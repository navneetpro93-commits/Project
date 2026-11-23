package finguard.model;

public class SavingsAccount extends Account {
    public static final double MIN_BALANCE = 500.0;
    private double vaultBalance;
    private boolean roundUpEnabled;

    public SavingsAccount(String accountNumber, String customerId, String holderName, double openingBalance) {
        super(accountNumber, customerId, holderName, openingBalance);
        this.vaultBalance = 0;
        this.roundUpEnabled = true;
    }

    public String getAccountType() {
        return "SAVINGS";
    }

    public synchronized double availableLimit() {
        return getBalance();
    }

    public synchronized void addToVault(double spare) {
        vaultBalance = vaultBalance + spare;
    }

    public synchronized double getVaultBalance() {
        return vaultBalance;
    }

    public synchronized boolean isRoundUpEnabled() {
        return roundUpEnabled;
    }

    public synchronized void setRoundUpEnabled(boolean roundUpEnabled) {
        this.roundUpEnabled = roundUpEnabled;
    }
}
