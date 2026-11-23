package finguard.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;

public class BudgetDAO {

    public void save(String customerId, String category, double amount) throws SQLException {
        String sql = "INSERT INTO customer_budgets (customer_id, category, amount) "
                + "VALUES (?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE amount = VALUES(amount)";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, customerId);
        ps.setString(2, category.toUpperCase());
        ps.setDouble(3, amount);
        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    public void saveAll(String customerId, HashMap<String, Double> budgets) throws SQLException {
        if (budgets == null || budgets.isEmpty()) return;
        Connection conn = DBConnection.getConnection();
        String sql = "INSERT INTO customer_budgets (customer_id, category, amount) "
                + "VALUES (?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE amount = VALUES(amount)";
        PreparedStatement ps = conn.prepareStatement(sql);
        for (java.util.Map.Entry<String, Double> e : budgets.entrySet()) {
            ps.setString(1, customerId);
            ps.setString(2, e.getKey().toUpperCase());
            ps.setDouble(3, e.getValue());
            ps.addBatch();
        }
        ps.executeBatch();
        ps.close();
        conn.close();
    }

    public HashMap<String, Double> findByCustomer(String customerId) throws SQLException {
        String sql = "SELECT category, amount FROM customer_budgets WHERE customer_id = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, customerId);
        ResultSet rs = ps.executeQuery();
        HashMap<String, Double> budgets = new HashMap<String, Double>();
        while (rs.next()) {
            budgets.put(rs.getString("category").toUpperCase(), rs.getDouble("amount"));
        }
        rs.close();
        ps.close();
        conn.close();
        return budgets;
    }
}
