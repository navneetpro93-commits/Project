package finguard;

import java.util.ArrayList;
import java.util.Scanner;

import finguard.concurrent.ClearingHouse;
import finguard.concurrent.CustomerWorker;
import finguard.concurrent.RaceLab;
import finguard.concurrent.SettlementWorker;
import finguard.exception.AccountNotFoundException;
import finguard.exception.InvalidPinException;
import finguard.model.Account;
import finguard.model.Customer;
import finguard.model.TransactionRequest;
import finguard.safety.BankClock;
import finguard.safety.CooldownVault;
import finguard.service.Bank;

public class FinGuardApp {
    private Scanner sc;
    private Bank bank;
    private BankClock clock;
    private CooldownVault vault;
    private ClearingHouse house;
    private Thread clockThread;
    private Thread vaultThread;
    private Thread settleThread;
    private Thread pulseThread;
    private Customer session;
    private SettlementWorker settler;

    public static void main(String[] args) {
        FinGuardApp app = new FinGuardApp();
        app.start();
    }

    public void start() {
        sc = new Scanner(System.in);
        clock = new BankClock();
        vault = new CooldownVault(clock);
        bank = new Bank(clock, vault);
        house = new ClearingHouse(5, bank);
        vault.setClearingHouse(house);
        settler = new SettlementWorker(house);

        clockThread = new Thread(clock, "bank-clock");
        vaultThread = new Thread(vault, "cooldown-watcher");
        settleThread = new Thread(settler, "settlement");
        pulseThread = new Thread(new Runnable() {
            public void run() {
                while (clock.isRunning()) {
                    try {
                        clock.awaitAtLeast(clock.now() + 1);
                    } catch (InterruptedException e) {
                        return;
                    }
                    vault.pulse();
                }
            }
        }, "cooldown-pulse");
        clockThread.setDaemon(true);
        vaultThread.setDaemon(true);
        settleThread.setDaemon(true);
        pulseThread.setDaemon(true);
        clockThread.start();
        vaultThread.start();
        settleThread.start();
        pulseThread.start();

        banner();
        bank.seedDemo();
        loop();
        shutdown();
    }

    private void banner() {
        System.out.println();
        System.out.println("======================================================");
        System.out.println("   FinGuard  |  Intelligent Banking Safety Console   ");
        System.out.println("   Lectures 1-31 only  |  in-memory  |  no database  ");
        System.out.println("======================================================");
    }

    private void loop() {
        boolean live = true;
        while (live) {
            System.out.println();
            System.out.println("Bank clock tick: " + clock.now()
                    + (session == null ? "  |  not logged in" : "  |  hello " + session.getName()));
            System.out.println("1. Create customer");
            System.out.println("2. Create account");
            System.out.println("3. Login");
            System.out.println("4. Deposit / Salary credit");
            System.out.println("5. Withdraw");
            System.out.println("6. Transfer / Bill pay");
            System.out.println("7. Statement");
            System.out.println("8. Spending intelligence");
            System.out.println("9. Held cooldown queue");
            System.out.println("10. Emergency freeze / unfreeze");
            System.out.println("11. Savings challenge board");
            System.out.println("12. Concurrency lab (race + lifecycle)");
            System.out.println("13. Live clearing demo (priority + wait/notify)");
            System.out.println("14. Freeze vs worker threads");
            System.out.println("0. Exit");
            System.out.print("Choice: ");
            int choice = readInt();
            try {
                if (choice == 1) {
                    createCustomer();
                } else if (choice == 2) {
                    createAccount();
                } else if (choice == 3) {
                    login();
                } else if (choice == 4) {
                    creditMenu();
                } else if (choice == 5) {
                    withdrawMenu();
                } else if (choice == 6) {
                    transferMenu();
                } else if (choice == 7) {
                    statementMenu();
                } else if (choice == 8) {
                    spendMenu();
                } else if (choice == 9) {
                    heldMenu();
                } else if (choice == 10) {
                    freezeMenu();
                } else if (choice == 11) {
                    bank.getChallenges().printLeaderboard();
                } else if (choice == 12) {
                    new RaceLab().runDemo();
                } else if (choice == 13) {
                    priorityDemo();
                } else if (choice == 14) {
                    freezeRaceDemo();
                } else if (choice == 0) {
                    live = false;
                } else {
                    System.out.println("Unknown choice");
                }
            } catch (Exception e) {
                System.out.println("Error: " + e.getMessage());
            }
        }
    }

    private void createCustomer() {
        System.out.print("Name: ");
        String name = sc.nextLine();
        System.out.print("4-digit PIN: ");
        String pin = sc.nextLine();
        Customer c = bank.createCustomer(name, pin);
        System.out.println("Created " + c.getCustomerId() + " for " + c.getName());
    }

    private void createAccount() throws AccountNotFoundException {
        System.out.print("Customer id: ");
        String id = sc.nextLine();
        System.out.print("Type SAVINGS / CURRENT: ");
        String type = sc.nextLine();
        System.out.print("Opening balance: ");
        double open = readDouble();
        Account acc = bank.createAccount(id, type, open);
        System.out.println("Opened " + acc.getAccountType() + " " + acc.getAccountNumber()
                + " masked " + acc.maskNumber());
    }

    private void login() throws AccountNotFoundException, InvalidPinException {
        System.out.print("Customer id: ");
        String id = sc.nextLine();
        System.out.print("PIN: ");
        String pin = sc.nextLine();
        session = bank.login(id, pin);
        System.out.println("Welcome " + session.getName() + ". Accounts: " + session.getAccountNumbers());
    }

    private void creditMenu() throws Exception {
        String acc = askAccount("Credit into account");
        System.out.print("Amount: ");
        double amt = readDouble();
        System.out.print("Purpose (salary / other): ");
        String purpose = sc.nextLine();
        String type = purpose.toLowerCase().indexOf("salary") >= 0
                ? TransactionRequest.TYPE_SALARY
                : TransactionRequest.TYPE_DEPOSIT;
        TransactionRequest req = bank.buildRequest(type, acc, acc, amt, purpose);
        System.out.println(bank.settle(req, false));
    }

    private void withdrawMenu() throws Exception {
        String acc = askAccount("Withdraw from account");
        System.out.print("Amount: ");
        double amt = readDouble();
        System.out.print("Purpose (food / atm / ...): ");
        String purpose = sc.nextLine();
        TransactionRequest req = bank.buildRequest(TransactionRequest.TYPE_WITHDRAW, acc, "", amt, purpose);
        System.out.println(bank.settle(req, false));
    }

    private void transferMenu() throws Exception {
        String from = askAccount("From account");
        System.out.print("To account number: ");
        String to = sc.nextLine();
        System.out.print("Amount: ");
        double amt = readDouble();
        System.out.print("Purpose (upi / rent bill / food ...): ");
        String purpose = sc.nextLine();
        String type = purpose.toLowerCase().indexOf("bill") >= 0
                ? TransactionRequest.TYPE_BILL
                : TransactionRequest.TYPE_TRANSFER;
        TransactionRequest req = bank.buildRequest(type, from, to, amt, purpose);
        System.out.println(bank.settle(req, false));
    }

    private void statementMenu() throws Exception {
        String acc = askAccount("Account");
        System.out.print("Sort by TICK or AMOUNT: ");
        String sort = sc.nextLine();
        bank.printStatement(acc, sort);
    }

    private void spendMenu() throws Exception {
        String acc = askAccount("Account");
        bank.printSpending(acc);
    }

    private void heldMenu() {
        ArrayList<TransactionRequest> held = vault.snapshot();
        if (held.isEmpty()) {
            System.out.println("No transactions in cooldown.");
            return;
        }
        for (int i = 0; i < held.size(); i++) {
            TransactionRequest r = held.get(i);
            System.out.println("  " + r.shortLabel() + " readyTick=" + r.getReadyTick());
        }
        System.out.print("Cancel request id (0 to skip): ");
        int id = readInt();
        if (id != 0) {
            boolean ok = vault.cancel(id);
            System.out.println(ok ? "Cancelled" : "Id not found");
        }
    }

    private void freezeMenu() throws Exception {
        String acc = askAccount("Account");
        System.out.print("1 freeze  2 unfreeze: ");
        int m = readInt();
        System.out.print("PIN: ");
        String pin = sc.nextLine();
        if (m == 1) {
            bank.freeze(acc, pin);
        } else {
            System.out.print("Type UNFREEZE: ");
            String phrase = sc.nextLine();
            bank.unfreeze(acc, pin, phrase);
        }
    }

    private void priorityDemo() throws Exception {
        System.out.println("Submitting SALARY, UPI, BILL together into bounded priority queue (capacity 5)...");
        System.out.println("Settlement thread state now: " + settleThread.getState());
        String nav = "FG1001";
        String aarav = "FG1003";
        TransactionRequest upi = bank.buildRequest(TransactionRequest.TYPE_TRANSFER, nav, aarav, 500, "upi snack");
        TransactionRequest bill = bank.buildRequest(TransactionRequest.TYPE_BILL, nav, aarav, 1200, "electric bill");
        TransactionRequest salary = bank.buildRequest(TransactionRequest.TYPE_SALARY, aarav, nav, 8000, "salary");
        TransactionRequest[] jobs1 = new TransactionRequest[] { upi };
        TransactionRequest[] jobs2 = new TransactionRequest[] { bill, salary };
        Thread p1 = new Thread(new CustomerWorker("producer-UPI", house, jobs1), "producer-UPI");
        Thread p2 = new Thread(new CustomerWorker("producer-BILL-SALARY", house, jobs2), "producer-BILL-SALARY");
        System.out.println("Producer UPI state before start: " + p1.getState());
        p1.start();
        p2.start();
        p1.join();
        p2.join();
        Thread.sleep(1500);
        System.out.println("Watch the SETTLE lines: SALARY (p=80) before BILL (p=60) before UPI (p=40).");
        System.out.println("Navneet statement after clearing:");
        bank.printStatement(nav, "TICK");
    }

    private void freezeRaceDemo() throws Exception {
        final String acc = "FG1002";
        System.out.println("Three workers will try to withdraw from current account " + acc
                + " while main thread freezes it.");
        TransactionRequest[] w1 = new TransactionRequest[] {
                bank.buildRequest(TransactionRequest.TYPE_WITHDRAW, acc, "", 100, "atm")
        };
        TransactionRequest[] w2 = new TransactionRequest[] {
                bank.buildRequest(TransactionRequest.TYPE_WITHDRAW, acc, "", 100, "atm")
        };
        TransactionRequest[] w3 = new TransactionRequest[] {
                bank.buildRequest(TransactionRequest.TYPE_WITHDRAW, acc, "", 100, "atm")
        };
        Thread t1 = new Thread(new CustomerWorker("wd-1", house, w1), "wd-1");
        Thread t2 = new Thread(new CustomerWorker("wd-2", house, w2), "wd-2");
        Thread t3 = new Thread(new CustomerWorker("wd-3", house, w3), "wd-3");
        t1.start();
        bank.freeze(acc, "1234");
        t2.start();
        t3.start();
        t1.join();
        t2.join();
        t3.join();
        Thread.sleep(800);
        bank.unfreeze(acc, "1234", "UNFREEZE");
    }

    private String askAccount(String label) throws AccountNotFoundException {
        if (session != null) {
            System.out.println(label + "  your accounts: " + session.getAccountNumbers());
        } else {
            System.out.println(label);
        }
        System.out.print("Account number: ");
        String acc = sc.nextLine();
        bank.requireAccount(acc);
        return acc;
    }

    private int readInt() {
        while (true) {
            String line = sc.nextLine();
            try {
                return Integer.parseInt(line.trim());
            } catch (NumberFormatException e) {
                System.out.print("Enter a number: ");
            }
        }
    }

    private double readDouble() {
        while (true) {
            String line = sc.nextLine();
            try {
                return Double.parseDouble(line.trim());
            } catch (NumberFormatException e) {
                System.out.print("Enter an amount: ");
            }
        }
    }

    private void shutdown() {
        System.out.println("Shutting FinGuard down...");
        settler.stopWorker();
        vault.stopVault();
        clock.stopClock();
        sc.close();
    }
}
