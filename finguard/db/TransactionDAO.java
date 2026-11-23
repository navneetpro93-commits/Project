package finguard.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;

import finguard.model.Transaction;

/**
 * TransactionDAO: Persistent Audit Ledger backed by MySQL relational table.
 */
public class TransactionDAO {

    public int save(Transaction txn) throws SQLException {
        String sql = "INSERT INTO transactions (tick, type, amount, from_account, to_account, purpose, category, status, risk_score) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
        ps.setInt(1, txn.getTick());
        ps.setString(2, txn.getType());
        ps.setDouble(3, txn.getAmount());
        ps.setString(4, txn.getFromAccount());
        ps.setString(5, txn.getToAccount());
        ps.setString(6, txn.getPurpose());
        ps.setString(7, txn.getCategory());
        ps.setString(8, txn.getStatus());
        ps.setInt(9, txn.getRiskScore());

        ps.executeUpdate();
        ResultSet keys = ps.getGeneratedKeys();
        int generatedId = -1;
        if (keys.next()) {
            generatedId = keys.getInt(1);
        }
        keys.close();
        ps.close();
        conn.close();
        return generatedId;
    }

    public ArrayList<Transaction> findByAccount(String accNo, String sortBy) throws SQLException {
        StringBuilder sql = new StringBuilder(
                "SELECT id, tick, type, amount, from_account, to_account, purpose, category, status, risk_score "
                + "FROM transactions WHERE from_account = ? OR to_account = ? ");

        if ("AMOUNT".equalsIgnoreCase(sortBy)) {
            sql.append("ORDER BY amount DESC");
        } else if ("RISK".equalsIgnoreCase(sortBy)) {
            sql.append("ORDER BY risk_score DESC");
        } else {
            sql.append("ORDER BY id DESC");
        }

        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql.toString());
        ps.setString(1, accNo);
        ps.setString(2, accNo);
        ResultSet rs = ps.executeQuery();

        ArrayList<Transaction> list = new ArrayList<Transaction>();
        while (rs.next()) {
            Transaction t = new Transaction(
                    rs.getInt("id"),
                    rs.getInt("tick"),
                    rs.getString("type"),
                    rs.getDouble("amount"),
                    rs.getString("from_account"),
                    rs.getString("to_account"),
                    rs.getString("purpose"),
                    rs.getString("category"),
                    rs.getString("status"),
                    rs.getInt("risk_score"));
            list.add(t);
        }
        rs.close();
        ps.close();
        conn.close();
        return list;
    }

    public ArrayList<Transaction> findAll() throws SQLException {
        String sql = "SELECT id, tick, type, amount, from_account, to_account, purpose, category, status, risk_score "
                + "FROM transactions ORDER BY id DESC LIMIT 100";

        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();

        ArrayList<Transaction> list = new ArrayList<Transaction>();
        while (rs.next()) {
            Transaction t = new Transaction(
                    rs.getInt("id"),
                    rs.getInt("tick"),
                    rs.getString("type"),
                    rs.getDouble("amount"),
                    rs.getString("from_account"),
                    rs.getString("to_account"),
                    rs.getString("purpose"),
                    rs.getString("category"),
                    rs.getString("status"),
                    rs.getInt("risk_score"));
            list.add(t);
        }
        rs.close();
        ps.close();
        conn.close();
        return list;
    }
}
