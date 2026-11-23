package finguard.safety;

import java.util.HashMap;
import java.util.Map;

import finguard.model.Customer;

public class SpendingIntelligence {

    public String categorize(String purpose) {
        if (purpose == null) {
            return "OTHER";
        }
        String p = purpose.toLowerCase();
        if (p.indexOf("food") >= 0 || p.indexOf("swiggy") >= 0 || p.indexOf("zomato") >= 0
                || p.indexOf("grocery") >= 0 || p.indexOf("restaurant") >= 0 || p.indexOf("cafe") >= 0
                || p.indexOf("dinner") >= 0 || p.indexOf("lunch") >= 0 || p.indexOf("breakfast") >= 0
                || p.indexOf("snacks") >= 0 || p.indexOf("blinkit") >= 0 || p.indexOf("zepto") >= 0
                || p.indexOf("instamart") >= 0 || p.indexOf("burger") >= 0 || p.indexOf("pizza") >= 0) {
            return "FOOD";
        }
        if (p.indexOf("shop") >= 0 || p.indexOf("shopping") >= 0 || p.indexOf("amazon") >= 0
                || p.indexOf("flipkart") >= 0 || p.indexOf("myntra") >= 0 || p.indexOf("cloth") >= 0
                || p.indexOf("mall") >= 0 || p.indexOf("store") >= 0 || p.indexOf("retail") >= 0
                || p.indexOf("mart") >= 0 || p.indexOf("zara") >= 0 || p.indexOf("meesho") >= 0
                || p.indexOf("ajio") >= 0 || p.indexOf("apparel") >= 0) {
            return "SHOPPING";
        }
        if (p.indexOf("uber") >= 0 || p.indexOf("ola") >= 0 || p.indexOf("travel") >= 0
                || p.indexOf("fuel") >= 0 || p.indexOf("petrol") >= 0 || p.indexOf("diesel") >= 0
                || p.indexOf("metro") >= 0 || p.indexOf("bus") >= 0 || p.indexOf("train") >= 0
                || p.indexOf("flight") >= 0 || p.indexOf("cab") >= 0 || p.indexOf("taxi") >= 0
                || p.indexOf("irctc") >= 0 || p.indexOf("toll") >= 0) {
            return "TRAVEL";
        }
        if (p.indexOf("rent") >= 0 || p.indexOf("electric") >= 0 || p.indexOf("bill") >= 0
                || p.indexOf("wifi") >= 0 || p.indexOf("recharge") >= 0 || p.indexOf("water") >= 0
                || p.indexOf("gas") >= 0 || p.indexOf("broadband") >= 0 || p.indexOf("dth") >= 0
                || p.indexOf("insurance") >= 0 || p.indexOf("emi") >= 0 || p.indexOf("utility") >= 0) {
            return "BILLS";
        }
        if (p.indexOf("netflix") >= 0 || p.indexOf("movie") >= 0 || p.indexOf("game") >= 0
                || p.indexOf("cinema") >= 0 || p.indexOf("hotstar") >= 0 || p.indexOf("spotify") >= 0
                || p.indexOf("entertainment") >= 0 || p.indexOf("concert") >= 0) {
            return "ENTERTAINMENT";
        }
        if (p.indexOf("atm") >= 0 || p.indexOf("cash") >= 0) {
            return "ATM";
        }
        if (p.indexOf("transfer") >= 0 || p.indexOf("upi") >= 0) {
            return "TRANSFER";
        }
        return "OTHER";
    }

    public String personality(HashMap<String, Double> spend, double vault, double totalDebit) {
        if (totalDebit <= 0) {
            return "NEW";
        }
        double saveRate = vault / (totalDebit + vault);
        if (saveRate >= 0.20) {
            return "SAVER";
        }
        for (Map.Entry<String, Double> e : spend.entrySet()) {
            if (e.getValue().doubleValue() > 0.40 * totalDebit) {
                return "IMPULSE";
            }
        }
        return "BALANCED";
    }

    public ArrayReport report(Customer customer, HashMap<String, Double> spend, double vault) {
        ArrayReport r = new ArrayReport();
        double total = 0;
        for (Double v : spend.values()) {
            total += v.doubleValue();
        }
        r.totalDebit = total;
        r.lines = new String[spend.size() + 3];
        int i = 0;
        r.lines[i++] = "Spending report for " + customer.getName();
        for (Map.Entry<String, Double> e : spend.entrySet()) {
            String cat = e.getKey();
            double used = e.getValue().doubleValue();
            Double capObj = customer.getCategoryBudgets().get(cat);
            double cap = capObj == null ? 0 : capObj.doubleValue();
            String flag = "";
            if (cap > 0 && used > cap) {
                flag = "  ** OVER BUDGET **";
            } else if (cap > 0 && used > 0.8 * cap) {
                flag = "  (80% warning)";
            }
            String pct = total <= 0 ? "0" : String.valueOf((used * 100) / total);
            r.lines[i++] = "  " + cat + ": Rs." + used + " / budget Rs." + cap
                    + "  (" + pct + "% of debit)" + flag;
        }
        String p = personality(spend, vault, total);
        customer.setPersonality(p);
        r.lines[i++] = "Vault savings: Rs." + vault;
        r.lines[i] = "Spending personality: " + p;
        r.personality = p;
        return r;
    }

    public BudgetAlert checkAlert(Customer customer, String category, double newSpent) {
        if (customer == null || category == null) return null;
        Double budgetObj = customer.getCategoryBudgets().get(category.toUpperCase());
        if (budgetObj == null || budgetObj.doubleValue() <= 0) return null;
        double budget = budgetObj.doubleValue();
        BudgetAlert alert = new BudgetAlert();
        alert.category = category.toUpperCase();
        alert.budget = budget;
        alert.spent = newSpent;
        alert.percent = Math.round((newSpent * 100.0) / budget * 10.0) / 10.0;

        if (newSpent > budget) {
            alert.exceeded = true;
            alert.warning = false;
            alert.overBy = Math.round((newSpent - budget) * 100.0) / 100.0;
            alert.remaining = 0;
            alert.message = "Budget Exceeded! You have spent Rs." + newSpent + " on " + alert.category
                    + ", exceeding your monthly budget of Rs." + budget + " by Rs." + alert.overBy + ".";
            return alert;
        } else if (newSpent >= 0.8 * budget) {
            alert.exceeded = false;
            alert.warning = true;
            alert.overBy = 0;
            alert.remaining = Math.round((budget - newSpent) * 100.0) / 100.0;
            alert.message = "Budget Warning! You have used " + alert.percent + "% of your monthly "
                    + alert.category + " budget (Spent: Rs." + newSpent + " / Rs." + budget + ").";
            return alert;
        }
        return null;
    }

    public static class BudgetAlert {
        public boolean exceeded = false;
        public boolean warning = false;
        public String category = "";
        public double budget = 0;
        public double spent = 0;
        public double overBy = 0;
        public double remaining = 0;
        public double percent = 0;
        public String message = "";

        public String toJson() {
            return "{\"exceeded\":" + exceeded
                    + ",\"warning\":" + warning
                    + ",\"category\":\"" + escape(category) + "\""
                    + ",\"budget\":" + budget
                    + ",\"spent\":" + spent
                    + ",\"overBy\":" + overBy
                    + ",\"remaining\":" + remaining
                    + ",\"percent\":" + percent
                    + ",\"message\":\"" + escape(message) + "\"}";
        }

        private static String escape(String s) {
            if (s == null) return "";
            return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
        }
    }

    public static class ArrayReport {
        public String[] lines;
        public String personality;
        public double totalDebit;
    }
}
