package bankcore.model;

import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.WalletBlockedException;

/** Savings rule: a minimum balance must always remain. */
public class SavingsWallet extends Wallet {
    public static final double MIN_BALANCE = 100;

    public SavingsWallet(String id, String owner, double balance) { super(id, owner, balance); }

    @Override
    public synchronized void debit(double amt) throws InsufficientBalanceException, WalletBlockedException {
        ensureActive();
        if (balance - amt < MIN_BALANCE) {
            throw new InsufficientBalanceException(String.format(
                    "%s: balance %.2f, need %.2f plus minimum %.2f", id, balance, amt, MIN_BALANCE));
        }
        balance -= amt;
    }

    @Override public String type() { return "SAVINGS"; }
}