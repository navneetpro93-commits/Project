package bankcore.model;

/** One payment request. Comparable so a PriorityQueue serves urgent/older payments first. */
public class Payment implements Comparable<Payment>, Auditable {
    private static int counter = 0;
    /** The shared static counter is itself a critical section: protect it with the class lock. */
    private static synchronized int nextId() { return ++counter; }

    private final int id;
    private final String from;
    private final String to;
    private final double amount;
    private final int priority;                    // higher = more urgent
    private final String category;
    private final long timestamp = System.currentTimeMillis();

    private volatile PaymentStatus status = PaymentStatus.PENDING;
    private volatile int fraudScore;
    private volatile String fraudNote = "";
    private volatile String reason = "";
    private volatile boolean verified;

    public Payment(String from, String to, double amount, int priority, String category) {
        this.id = nextId();
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.priority = priority;
        this.category = category;
    }

    @Override
    public int compareTo(Payment o) {
        if (priority != o.priority) return Integer.compare(o.priority, priority);   // high first
        return Long.compare(timestamp, o.timestamp);                                 // then oldest
    }

    public int getId() { return id; }
    public String getFrom() { return from; }
    public String getTo() { return to; }
    public double getAmount() { return amount; }
    public int getPriority() { return priority; }
    public String getCategory() { return category; }
    public long getTimestamp() { return timestamp; }
    public PaymentStatus getStatus() { return status; }
    public void setStatus(PaymentStatus s) { status = s; }
    public int getFraudScore() { return fraudScore; }
    public void setFraudScore(int s) { fraudScore = s; }
    public String getFraudNote() { return fraudNote; }
    public void setFraudNote(String n) { fraudNote = n; }
    public String getReason() { return reason; }
    public void setReason(String r) { reason = r; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean v) { verified = v; }

    @Override
    public String toAuditString() {
        return String.format("PAY#%d %s->%s Rs%.2f [%s] p=%d score=%d %s",
                id, from, to, amount, status, priority, fraudScore, reason);
    }

    @Override
    public String toString() {
        return String.format("#%-3d %-14s -> %-14s %10.2f  %-8s %s", id, from, to, amount, status, category);
    }
}