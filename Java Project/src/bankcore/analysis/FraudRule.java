package bankcore.analysis;

import bankcore.core.Bank;
import bankcore.model.Payment;

/** Each rule scores a payment and can explain itself ("why was this flagged?"). */
public interface FraudRule {
    /** Points added to the risk score (0 if the rule does not fire). */
    int score(Payment p, Bank bank);

    String reason();
}