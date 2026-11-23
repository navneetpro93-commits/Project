package bankcore.core;

import bankcore.exceptions.InvalidPaymentException;
import bankcore.exceptions.WalletBlockedException;

import java.util.HashMap;
import java.util.Map;

/**
 * Login with failed-attempt tracking and a temporary lock.
 * Passwords are stored in plain text only because this is a classroom simulation.
 */
public class UserManager {
    public static final int MAX_FAILS = 3;
    private long lockMs = 30000;

    private final Map<String, String> passwords = new HashMap<String, String>();
    private final Map<String, Integer> fails = new HashMap<String, Integer>();
    private final Map<String, Long> lockedUntil = new HashMap<String, Long>();

    public void setLockMs(long ms) { lockMs = ms; }

    public synchronized String register(String user, String pass) throws InvalidPaymentException {
        user = user.trim().toLowerCase();
        if (!user.matches("[a-z0-9]{3,12}")) {
            throw new InvalidPaymentException("Username must be 3-12 letters/digits");
        }
        if (pass.length() < 4) throw new InvalidPaymentException("Password must be at least 4 characters");
        if (passwords.containsKey(user)) throw new InvalidPaymentException("Username already taken");
        passwords.put(user, pass);
        return user + "@pay";                          // wallet id for this user
    }

    public synchronized boolean exists(String user) { return passwords.containsKey(user.trim().toLowerCase()); }

    public synchronized boolean login(String user, String pass) throws WalletBlockedException {
        user = user.trim().toLowerCase();
        if (!passwords.containsKey(user)) return false;
        Long until = lockedUntil.get(user);
        long now = System.currentTimeMillis();
        if (until != null && now < until) {
            throw new WalletBlockedException("Account locked. Try again in " + ((until - now) / 1000 + 1) + " s");
        }
        if (passwords.get(user).equals(pass)) {        // equals(), never == for Strings
            fails.put(user, 0);
            lockedUntil.remove(user);
            return true;
        }
        Integer n = fails.get(user);
        int count = (n == null ? 0 : n) + 1;
        if (count >= MAX_FAILS) {
            fails.put(user, 0);
            lockedUntil.put(user, now + lockMs);
            throw new WalletBlockedException("Too many failed attempts. Account locked for " + (lockMs / 1000) + " s");
        }
        fails.put(user, count);
        return false;
    }

    public synchronized int failedAttempts(String user) {
        Integer n = fails.get(user.trim().toLowerCase());
        return n == null ? 0 : n;
    }
}