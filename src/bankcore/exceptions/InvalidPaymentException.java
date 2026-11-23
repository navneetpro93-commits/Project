package bankcore.exceptions;

/** Checked exception: thrown for invalid, unknown or duplicate payments. */
public class InvalidPaymentException extends Exception {
    private static final long serialVersionUID = 1L;
    public InvalidPaymentException(String message) { super(message); }
}