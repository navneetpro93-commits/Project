package finguard.model;

public class SavingsChallenge implements Comparable<SavingsChallenge> {
    private String accountNumber;
    private String title;
    private double[] weeks;
    private int streak;
    private double weeklyTarget;

    public SavingsChallenge(String accountNumber, String title, int weekCount, double weeklyTarget) {
        this.accountNumber = accountNumber;
        this.title = title;
        this.weeks = new double[weekCount];
        this.weeklyTarget = weeklyTarget;
        this.streak = 0;
    }

    public boolean fillWeek(int weekIndex, double amount) {
        if (weekIndex < 0 || weekIndex >= weeks.length) {
            return false;
        }
        weeks[weekIndex] = weeks[weekIndex] + amount;
        if (weeks[weekIndex] >= weeklyTarget) {
            streak++;
            return true;
        }
        return false;
    }

    public double progressPercent() {
        double filled = 0;
        for (int i = 0; i < weeks.length; i++) {
            if (weeks[i] >= weeklyTarget) {
                filled++;
            }
        }
        return (filled * 100.0) / weeks.length;
    }

    public int compareTo(SavingsChallenge other) {
        double diff = other.progressPercent() - this.progressPercent();
        if (diff > 0) {
            return 1;
        }
        if (diff < 0) {
            return -1;
        }
        return this.accountNumber.compareTo(other.accountNumber);
    }

    public String report() {
        return title + " [" + accountNumber + "] " + progressPercent() + "%  streak=" + streak
                + "  target/week=Rs." + weeklyTarget;
    }

    public String getTitle() {
        return title;
    }

    public double getWeeklyTarget() {
        return weeklyTarget;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public int getStreak() {
        return streak;
    }

    public double[] getWeeks() {
        return weeks;
    }
}
