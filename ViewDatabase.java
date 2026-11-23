import java.sql.*;

public class ViewDatabase {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/finguard_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "root";
        String pass = "navneet18";

        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            System.out.println("==========================================================================");
            System.out.println("                       LOCAL MYSQL DATABASE (finguard_db)                 ");
            System.out.println("==========================================================================");

            System.out.println("\n--- [CUSTOMERS TABLE] ---");
            System.out.printf("%-10s | %-16s | %-16s | %-8s\n", "ID", "USERNAME", "NAME", "PIN");
            System.out.println("--------------------------------------------------------------------------");
            try (ResultSet rs = conn.createStatement().executeQuery("SELECT customer_id, username, name, pin FROM customers ORDER BY customer_id")) {
                while (rs.next()) {
                    System.out.printf("%-10s | %-16s | %-16s | %-8s\n",
                            rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4));
                }
            }

            System.out.println("\n--- [ACCOUNTS TABLE] ---");
            System.out.printf("%-12s | %-10s | %-16s | %-10s | %-12s\n", "ACCOUNT NO", "CUSTOMER", "HOLDER", "TYPE", "BALANCE (Rs)");
            System.out.println("--------------------------------------------------------------------------");
            try (ResultSet rs = conn.createStatement().executeQuery("SELECT account_number, customer_id, holder_name, account_type, balance FROM accounts ORDER BY account_number")) {
                while (rs.next()) {
                    System.out.printf("%-12s | %-10s | %-16s | %-10s | Rs %,10.2f\n",
                            rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getDouble(5));
                }
            }

            System.out.println("\n--- [RECENT TRANSACTIONS TABLE] ---");
            System.out.printf("%-4s | %-10s | %-12s | %-18s | %-18s | %-8s\n", "ID", "TYPE", "AMOUNT", "FROM -> TO", "PURPOSE", "STATUS");
            System.out.println("--------------------------------------------------------------------------");
            try (ResultSet rs = conn.createStatement().executeQuery("SELECT id, type, amount, from_account, to_account, purpose, status FROM transactions ORDER BY id DESC LIMIT 10")) {
                while (rs.next()) {
                    String route = (rs.getString(4) == null ? "" : rs.getString(4)) + " -> " + (rs.getString(5) == null ? "" : rs.getString(5));
                    System.out.printf("%-4d | %-10s | Rs %,8.2f | %-18s | %-18s | %-8s\n",
                            rs.getInt(1), rs.getString(2), rs.getDouble(3), route, rs.getString(6), rs.getString(7));
                }
            }
            System.out.println("==========================================================================\n");

        } catch (Exception e) {
            System.err.println("Database error: " + e.getMessage());
        }
    }
}
