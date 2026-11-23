package bankcore.lab;

import bankcore.analysis.FraudEngine;
import bankcore.analysis.SpendingAnalyzer;
import bankcore.analysis.WhatIfSimulator;
import bankcore.core.AuditLogger;
import bankcore.core.Bank;
import bankcore.core.PaymentGateway;
import bankcore.core.PaymentQueue;
import bankcore.core.UserManager;
import bankcore.model.MerchantWallet;
import bankcore.model.Payment;
import bankcore.model.SavingsWallet;
import bankcore.model.Wallet;

import java.util.PriorityQueue;

/**
 * Table-driven test cases: Input | Expected | Actual | PASS/FAIL.
 * Exceptions are reported by class name so the table reads like a coding-platform test sheet.
 */
public class SelfTest {
    /** One test case. run() returns the actual output as text. */
    private abstract static class Case {
        final String name, input, expected;
        Case(String name, String input, String expected) { this.name = name; this.input = input; this.expected = expected; }
        abstract String run() throws Exception;
    }

    private static int pass, fail;

    public static void runAll() {
        final Bank bank = new Bank();
        final AuditLogger logger = new AuditLogger();          // never started: log() just queues text
        final PaymentQueue queue = new PaymentQueue(50);
        final FraudEngine fraud = new FraudEngine();
        final PaymentGateway gw = new PaymentGateway(bank, queue, fraud, logger);
        final SpendingAnalyzer analyzer = new SpendingAnalyzer();
        try {
            bank.addWallet(new SavingsWallet("t1@pay", "T1", 5000));
            bank.addWallet(new SavingsWallet("t2@pay", "T2", 5000));
            bank.addWallet(new MerchantWallet("shop@pay", "Shop", 100));
        } catch (Exception e) {
            System.out.println("setup failed: " + e);
            return;
        }

        Case[] cases = {
                new Case("Negative amount", "t1->t2, -5", "InvalidPaymentException") {
                    String run() throws Exception { gw.submit(new Payment("t1@pay", "t2@pay", -5, 1, "x"), 0); return "OK"; } },
                new Case("Zero amount", "t1->t2, 0", "InvalidPaymentException") {
                    String run() throws Exception { gw.submit(new Payment("t1@pay", "t2@pay", 0, 1, "x"), 0); return "OK"; } },
                new Case("Self transfer", "t1->t1, 100", "InvalidPaymentException") {
                    String run() throws Exception { gw.submit(new Payment("t1@pay", "t1@pay", 100, 1, "x"), 0); return "OK"; } },
                new Case("Unknown receiver", "t1->ghost@pay", "InvalidPaymentException") {
                    String run() throws Exception { gw.submit(new Payment("t1@pay", "ghost@pay", 100, 1, "x"), 0); return "OK"; } },
                new Case("Valid payment", "t1->t2, 100", "QUEUED") {
                    String run() throws Exception { return gw.submit(new Payment("t1@pay", "t2@pay", 100, 1, "x"), 0).name(); } },
                new Case("Same payment submitted twice", "same object", "InvalidPaymentException") {
                    String run() throws Exception {
                        Payment p = new Payment("t2@pay", "t1@pay", 77, 1, "x");
                        gw.submit(p, 0);
                        gw.submit(p, 0);
                        return "OK"; } },
                new Case("Duplicate transfer within window", "t1->t2, 100 again", "InvalidPaymentException") {
                    String run() throws Exception { gw.submit(new Payment("t1@pay", "t2@pay", 100, 1, "x"), 0); return "OK"; } },
                new Case("Savings minimum balance", "balance 150, debit 100", "InsufficientBalanceException") {
                    String run() throws Exception { new SavingsWallet("s@pay", "S", 150).debit(100); return "OK"; } },
                new Case("Merchant per-transaction limit", "debit 60000", "InsufficientBalanceException") {
                    String run() throws Exception { new MerchantWallet("m@pay", "M", 90000).debit(60000); return "OK"; } },
                new Case("Blocked wallet", "blocked, debit 10", "WalletBlockedException") {
                    String run() throws Exception { Wallet w = new SavingsWallet("b@pay", "B", 1000); w.setBlocked(true); w.debit(10); return "OK"; } },
                new Case("Non-numeric amount", "parse \"abc\"", "NumberFormatException") {
                    String run() { return String.valueOf(Double.parseDouble("abc")); } },
                new Case("Amount with spaces", "parse \" 12.5 \"", "12.5") {
                    String run() { return String.valueOf(Double.parseDouble(" 12.5 ".trim())); } },
                new Case("Login locks after 3 failures", "3 wrong passwords", "WalletBlockedException") {
                    String run() throws Exception {
                        UserManager u = new UserManager();
                        u.register("tester", "right1");
                        u.login("tester", "x"); u.login("tester", "y"); u.login("tester", "z");
                        return "OK"; } },
                new Case("Locked account, right password", "correct password while locked", "WalletBlockedException") {
                    String run() throws Exception {
                        UserManager u = new UserManager();
                        u.register("tester", "right1");
                        for (int i = 0; i < 3; i++) { try { u.login("tester", "bad"); } catch (Exception ignore) { } }
                        u.login("tester", "right1");
                        return "OK"; } },
                new Case("Login succeeds", "right password", "true") {
                    String run() throws Exception { UserManager u = new UserManager(); u.register("tester", "right1"); return String.valueOf(u.login("tester", "right1")); } },
                new Case("Round-up of 123", "roundUpAmount(123)", "7.0") {
                    String run() { return String.valueOf(SpendingAnalyzer.roundUpAmount(123)); } },
                new Case("Round-up of 120", "roundUpAmount(120)", "0.0") {
                    String run() { return String.valueOf(SpendingAnalyzer.roundUpAmount(120)); } },
                new Case("Priority queue order", "priority 1 then 3", "3") {
                    String run() {
                        PriorityQueue<Payment> pq = new PriorityQueue<Payment>();
                        pq.add(new Payment("a", "b", 1, 1, "x"));
                        pq.add(new Payment("a", "b", 1, 3, "x"));
                        return String.valueOf(pq.poll().getPriority()); } },
                new Case("What-if months to target", "10000 target, 2000 saved, 1500/mo", "6") {
                    String run() { return String.valueOf(WhatIfSimulator.monthsToReach(10000, 2000, 1500)); } },
                new Case("String == vs equals", "new String(\"a@pay\") == \"a@pay\"", "false") {
                    @SuppressWarnings("StringEquality")
                    String run() { return String.valueOf(new String("a@pay") == "a@pay"); } },
                new Case("Categoriser", "\"swiggy order\"", "Food") {
                    String run() { return analyzer.categorize("swiggy order"); } },
                new Case("Fraud score reaches threshold", "Rs25000, new payee, 3 rapid txs", "true") {
                    String run() {
                        for (int i = 0; i < 3; i++) bank.recordTx("t2@pay");
                        Payment p = new Payment("t2@pay", "shop@pay", 25000, 1, "x");
                        int score = fraud.evaluate(p, bank, new StringBuilder());
                        return String.valueOf(fraud.isSuspicious(score)); } },
                new Case("10 threads x 100 safe deposits", "expected 10000", "10000.0") {
                    String run() throws Exception {
                        final Wallet w = new SavingsWallet("c@pay", "C", 0);
                        Thread[] ts = new Thread[10];
                        for (int i = 0; i < ts.length; i++) {
                            ts[i] = new Thread(new Runnable() {
                                @Override public void run() { for (int k = 0; k < 100; k++) w.credit(10); }
                            });
                            ts[i].start();
                        }
                        for (Thread t : ts) t.join();
                        return String.valueOf(w.getBalance()); } },
        };

        pass = 0; fail = 0;
        System.out.printf("%n%-3s %-34s %-36s %-28s %-28s %s%n", "#", "Case", "Input", "Expected", "Actual", "Result");
        System.out.println("-".repeat(140));
        for (int i = 0; i < cases.length; i++) {
            String actual;
            try {
                actual = cases[i].run();
            } catch (Exception e) {
                actual = e.getClass().getSimpleName();
            }
            boolean ok = actual.equals(cases[i].expected);
            if (ok) pass++; else fail++;
            System.out.printf("%-3d %-34s %-36s %-28s %-28s %s%n", i + 1, cases[i].name, cases[i].input,
                    cases[i].expected, actual, ok ? "PASS" : "FAIL");
        }
        System.out.println("-".repeat(140));
        System.out.println("Passed " + pass + " / " + (pass + fail));
    }
}