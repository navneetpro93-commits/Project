package finguard.model;

import finguard.exception.AccountFrozenException;

public interface Freezeable {
    void freeze();

    void unfreeze();

    boolean isFrozen();

    void assertNotFrozen() throws AccountFrozenException;
}
