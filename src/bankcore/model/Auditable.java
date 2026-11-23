package bankcore.model;

/** Interface = pure contract. Anything that can describe itself for the audit log. */
public interface Auditable {
    String toAuditString();
}