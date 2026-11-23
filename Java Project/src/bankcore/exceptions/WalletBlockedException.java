package bankcore.exceptions;

/** Checked exception: thrown when a blocked wallet or locked account is used. */
public class WalletBlockedException extends Exception {
    private static final long serialVersionUID = 1L;
    public WalletBlockedException(String message) { super(message); }
}