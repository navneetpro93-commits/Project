package bankcore.analysis;

import bankcore.exceptions.InsufficientBalanceException;
import bankcore.exceptions.WalletBlockedException;
import bankcore.model.Payment;
import bankcore.model.PaymentStatus;
import bankcore.model.Wallet;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Categories, budgets, savings goals and round-up savings. */
public class SpendingAnalyzer {
    /** keyword -> category; LinkedHashMap keeps the check order predictable. */
    private final Map<String, String> keywords = new LinkedHashMap<String, String>();
    private final Map<String, Map<String, Double>> budgets = new HashMap<String, Map<String, Double>>();
    private final Map<String, Double> goalTarget = new HashMap<String, Double>();
    private final Map<String, Double> goalSaved = new HashMap<String, Double>();

    public SpendingAnalyzer() {
        learn("swiggy", "Food");     learn("zomato", "Food");      learn("dinner", "Food");
        learn("amazon", "Shopping"); learn("flipkart", "Shopping");
        learn("irctc", "Travel");    learn("uber", "Travel");      learn("ticket", "Travel");
        learn("jio", "Bills");       learn("recharge", "Bills");   learn("electricity", "Bills");
    }

    /** The categoriser "learns": a user correction is remembered. */
    public synchronized void learn(String keyword, String category) {
        keywords.put(keyword.toLowerCase(), category);
    }

    public synchronized String categorize(String text) {
        String t = text.toLowerCase();
        for (Map.Entry<String, String> e : keywords.entrySet()) {
            if (t.contains(e.getKey())) return e.getValue();
        }
        return "Others";
    }

    /** Total successful spending per category for one wallet (TreeMap = sorted by category). */
    public Map<String, Double> totalsByCategory(List<Payment> history, String walletId) {
        Map<String, Double> totals = new TreeMap<String, Double>();
        for (Payment p : history) {
            if (p.getFrom().equals(walletId) && p.getStatus() == PaymentStatus.SUCCESS) {
                Double old = totals.get(p.getCategory());
                totals.put(p.getCategory(), (old == null ? 0.0 : old) + p.getAmount());
            }
        }
        return totals;
    }

    // ---------- budgets ----------
    public synchronized void setBudget(String walletId, String category, double limit) {
        Map<String, Double> m = budgets.get(walletId);
        if (m == null) { m = new TreeMap<String, Double>(); budgets.put(walletId, m); }
        m.put(category, limit);
    }

    public synchronized List<String> budgetAlerts(String walletId, Map<String, Double> totals) {
        List<String> alerts = new ArrayList<String>();
        Map<String, Double> m = budgets.get(walletId);
        if (m == null) return alerts;
        for (Map.Entry<String, Double> e : m.entrySet()) {
            Double spent = totals.get(e.getKey());
            double s = spent == null ? 0 : spent;
            double ratio = s / e.getValue();
            if (ratio >= 1.0) {
                alerts.add(String.format("EXCEEDED %s budget: spent %.2f of %.2f", e.getKey(), s, e.getValue()));
            } else if (ratio >= 0.8) {
                alerts.add(String.format("WARNING  %s budget: %.0f%% used (%.2f of %.2f)",
                        e.getKey(), ratio * 100, s, e.getValue()));
            }
        }
        return alerts;
    }

    // ---------- savings goal with round-up ----------
    public synchronized void setGoal(String walletId, double target) {
        goalTarget.put(walletId, target);
        if (!goalSaved.containsKey(walletId)) goalSaved.put(walletId, 0.0);
    }

    public synchronized boolean hasGoal(String walletId) { return goalTarget.containsKey(walletId); }
    public synchronized double getGoalTarget(String walletId) { Double d = goalTarget.get(walletId); return d == null ? 0 : d; }
    public synchronized double getGoalSaved(String walletId) { Double d = goalSaved.get(walletId); return d == null ? 0 : d; }

    /** e.g. 123.00 -> 127.00 saves 7.00 */
    public static double roundUpAmount(double amount) {
        return Math.ceil(amount / 10.0) * 10.0 - amount;
    }

    /** After a successful payment, move the round-up difference from the wallet into the goal. */
    public synchronized void applyRoundUp(Wallet from, double amount) {
        if (!goalTarget.containsKey(from.getId())) return;
        double extra = roundUpAmount(amount);
        if (extra <= 0) return;
        try {
            from.debit(extra);
            goalSaved.put(from.getId(), getGoalSaved(from.getId()) + extra);
        } catch (InsufficientBalanceException | WalletBlockedException e) {
            // not enough spare money: skip the round-up silently
        }
    }

    public String progressBar(double saved, double target) {
        int width = 30;
        int filled = target <= 0 ? 0 : (int) Math.min(width, Math.round(saved / target * width));
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < width; i++) sb.append(i < filled ? '#' : '-');
        sb.append(String.format("] %.0f%%", target <= 0 ? 0 : Math.min(100.0, saved / target * 100)));
        return sb.toString();
    }

    // ---------- adaptive limit ----------
    /** "Unusual" amount for this user = mean + 2 x standard deviation of past successful payments. */
    public double adaptiveLimit(List<Payment> history, String walletId) {
        List<Double> amounts = new ArrayList<Double>();
        for (Payment p : history) {
            if (p.getFrom().equals(walletId) && p.getStatus() == PaymentStatus.SUCCESS) amounts.add(p.getAmount());
        }
        if (amounts.size() < 3) return -1;             // not enough data
        double sum = 0;
        for (double a : amounts) sum += a;
        double mean = sum / amounts.size();
        double sq = 0;
        for (double a : amounts) sq += (a - mean) * (a - mean);
        return mean + 2 * Math.sqrt(sq / amounts.size());
    }
}