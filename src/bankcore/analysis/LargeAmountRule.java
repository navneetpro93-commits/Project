package bankcore.analysis;

import bankcore.core.Bank;
import bankcore.model.Payment;

public class LargeAmountRule implements FraudRule {
    private final double limit;                        // simulated, configurable value
    public LargeAmountRule(double limit) { this.limit = limit; }

    @Override public int score(Payment p, Bank bank) { return p.getAmount() >= limit ? 30 : 0; }
    @Override public String reason() { return String.format("large amount (>= Rs%.0f)", limit); }
}