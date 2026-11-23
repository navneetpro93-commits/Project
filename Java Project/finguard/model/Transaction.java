package finguard.model;

public class Transaction implements Comparable<Transaction> {
    private int id;
    private int tick;
    private String type;
    private double amount;
    private String fromAccount;
    private String toAccount;
    private String purpose;
    private String category;
    private String status;
    private int riskScore;

    public Transaction(int id, int tick, String type, double amount, String fromAccount,
                       String toAccount, String purpose, String category, String status, int riskScore) {
        this.id = id;
        this.tick = tick;
        this.type = type;
        this.amount = amount;
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.purpose = purpose;
        this.category = category;
        this.status = status;
        this.riskScore = riskScore;
    }

    public int compareTo(Transaction other) {
        if (this.tick != other.tick) {
            return this.tick - other.tick;
        }
        return this.id - other.id;
    }

    public String summary() {
        return "#" + id + " [tick " + tick + "] " + type + " Rs." + amount
                + " | " + fromAccount + " -> " + toAccount
                + " | " + category + " | " + status + " | risk=" + riskScore
                + " | " + purpose;
    }

    public int getId() {
        return id;
    }

    public int getTick() {
        return tick;
    }

    public String getType() {
        return type;
    }

    public double getAmount() {
        return amount;
    }

    public String getFromAccount() {
        return fromAccount;
    }

    public String getToAccount() {
        return toAccount;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getCategory() {
        return category;
    }

    public String getStatus() {
        return status;
    }

    public int getRiskScore() {
        return riskScore;
    }
}
