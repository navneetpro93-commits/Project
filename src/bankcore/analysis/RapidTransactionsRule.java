package bankcore.analysis;

import bankcore.core.Bank;
import bankcore.model.Payment;

public class RapidTransactionsRule implements FraudRule {
    private final int maxCount;
    private final long windowMs;
    public RapidTransactionsRule(int maxCount, long windowMs) { this.maxCount = maxCount; this.windowMs = windowMs; }

    @Override public int score(Payment p, Bank bank) {
        return bank.recentTxCount(p.getFrom(), windowMs) >= maxCount ? 20 : 0;
    }
    @Override public String reason() { return maxCount + "+ payments within " + windowMs / 1000 + " s"; }
}