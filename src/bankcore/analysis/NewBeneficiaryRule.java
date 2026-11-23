package bankcore.analysis;

import bankcore.core.Bank;
import bankcore.model.Payment;

public class NewBeneficiaryRule implements FraudRule {
    @Override public int score(Payment p, Bank bank) {
        return bank.isKnownBeneficiary(p.getFrom(), p.getTo()) ? 0 : 25;
    }
    @Override public String reason() { return "first payment to this beneficiary"; }
}