-- ==============================================================================
-- FinGuard Relational Database Schema (MySQL)
-- Topics 17-20: Relational/SQL Concepts, DDL, DML, Entities & Constraints
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS finguard_db;
USE finguard_db;

-- 1. Customers Table (Entity with Primary Key, Username, and Password)
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    pin VARCHAR(10) NOT NULL,
    personality VARCHAR(20) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Accounts Table (Entity with Foreign Key & Constraints)
CREATE TABLE IF NOT EXISTS accounts (
    account_number VARCHAR(12) PRIMARY KEY,
    customer_id VARCHAR(10) NOT NULL,
    holder_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    balance DOUBLE NOT NULL DEFAULT 0.0,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    vault_balance DOUBLE DEFAULT 0.0,
    overdraft_limit DOUBLE DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- 3. Transactions Table (Audit Ledger with Foreign Key)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tick INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount DOUBLE NOT NULL,
    from_account VARCHAR(12),
    to_account VARCHAR(12),
    purpose VARCHAR(255),
    category VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    risk_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Cooldown Queue Table (Guarded Inter-thread State)
CREATE TABLE IF NOT EXISTS cooldown_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    from_account VARCHAR(12) NOT NULL,
    to_account VARCHAR(12),
    amount DOUBLE NOT NULL,
    purpose VARCHAR(255),
    remaining_ticks INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Savings Challenge Board Table
CREATE TABLE IF NOT EXISTS savings_challenges (
    account_number VARCHAR(12) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    streak INT DEFAULT 0,
    target DOUBLE DEFAULT 200.0,
    progress DOUBLE DEFAULT 0.0,
    weeks_data VARCHAR(255) DEFAULT '0,0,0,0,0,0,0,0',
    CONSTRAINT fk_account FOREIGN KEY (account_number) 
        REFERENCES accounts(account_number) ON DELETE CASCADE
);
