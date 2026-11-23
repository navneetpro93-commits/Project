package finguard.model;

import finguard.exception.AccountFrozenException;
import finguard.exception.InsufficientBalanceException;

public class CurrentAccount extends Account {
    private double overdraftLimit;

    public CurrentAccount(String accountNumber, String customerId, String holderName,
                          double openingBalance, double overdraftLimit) {
        super(accountNumber, customerId, holderName, openingBalance);
        this.overdraftLimit = overdraftLimit;
    }

    public String getAccountType() {
        return "CURRENT";
    }

    public synchronized double availableLimit() {
        return getBalance() + overdraftLimit;
    }

    public synchronized void debit(double amount) throws AccountFrozenException, InsufficientBalanceException {
        super.debit(amount);
    }

    public double getOverdraftLimit() {
        return overdraftLimit;
    }
}
