package bankcore;

import bankcore.analysis.FraudEngine;
import bankcore.analysis.ReportGenerator;
import bankcore.analysis.SpendingAnalyzer;
import bankcore.analysis.WhatIfSimulator;
import bankcore.core.AppClient;
import bankcore.core.AuditLogger;
import bankcore.core.Bank;
import bankcore.core.PaymentGateway;
import bankcore.core.PaymentProcessor;
import bankcore.core.PaymentQueue;
import bankcore.core.UserManager;
import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.InvalidPaymentException;
import bankcore.exceptions.WalletBlockedException;
import bankcore.lab.Lab;
import bankcore.lab.SelfTest;
import bankcore.model.MerchantWallet;
import bankcore.model.Payment;
import bankcore.model.PaymentStatus;
import bankcore.model.SavingsWallet;
import bankcore.model.Wallet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Scanner;
import java.util.TreeMap;

/** BankCore: console bank with a concurrent UPI-style payment switch. */
public class Main {
    private static final Scanner SC = new Scanner(System.in);

    private static Bank bank;
    private static PaymentQueue queue;
    private static AuditLogger logger;
    private static PaymentProcessor[] processors;
    private static PaymentGateway gateway;
    private static UserManager users;
    private static SpendingAnalyzer analyzer;
    private static FraudEngine fraud;

    public static void main(String[] args) {
        setup();
        try {
            mainMenu();
        } catch (NoSuchElementException e) {           // input stream closed (Ctrl+D / end of script)
            System.out.println("\n[input closed]");
        } finally {
            shutdown();                                // always: stop threads, join, print report
        }
    }

    // =====================================================================================
    // Setup and shutdown
    // =====================================================================================
    private static void setup() {
        bank = new Bank();
        logger = new AuditLogger();
        logger.start();
        queue = new PaymentQueue(3);                   // small on purpose: producers visibly block
        fraud = new FraudEngine();
        analyzer = new SpendingAnalyzer();
        gateway = new PaymentGateway(bank, queue, fraud, logger);
        users = new UserManager();
        try {
            seedUser("bhavya", "pass123", 50000);
            seedUser("riya", "pass123", 30000);
            seedUser("arjun", "pass123", 20000);
            users.register("admin", "admin123");
            String[] merchants = {"swiggy", "amazon", "irctc", "jio"};
            for (String m : merchants) bank.addWallet(new MerchantWallet(m + "@pay", m, 1000));
        } catch (InvalidPaymentException e) {
            System.out.println("Setup problem: " + e.getMessage());
        }
        processors = new PaymentProcessor[2];
        for (int i = 0; i < processors.length; i++) {
            processors[i] = new PaymentProcessor("processor-" + (i + 1), bank, queue, logger, analyzer, 150);
            processors[i].start();
        }
        logger.log("BankCore started");
    }

    private static void seedUser(String user, String pass, double balance) throws InvalidPaymentException {
        String id = users.register(user, pass);
        bank.addWallet(new SavingsWallet(id, user, balance));
    }

    private static void shutdown() {
        System.out.println("\nShutting down: waiting for in-flight payments...");
        waitForProcessing(5000);
        for (PaymentProcessor p : processors) p.shutdown();      // volatile flag + interrupt()
        for (PaymentProcessor p : processors) joinQuietly(p, 2000);
        logger.interrupt();
        joinQuietly(logger, 1000);
        System.out.println("All processors stopped. Final report:");
        finalReport();
    }

    private static void joinQuietly(Thread t, long ms) {
        try { t.join(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }

    private static void waitForProcessing(long maxMs) {
        long end = System.currentTimeMillis() + maxMs;
        while (bank.getProcessed() < bank.getQueued() && System.currentTimeMillis() < end) {
            try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        }
    }

    private static void finalReport() {
        printWallets();
        List<Payment> hist = bank.historySnapshot();
        System.out.println("\nPayments by status: " + ReportGenerator.statusCounts(hist));
        List<String> ids = savingsIds();
        if (!ids.isEmpty()) {
            System.out.println("\nSpending report (successful payments, Rs per 5-second slot):");
            ReportGenerator.printMatrix(ReportGenerator.spendMatrix(hist, ids, bank.getStartTime(), 5000, 6), ids, 5000);
        }
        System.out.println("\nLast audit lines:\n" + logger.tail(8));
        System.out.println("Goodbye.");
    }

    // =====================================================================================
    // Input helpers (validation loops, wrapper-class parsing)
    // =====================================================================================
    private static String readLine(String prompt) {
        System.out.print(prompt);
        return SC.nextLine().trim();
    }

    private static int readInt(String prompt, int min, int max) {
        while (true) {
            String s = readLine(prompt);
            try {
                int v = Integer.parseInt(s);
                if (v >= min && v <= max) return v;
                System.out.println("Enter a number between " + min + " and " + max + ".");
            } catch (NumberFormatException e) {
                System.out.println("That is not a whole number. Try again.");
            }
        }
    }

    private static double readDouble(String prompt, double min) {
        while (true) {
            String s = readLine(prompt);
            try {
                double v = Double.parseDouble(s);
                if (!Double.isNaN(v) && !Double.isInfinite(v) && v >= min) return v;
                System.out.println("Enter a number that is at least " + min + ".");
            } catch (NumberFormatException e) {
                System.out.println("That is not a valid number. Try again.");
            }
        }
    }

    private static double readAmount(String prompt) { return readDouble(prompt, 0.01); }

    // =====================================================================================
    // Menus
    // =====================================================================================
    private static void mainMenu() {
        while (true) {
            System.out.println("\n===== BankCore =====");
            System.out.println("1. Login\n2. Register\n0. Exit");
            int c = readInt("Choice: ", 0, 2);
            if (c == 0) return;
            if (c == 1) login(); else register();
        }
    }

    private static void register() {
        String user = readLine("Choose username (3-12 letters/digits): ");
        String pass = readLine("Choose password (min 4 chars): ");
        try {
            String id = users.register(user, pass);
            double opening = readDouble("Opening balance (Rs, min 100): ", 100);
            bank.addWallet(new SavingsWallet(id, user.toLowerCase(), opening));
            System.out.println("Account created. Your wallet id is " + id);
            logger.log("REGISTERED " + id);
        } catch (InvalidPaymentException e) {
            System.out.println("Could not register: " + e.getMessage());
        }
    }

    private static void login() {
        String user = readLine("Username: ").toLowerCase();
        String pass = readLine("Password: ");
        try {
            if (users.login(user, pass)) {
                logger.log("LOGIN " + user);
                if (user.equals("admin")) adminMenu(); else userMenu(user);
            } else if (!users.exists(user)) {
                System.out.println("Unknown user.");
            } else {
                System.out.println("Wrong password. Attempts left before lock: "
                        + (UserManager.MAX_FAILS - users.failedAttempts(user)));
            }
        } catch (WalletBlockedException e) {
            System.out.println(e.getMessage());
            logger.log("LOGIN BLOCKED " + user);
        }
    }

    // ---------------------------------------------------------------- user menu
    private static void userMenu(String user) {
        Wallet me;
        try {
            me = bank.find(user + "@pay");
        } catch (InvalidPaymentException e) {
            System.out.println(e.getMessage());
            return;
        }
        System.out.println("\nWelcome, " + user + "!");
        while (true) {
            System.out.printf("%n--- %s | balance Rs%.2f%s ---%n", me.getId(), me.getBalance(), me.isBlocked() ? " | BLOCKED" : "");
            System.out.println("1. Wallet info and search\n2. Deposit / Withdraw\n3. Send payment\n4. Cancel a pending payment (undo)");
            System.out.println("5. Payments held for verification\n6. What-if simulator\n7. Spending and savings\n8. History and reports\n0. Logout");
            int c = readInt("Choice: ", 0, 8);
            if (c == 0) return;
            switch (c) {
                case 1: walletInfo(me); break;
                case 2: depositWithdraw(me); break;
                case 3: sendPayment(me); break;
                case 4: cancelPending(); break;
                case 5: heldPayments(me); break;
                case 6: whatIf(me); break;
                case 7: spending(me); break;
                default: historyMenu(me);
            }
        }
    }

    private static void walletInfo(Wallet me) {
        System.out.printf("Wallet %s | type %s | balance Rs%.2f%n", me.getId(), me.type(), me.getBalance());
        if (me instanceof SavingsWallet) System.out.println("Rule: Rs" + SavingsWallet.MIN_BALANCE + " minimum balance must remain.");
        String q = readLine("Search wallets (text in id, or Enter to skip): ").toLowerCase();
        if (q.isEmpty()) return;
        int found = 0;
        for (Map.Entry<String, Wallet> e : sortedWallets().entrySet()) {
            if (e.getKey().contains(q)) {
                System.out.println("  " + ReportGenerator.mask(e.getKey()) + "  (" + e.getValue().type() + ")");
                found++;
            }
        }
        if (found == 0) System.out.println("  no match");
    }

    private static void depositWithdraw(Wallet me) {
        int c = readInt("1 = Deposit, 2 = Withdraw: ", 1, 2);
        double amt = readAmount("Amount (Rs): ");
        if (c == 1) {
            me.credit(amt);
            logger.log("DEPOSIT " + me.getId() + " Rs" + amt);
            System.out.printf("Deposited. Balance Rs%.2f%n", me.getBalance());
        } else {
            try {
                me.debit(amt);
                logger.log("WITHDRAW " + me.getId() + " Rs" + amt);
                System.out.printf("Withdrawn. Balance Rs%.2f%n", me.getBalance());
            } catch (InsufficientBalanceException | WalletBlockedException e) {
                System.out.println("Refused: " + e.getMessage());
            }
        }
    }

    private static void sendPayment(Wallet me) {
        String to = readLine("Receiver wallet id (e.g. swiggy@pay): ").toLowerCase();
        double amt = readAmount("Amount (Rs): ");
        String note = readLine("Note (e.g. 'swiggy dinner'): ");
        int prio = readInt("Priority 1 (low) - 3 (high): ", 1, 3);
        int undo = readInt("Undo window in seconds (0 = send immediately, max 10): ", 0, 10);
        Payment p = new Payment(me.getId(), to, amt, prio, analyzer.categorize(note + " " + to));
        try {
            PaymentGateway.Result r = gateway.submit(p, undo * 1000);
            System.out.println("Risk score " + p.getFraudScore() + ":\n" + p.getFraudNote());
            switch (r) {
                case HELD:
                    System.out.println("Payment #" + p.getId() + " needs verification. See menu 5.");
                    break;
                case SCHEDULED:
                    System.out.println("Payment #" + p.getId() + " will be sent in " + undo + " s. Use menu 4 to cancel it.");
                    break;
                default:
                    awaitResult(p, 3000);
            }
        } catch (InvalidPaymentException e) {
            System.out.println("Rejected: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static void awaitResult(Payment p, long maxMs) {
        long end = System.currentTimeMillis() + maxMs;
        while (p.getStatus() == PaymentStatus.PENDING && System.currentTimeMillis() < end) {
            try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); return; }
        }
        System.out.println("Payment #" + p.getId() + " is " + p.getStatus() + (p.getReason().isEmpty() ? "" : " - " + p.getReason()));
    }

    private static void cancelPending() {
        List<Integer> ids = bank.pendingUndoIds();
        if (ids.isEmpty()) { System.out.println("No payment is inside its undo window."); return; }
        System.out.println("Payments in undo window: " + ids);
        int id = readInt("Payment id to cancel: ", 1, Integer.MAX_VALUE);
        System.out.println(bank.cancelUndo(id) ? "Cancelled (the sleeping undo thread was interrupted)."
                : "Too late or unknown id: the payment has already been sent.");
    }

    private static void heldPayments(Wallet me) {
        List<Payment> held = bank.heldFor(me.getId());
        if (held.isEmpty()) { System.out.println("Nothing is waiting for verification."); return; }
        for (Payment p : held) System.out.println(p + "  risk " + p.getFraudScore());
        int id = readInt("Payment id to review (0 = back): ", 0, Integer.MAX_VALUE);
        if (id == 0) return;
        for (Payment p : held) {
            if (p.getId() == id) {
                int a = readInt("1 = I confirm this payment, 2 = Reject it: ", 1, 2);
                try {
                    if (a == 1) { gateway.release(p); awaitResult(p, 3000); }
                    else { gateway.reject(p); System.out.println("Rejected."); }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                return;
            }
        }
        System.out.println("No held payment with that id.");
    }

    private static void whatIf(Wallet me) {
        System.out.println("(What-if only calculates. Nothing in your account changes.)");
        int c = readInt("1 = Balance after a withdrawal, 2 = Months to reach a target, 3 = Savings from cutting expenses: ", 1, 3);
        if (c == 1) {
            double amt = readAmount("Withdrawal Rs: ");
            double after = WhatIfSimulator.balanceAfterWithdrawal(me.getBalance(), amt);
            System.out.printf("Balance would be Rs%.2f%s%n", after,
                    after < SavingsWallet.MIN_BALANCE && me instanceof SavingsWallet ? "  (below the Rs100 minimum: refused)" : "");
        } else if (c == 2) {
            double target = readAmount("Target Rs: ");
            double saved = readDouble("Already saved Rs: ", 0);
            double monthly = readDouble("Saving per month Rs: ", 0);
            int m = WhatIfSimulator.monthsToReach(target, saved, monthly);
            System.out.println(m < 0 ? "Saving per month must be above zero." : "You would reach it in " + m + " month(s).");
        } else {
            double exp = readAmount("Monthly spending Rs: ");
            double pct = readDouble("Cut by (percent, 0-100): ", 0);
            int months = readInt("Over how many months: ", 1, 120);
            System.out.printf("You would save about Rs%.2f%n", WhatIfSimulator.savingsFromCut(exp, pct, months));
        }
    }

    private static void spending(Wallet me) {
        while (true) {
            System.out.println("\n-- Spending and savings --");
            System.out.println("1. Spending by category\n2. Set category budget\n3. Set savings goal (round-up)\n4. Goal progress");
            System.out.println("5. Teach the categoriser\n6. My unusual-amount limit\n0. Back");
            int c = readInt("Choice: ", 0, 6);
            if (c == 0) return;
            List<Payment> hist = bank.historySnapshot();
            switch (c) {
                case 1: {
                    Map<String, Double> totals = analyzer.totalsByCategory(hist, me.getId());
                    if (totals.isEmpty()) { System.out.println("No successful payments yet."); break; }
                    double max = Collections.max(totals.values()), sum = 0;
                    for (Map.Entry<String, Double> e : totals.entrySet()) {
                        sum += e.getValue();
                        StringBuilder bar = new StringBuilder();
                        for (int i = 0; i < Math.round(e.getValue() / max * 30); i++) bar.append('#');
                        System.out.printf("%-10s %10.2f  %s%n", e.getKey(), e.getValue(), bar);
                    }
                    System.out.printf("Total spent Rs%.2f | current balance Rs%.2f%n", sum, me.getBalance());
                    for (String a : analyzer.budgetAlerts(me.getId(), totals)) System.out.println("ALERT: " + a);
                    break;
                }
                case 2: {
                    String cat = readLine("Category (Food/Shopping/Travel/Bills/Others): ");
                    analyzer.setBudget(me.getId(), cat, readAmount("Monthly budget Rs: "));
                    System.out.println("Budget saved.");
                    break;
                }
                case 3:
                    analyzer.setGoal(me.getId(), readAmount("Goal amount Rs: "));
                    System.out.println("Goal set. Every successful payment is rounded up to the next Rs10 and the difference is saved.");
                    break;
                case 4:
                    if (!analyzer.hasGoal(me.getId())) { System.out.println("No goal set."); break; }
                    System.out.printf("Saved Rs%.2f of Rs%.2f%n%s%n", analyzer.getGoalSaved(me.getId()),
                            analyzer.getGoalTarget(me.getId()),
                            analyzer.progressBar(analyzer.getGoalSaved(me.getId()), analyzer.getGoalTarget(me.getId())));
                    break;
                case 5: {
                    String kw = readLine("Keyword (e.g. 'pizza'): ");
                    if (kw.isEmpty()) break;
                    analyzer.learn(kw, readLine("Category: "));
                    System.out.println("Learned.");
                    break;
                }
                default: {
                    double lim = analyzer.adaptiveLimit(hist, me.getId());
                    System.out.println(lim < 0 ? "Not enough history yet (needs 3 successful payments)."
                            : String.format("Payments above about Rs%.2f are unusual for you (mean + 2 standard deviations).", lim));
                }
            }
        }
    }

    private static void historyMenu(Wallet me) {
        while (true) {
            System.out.println("\n-- History and reports --");
            System.out.println("1. Sort by amount\n2. Sort by time\n3. Sort by status\n4. Browse (next/previous)");
            System.out.println("5. Last 10 payments\n6. Spending matrix\n7. Status counts\n8. Receipt of my latest payment\n0. Back");
            int c = readInt("Choice: ", 0, 8);
            if (c == 0) return;
            List<Payment> mine = new ArrayList<Payment>();
            for (Payment p : bank.historySnapshot()) {
                if (p.getFrom().equals(me.getId()) || p.getTo().equals(me.getId())) mine.add(p);
            }
            switch (c) {
                case 1: printSorted(mine, ReportGenerator.BY_AMOUNT); break;
                case 2: printSorted(mine, ReportGenerator.BY_TIME); break;
                case 3: printSorted(mine, ReportGenerator.BY_STATUS); break;
                case 4: browse(mine); break;
                case 5:
                    for (Payment p : bank.recentPayments()) System.out.println(p);
                    break;
                case 6: {
                    List<String> ids = savingsIds();
                    ReportGenerator.printMatrix(ReportGenerator.spendMatrix(bank.historySnapshot(), ids,
                            bank.getStartTime(), 5000, 6), ids, 5000);
                    break;
                }
                case 7: System.out.println(ReportGenerator.statusCounts(bank.historySnapshot())); break;
                default: {
                    Payment last = null;
                    for (Payment p : mine) if (p.getFrom().equals(me.getId())) last = p;
                    System.out.println(last == null ? "No payments yet." : ReportGenerator.receipt(last));
                }
            }
        }
    }

    private static void printSorted(List<Payment> list, Comparator<Payment> cmp) {
        if (list.isEmpty()) { System.out.println("No payments yet."); return; }
        List<Payment> copy = new ArrayList<Payment>(list);
        Collections.sort(copy, cmp);
        for (Payment p : copy) System.out.println(p);
    }

    private static void browse(List<Payment> list) {
        if (list.isEmpty()) { System.out.println("No payments yet."); return; }
        ListIterator<Payment> it = list.listIterator();
        while (true) {
            String cmd = readLine("[n]ext, [p]revious, [q]uit: ").toLowerCase();
            if (cmd.equals("q")) return;
            if (cmd.equals("n") && it.hasNext()) System.out.println(it.next());
            else if (cmd.equals("p") && it.hasPrevious()) System.out.println(it.previous());
            else System.out.println("(nothing in that direction)");
        }
    }

    // ---------------------------------------------------------------- admin menu
    private static void adminMenu() {
        while (true) {
            System.out.println("\n--- ADMIN ---   mode: " + (bank.safeMode ? "SAFE" : "UNSAFE") + " | queue "
                    + queue.size() + "/" + queue.capacity());
            System.out.println("1. All wallets\n2. Run payment simulation (producers + consumers)\n3. Concept Lab");
            System.out.println("4. Toggle SAFE / UNSAFE mode\n5. Fraud threshold\n6. Purge expired queued payments");
            System.out.println("7. Audit log (tail)\n8. Self-test table\n9. Block / unblock a wallet\n10. Running threads\n0. Logout");
            int c = readInt("Choice: ", 0, 10);
            switch (c) {
                case 0: return;
                case 1: printWallets(); break;
                case 2: runSimulation(); break;
                case 3: labMenu(); break;
                case 4:
                    bank.safeMode = !bank.safeMode;
                    System.out.println("Mode is now " + (bank.safeMode ? "SAFE (ordered locking)." :
                            "UNSAFE (caller-order locking). Do NOT run the simulation in this mode: opposite transfers can deadlock."));
                    break;
                case 5:
                    System.out.println("Current threshold: " + fraud.getThreshold() + " (simulated value)");
                    fraud.setThreshold(readInt("New threshold (10-200): ", 10, 200));
                    break;
                case 6: {
                    int sec = readInt("Remove queued payments older than (seconds): ", 0, 3600);
                    System.out.println(queue.purgeExpired(sec * 1000L) + " payment(s) removed with Iterator.remove().");
                    break;
                }
                case 7: System.out.println(logger.tail(20)); break;
                case 8: SelfTest.runAll(); break;
                case 9: {
                    try {
                        Wallet w = bank.find(readLine("Wallet id: ").toLowerCase());
                        w.setBlocked(!w.isBlocked());
                        System.out.println(w.getId() + (w.isBlocked() ? " is now BLOCKED" : " is now ACTIVE"));
                        logger.log("ADMIN toggled block on " + w.getId());
                    } catch (InvalidPaymentException e) {
                        System.out.println(e.getMessage());
                    }
                    break;
                }
                default: {
                    Thread[] all = new Thread[processors.length + 2];
                    System.arraycopy(processors, 0, all, 0, processors.length);
                    all[processors.length] = logger;
                    all[processors.length + 1] = Thread.currentThread();
                    Lab.threadInfo(all);
                }
            }
        }
    }

    private static void runSimulation() {
        if (!bank.safeMode) { System.out.println("Switch to SAFE mode first (menu 4)."); return; }
        int clients = readInt("Number of app clients (1-8): ", 1, 8);
        int each = readInt("Payments per client (1-15): ", 1, 15);
        List<String> senders = savingsIds();
        List<String> receivers = new ArrayList<String>(sortedWallets().keySet());
        queue.setVerbose(true);
        AppClient[] apps = new AppClient[clients];
        Thread[] threads = new Thread[clients];
        int before = bank.historySnapshot().size();
        for (int i = 0; i < clients; i++) {
            apps[i] = new AppClient(gateway, senders, receivers, each);
            threads[i] = new Thread(apps[i], "app-" + (i + 1));
            threads[i].start();
        }
        System.out.println("Started " + clients + " producer threads. Watch the queue (capacity "
                + queue.capacity() + "): producers wait when it is full.\n");
        for (Thread t : threads) joinQuietly(t, 60000);
        waitForProcessing(30000);
        queue.setVerbose(false);
        int q = 0, h = 0, r = 0;
        for (AppClient a : apps) { q += a.queued; h += a.held; r += a.rejected; }
        System.out.printf("%nSimulation done: %d sent to queue, %d held for verification, %d rejected at the gateway.%n", q, h, r);
        List<Payment> hist = bank.historySnapshot();
        System.out.println("Settled in this run: " + (hist.size() - before) + " | " + ReportGenerator.statusCounts(hist));
        System.out.println("Failed payments are normal here: some wallets run out of money, which is the exception handling at work.");
    }

    private static void labMenu() {
        while (true) {
            System.out.println("\n--- CONCEPT LAB ---");
            System.out.println(" 1 OOP / polymorphism     2 Strings          3 Wrappers         4 Exceptions");
            System.out.println(" 5 Collections            6 run() vs start() 7 Thread states    8 Race condition");
            System.out.println(" 9 Deadlock and fix      10 Wait for funds  11 interrupt()     12 volatile flag   0 Back");
            int c = readInt("Choice: ", 0, 12);
            switch (c) {
                case 0: return;
                case 1: Lab.oopDemo(); break;
                case 2: Lab.stringDemo(); break;
                case 3: Lab.wrapperDemo(); break;
                case 4: Lab.exceptionDemo(); break;
                case 5: Lab.collectionsDemo(); break;
                case 6: Lab.runVsStartDemo(); break;
                case 7: Lab.threadStateDemo(); break;
                case 8: Lab.raceDemo(); break;
                case 9: Lab.deadlockDemo(); break;
                case 10: Lab.waitForFundsDemo(); break;
                case 11: Lab.interruptDemo(); break;
                default: Lab.volatileDemo();
            }
        }
    }

    // ---------------------------------------------------------------- shared views
    private static Map<String, Wallet> sortedWallets() {
        Map<String, Wallet> m = new TreeMap<String, Wallet>();            // sorted by id
        for (Wallet w : bank.allWallets()) m.put(w.getId(), w);
        return m;
    }

    private static List<String> savingsIds() {
        List<String> ids = new ArrayList<String>();
        for (Map.Entry<String, Wallet> e : sortedWallets().entrySet()) {
            if (e.getValue() instanceof SavingsWallet) ids.add(e.getKey());
        }
        return ids;
    }

    private static void printWallets() {
        System.out.printf("%n%-16s %-9s %12s  %s%n", "wallet", "type", "balance", "status");
        double total = 0;
        for (Wallet w : sortedWallets().values()) {
            System.out.printf("%-16s %-9s %12.2f  %s%n", w.getId(), w.type(), w.getBalance(), w.isBlocked() ? "BLOCKED" : "active");
            total += w.getBalance();
        }
        System.out.printf("%-26s %12.2f%n", "TOTAL (money is conserved)", total);
    }
}