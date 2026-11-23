package bankcore.core;

import bankcore.exceptions.InvalidPaymentException;
import bankcore.model.Payment;

import java.util.List;
import java.util.Random;

/** Producer: simulates one phone app firing payments at the switch. */
public class AppClient implements Runnable {
    private static final String[] NOTES = {"swiggy dinner", "amazon order", "irctc ticket", "jio recharge", "rent share"};

    private final PaymentGateway gateway;
    private final List<String> senders;
    private final List<String> receivers;
    private final int count;
    private final Random rnd = new Random();
    public int queued, held, rejected;                 // read by main only after join()

    public AppClient(PaymentGateway gateway, List<String> senders, List<String> receivers, int count) {
        this.gateway = gateway;
        this.senders = senders;
        this.receivers = receivers;
        this.count = count;
    }

    @Override
    public void run() {
        String me = Thread.currentThread().getName();
        for (int i = 0; i < count; i++) {
            String from = senders.get(rnd.nextInt(senders.size()));
            String to;
            do {
                to = receivers.get(rnd.nextInt(receivers.size()));
            } while (to.equals(from));                  // never pay yourself
            double amount = rnd.nextInt(100) < 15 ? 20000 + rnd.nextInt(10000) : 50 + rnd.nextInt(2950);
            Payment p = new Payment(from, to, amount, 1 + rnd.nextInt(3), "Others");
            try {
                PaymentGateway.Result r = gateway.submit(p, 0);
                if (r == PaymentGateway.Result.HELD) held++; else queued++;
                Thread.sleep(20 + rnd.nextInt(40));    // simulated network latency
            } catch (InvalidPaymentException e) {
                rejected++;
                System.out.println("  " + me + " rejected: " + e.getMessage());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }
}