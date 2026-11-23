package bankcore.model;

import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.WalletBlockedException;

/**
 * Abstract base class. Shares state/code; subclasses supply their own debit() rules
 * (polymorphism). Each Wallet object is also its own monitor (intrinsic lock).
 */
public abstract class Wallet implements Auditable {
    private static int walletCount = 0;            // static: one copy shared by the class

    protected final String id;                     // e.g. "bhavya@pay"
    protected final String owner;
    protected double balance;
    protected volatile boolean blocked;

    public Wallet(String id, String owner, double balance) {
        this.id = id;                              // 'this' separates field from parameter
        this.owner = owner;
        this.balance = balance;
        synchronized (Wallet.class) { walletCount++; }
    }

    public static synchronized int getWalletCount() { return walletCount; }

    /** Every wallet type applies its own rules. */
    public abstract void debit(double amt) throws InsufficientBalanceException, WalletBlockedException;

    public abstract String type();

    /** SAFE: synchronized makes read-modify-write atomic and wakes threads waiting for funds. */
    public synchronized void credit(double amt) {
        balance += amt;
        notifyAll();
    }

    /**
     * UNSAFE (for the race-condition demo): "balance += amt" is really read, add, write = 3 steps.
     * Thread.yield() between read and write widens the window so the lost update is easy to see
     * even on a single-core machine. Without it the bug is the same, just rarer.
     */
    public void creditUnsafe(double amt) {
        double temp = balance;                     // 1. read
        Thread.yield();                            //    another thread may run here and also read
        balance = temp + amt;                      // 2. add and write back: overwrites its update
    }

    /**
     * Guarded block: waits (with timeout) until the wallet has enough funds.
     * wait() always sits inside a while loop and releases the monitor while waiting.
     */
    public synchronized void debitWhenFunded(double amt, long timeoutMs)
            throws InsufficientBalanceException, WalletBlockedException, InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (balance < amt) {
            long left = deadline - System.currentTimeMillis();
            if (left <= 0) {
                throw new InsufficientBalanceException("Timed out waiting for funds in " + id);
            }
            wait(left);                            // TIMED_WAITING until notifyAll() or timeout
        }
        debit(amt);                                // re-entrant: same thread already owns the lock
    }

    protected void ensureActive() throws WalletBlockedException {
        if (blocked) throw new WalletBlockedException("Wallet " + id + " is blocked");
    }

    public String getId() { return id; }
    public String getOwner() { return owner; }
    public synchronized double getBalance() { return balance; }
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean b) { blocked = b; }

    @Override
    public synchronized String toAuditString() {
        return String.format("WALLET[%s|%s|%s|%.2f|%s]", id, owner, type(), balance, blocked ? "BLOCKED" : "ACTIVE");
    }
}