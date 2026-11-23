package finguard.safety;

import java.util.ArrayList;

import finguard.model.Account;
import finguard.model.TransactionRequest;

public class RuleEngine {
    public static final int ALLOW = 0;
    public static final int COOLDOWN = 1;
    public static final int BLOCK = 2;

    public static class Result {
        public int score;
        public int decision;
        public ArrayList<String> fired;

        public Result() {
            score = 0;
            decision = ALLOW;
            fired = new ArrayList<String>();
        }
    }

    public Result score(Account account, TransactionRequest request) {
        Result result = new Result();
        String type = request.getType();
        boolean debit = TransactionRequest.TYPE_WITHDRAW.equals(type)
                || TransactionRequest.TYPE_TRANSFER.equals(type)
                || TransactionRequest.TYPE_BILL.equals(type);
        if (!debit) {
            result.decision = ALLOW;
            return result;
        }

        double amount = request.getAmount();
        double balance = account.getBalance();

        if (balance > 0 && amount > 0.5 * balance) {
            result.score += 30;
            result.fired.add("+30 amount > 50% of balance");
        }
        if (balance > 0 && amount > 0.9 * balance) {
            result.score += 20;
            result.fired.add("+20 amount > 90% of balance");
        }

        String payee = request.getPayeeKey();
        boolean cashDebit = TransactionRequest.TYPE_WITHDRAW.equals(type)
                || "CASH".equals(payee) || payee == null || payee.length() == 0;
        if (!cashDebit && !account.isKnownPayee(payee)) {
            result.score += 25;
            result.fired.add("+25 first-time payee " + payee);
        }

        int burst = account.debitCountInWindow(request.getCreatedTick(), 3);
        if (burst >= 3) {
            result.score += 20;
            result.fired.add("+20 rapid-fire: " + burst + " debits in last 3 ticks");
        }

        if (payee != null && account.samePayeeInLast(payee, 3) >= 2) {
            result.score += 15;
            result.fired.add("+15 same payee repeated in last 3 transactions");
        }

        if (amount >= 50000 && amount % 10000 == 0) {
            result.score += 10;
            result.fired.add("+10 large round-figure amount");
        }

        if (result.score >= 85) {
            result.decision = BLOCK;
        } else if (result.score >= 70) {
            result.decision = COOLDOWN;
        } else {
            result.decision = ALLOW;
        }
        return result;
    }

    public String decisionName(int decision) {
        if (decision == BLOCK) {
            return "BLOCK";
        }
        if (decision == COOLDOWN) {
            return "COOLDOWN";
        }
        return "ALLOW";
    }
}
