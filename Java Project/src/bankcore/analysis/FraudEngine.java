package bankcore.analysis;

import bankcore.core.Bank;
import bankcore.model.Payment;

import java.util.ArrayList;
import java.util.List;

/** Runs every rule, sums the points and writes a human-readable breakdown. */
public class FraudEngine {
    private final List<FraudRule> rules = new ArrayList<FraudRule>();
    private volatile int threshold = 70;               // simulated, configurable

    public FraudEngine() {
        rules.add(new LargeAmountRule(20000));
        rules.add(new NewBeneficiaryRule());
        rules.add(new RapidTransactionsRule(3, 10000));
        rules.add(new RepeatedFailureRule(2));
    }

    public int evaluate(Payment p, Bank bank, StringBuilder explain) {
        int total = 0;
        for (FraudRule r : rules) {
            int s = r.score(p, bank);
            if (s > 0) {
                total += s;
                explain.append(String.format("  +%d  %s%n", s, r.reason()));
            }
        }
        if (total == 0) explain.append("  no risk rules fired\n");
        explain.append(String.format("  = %d (verification needed at %d or more)", total, threshold));
        return total;
    }

    public boolean isSuspicious(int score) { return score >= threshold; }
    public int getThreshold() { return threshold; }
    public void setThreshold(int t) { threshold = t; }
}