package bankcore.analysis;

import bankcore.model.Payment;
import bankcore.model.PaymentStatus;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Tables, 2D arrays and sorted views. */
public class ReportGenerator {
    private ReportGenerator() { }

    // Comparators written as anonymous classes (no lambdas in the syllabus)
    public static final Comparator<Payment> BY_AMOUNT = new Comparator<Payment>() {
        @Override public int compare(Payment a, Payment b) { return Double.compare(b.getAmount(), a.getAmount()); }
    };
    public static final Comparator<Payment> BY_AMOUNT_ASC = new Comparator<Payment>() {
        @Override public int compare(Payment a, Payment b) { return Double.compare(a.getAmount(), b.getAmount()); }
    };
    public static final Comparator<Payment> BY_TIME = new Comparator<Payment>() {
        @Override public int compare(Payment a, Payment b) { return Long.compare(a.getTimestamp(), b.getTimestamp()); }
    };
    public static final Comparator<Payment> BY_STATUS = new Comparator<Payment>() {
        @Override public int compare(Payment a, Payment b) { return a.getStatus().compareTo(b.getStatus()); }
    };

    /** rows = wallets, columns = time slots, cell = total successfully sent in that slot. */
    public static double[][] spendMatrix(List<Payment> history, List<String> walletIds,
                                         long startTime, long slotMs, int slots) {
        double[][] m = new double[walletIds.size()][slots];
        for (Payment p : history) {
            if (p.getStatus() != PaymentStatus.SUCCESS) continue;
            int row = walletIds.indexOf(p.getFrom());
            if (row < 0) continue;
            int col = (int) ((p.getTimestamp() - startTime) / slotMs);
            if (col >= slots) col = slots - 1;
            if (col < 0) col = 0;
            m[row][col] += p.getAmount();
        }
        return m;
    }

    public static void printMatrix(double[][] m, List<String> rowNames, long slotMs) {
        StringBuilder sb = new StringBuilder(String.format("%-14s", "wallet \\ slot"));
        for (int c = 0; c < m[0].length; c++) sb.append(String.format("%10s", "t" + c * slotMs / 1000 + "s+"));
        sb.append(String.format("%12s%n", "row total"));
        for (int r = 0; r < m.length; r++) {
            double rowTotal = 0;
            sb.append(String.format("%-14s", rowNames.get(r)));
            for (int c = 0; c < m[r].length; c++) {
                sb.append(String.format("%10.0f", m[r][c]));
                rowTotal += m[r][c];
            }
            sb.append(String.format("%12.0f%n", rowTotal));
        }
        System.out.print(sb);
    }

    public static Map<PaymentStatus, Integer> statusCounts(List<Payment> history) {
        Map<PaymentStatus, Integer> counts = new TreeMap<PaymentStatus, Integer>();
        for (PaymentStatus s : PaymentStatus.values()) counts.put(s, 0);
        for (Payment p : history) counts.put(p.getStatus(), counts.get(p.getStatus()) + 1);
        return counts;
    }

    /** Receipt built with StringBuilder (single thread, so no need for StringBuffer). */
    public static String receipt(Payment p) {
        StringBuilder sb = new StringBuilder();
        sb.append("+----------- RECEIPT ------------+\n");
        sb.append(String.format("| Payment   : #%-17d |%n", p.getId()));
        sb.append(String.format("| From      : %-18s |%n", p.getFrom()));
        sb.append(String.format("| To        : %-18s |%n", p.getTo()));
        sb.append(String.format("| Amount    : Rs %-15.2f |%n", p.getAmount()));
        sb.append(String.format("| Status    : %-18s |%n", p.getStatus()));
        sb.append(String.format("| Category  : %-18s |%n", p.getCategory()));
        sb.append("+--------------------------------+");
        return sb.toString();
    }

    /** Masks an id for display: "bhavya@pay" -> "bh***@pay" (substring / indexOf). */
    public static String mask(String id) {
        int at = id.indexOf('@');
        if (at < 3) return id;
        return id.substring(0, 2) + "***" + id.substring(at);
    }
}