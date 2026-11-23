package finguard.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;

import finguard.model.Customer;

/**
 * CustomerDAO: Manages persistent customer records in MySQL with username and password authentication.
 */
public class CustomerDAO {

    public void save(Customer customer) throws SQLException {
        String sql = "INSERT INTO customers (customer_id, username, password, name, pin, personality) "
                + "VALUES (?, ?, ?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE username = VALUES(username), password = VALUES(password), "
                + "name = VALUES(name), pin = VALUES(pin), personality = VALUES(personality)";

        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, customer.getCustomerId());
        ps.setString(2, customer.getUsername());
        ps.setString(3, customer.getPassword());
        ps.setString(4, customer.getName());
        ps.setString(5, customer.getPin());
        ps.setString(6, customer.getPersonality());
        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    public Customer findById(String customerId) throws SQLException {
        String sql = "SELECT customer_id, username, password, name, pin, personality FROM customers WHERE customer_id = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, customerId);
        ResultSet rs = ps.executeQuery();

        Customer customer = null;
        if (rs.next()) {
            customer = mapRow(rs);
        }
        rs.close();
        ps.close();
        conn.close();
        return customer;
    }

    public Customer findByUsername(String identifier) throws SQLException {
        String sql = "SELECT customer_id, username, password, name, pin, personality FROM customers "
                + "WHERE LOWER(username) = LOWER(?) OR LOWER(name) = LOWER(?) OR customer_id = ? "
                + "ORDER BY CASE WHEN LOWER(username) = LOWER(?) THEN 1 WHEN customer_id = ? THEN 2 ELSE 3 END LIMIT 1";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        String term = identifier.trim();
        ps.setString(1, term);
        ps.setString(2, term);
        ps.setString(3, term);
        ps.setString(4, term);
        ps.setString(5, term);
        ResultSet rs = ps.executeQuery();

        Customer customer = null;
        if (rs.next()) {
            customer = mapRow(rs);
        }
        rs.close();
        ps.close();
        conn.close();
        return customer;
    }

    public HashMap<String, Customer> findAll() throws SQLException {
        String sql = "SELECT customer_id, username, password, name, pin, personality FROM customers";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();

        HashMap<String, Customer> map = new HashMap<String, Customer>();
        while (rs.next()) {
            Customer c = mapRow(rs);
            map.put(c.getCustomerId(), c);
        }
        rs.close();
        ps.close();
        conn.close();
        return map;
    }

    public void delete(String customerId) throws SQLException {
        String sql = "DELETE FROM customers WHERE customer_id = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, customerId);
        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    private Customer mapRow(ResultSet rs) throws SQLException {
        String id = rs.getString("customer_id");
        String username = rs.getString("username");
        String password = rs.getString("password");
        String name = rs.getString("name");
        String pin = rs.getString("pin");
        String personality = rs.getString("personality");

        if (password == null || password.isEmpty()) password = pin;
        if (username == null || username.isEmpty()) username = name != null ? name.toLowerCase() : id;

        Customer c = new Customer(id, username, password, name);
        c.setPersonality(personality != null ? personality : "NEW");
        return c;
    }
}
