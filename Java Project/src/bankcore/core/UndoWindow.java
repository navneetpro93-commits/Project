package bankcore.core;

import bankcore.model.Payment;
import bankcore.model.PaymentStatus;

/**
 * Holds a payment for a few seconds so the user can cancel it.
 * Cancelling = interrupt() on this sleeping thread.
 */
public class UndoWindow implements Runnable {
    private final Payment payment;
    private final PaymentQueue queue;
    private final Bank bank;
    private final AuditLogger logger;
    private final long ms;

    public UndoWindow(Payment payment, PaymentQueue queue, Bank bank, AuditLogger logger, long ms) {
        this.payment = payment;
        this.queue = queue;
        this.bank = bank;
        this.logger = logger;
        this.ms = ms;
    }

    @Override
    public void run() {
        try {
            Thread.sleep(ms);                          // TIMED_WAITING during the undo window
            if (bank.takeUndo(payment.getId()) == null) {   // someone cancelled just as we woke up
                cancelled();
                return;
            }
            queue.put(payment);
        } catch (InterruptedException e) {
            cancelled();
        }
    }

    private void cancelled() {
        payment.setStatus(PaymentStatus.FAILED);
        payment.setReason("cancelled by user (undo)");
        bank.record(payment);
        bank.incProcessed();                           // keeps queued/processed counters balanced
        logger.log("CANCELLED " + payment.toAuditString());
    }
}