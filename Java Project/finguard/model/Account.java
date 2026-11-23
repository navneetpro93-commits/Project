package finguard.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

import finguard.exception.AccountFrozenException;
import finguard.exception.InsufficientBalanceException;

public abstract class Account implements Freezeable {
    private String accountNumber;
    private String customerId;
    private String holderName;
    private double balance;
    private boolean frozen;
    private ArrayList<Transaction> history;
    private HashMap<String, Double> categorySpend;
    private HashSet<String> knownPayees;
    private int[] recentDebitTicks;
    private int recentDebitCount;

    public Account(String accountNumber, String customerId, String holderName, double openingBalance) {
        this.accountNumber = accountNumber;
        this.customerId = customerId;
        this.holderName = holderName;
        this.balance = openingBalance;
        this.frozen = false;
        this.history = new ArrayList<Transaction>();
        this.categorySpend = new HashMap<String, Double>();
        this.knownPayees = new HashSet<String>();
        this.recentDebitTicks = new int[5];
        this.recentDebitCount = 0;
    }

    public abstract String getAccountType();

    public abstract double availableLimit();

    public synchronized void freeze() {
        frozen = true;
    }

    public synchronized void unfreeze() {
        frozen = false;
    }

    public synchronized boolean isFrozen() {
        return frozen;
    }

    public synchronized void assertNotFrozen() throws AccountFrozenException {
        if (frozen) {
            throw new AccountFrozenException("Account " + maskNumber() + " is FROZEN. Debits and credits are blocked.");
        }
    }

    public synchronized void credit(double amount) throws AccountFrozenException {
        assertNotFrozen();
        balance = balance + amount;
    }

    public synchronized void debit(double amount) throws AccountFrozenException, InsufficientBalanceException {
        assertNotFrozen();
        if (amount > availableLimit()) {
            throw new InsufficientBalanceException(
                    "Need Rs." + amount + " but available is Rs." + availableLimit()
                            + " on " + maskNumber());
        }
        balance = balance - amount;
    }

    public synchronized void record(Transaction txn) {
        history.add(txn);
        if (txn.getAmount() > 0 && isDebitType(txn.getType())) {
            rememberDebitTick(txn.getTick());
            String cat = txn.getCategory();
            Double old = categorySpend.get(cat);
            if (old == null) {
                categorySpend.put(cat, txn.getAmount());
            } else {
                categorySpend.put(cat, old.doubleValue() + txn.getAmount());
            }
        }
        if (txn.getToAccount() != null && txn.getToAccount().length() > 0
                && !txn.getToAccount().equals(accountNumber)
                && "SUCCESS".equals(txn.getStatus())) {
            knownPayees.add(txn.getToAccount());
        }
    }

    private boolean isDebitType(String type) {
        return TransactionRequest.TYPE_WITHDRAW.equals(type)
                || TransactionRequest.TYPE_TRANSFER.equals(type)
                || TransactionRequest.TYPE_BILL.equals(type);
    }

    private void rememberDebitTick(int tick) {
        if (recentDebitCount < recentDebitTicks.length) {
            recentDebitTicks[recentDebitCount] = tick;
            recentDebitCount++;
        } else {
            for (int i = 0; i < recentDebitTicks.length - 1; i++) {
                recentDebitTicks[i] = recentDebitTicks[i + 1];
            }
            recentDebitTicks[recentDebitTicks.length - 1] = tick;
        }
    }

    public synchronized int debitCountInWindow(int currentTick, int window) {
        int count = 0;
        int n = recentDebitCount;
        if (n > recentDebitTicks.length) {
            n = recentDebitTicks.length;
        }
        for (int i = 0; i < n; i++) {
            if (currentTick - recentDebitTicks[i] <= window) {
                count++;
            }
        }
        return count;
    }

    public synchronized int samePayeeInLast(String payee, int lastN) {
        int count = 0;
        int start = history.size() - lastN;
        if (start < 0) {
            start = 0;
        }
        for (int i = start; i < history.size(); i++) {
            Transaction t = history.get(i);
            if (payee.equals(t.getToAccount())) {
                count++;
            }
        }
        return count;
    }

    public String maskNumber() {
        if (accountNumber.length() <= 4) {
            return accountNumber;
        }
        return "XXXXXX" + accountNumber.substring(accountNumber.length() - 4);
    }

    public synchronized double getBalance() {
        return balance;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public String getCustomerId() {
        return customerId;
    }

    public String getHolderName() {
        return holderName;
    }

    public synchronized ArrayList<Transaction> copyHistory() {
        ArrayList<Transaction> copy = new ArrayList<Transaction>();
        for (int i = 0; i < history.size(); i++) {
            copy.add(history.get(i));
        }
        return copy;
    }

    public synchronized HashMap<String, Double> copyCategorySpend() {
        HashMap<String, Double> copy = new HashMap<String, Double>();
        copy.putAll(categorySpend);
        return copy;
    }

    public synchronized boolean isKnownPayee(String payee) {
        return knownPayees.contains(payee);
    }

    public synchronized HashSet<String> copyKnownPayees() {
        HashSet<String> copy = new HashSet<String>();
        copy.addAll(knownPayees);
        return copy;
    }
}
