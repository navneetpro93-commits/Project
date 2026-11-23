package bankcore.core;

import bankcore.analysis.SpendingAnalyzer;
import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.InvalidPaymentException;
import bankcore.exceptions.WalletBlockedException;
import bankcore.model.Payment;
import bankcore.model.PaymentStatus;
import bankcore.model.Wallet;

/** Consumer thread: takes payments from the queue and settles them. */
public class PaymentProcessor extends Thread {
    private final Bank bank;
    private final PaymentQueue queue;
    private final AuditLogger logger;
    private final SpendingAnalyzer analyzer;
    private final int latencyMs;
    private volatile boolean running = true;           // volatile: visible across threads

    public PaymentProcessor(String name, Bank bank, PaymentQueue queue, AuditLogger logger,
                            SpendingAnalyzer analyzer, int latencyMs) {
        super(name);
        this.bank = bank;
        this.queue = queue;
        this.logger = logger;
        this.analyzer = analyzer;
        this.latencyMs = latencyMs;
        setPriority(Thread.MAX_PRIORITY);              // only a hint to the OS scheduler
    }

    @Override
    public void run() {
        while (running) {
            Payment p;
            try {
                p = queue.take();                      // WAITING while the queue is empty
            } catch (InterruptedException e) {
                break;                                 // interrupt() = "please stop"
            }
            try {
                Thread.sleep(latencyMs);               // simulated network latency
            } catch (InterruptedException e) {
                running = false;                       // finish this payment, then stop
            }
            process(p);
        }
        logger.log(getName() + " stopped");
    }

    private void process(Payment p) {
        try {
            Wallet from = bank.find(p.getFrom());      // may throw InvalidPaymentException
            Wallet to = bank.find(p.getTo());
            bank.transfer(from, to, p.getAmount());    // may throw the two other checked exceptions
            p.setStatus(PaymentStatus.SUCCESS);
            bank.addBeneficiary(p.getFrom(), p.getTo());
            bank.resetFailures(p.getFrom());
            analyzer.applyRoundUp(from, p.getAmount());
        } catch (InsufficientBalanceException | WalletBlockedException e) {   // multi-catch
            fail(p, e.getMessage());
        } catch (InvalidPaymentException e) {
            fail(p, "INVALID: " + e.getMessage());
        } catch (RuntimeException e) {                 // unchecked: a bug must not kill the thread
            fail(p, "UNEXPECTED " + e);
        } finally {                                    // always runs: record, log, count
            bank.record(p);
            bank.incProcessed();
            logger.log(p.toAuditString());
        }
    }

    private void fail(Payment p, String why) {
        p.setStatus(PaymentStatus.FAILED);
        p.setReason(why);
        bank.recordFailure(p.getFrom());
    }

    public void shutdown() {
        running = false;
        interrupt();                                   // wakes take() if it is waiting
    }
}