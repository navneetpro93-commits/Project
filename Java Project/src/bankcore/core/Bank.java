package bankcore.core;

import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.InvalidPaymentException;
import bankcore.exceptions.WalletBlockedException;
import bankcore.model.Payment;
import bankcore.model.Wallet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The "bank": wallets, history and shared bookkeeping.
 * Many threads touch this object, so every shared structure is protected.
 */
public class Bank {
    private final Map<String, Wallet> wallets = new HashMap<String, Wallet>();           // lookup by id
    private final List<Payment> history = Collections.synchronizedList(new ArrayList<Payment>());
    /** Last 10 payments in insertion order (LinkedHashMap auto-evicts the eldest). */
    private final LinkedHashMap<Integer, Payment> recent = new LinkedHashMap<Integer, Payment>() {
        private static final long serialVersionUID = 1L;
        @Override
        protected boolean removeEldestEntry(Map.Entry<Integer, Payment> eldest) { return size() > 10; }
    };
    private final Set<Integer> seenIds = new HashSet<Integer>();                         // duplicate detection
    private final Map<String, LinkedHashSet<String>> beneficiaries = new HashMap<String, LinkedHashSet<String>>();
    private final Map<String, Integer> failures = new HashMap<String, Integer>();
    private final Map<String, LinkedList<Long>> txTimes = new HashMap<String, LinkedList<Long>>();
    private final List<Payment> held = new ArrayList<Payment>();                         // awaiting verification
    private final Map<Integer, Thread> undoThreads = new HashMap<Integer, Thread>();

    /** volatile: a change made by the admin thread is immediately visible to all worker threads. */
    public volatile boolean safeMode = true;
    public volatile int demoDelayMs = 0;           // widens the deadlock window for the lab demo

    private int queued;
    private int processed;
    private final long startTime = System.currentTimeMillis();

    // ---------- wallets ----------
    public synchronized void addWallet(Wallet w) throws InvalidPaymentException {
        if (wallets.containsKey(w.getId())) throw new InvalidPaymentException("Wallet already exists: " + w.getId());
        wallets.put(w.getId(), w);
    }

    public synchronized Wallet find(String id) throws InvalidPaymentException {
        Wallet w = wallets.get(id);
        if (w == null) throw new InvalidPaymentException("Unknown wallet: " + id);
        return w;
    }

    public synchronized boolean exists(String id) { return wallets.containsKey(id); }

    public synchronized List<Wallet> allWallets() { return new ArrayList<Wallet>(wallets.values()); }

    // ---------- the critical section: moving money ----------
    public void transfer(Wallet a, Wallet b, double amt)
            throws InsufficientBalanceException, WalletBlockedException {
        if (!safeMode) {
            // UNSAFE: locks in the order the caller gave. A->B and B->A can deadlock.
            synchronized (a) {
                sleepQuietly(demoDelayMs);
                synchronized (b) {
                    a.debit(amt);
                    b.credit(amt);
                }
            }
            return;
        }
        // SAFE: always lock the wallet with the smaller id first -> no circular wait -> no deadlock.
        Wallet first = a.getId().compareTo(b.getId()) < 0 ? a : b;
        Wallet second = (first == a) ? b : a;
        synchronized (first) {
            sleepQuietly(demoDelayMs);
            synchronized (second) {
                a.debit(amt);
                b.credit(amt);
            }
        }
    }

    private static void sleepQuietly(int ms) {
        if (ms <= 0) return;
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    // ---------- history ----------
    public void record(Payment p) {
        history.add(p);
        synchronized (this) { recent.put(p.getId(), p); }
    }

    public List<Payment> historySnapshot() {
        synchronized (history) { return new ArrayList<Payment>(history); }
    }

    public synchronized List<Payment> recentPayments() { return new ArrayList<Payment>(recent.values()); }

    public synchronized boolean markSeen(int paymentId) { return seenIds.add(paymentId); }

    // ---------- beneficiaries, failures, rapid-transaction tracking ----------
    public synchronized void addBeneficiary(String from, String to) {
        LinkedHashSet<String> set = beneficiaries.get(from);
        if (set == null) { set = new LinkedHashSet<String>(); beneficiaries.put(from, set); }
        set.add(to);
    }

    public synchronized boolean isKnownBeneficiary(String from, String to) {
        LinkedHashSet<String> set = beneficiaries.get(from);
        return set != null && set.contains(to);
    }

    public synchronized void recordFailure(String from) {
        Integer n = failures.get(from);                // wrapper class: may be null
        failures.put(from, n == null ? 1 : n + 1);     // autoboxing / unboxing
    }

    public synchronized void resetFailures(String from) { failures.put(from, 0); }

    public synchronized int getFailures(String from) {
        Integer n = failures.get(from);
        return n == null ? 0 : n;
    }

    public synchronized void recordTx(String from) {
        LinkedList<Long> list = txTimes.get(from);
        if (list == null) { list = new LinkedList<Long>(); txTimes.put(from, list); }
        list.addLast(System.currentTimeMillis());
    }

    public synchronized int recentTxCount(String from, long windowMs) {
        LinkedList<Long> list = txTimes.get(from);
        if (list == null) return 0;
        long now = System.currentTimeMillis();
        int count = 0;
        for (Long t : list) if (now - t <= windowMs) count++;
        return count;
    }

    // ---------- payments held for verification ----------
    public synchronized void hold(Payment p) { held.add(p); }

    public synchronized List<Payment> heldFor(String walletId) {
        List<Payment> out = new ArrayList<Payment>();
        for (Payment p : held) if (p.getFrom().equals(walletId)) out.add(p);
        return out;
    }

    public synchronized boolean removeHeld(Payment p) { return held.remove(p); }

    // ---------- undo window bookkeeping ----------
    public synchronized void registerUndo(int paymentId, Thread t) { undoThreads.put(paymentId, t); }

    /** Removes and returns the undo thread (null if already gone). */
    public synchronized Thread takeUndo(int paymentId) { return undoThreads.remove(paymentId); }

    /** User cancels: remove the entry and interrupt the sleeping window thread. */
    public boolean cancelUndo(int paymentId) {
        Thread t = takeUndo(paymentId);
        if (t == null) return false;                   // too late, or unknown id
        t.interrupt();
        return true;
    }

    public synchronized List<Integer> pendingUndoIds() { return new ArrayList<Integer>(undoThreads.keySet()); }

    // ---------- counters used to know when the simulation has drained ----------
    public synchronized void incQueued() { queued++; }
    public synchronized void incProcessed() { processed++; }
    public synchronized int getQueued() { return queued; }
    public synchronized int getProcessed() { return processed; }
    public long getStartTime() { return startTime; }
}