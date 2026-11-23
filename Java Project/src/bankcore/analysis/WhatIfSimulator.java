package bankcore.analysis;

/** What-if calculations. They only compute: no real balance is ever changed. */
public class WhatIfSimulator {
    private WhatIfSimulator() { }

    public static double balanceAfterWithdrawal(double balance, double amount) {
        return balance - amount;
    }

    /** Whole months needed to reach a target; -1 if monthly saving is not positive. */
    public static int monthsToReach(double target, double saved, double monthlySaving) {
        if (monthlySaving <= 0) return -1;
        if (saved >= target) return 0;
        return (int) Math.ceil((target - saved) / monthlySaving);
    }

    public static double savingsFromCut(double monthlyExpense, double cutPercent, int months) {
        return monthlyExpense * (cutPercent / 100.0) * months;
    }
}