package finguard.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;

import finguard.exception.AccountFrozenException;
import finguard.exception.AccountNotFoundException;
import finguard.exception.InsufficientBalanceException;
import finguard.exception.InvalidPinException;
import finguard.model.Account;
import finguard.model.CurrentAccount;
import finguard.model.Customer;
import finguard.model.SavingsAccount;
import finguard.model.SavingsChallenge;
import finguard.model.Transaction;
import finguard.model.TransactionRequest;
import finguard.safety.BankClock;
import finguard.safety.CooldownVault;
import finguard.safety.RuleEngine;
import finguard.safety.SpendingIntelligence;
import finguard.savings.ChallengeBoard;

public class Bank {
    private HashMap<String, Customer> customers;
    private HashMap<String, Account> accounts;
    private HashSet<String> frozenIds;
    private BankClock clock;
    private RuleEngine rules;
    private SpendingIntelligence spendIntel;
    private CooldownVault cooldown;
    private ChallengeBoard challenges;
    private finguard.db.CustomerDAO customerDAO;
    private finguard.db.AccountDAO accountDAO;
    private finguard.db.TransactionDAO transactionDAO;
    private finguard.db.BudgetDAO budgetDAO;
    private SpendingIntelligence.BudgetAlert lastBudgetAlert;
    private int customerSeq;
    private int accountSeq;
    private int requestSeq;
    private int txnSeq;

    public Bank(BankClock clock, CooldownVault cooldown) {
        this.customers = new HashMap<String, Customer>();
        this.accounts = new HashMap<String, Account>();
        this.frozenIds = new HashSet<String>();
        this.clock = clock;
        this.cooldown = cooldown;
        this.rules = new RuleEngine();
        this.spendIntel = new SpendingIntelligence();
        this.challenges = new ChallengeBoard();
        this.customerDAO = new finguard.db.CustomerDAO();
        this.accountDAO = new finguard.db.AccountDAO();
        this.transactionDAO = new finguard.db.TransactionDAO();
        this.budgetDAO = new finguard.db.BudgetDAO();
        this.lastBudgetAlert = null;
        this.customerSeq = 100;
        this.accountSeq = 1000;
        this.requestSeq = 1;
        this.txnSeq = 1;
    }

    public void initDatabase() {
        boolean dbOk = finguard.db.DBConnection.initializeSchema();
        if (dbOk) {
            try {
                HashMap<String, Customer> dbCustomers = customerDAO.findAll();
                HashMap<String, Account> dbAccounts = accountDAO.findAll();
                if (dbCustomers != null && !dbCustomers.isEmpty()) {
                    for (Customer c : dbCustomers.values()) {
                        customers.put(c.getCustomerId(), c);
                        try {
                            HashMap<String, Double> b = budgetDAO.findByCustomer(c.getCustomerId());
                            if (b != null && !b.isEmpty()) {
                                c.setBudgets(b);
                            }
                        } catch (Exception ignored) {}
                        try {
                            int idNum = Integer.parseInt(c.getCustomerId().replaceAll("\\D", ""));
                            if (idNum > customerSeq) customerSeq = idNum;
                        } catch (Exception ignored) {}
                    }
                    for (Account a : dbAccounts.values()) {
                        accounts.put(a.getAccountNumber(), a);
                        Customer owner = customers.get(a.getCustomerId());
                        if (owner != null) {
                            owner.addAccountNumber(a.getAccountNumber());
                        }
                        try {
                            int accNum = Integer.parseInt(a.getAccountNumber().replaceAll("\\D", ""));
                            if (accNum > accountSeq) accountSeq = accNum;
                        } catch (Exception ignored) {}
                    }
                    System.out.println("[JDBC] Initialized from MySQL database (Loaded " + customers.size() + " customers, " + accounts.size() + " accounts).");
                }
            } catch (Exception e) {
                System.out.println("[JDBC] Notice reading relational tables: " + e.getMessage());
            }
        }
    }

    public BankClock getClock() {
        return clock;
    }

    public CooldownVault getCooldown() {
        return cooldown;
    }

    public ChallengeBoard getChallenges() {
        return challenges;
    }

    public synchronized Customer createCustomer(String name, String pin) {
        return createCustomer(name != null ? name.toLowerCase().replaceAll("\\s+", "") : "", pin, name);
    }

    public synchronized Customer createCustomer(String username, String password, String name) {
        String cleanUser = (username != null && !username.trim().isEmpty()) ? username.trim() : ("user" + (customerSeq + 1));
        String cleanPass = (password != null && !password.trim().isEmpty()) ? password.trim() : "1234";
        String cleanName = (name != null && !name.trim().isEmpty()) ? name.trim() : cleanUser;

        // 1. Check if username already exists in memory
        for (Customer c : customers.values()) {
            if (c.getUsername().equalsIgnoreCase(cleanUser)) {
                throw new IllegalArgumentException("Username '" + cleanUser + "' already exists. Please choose a different username or sign in.");
            }
        }

        // 2. Check if username already exists in MySQL database
        try {
            Customer dbCustomer = customerDAO.findByUsername(cleanUser);
            if (dbCustomer != null && dbCustomer.getUsername().equalsIgnoreCase(cleanUser)) {
                throw new IllegalArgumentException("Username '" + cleanUser + "' already exists. Please choose a different username or sign in.");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {}

        customerSeq++;
        String id = "C" + customerSeq;
        Customer c = new Customer(id, cleanUser, cleanPass, cleanName);
        customers.put(id, c);
        try {
            customerDAO.save(c);
            System.out.println("[MySQL SUCCESS] Saved customer " + c.getUsername() + " (" + id + ") to database.");
        } catch (Exception e) {
            System.out.println("[MySQL NOTICE] Offline / in-memory mode: " + e.getMessage());
        }
        return c;
    }

    public synchronized Account createAccount(String customerId, String type, double opening)
            throws AccountNotFoundException {
        Customer c = customers.get(customerId);
        if (c == null) {
            throw new AccountNotFoundException("No customer " + customerId);
        }
        accountSeq++;
        String accNo = "FG" + accountSeq;
        Account acc;
        if ("CURRENT".equalsIgnoreCase(type)) {
            acc = new CurrentAccount(accNo, customerId, c.getName(), opening, 5000);
        } else {
            acc = new SavingsAccount(accNo, customerId, c.getName(), opening);
            challenges.add(new SavingsChallenge(accNo, "8-week safety vault", 8, 200));
        }
        accounts.put(accNo, acc);
        c.addAccountNumber(accNo);
        try {
            accountDAO.save(acc);
            System.out.println("[MySQL SUCCESS] Saved account " + accNo + " to database.");
            if (opening > 0) {
                int id;
                synchronized (this) {
                    id = txnSeq++;
                }
                Transaction initTxn = new Transaction(id, clock.now(), TransactionRequest.TYPE_DEPOSIT,
                        opening, null, accNo, "Account Opening Deposit", "TRANSFER", "SUCCESS", 0);
                acc.record(initTxn);
                transactionDAO.save(initTxn);
                System.out.println("[MySQL SUCCESS] Saved opening transaction #" + id + " to database.");
            }
        } catch (Exception e) {
            System.out.println("[MySQL NOTICE] Offline / in-memory mode: " + e.getMessage());
            if (opening > 0 && acc.copyHistory().isEmpty()) {
                int id;
                synchronized (this) {
                    id = txnSeq++;
                }
                Transaction initTxn = new Transaction(id, clock.now(), TransactionRequest.TYPE_DEPOSIT,
                        opening, null, accNo, "Account Opening Deposit", "TRANSFER", "SUCCESS", 0);
                acc.record(initTxn);
            }
        }
        return acc;
    }

    public Customer login(String identifier, String password) throws AccountNotFoundException, InvalidPinException {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new AccountNotFoundException("Username is required.");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new InvalidPinException("Password is required.");
        }
        String term = identifier.trim();
        String pass = password.trim();
        Customer c = null;

        // 1. Direct username match where password matches
        for (Customer cand : customers.values()) {
            if (cand.getUsername().equalsIgnoreCase(term) && cand.checkPassword(pass)) {
                c = cand;
                break;
            }
        }

        // 2. If no direct match with password, check if username exists to give clear error
        if (c == null) {
            for (Customer cand : customers.values()) {
                if (cand.getUsername().equalsIgnoreCase(term)) {
                    throw new InvalidPinException("Incorrect password for username '" + term + "'. Please try again.");
                }
            }
        }

        // 3. Match by Customer ID (e.g. C101) or Name
        if (c == null) {
            Customer byId = customers.get(term.toUpperCase());
            if (byId == null) byId = customers.get(term);
            if (byId != null) {
                if (byId.checkPassword(pass)) {
                    c = byId;
                } else {
                    throw new InvalidPinException("Incorrect password for customer ID '" + term + "'.");
                }
            }
        }

        if (c == null) {
            for (Customer cand : customers.values()) {
                if (cand.getName().equalsIgnoreCase(term)) {
                    if (cand.checkPassword(pass)) {
                        c = cand;
                        break;
                    } else {
                        throw new InvalidPinException("Incorrect password for '" + term + "'.");
                    }
                }
            }
        }

        // 4. Account Number match (e.g. "FG1001")
        if (c == null) {
            Account acc = accounts.get(term.toUpperCase());
            if (acc != null) {
                Customer byAcc = customers.get(acc.getCustomerId());
                if (byAcc != null) {
                    if (byAcc.checkPassword(pass)) {
                        c = byAcc;
                    } else {
                        throw new InvalidPinException("Incorrect password for account '" + term + "'.");
                    }
                }
            }
        }

        // 5. Query MySQL database directly by username or identifier
        if (c == null) {
            try {
                c = customerDAO.findByUsername(term);
                if (c != null) {
                    if (!c.checkPassword(pass)) {
                        throw new InvalidPinException("Incorrect password for '" + term + "'. Please try again.");
                    }
                    customers.put(c.getCustomerId(), c);
                }
            } catch (InvalidPinException e) {
                throw e;
            } catch (Exception ignored) {}
        }

        if (c == null) {
            throw new AccountNotFoundException("No account found for username '" + term + "'. Please create an account first.");
        }

        // Refresh customer's accounts list with all active accounts belonging to them
        c.getAccountNumbers().clear();
        for (Account a : accounts.values()) {
            if (a.getCustomerId().equals(c.getCustomerId())) {
                c.addAccountNumber(a.getAccountNumber());
            }
        }

        return c;
    }

    public Account requireAccount(String accNo) throws AccountNotFoundException {
        if (accNo == null || accNo.trim().isEmpty()) {
            throw new AccountNotFoundException("Account number is required.");
        }
        String key = accNo.trim().toUpperCase();
        Account acc = accounts.get(key);
        if (acc == null) {
            for (Account a : accounts.values()) {
                if (a.getAccountNumber().equalsIgnoreCase(key)) {
                    acc = a;
                    break;
                }
            }
        }
        if (acc == null) {
            throw new AccountNotFoundException("No account " + accNo);
        }
        return acc;
    }

    public Customer requireCustomer(String id) throws AccountNotFoundException {
        if (id == null || id.trim().isEmpty()) {
            throw new AccountNotFoundException("Customer ID is required.");
        }
        String key = id.trim().toUpperCase();
        Customer c = customers.get(key);
        if (c == null) {
            for (Customer cand : customers.values()) {
                if (cand.getCustomerId().equalsIgnoreCase(key) || cand.getUsername().equalsIgnoreCase(key)) {
                    c = cand;
                    break;
                }
            }
        }
        if (c == null) {
            throw new AccountNotFoundException("No customer " + id);
        }
        return c;
    }

    public TransactionRequest buildRequest(String type, String from, String to, double amount, String purpose) {
        int priority = TransactionRequest.PRIORITY_NORMAL;
        if (TransactionRequest.TYPE_SALARY.equals(type)) {
            priority = TransactionRequest.PRIORITY_SALARY;
        } else if (TransactionRequest.TYPE_BILL.equals(type)) {
            priority = TransactionRequest.PRIORITY_BILL;
        } else if (TransactionRequest.TYPE_ROUNDUP.equals(type)) {
            priority = TransactionRequest.PRIORITY_ROUNDUP;
        }
        String payee = to;
        if (payee == null || payee.length() == 0) {
            payee = "CASH";
        }
        int id;
        synchronized (this) {
            id = requestSeq++;
        }
        return new TransactionRequest(id, priority, clock.now(), type, from, to, amount, purpose, payee);
    }

    public synchronized SpendingIntelligence.BudgetAlert getLastBudgetAlert() {
        return lastBudgetAlert;
    }

    public synchronized void setCustomerBudget(String customerId, String category, double amount) {
        Customer c = customers.get(customerId);
        if (c == null) {
            for (Customer cand : customers.values()) {
                if (cand.getCustomerId().equalsIgnoreCase(customerId) || cand.getUsername().equalsIgnoreCase(customerId)) {
                    c = cand;
                    break;
                }
            }
        }
        if (c != null) {
            c.setBudget(category, amount);
            try {
                budgetDAO.save(c.getCustomerId(), category, amount);
                System.out.println("[MySQL SUCCESS] Saved budget " + category + " = Rs." + amount + " for customer " + c.getCustomerId());
            } catch (Exception e) {
                System.out.println("[MySQL NOTICE] Saving budget: " + e.getMessage());
            }
        }
    }

    public synchronized void setCustomerBudgets(String customerId, HashMap<String, Double> budgets) {
        Customer c = customers.get(customerId);
        if (c == null) {
            for (Customer cand : customers.values()) {
                if (cand.getCustomerId().equalsIgnoreCase(customerId) || cand.getUsername().equalsIgnoreCase(customerId)) {
                    c = cand;
                    break;
                }
            }
        }
        if (c != null && budgets != null) {
            c.setBudgets(budgets);
            try {
                budgetDAO.saveAll(c.getCustomerId(), budgets);
                System.out.println("[MySQL SUCCESS] Saved " + budgets.size() + " category budgets for customer " + c.getCustomerId());
            } catch (Exception e) {
                System.out.println("[MySQL NOTICE] Saving budgets: " + e.getMessage());
            }
        }
    }

    public String settle(TransactionRequest request, boolean alreadyCooled) {
        synchronized (this) {
            lastBudgetAlert = null;
        }
        try {
            return settleInner(request, alreadyCooled);
        } catch (AccountNotFoundException e) {
            return "FAIL: " + e.getMessage();
        } catch (AccountFrozenException e) {
            return "FAIL: " + e.getMessage();
        } catch (InsufficientBalanceException e) {
            return "FAIL: " + e.getMessage();
        }
    }

    private String settleInner(TransactionRequest request, boolean alreadyCooled)
            throws AccountNotFoundException, AccountFrozenException, InsufficientBalanceException {
        String type = request.getType();
        if (TransactionRequest.TYPE_DEPOSIT.equals(type) || TransactionRequest.TYPE_SALARY.equals(type)) {
            Account acc = requireAccount(request.getToAccount());
            acc.assertNotFrozen();
            acc.credit(request.getAmount());
            String cat = spendIntel.categorize(request.getPurpose());
            Transaction t = nextTxn(request, cat, "SUCCESS", 0);
            acc.record(t);
            try {
                accountDAO.updateBalance(acc.getAccountNumber(), acc.getBalance());
                transactionDAO.save(t);
                System.out.println("[MySQL SUCCESS] Updated balance for " + acc.getAccountNumber() + " and recorded transaction #" + t.getId());
            } catch (Exception e) {
                System.err.println("[MySQL ERROR] Updating balance/transaction: " + e.getMessage());
            }
            maybeChallenge(acc, request);
            return "SUCCESS credit Rs." + request.getAmount() + " to " + acc.maskNumber()
                    + " bal=" + acc.getBalance();
        }

        Account from = requireAccount(request.getFromAccount());
        from.assertNotFrozen();

        RuleEngine.Result result = rules.score(from, request);
        System.out.println("  [RULES] score=" + result.score + " decision=" + rules.decisionName(result.decision));
        for (int i = 0; i < result.fired.size(); i++) {
            System.out.println("           " + result.fired.get(i));
        }

        if (!alreadyCooled && result.decision == RuleEngine.BLOCK) {
            String cat = spendIntel.categorize(request.getPurpose());
            from.record(nextTxn(request, cat, "BLOCKED", result.score));
            return "BLOCKED (score " + result.score + "). Consider emergency freeze.";
        }
        if (!alreadyCooled && result.decision == RuleEngine.COOLDOWN) {
            String cat = spendIntel.categorize(request.getPurpose());
            from.record(nextTxn(request, cat, "HELD", result.score));
            cooldown.hold(request, 4);
            return "HELD for cooldown (score " + result.score + "). Watcher will release later.";
        }

        lockAndMove(request, result.score);
        maybeRoundUp(from, request);
        maybeChallenge(from, request);

        // Check Category Budget Alert
        try {
            String cat = spendIntel.categorize(request.getPurpose());
            Customer c = customers.get(from.getCustomerId());
            if (c != null) {
                Double spentAfter = from.copyCategorySpend().get(cat);
                double spentVal = spentAfter != null ? spentAfter.doubleValue() : 0.0;
                synchronized (this) {
                    lastBudgetAlert = spendIntel.checkAlert(c, cat, spentVal);
                }
                if (lastBudgetAlert != null && lastBudgetAlert.exceeded) {
                    System.out.println("  [BUDGET ALERT] " + lastBudgetAlert.message);
                }
            }
        } catch (Exception ignored) {}

        return "SUCCESS " + type + " Rs." + request.getAmount()
                + " from " + from.maskNumber() + " bal=" + from.getBalance();
    }

    private void lockAndMove(TransactionRequest request, int score)
            throws AccountNotFoundException, AccountFrozenException, InsufficientBalanceException {
        Account from = requireAccount(request.getFromAccount());
        Account to = null;
        if (request.getToAccount() != null && request.getToAccount().trim().length() > 0) {
            try {
                to = requireAccount(request.getToAccount());
            } catch (AccountNotFoundException ignored) {}
        }

        if (to == null) {
            synchronized (from) {
                from.assertNotFrozen();
                from.debit(request.getAmount());
                String cat = spendIntel.categorize(request.getPurpose());
                Transaction t = nextTxn(request, cat, "SUCCESS", score);
                from.record(t);
                try {
                    accountDAO.updateBalance(from.getAccountNumber(), from.getBalance());
                    transactionDAO.save(t);
                    System.out.println("[MySQL SUCCESS] Debit " + from.getAccountNumber() + " recorded txn #" + t.getId());
                } catch (Exception e) {
                    System.err.println("[MySQL ERROR] Debit balance/transaction: " + e.getMessage());
                }
            }
            return;
        }

        Account first = from;
        Account second = to;
        if (from.getAccountNumber().compareTo(to.getAccountNumber()) > 0) {
            first = to;
            second = from;
        }
        synchronized (first) {
            synchronized (second) {
                from.assertNotFrozen();
                to.assertNotFrozen();
                from.debit(request.getAmount());
                to.credit(request.getAmount());
                String cat = spendIntel.categorize(request.getPurpose());
                Transaction t = nextTxn(request, cat, "SUCCESS", score);
                from.record(t);
                to.record(t);
                try {
                    accountDAO.updateBalance(from.getAccountNumber(), from.getBalance());
                    accountDAO.updateBalance(to.getAccountNumber(), to.getBalance());
                    transactionDAO.save(t);
                    System.out.println("[MySQL SUCCESS] Transferred between " + from.getAccountNumber() + " & " + to.getAccountNumber() + ", recorded txn #" + t.getId());
                } catch (Exception e) {
                    System.err.println("[MySQL ERROR] Transfer balance/transaction: " + e.getMessage());
                }
            }
        }
    }

    private void maybeRoundUp(Account from, TransactionRequest request) {
        if (!(from instanceof SavingsAccount)) {
            return;
        }
        SavingsAccount sav = (SavingsAccount) from;
        if (!sav.isRoundUpEnabled()) {
            return;
        }
        String type = request.getType();
        if (!TransactionRequest.TYPE_WITHDRAW.equals(type) && !TransactionRequest.TYPE_TRANSFER.equals(type)
                && !TransactionRequest.TYPE_BILL.equals(type)) {
            return;
        }
        double amount = request.getAmount();
        double rounded = Math.ceil(amount / 10.0) * 10.0;
        double spare = rounded - amount;
        if (spare <= 0) {
            return;
        }
        try {
            synchronized (sav) {
                if (sav.getBalance() >= spare && !sav.isFrozen()) {
                    sav.debit(spare);
                    sav.addToVault(spare);
                    try {
                        accountDAO.updateBalance(sav.getAccountNumber(), sav.getBalance());
                        accountDAO.updateVaultBalance(sav.getAccountNumber(), sav.getVaultBalance());
                    } catch (Exception ignored) {}
                    System.out.println("  [ROUND-UP] extra Rs." + spare + " moved to safety vault. Vault=Rs."
                            + sav.getVaultBalance());
                }
            }
        } catch (Exception e) {
            System.out.println("  [ROUND-UP] skipped: " + e.getMessage());
        }
    }

    private void maybeChallenge(Account from, TransactionRequest request) {
        if (TransactionRequest.TYPE_DEPOSIT.equals(request.getType())
                || TransactionRequest.TYPE_SALARY.equals(request.getType())) {
            SavingsChallenge ch = challenges.find(from.getAccountNumber());
            if (ch != null) {
                int week = clock.now() % 8;
                boolean filled = ch.fillWeek(week, Math.min(request.getAmount() * 0.05, 200));
                if (filled) {
                    System.out.println("  [CHALLENGE] week slot " + week + " completed. " + ch.report());
                }
            }
        }
    }

    private Transaction nextTxn(TransactionRequest request, String category, String status, int score) {
        int id;
        synchronized (this) {
            id = txnSeq++;
        }
        return new Transaction(id, clock.now(), request.getType(), request.getAmount(),
                request.getFromAccount(), request.getToAccount(), request.getPurpose(),
                category, status, score);
    }

    public synchronized void freeze(String accNo, String pin)
            throws AccountNotFoundException, InvalidPinException {
        Account acc = requireAccount(accNo);
        Customer c = requireCustomer(acc.getCustomerId());
        if (!c.checkPin(pin)) {
            throw new InvalidPinException("PIN required to freeze");
        }
        acc.freeze();
        frozenIds.add(accNo);
        try {
            accountDAO.setFrozen(accNo, true);
        } catch (Exception ignored) {}
        System.out.println("  [FREEZE] " + acc.maskNumber() + " is now frozen. Set=" + frozenIds);
    }

    public synchronized void unfreeze(String accNo, String pin, String phrase)
            throws AccountNotFoundException, InvalidPinException {
        Account acc = requireAccount(accNo);
        Customer c = requireCustomer(acc.getCustomerId());
        if (!c.checkPin(pin)) {
            throw new InvalidPinException("PIN required to unfreeze");
        }
        if (!"UNFREEZE".equals(phrase)) {
            throw new InvalidPinException("Type UNFREEZE exactly to confirm");
        }
        acc.unfreeze();
        frozenIds.remove(accNo);
        try {
            accountDAO.setFrozen(accNo, false);
        } catch (Exception ignored) {}
        System.out.println("  [FREEZE] " + acc.maskNumber() + " restored");
    }

    public void printStatement(String accNo, String sortBy) throws AccountNotFoundException {
        Account acc = requireAccount(accNo);
        ArrayList<Transaction> list = statement(accNo, sortBy);
        System.out.println("Statement " + acc.maskNumber() + "  type=" + acc.getAccountType()
                + "  bal=Rs." + acc.getBalance() + "  frozen=" + acc.isFrozen());
        if (acc instanceof SavingsAccount) {
            System.out.println("Safety vault: Rs." + ((SavingsAccount) acc).getVaultBalance());
        }
        if (acc instanceof CurrentAccount) {
            System.out.println("Overdraft limit: Rs." + ((CurrentAccount) acc).getOverdraftLimit()
                    + "  available=Rs." + acc.availableLimit());
        }
        if (list.isEmpty()) {
            System.out.println("  (no transactions)");
            return;
        }
        for (int i = 0; i < list.size(); i++) {
            System.out.println("  " + list.get(i).summary());
        }
    }

    public void printSpending(String accNo) throws AccountNotFoundException {
        SpendingIntelligence.ArrayReport r = spendingReport(accNo);
        for (int i = 0; i < r.lines.length; i++) {
            if (r.lines[i] != null) {
                System.out.println(r.lines[i]);
            }
        }
    }

    public void seedDemo() {
        // No-op: Database and memory remain completely clean until real users register
    }

    public HashMap<String, Account> getAccounts() {
        return accounts;
    }

    public HashMap<String, Customer> getCustomers() {
        return customers;
    }

    public ArrayList<Transaction> statement(String accNo, String sortBy) throws AccountNotFoundException {
        Account acc = requireAccount(accNo);
        try {
            ArrayList<Transaction> dbList = transactionDAO.findByAccount(accNo, sortBy);
            if (dbList != null && !dbList.isEmpty()) {
                return dbList;
            }
        } catch (Exception ignored) {}
        ArrayList<Transaction> list = acc.copyHistory();
        if ("AMOUNT".equalsIgnoreCase(sortBy)) {
            Collections.sort(list, new Comparator<Transaction>() {
                public int compare(Transaction a, Transaction b) {
                    if (a.getAmount() > b.getAmount()) {
                        return -1;
                    }
                    if (a.getAmount() < b.getAmount()) {
                        return 1;
                    }
                    return 0;
                }
            });
        } else {
            Collections.sort(list);
        }
        return list;
    }

    public SpendingIntelligence.ArrayReport spendingReport(String accNo) throws AccountNotFoundException {
        Account acc = requireAccount(accNo);
        Customer c = requireCustomer(acc.getCustomerId());
        double vault = 0;
        if (acc instanceof SavingsAccount) {
            vault = ((SavingsAccount) acc).getVaultBalance();
        }
        return spendIntel.report(c, acc.copyCategorySpend(), vault);
    }
}
