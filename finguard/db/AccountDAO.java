package finguard.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;

import finguard.model.Account;
import finguard.model.CurrentAccount;
import finguard.model.SavingsAccount;

/**
 * Topics 19-20: PreparedStatement, ResultSet typed getters, Polymorphic Java-object mapping,
 * and ACID transaction management (commit/rollback).
 */
public class AccountDAO {

    public void save(Account account) throws SQLException {
        String sql = "INSERT INTO accounts (account_number, customer_id, holder_name, account_type, balance, is_frozen, vault_balance, overdraft_limit) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE balance = VALUES(balance), is_frozen = VALUES(is_frozen), vault_balance = VALUES(vault_balance), overdraft_limit = VALUES(overdraft_limit)";

        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, account.getAccountNumber());
        ps.setString(2, account.getCustomerId());
        ps.setString(3, account.getHolderName());
        ps.setString(4, account.getAccountType());
        ps.setDouble(5, account.getBalance());
        ps.setBoolean(6, account.isFrozen());

        double vault = 0;
        double overdraft = 0;
        if (account instanceof SavingsAccount) {
            vault = ((SavingsAccount) account).getVaultBalance();
        } else if (account instanceof CurrentAccount) {
            overdraft = ((CurrentAccount) account).getOverdraftLimit();
        }
        ps.setDouble(7, vault);
        ps.setDouble(8, overdraft);

        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    public Account findByNumber(String accNo) throws SQLException {
        String sql = "SELECT account_number, customer_id, holder_name, account_type, balance, is_frozen, vault_balance, overdraft_limit FROM accounts WHERE account_number = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setString(1, accNo);
        ResultSet rs = ps.executeQuery();

        Account account = null;
        if (rs.next()) {
            account = mapRow(rs);
        }
        rs.close();
        ps.close();
        conn.close();
        return account;
    }

    public HashMap<String, Account> findAll() throws SQLException {
        String sql = "SELECT account_number, customer_id, holder_name, account_type, balance, is_frozen, vault_balance, overdraft_limit FROM accounts";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ResultSet rs = ps.executeQuery();

        HashMap<String, Account> map = new HashMap<String, Account>();
        while (rs.next()) {
            Account acc = mapRow(rs);
            map.put(acc.getAccountNumber(), acc);
        }
        rs.close();
        ps.close();
        conn.close();
        return map;
    }

    public void updateBalance(String accNo, double newBalance) throws SQLException {
        String sql = "UPDATE accounts SET balance = ? WHERE account_number = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setDouble(1, newBalance);
        ps.setString(2, accNo);
        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    public void updateVaultBalance(String accNo, double vaultBalance) throws SQLException {
        String sql = "UPDATE accounts SET vault_balance = ? WHERE account_number = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setDouble(1, vaultBalance);
        ps.setString(2, accNo);
        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    public void setFrozen(String accNo, boolean frozen) throws SQLException {
        String sql = "UPDATE accounts SET is_frozen = ? WHERE account_number = ?";
        Connection conn = DBConnection.getConnection();
        PreparedStatement ps = conn.prepareStatement(sql);
        ps.setBoolean(1, frozen);
        ps.setString(2, accNo);
        ps.executeUpdate();
        ps.close();
        conn.close();
    }

    public void transferAtomic(String fromAcc, String toAcc, double amount) throws SQLException {
        Connection conn = DBConnection.getConnection();
        try {
            conn.setAutoCommit(false); // ACID: Begin transaction

            String debitSql = "UPDATE accounts SET balance = balance - ? WHERE account_number = ? AND balance >= ?";
            PreparedStatement psDebit = conn.prepareStatement(debitSql);
            psDebit.setDouble(1, amount);
            psDebit.setString(2, fromAcc);
            psDebit.setDouble(3, amount);
            int rowsDebit = psDebit.executeUpdate();
            psDebit.close();

            if (rowsDebit == 0) {
                conn.rollback();
                throw new SQLException("Insufficient funds or account locked in atomic transaction.");
            }

            String creditSql = "UPDATE accounts SET balance = balance + ? WHERE account_number = ?";
            PreparedStatement psCredit = conn.prepareStatement(creditSql);
            psCredit.setDouble(1, amount);
            psCredit.setString(2, toAcc);
            psCredit.executeUpdate();
            psCredit.close();

            conn.commit(); // ACID: Commit both operations
        } catch (SQLException ex) {
            conn.rollback(); // Rollback on error
            throw ex;
        } finally {
            conn.setAutoCommit(true);
            conn.close();
        }
    }

    private Account mapRow(ResultSet rs) throws SQLException {
        String type = rs.getString("account_type");
        String accNo = rs.getString("account_number");
        String custId = rs.getString("customer_id");
        String holder = rs.getString("holder_name");
        double balance = rs.getDouble("balance");
        boolean frozen = rs.getBoolean("is_frozen");

        Account acc;
        if ("CURRENT".equalsIgnoreCase(type)) {
            double overdraft = rs.getDouble("overdraft_limit");
            acc = new CurrentAccount(accNo, custId, holder, balance, overdraft);
        } else {
            SavingsAccount sav = new SavingsAccount(accNo, custId, holder, balance);
            sav.addToVault(rs.getDouble("vault_balance"));
            acc = sav;
        }
        if (frozen) {
            acc.freeze();
        }
        return acc;
    }
}
