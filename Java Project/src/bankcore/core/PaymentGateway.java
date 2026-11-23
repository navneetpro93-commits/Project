package bankcore.core;

import bankcore.analysis.FraudEngine;
import bankcore.exceptions.InvalidPaymentException;
import bankcore.model.Payment;
import bankcore.model.PaymentStatus;

import java.util.HashMap;
import java.util.Map;

/** Front door for payments: validate -> duplicate check -> fraud score -> hold / undo window / queue. */
public class PaymentGateway {
    public enum Result { QUEUED, HELD, SCHEDULED }

    private final Bank bank;
    private final PaymentQueue queue;
    private final FraudEngine fraud;
    private final AuditLogger logger;
    private final Map<String, Long> recentKeys = new HashMap<String, Long>();
    private long dupWindowMs = 5000;

    public PaymentGateway(Bank bank, PaymentQueue queue, FraudEngine fraud, AuditLogger logger) {
        this.bank = bank;
        this.queue = queue;
        this.fraud = fraud;
        this.logger = logger;
    }

    public void validate(Payment p) throws InvalidPaymentException {
        if (Double.isNaN(p.getAmount()) || Double.isInfinite(p.getAmount()) || p.getAmount() <= 0) {
            throw new InvalidPaymentException("Amount must be positive");
        }
        if (p.getFrom().equals(p.getTo())) throw new InvalidPaymentException("Cannot pay yourself");
        bank.find(p.getFrom());                        // throws if unknown
        bank.find(p.getTo());
        if (!bank.markSeen(p.getId())) throw new InvalidPaymentException("Duplicate payment id #" + p.getId());
        String key = p.getFrom() + "|" + p.getTo() + "|" + p.getAmount();
        long now = System.currentTimeMillis();
        synchronized (this) {
            Long last = recentKeys.get(key);
            if (last != null && now - last < dupWindowMs) {
                throw new InvalidPaymentException("Duplicate transfer (same payer, payee and amount within "
                        + dupWindowMs / 1000 + " s)");
            }
            recentKeys.put(key, now);
        }
    }

    public Result submit(Payment p, int undoMs) throws InvalidPaymentException, InterruptedException {
        validate(p);
        StringBuilder explain = new StringBuilder();
        int score = fraud.evaluate(p, bank, explain);
        p.setFraudScore(score);
        p.setFraudNote(explain.toString());
        bank.recordTx(p.getFrom());
        logger.log("SUBMIT " + p.toAuditString());

        if (fraud.isSuspicious(score) && !p.isVerified()) {
            bank.hold(p);
            logger.log("HELD for verification: payment #" + p.getId() + " score " + score);
            return Result.HELD;
        }
        return dispatch(p, undoMs);
    }

    /** Called after the user verifies a held payment. */
    public Result release(Payment p) throws InterruptedException {
        bank.removeHeld(p);
        p.setVerified(true);
        logger.log("VERIFIED payment #" + p.getId());
        return dispatch(p, 0);
    }

    public void reject(Payment p) {
        bank.removeHeld(p);
        p.setStatus(PaymentStatus.FAILED);
        p.setReason("rejected at verification");
        bank.record(p);
        logger.log("REJECTED " + p.toAuditString());
    }

    private Result dispatch(Payment p, int undoMs) throws InterruptedException {
        bank.incQueued();
        if (undoMs > 0) {
            Thread t = new Thread(new UndoWindow(p, queue, bank, logger, undoMs), "undo-" + p.getId());
            bank.registerUndo(p.getId(), t);
            t.start();
            return Result.SCHEDULED;
        }
        queue.put(p);                                  // blocks (wait) if the queue is full
        return Result.QUEUED;
    }
}