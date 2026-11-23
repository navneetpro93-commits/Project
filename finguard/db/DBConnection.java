package finguard.db;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;

/**
 * Topics 17-18: JDBC Architecture, Drivers, URL, DriverManager, and Connection.
 * Demonstrates:
 * 1. JDBC Architecture: Application -> DriverManager -> Type-4 Driver -> Database.
 * 2. Driver Loading: Class.forName("com.mysql.cj.jdbc.Driver")
 * 3. JDBC URL: Structured URI specifying protocol, subprotocol, host, port, database, and connection properties.
 * 4. DriverManager.getConnection(): Factory method to establish an active database session.
 */
public class DBConnection {

    private static String driver = "com.mysql.cj.jdbc.Driver";
    private static String url = "jdbc:mysql://localhost:3306/finguard_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static String user = "root";
    private static String password = "navneet18";

    private static boolean driverLoaded = false;
    private static boolean connected = false;
    private static String lastError = null;

    static {
        loadConfig();
        loadDriver();
    }

    private static void loadConfig() {
        try {
            Properties props = new Properties();
            File propFile = new File("finguard/db/db.properties");
            if (!propFile.exists()) {
                propFile = new File("../finguard/db/db.properties");
            }
            if (!propFile.exists()) {
                File dir = new File(System.getProperty("user.dir", "."));
                File candidate = new File(dir, "finguard/db/db.properties");
                if (candidate.exists()) propFile = candidate;
            }
            if (propFile.exists()) {
                InputStream in = new FileInputStream(propFile);
                props.load(in);
                in.close();
            }

            if (props.getProperty("db.driver") != null) driver = props.getProperty("db.driver");
            if (props.getProperty("db.url") != null) url = props.getProperty("db.url");
            if (props.getProperty("db.user") != null) user = props.getProperty("db.user");
            if (props.getProperty("db.password") != null) password = props.getProperty("db.password");

            String envUser = System.getenv("MYSQL_USER");
            String envPass = System.getenv("MYSQL_PASSWORD");
            String envUrl = System.getenv("MYSQL_URL");
            if (envUser != null) user = envUser;
            if (envPass != null) password = envPass;
            if (envUrl != null) url = envUrl;

        } catch (Exception e) {
            System.err.println("[JDBC Config] Using default settings (" + e.getMessage() + ")");
        }
    }

    public static boolean loadDriver() {
        try {
            Class.forName(driver);
            driverLoaded = true;
            return true;
        } catch (ClassNotFoundException e) {
            driverLoaded = false;
            lastError = "Driver class not found: " + driver + ". Ensure mysql-connector-j.jar is on classpath.";
            return false;
        }
    }

    public static Connection getConnection() throws SQLException {
        if (!driverLoaded) {
            loadDriver();
        }
        try {
            Connection conn = DriverManager.getConnection(url, user, password);
            connected = true;
            lastError = null;
            return conn;
        } catch (SQLException e) {
            connected = false;
            lastError = e.getMessage();
            throw e;
        }
    }

    public static boolean initializeSchema() {
        try {
            Connection conn = getConnection();
            Statement stmt = conn.createStatement();

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS customers ("
                    + "customer_id VARCHAR(10) PRIMARY KEY,"
                    + "username VARCHAR(50) UNIQUE,"
                    + "password VARCHAR(100),"
                    + "name VARCHAR(100) NOT NULL,"
                    + "pin VARCHAR(100) NOT NULL,"
                    + "personality VARCHAR(20) DEFAULT 'NEW',"
                    + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            try { stmt.executeUpdate("ALTER TABLE customers MODIFY pin VARCHAR(100)"); } catch (Exception ignored) {}
            try { stmt.executeUpdate("ALTER TABLE customers ADD COLUMN username VARCHAR(50) UNIQUE"); } catch (Exception ignored) {}
            try { stmt.executeUpdate("ALTER TABLE customers ADD COLUMN password VARCHAR(100)"); } catch (Exception ignored) {}

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS accounts ("
                    + "account_number VARCHAR(12) PRIMARY KEY,"
                    + "customer_id VARCHAR(10) NOT NULL,"
                    + "holder_name VARCHAR(100) NOT NULL,"
                    + "account_type VARCHAR(20) NOT NULL,"
                    + "balance DOUBLE NOT NULL DEFAULT 0.0,"
                    + "is_frozen BOOLEAN NOT NULL DEFAULT FALSE,"
                    + "vault_balance DOUBLE DEFAULT 0.0,"
                    + "overdraft_limit DOUBLE DEFAULT 0.0,"
                    + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                    + "FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE)");

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS transactions ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY,"
                    + "tick INT NOT NULL,"
                    + "type VARCHAR(20) NOT NULL,"
                    + "amount DOUBLE NOT NULL,"
                    + "from_account VARCHAR(12),"
                    + "to_account VARCHAR(12),"
                    + "purpose VARCHAR(255),"
                    + "category VARCHAR(50),"
                    + "status VARCHAR(20) NOT NULL,"
                    + "risk_score INT DEFAULT 0,"
                    + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS cooldown_queue ("
                    + "id INT AUTO_INCREMENT PRIMARY KEY,"
                    + "request_id INT NOT NULL,"
                    + "from_account VARCHAR(12) NOT NULL,"
                    + "to_account VARCHAR(12),"
                    + "amount DOUBLE NOT NULL,"
                    + "purpose VARCHAR(255),"
                    + "remaining_ticks INT NOT NULL,"
                    + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS savings_challenges ("
                    + "account_number VARCHAR(12) PRIMARY KEY,"
                    + "title VARCHAR(100) NOT NULL,"
                    + "streak INT DEFAULT 0,"
                    + "target DOUBLE DEFAULT 200.0,"
                    + "progress DOUBLE DEFAULT 0.0,"
                    + "weeks_data VARCHAR(255) DEFAULT '0,0,0,0,0,0,0,0',"
                    + "FOREIGN KEY (account_number) REFERENCES accounts(account_number) ON DELETE CASCADE)");

            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS customer_budgets ("
                    + "customer_id VARCHAR(10) NOT NULL,"
                    + "category VARCHAR(50) NOT NULL,"
                    + "amount DOUBLE NOT NULL,"
                    + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
                    + "PRIMARY KEY (customer_id, category),"
                    + "FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE)");

            stmt.close();
            conn.close();
            connected = true;
            System.out.println("[JDBC] Successfully initialized schema on MySQL (finguard_db).");
            return true;
        } catch (SQLException e) {
            connected = false;
            lastError = e.getMessage();
            return false;
        }
    }

    public static boolean isConnected() {
        return connected;
    }

    public static boolean isDriverLoaded() {
        return driverLoaded;
    }

    public static String getUrl() {
        return url;
    }

    public static String getUser() {
        return user;
    }

    public static String getLastError() {
        return lastError;
    }
}
