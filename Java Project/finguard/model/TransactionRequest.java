package finguard.model;

public class TransactionRequest {
    public static final int PRIORITY_FREEZE = 100;
    public static final int PRIORITY_SALARY = 80;
    public static final int PRIORITY_BILL = 60;
    public static final int PRIORITY_NORMAL = 40;
    public static final int PRIORITY_ROUNDUP = 20;

    public static final String TYPE_DEPOSIT = "DEPOSIT";
    public static final String TYPE_WITHDRAW = "WITHDRAW";
    public static final String TYPE_TRANSFER = "TRANSFER";
    public static final String TYPE_SALARY = "SALARY";
    public static final String TYPE_BILL = "BILL";
    public static final String TYPE_ROUNDUP = "ROUNDUP";

    private int id;
    private int priority;
    private int createdTick;
    private int readyTick;
    private String type;
    private String fromAccount;
    private String toAccount;
    private double amount;
    private String purpose;
    private String payeeKey;
    private boolean releasedFromCooldown;

    public TransactionRequest(int id, int priority, int createdTick, String type,
                              String fromAccount, String toAccount, double amount,
                              String purpose, String payeeKey) {
        this.id = id;
        this.priority = priority;
        this.createdTick = createdTick;
        this.readyTick = createdTick;
        this.type = type;
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.amount = amount;
        this.purpose = purpose;
        this.payeeKey = payeeKey;
    }

    public int getId() {
        return id;
    }

    public int getPriority() {
        return priority;
    }

    public int getCreatedTick() {
        return createdTick;
    }

    public int getReadyTick() {
        return readyTick;
    }

    public void setReadyTick(int readyTick) {
        this.readyTick = readyTick;
    }

    public String getType() {
        return type;
    }

    public String getFromAccount() {
        return fromAccount;
    }

    public String getToAccount() {
        return toAccount;
    }

    public double getAmount() {
        return amount;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getPayeeKey() {
        return payeeKey;
    }

    public boolean isReleasedFromCooldown() {
        return releasedFromCooldown;
    }

    public void setReleasedFromCooldown(boolean releasedFromCooldown) {
        this.releasedFromCooldown = releasedFromCooldown;
    }

    public String shortLabel() {
        return "REQ#" + id + " p=" + priority + " " + type + " Rs." + amount
                + " " + fromAccount + "->" + toAccount;
    }
}
