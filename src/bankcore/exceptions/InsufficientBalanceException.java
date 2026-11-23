package bankcore.exceptions;

/** Checked exception: thrown when a wallet cannot cover a debit. */
public class InsufficientBalanceException extends Exception {
    private static final long serialVersionUID = 1L;
    public InsufficientBalanceException(String message) { super(message); }
}