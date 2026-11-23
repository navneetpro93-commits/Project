package bankcore.analysis;

import bankcore.core.Bank;
import bankcore.model.Payment;

public class RepeatedFailureRule implements FraudRule {
    private final int maxFailures;
    public RepeatedFailureRule(int maxFailures) { this.maxFailures = maxFailures; }

    @Override public int score(Payment p, Bank bank) {
        return bank.getFailures(p.getFrom()) >= maxFailures ? 20 : 0;
    }
    @Override public String reason() { return maxFailures + "+ recent failed payments"; }
}