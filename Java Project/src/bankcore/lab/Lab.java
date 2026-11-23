package bankcore.lab;

import bankcore.analysis.ReportGenerator;
import bankcore.core.Bank;
import bankcore.core.PaymentQueue;
import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.InvalidPaymentException;
import bankcore.exceptions.WalletBlockedException;
import bankcore.model.Auditable;
import bankcore.model.MerchantWallet;
import bankcore.model.Payment;
import bankcore.model.PaymentStatus;
import bankcore.model.SavingsWallet;
import bankcore.model.Wallet;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Queue;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

/** Live demonstrations of every syllabus topic. Each method prints what it proves. */
public class Lab {
    private Lab() { }

    private static void title(String t) { System.out.println("\n=== " + t + " ==="); }
    private static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    // ------------------------------------------------------------------ Lectures 1
    public static void oopDemo() {
        title("OOP: abstraction, inheritance, polymorphism, interface, static");
        Wallet[] ws = { new SavingsWallet("demo1@pay", "Demo", 500), new MerchantWallet("demo2@pay", "Shop", 500) };
        for (Wallet w : ws) {                          // same call, different behaviour at runtime
            try {
                w.debit(450);
                System.out.println(w.type() + ": debit(450) allowed, balance now " + w.getBalance());
            } catch (InsufficientBalanceException | WalletBlockedException e) {
                System.out.println(w.type() + ": debit(450) refused -> " + e.getMessage());
            }
        }
        Auditable a = ws[0];                           // interface reference to a Wallet object
        System.out.println("Through the Auditable interface: " + a.toAuditString());
        System.out.println("instanceof SavingsWallet? " + (ws[0] instanceof SavingsWallet)
                + " | static Wallet.getWalletCount() = " + Wallet.getWalletCount());
    }

    // ------------------------------------------------------------------ Lecture 2
    public static void stringDemo() {
        title("Strings: immutability, pool, comparison, search, manipulation, formatting");
        String a = "bhavya@pay";
        String b = "bhavya@pay";
        String c = new String("bhavya@pay");
        System.out.println("a == b            : " + (a == b) + "   (same pooled literal)");
        System.out.println("a == c            : " + (a == c) + "  (new String creates a separate object)");
        System.out.println("a.equals(c)       : " + a.equals(c) + "   (compares content)");
        System.out.println("c.intern() == a   : " + (c.intern() == a) + "   (intern() returns the pooled copy)");
        String s = "pay";
        s.concat("flow");                              // result thrown away: Strings are immutable
        System.out.println("s after s.concat(\"flow\") = " + s + "  (unchanged)");
        s = s.concat("flow");
        System.out.println("s after s = s.concat(...) = " + s);
        System.out.println("indexOf('@')=" + a.indexOf('@') + ", startsWith(\"bha\")=" + a.startsWith("bha")
                + ", substring(0,6)=" + a.substring(0, 6) + ", toUpperCase=" + a.toUpperCase());
        System.out.println("compareTo(\"riya@pay\") = " + a.compareTo("riya@pay") + " (negative: a comes first)");
        String[] parts = "swiggy,amazon,irctc".split(",");
        System.out.println("split -> " + parts.length + " parts, first = " + parts[0]);
        System.out.println(String.format("format: |%-12s|%10.2f|%05d|", "bhavya@pay", 1234.5, 42));
        StringBuilder sb = new StringBuilder("Rs");
        sb.append(' ').append(250).append(".00").insert(0, '[').append(']').reverse();
        System.out.println("StringBuilder (not synchronized, faster) reversed: " + sb);
        StringBuffer buf = new StringBuffer("log:");
        buf.append(" thread-safe appends");
        System.out.println("StringBuffer (synchronized, safe for many threads): " + buf);
    }

    public static void wrapperDemo() {
        title("Wrapper classes");
        Integer x = 127, y = 127, p = 1000, q = 1000;          // autoboxing
        System.out.println("127 == 127 (boxed)   : " + (x == y) + "  (small values are cached)");
        System.out.println("1000 == 1000 (boxed) : " + (p == q) + " (outside cache: different objects)");
        System.out.println("1000 equals 1000     : " + p.equals(q));
        int unboxed = p;                                       // unboxing
        System.out.println("unboxed int          : " + unboxed + ", Integer.parseInt(\"42\")+1 = " + (Integer.parseInt("42") + 1));
        System.out.println("Double.parseDouble(\"12.50\") = " + Double.parseDouble("12.50")
                + ", Integer.MAX_VALUE = " + Integer.MAX_VALUE + ", Double.compare(1.5,2.5) = " + Double.compare(1.5, 2.5));
        Map<String, Double> balances = new HashMap<String, Double>();
        balances.put("bhavya@pay", 5000.0);                    // double autoboxed to Double
        System.out.println("Map<String, Double> lookup: " + balances.get("bhavya@pay"));
    }

    // ------------------------------------------------------------------ Lecture 3
    public static void exceptionDemo() {
        title("Exceptions: unchecked, multi-catch, propagation, finally, custom");
        Object[] attempts = {"abc", null, 0, 5};
        for (int i = 0; i < attempts.length; i++) {
            try {
                switch (i) {
                    case 0: Integer.parseInt((String) attempts[i]); break;
                    case 1: ((String) attempts[i]).length(); break;
                    case 2: System.out.println(10 / (Integer) attempts[i]); break;
                    default: int[] arr = new int[3]; arr[(Integer) attempts[i]] = 1;
                }
            } catch (NumberFormatException | NullPointerException e) {          // multi-catch
                System.out.println("caught (multi-catch): " + e.getClass().getSimpleName());
            } catch (ArithmeticException | ArrayIndexOutOfBoundsException e) {
                System.out.println("caught (multi-catch): " + e.getClass().getSimpleName() + " - " + e.getMessage());
            } finally {
                System.out.println("  finally ran for attempt " + i);
            }
        }
        System.out.println("Propagation: level3 throws -> level2 (finally only) -> level1 catches");
        try {
            level1();
        } catch (InvalidPaymentException e) {
            System.out.println("main caught checked custom exception: " + e.getMessage());
        }
    }

    private static void level1() throws InvalidPaymentException {
        try { level2(); } finally { System.out.println("  level1 finally"); }
    }
    private static void level2() throws InvalidPaymentException {
        try { level3(); } finally { System.out.println("  level2 finally"); }
    }
    private static void level3() throws InvalidPaymentException {
        throw new InvalidPaymentException("amount must be positive (thrown in level3)");
    }

    // ------------------------------------------------------------------ Lectures 5-8
    public static void collectionsDemo() {
        title("Collections: choosing the right one");
        List<Payment> list = new ArrayList<Payment>();
        list.add(new Payment("bhavya@pay", "swiggy@pay", 450, 1, "Food"));
        list.add(new Payment("riya@pay", "amazon@pay", 2999, 3, "Shopping"));
        list.add(new Payment("bhavya@pay", "irctc@pay", 1250, 2, "Travel"));
        list.add(new Payment("arjun@pay", "jio@pay", 299, 1, "Bills"));
        list.get(1).setStatus(PaymentStatus.SUCCESS);
        list.get(3).setStatus(PaymentStatus.FAILED);

        System.out.println("ArrayList (history, indexed): size=" + list.size() + ", get(2)=" + list.get(2).getTo());
        LinkedList<Payment> ll = new LinkedList<Payment>(list);
        ll.addFirst(ll.removeLast());
        System.out.println("LinkedList (cheap add/remove at ends): first is now #" + ll.getFirst().getId());

        Set<String> hs = new HashSet<String>();
        System.out.println("HashSet duplicates: add(a)=" + hs.add("a@pay") + ", add(a) again=" + hs.add("a@pay"));
        Set<String> lhs = new LinkedHashSet<String>();
        Set<String> ts = new TreeSet<String>();
        for (Payment p : list) { lhs.add(p.getTo()); ts.add(p.getTo()); }
        System.out.println("LinkedHashSet (insertion order): " + lhs);
        System.out.println("TreeSet (sorted): " + ts);

        Map<String, Double> hm = new HashMap<String, Double>();
        Map<String, Double> lhm = new LinkedHashMap<String, Double>();
        Map<String, Double> tm = new TreeMap<String, Double>();
        for (Payment p : list) { hm.put(p.getTo(), p.getAmount()); lhm.put(p.getTo(), p.getAmount()); tm.put(p.getTo(), p.getAmount()); }
        System.out.println("HashMap (no order guaranteed): " + hm.keySet());
        System.out.println("LinkedHashMap (insertion order): " + lhm.keySet());
        System.out.println("TreeMap (sorted by key): " + tm.keySet());

        Queue<Payment> fifo = new LinkedList<Payment>(list);
        System.out.println("Queue (FIFO) poll -> #" + fifo.poll().getId());
        Deque<Payment> dq = new ArrayDeque<Payment>(list);
        dq.addFirst(dq.pollLast());
        System.out.println("Deque (both ends): peekFirst -> #" + dq.peekFirst().getId() + ", peekLast -> #" + dq.peekLast().getId());
        PriorityQueue<Payment> pq = new PriorityQueue<Payment>(list);
        System.out.println("PriorityQueue (Comparable: priority then age) poll -> amount " + pq.poll().getAmount());

        List<Payment> sorted = new ArrayList<Payment>(list);
        Collections.sort(sorted, ReportGenerator.BY_AMOUNT);
        System.out.println("Comparator BY_AMOUNT (desc): " + amounts(sorted));
        Collections.sort(sorted, ReportGenerator.BY_STATUS);
        System.out.println("Comparator BY_STATUS first -> " + sorted.get(0).getStatus());
        Collections.sort(sorted);                                   // natural order = Comparable
        System.out.println("Natural order (Comparable) first -> priority " + sorted.get(0).getPriority());
        System.out.println("Collections.max by amount = " + Collections.max(list, ReportGenerator.BY_AMOUNT_ASC).getAmount()
                + " | min by amount = " + Collections.min(list, ReportGenerator.BY_AMOUNT_ASC).getAmount());
        Collections.reverse(sorted);
        System.out.println("Collections.reverse -> first priority " + sorted.get(0).getPriority()
                + " | FAILED payments counted = " + countStatus(list, PaymentStatus.FAILED));

        int removed = 0;
        List<Payment> copy = new ArrayList<Payment>(list);
        Iterator<Payment> it = copy.iterator();
        while (it.hasNext()) if (it.next().getStatus() == PaymentStatus.FAILED) { it.remove(); removed++; }
        System.out.println("Iterator.remove() dropped " + removed + " FAILED payment(s); list size " + list.size() + " -> " + copy.size());

        ListIterator<Payment> li = list.listIterator();
        while (li.hasNext()) li.next();
        StringBuilder back = new StringBuilder("ListIterator backwards: ");
        while (li.hasPrevious()) back.append('#').append(li.previous().getId()).append(' ');
        System.out.println(back);
    }

    private static String amounts(List<Payment> l) {
        StringBuilder sb = new StringBuilder();
        for (Payment p : l) sb.append(p.getAmount()).append(' ');
        return sb.toString().trim();
    }

    private static int countStatus(List<Payment> l, PaymentStatus s) {
        int n = 0;
        for (Payment p : l) if (p.getStatus() == s) n++;
        return n;
    }

    // ------------------------------------------------------------------ Lectures 9-10
    public static void runVsStartDemo() {
        title("run() vs start()");
        Runnable r = new Runnable() {
            @Override public void run() { System.out.println("  body executed by thread: " + Thread.currentThread().getName()); }
        };
        Thread t = new Thread(r, "worker-1");
        System.out.println("Calling t.run()   (ordinary method call, no new thread):");
        t.run();
        System.out.println("Calling t.start() (JVM creates a new thread, then calls run() on it):");
        t.start();
        try { t.join(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        System.out.println("join() returned: main waited until worker-1 finished.");
    }

    public static void interruptDemo() {
        title("interrupt() on a thread blocked in wait()");
        final PaymentQueue empty = new PaymentQueue(2);
        Thread t = new Thread(new Runnable() {
            @Override public void run() {
                try {
                    empty.take();
                } catch (InterruptedException e) {
                    System.out.println("  consumer: interrupted while waiting -> exiting cleanly");
                }
            }
        }, "consumer");
        t.start();
        sleep(200);
        System.out.println("State before interrupt: " + t.getState() + " (take() called wait() on an empty queue)");
        t.interrupt();
        try { t.join(1000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        System.out.println("State after interrupt : " + t.getState());
    }

    // ------------------------------------------------------------------ Lectures 11-12
    public static void threadStateDemo() {
        title("Thread states: NEW -> RUNNABLE -> TIMED_WAITING -> WAITING -> BLOCKED -> TERMINATED");
        final Object lock = new Object();
        final Object gate = new Object();
        Thread t = new Thread(new Runnable() {
            @Override public void run() {
                sleep(300);                                          // TIMED_WAITING
                synchronized (lock) {
                    try { lock.wait(); } catch (InterruptedException e) { return; }   // WAITING
                }
                synchronized (gate) { /* BLOCKED until main releases gate */ }
            }
        }, "state-demo");
        System.out.println("before start()        : " + t.getState());
        t.start();
        System.out.println("right after start()   : " + t.getState());
        sleep(100);
        System.out.println("inside sleep(300)     : " + t.getState());
        sleep(400);
        System.out.println("inside lock.wait()    : " + t.getState());
        synchronized (gate) {
            synchronized (lock) { lock.notifyAll(); }
            sleep(200);
            System.out.println("wants gate, main holds: " + t.getState());
        }
        try { t.join(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        System.out.println("after finishing       : " + t.getState());
        System.out.println("(wait(timeout) would show TIMED_WAITING instead of WAITING.)");
    }

    public static void threadInfo(Thread... ts) {
        title("Thread info: state, priority, daemon");
        System.out.printf("%-16s %-14s %-9s %s%n", "name", "state", "priority", "daemon");
        for (Thread t : ts) {
            System.out.printf("%-16s %-14s %-9d %s%n", t.getName(), t.getState(), t.getPriority(), t.isDaemon());
        }
        System.out.println("Priorities are hints; the OS scheduler may ignore them. Daemon threads die when all user threads end.");
    }

    // ------------------------------------------------------------------ Lectures 13-14
    /** Start gate: threads spin until main flips this volatile flag, so they really overlap. */
    private static volatile boolean go;

    public static void raceDemo() {
        final int perThread = 2000;
        title("Race condition: 100 threads x " + perThread + " deposits of Rs10");
        double expected = 100.0 * perThread * 10;
        for (int mode = 0; mode < 2; mode++) {
            final boolean safe = mode == 1;
            final Wallet w = new SavingsWallet(safe ? "safe@pay" : "unsafe@pay", "Race", 0);
            Thread[] ts = new Thread[100];
            go = false;
            for (int i = 0; i < ts.length; i++) {
                ts[i] = new Thread(new Runnable() {
                    @Override public void run() {
                        while (!go) Thread.yield();                  // wait for the starting gun
                        for (int k = 0; k < perThread; k++) {
                            if (safe) w.credit(10); else w.creditUnsafe(10);
                        }
                    }
                }, "dep-" + i);
                ts[i].start();
            }
            sleep(200);                                              // let every thread reach the gate
            long t0 = System.currentTimeMillis();
            go = true;                                               // all threads start together
            for (Thread t : ts) {
                try { t.join(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            }
            double actual = w.getBalance();
            System.out.printf("%-6s expected %,.0f | actual %,.0f | lost %,.0f | %d ms%n",
                    safe ? "SAFE" : "UNSAFE", expected, actual, expected - actual, System.currentTimeMillis() - t0);
        }
        System.out.println("UNSAFE usually loses money (balance += x is read-add-write, not atomic) but this is not guaranteed;");
        System.out.println("run it again if it happened to match. SAFE always matches because synchronized is atomic.");
    }

    public static void volatileDemo() {
        title("volatile: visibility of a shutdown flag");
        class Worker implements Runnable {
            private volatile boolean running = true;
            long loops;
            @Override public void run() { while (running) loops++; }
            void stop() { running = false; }
        }
        Worker w = new Worker();
        Thread t = new Thread(w, "spinner");
        t.start();
        sleep(200);
        w.stop();                                       // visible to the spinner because of volatile
        try { t.join(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        System.out.println("spinner stopped: " + (t.getState() == Thread.State.TERMINATED) + " after " + w.loops + " loops");
        System.out.println("volatile guarantees visibility, not atomicity: fine for a flag, wrong for balance += x.");
    }

    public static void deadlockDemo() {
        title("Deadlock and its fix");
        for (int mode = 0; mode < 2; mode++) {
            final boolean safe = mode == 1;
            final Bank lab = new Bank();
            lab.safeMode = safe;
            lab.demoDelayMs = 100;                                   // widens the window so the deadlock is reliable
            final Wallet a = new MerchantWallet("A@pay", "A", 1000);
            final Wallet b = new MerchantWallet("B@pay", "B", 1000);
            Thread t1 = new Thread(transferTask(lab, a, b), "A-to-B");
            Thread t2 = new Thread(transferTask(lab, b, a), "B-to-A");
            t1.setDaemon(true);                                      // so a stuck thread cannot keep the JVM alive
            t2.setDaemon(true);
            t1.start();
            t2.start();
            try { t1.join(2000); t2.join(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            if (!safe) {
                System.out.println("UNSAFE (lock in caller's order): A-to-B is " + t1.getState() + ", B-to-A is " + t2.getState()
                        + (t1.isAlive() && t2.isAlive() ? "  => DEADLOCK" : "  (no deadlock this time)"));
            } else {
                System.out.println("SAFE (lock smaller id first)  : A-to-B is " + t1.getState() + ", B-to-A is " + t2.getState()
                        + "  => both finished; A=" + a.getBalance() + " B=" + b.getBalance());
            }
        }
    }

    private static Runnable transferTask(final Bank bank, final Wallet from, final Wallet to) {
        return new Runnable() {
            @Override public void run() {
                try { bank.transfer(from, to, 10); }
                catch (InsufficientBalanceException | WalletBlockedException e) { System.out.println(e.getMessage()); }
            }
        };
    }

    // ------------------------------------------------------------------ Lectures 15-16
    public static void waitForFundsDemo() {
        title("wait()/notifyAll(): a payment waits for funds");
        final Wallet w = new MerchantWallet("poor@pay", "Poor", 50);
        Thread waiter = new Thread(new Runnable() {
            @Override public void run() {
                try {
                    w.debitWhenFunded(200, 3000);
                    System.out.println("  waiter: payment of 200 completed, balance " + w.getBalance());
                } catch (InsufficientBalanceException | WalletBlockedException e) {
                    System.out.println("  waiter: failed -> " + e.getMessage());
                } catch (InterruptedException e) {
                    System.out.println("  waiter: interrupted");
                }
            }
        }, "waiter");
        waiter.start();
        sleep(500);
        System.out.println("Balance 50, payment needs 200. waiter is " + waiter.getState() + " (wait with timeout)");
        System.out.println("main tops up Rs500 -> credit() calls notifyAll()");
        w.credit(500);
        try { waiter.join(2000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }

        System.out.println("Second case: nobody tops up, timeout 800 ms.");
        final Wallet w2 = new MerchantWallet("poor2@pay", "Poor2", 50);
        try {
            w2.debitWhenFunded(900, 800);
        } catch (InsufficientBalanceException | WalletBlockedException e) {
            System.out.println("  timeout reached -> InsufficientBalanceException: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}