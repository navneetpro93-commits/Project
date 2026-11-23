package bankcore.core;

import bankcore.model.Payment;
import bankcore.model.PaymentStatus;

import java.util.Iterator;
import java.util.PriorityQueue;

/**
 * Bounded producer-consumer buffer built on wait()/notifyAll().
 * Producers wait when it is full; consumers wait when it is empty.
 */
public class PaymentQueue {
    private final PriorityQueue<Payment> q = new PriorityQueue<Payment>();
    private final int capacity;
    private volatile boolean verbose;

    public PaymentQueue(int capacity) { this.capacity = capacity; }

    public void setVerbose(boolean v) { verbose = v; }

    public synchronized void put(Payment p) throws InterruptedException {
        boolean announced = false;
        while (q.size() == capacity) {                 // 'while', never 'if': re-check after waking
            if (verbose && !announced) {
                System.out.println("  [queue] FULL -> producer " + Thread.currentThread().getName() + " waits");
                announced = true;
            }
            wait();
        }
        q.add(p);
        if (verbose) System.out.println("  [queue] + payment #" + p.getId() + "  size=" + q.size() + "/" + capacity);
        notifyAll();                                   // wake consumers (and any other waiters)
    }

    public synchronized Payment take() throws InterruptedException {
        while (q.isEmpty()) wait();
        Payment p = q.poll();                          // highest priority, then oldest
        if (verbose) System.out.println("  [queue] - payment #" + p.getId() + "  size=" + q.size() + "/" + capacity);
        notifyAll();                                   // wake producers waiting for space
        return p;
    }

    /** Removes payments that waited too long, using Iterator.remove(). */
    public synchronized int purgeExpired(long maxAgeMs) {
        long now = System.currentTimeMillis();
        int count = 0;
        Iterator<Payment> it = q.iterator();
        while (it.hasNext()) {
            Payment p = it.next();
            if (now - p.getTimestamp() > maxAgeMs) {
                it.remove();
                p.setStatus(PaymentStatus.FAILED);
                p.setReason("expired in queue");
                count++;
            }
        }
        if (count > 0) notifyAll();
        return count;
    }

    public synchronized int size() { return q.size(); }
    public int capacity() { return capacity; }
}