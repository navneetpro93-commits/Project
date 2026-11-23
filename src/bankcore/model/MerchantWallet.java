package bankcore.model;

import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.WalletBlockedException;

/** Merchant rule: no minimum balance, but a per-transaction limit (simulated value). */
public class MerchantWallet extends Wallet {
    public static final double PER_TXN_LIMIT = 50000;

    public MerchantWallet(String id, String owner, double balance) { super(id, owner, balance); }

    @Override
    public synchronized void debit(double amt) throws InsufficientBalanceException, WalletBlockedException {
        ensureActive();
        if (amt > PER_TXN_LIMIT) {
            throw new InsufficientBalanceException(String.format(
                    "%s: %.2f exceeds merchant per-transaction limit %.2f", id, amt, PER_TXN_LIMIT));
        }
        if (balance < amt) {
            throw new InsufficientBalanceException(String.format(
                    "%s: balance %.2f is less than %.2f", id, balance, amt));
        }
        balance -= amt;
    }

    @Override public String type() { return "MERCHANT"; }
}