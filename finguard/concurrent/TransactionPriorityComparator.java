package finguard.concurrent;

import java.util.Comparator;

import finguard.model.TransactionRequest;

public class TransactionPriorityComparator implements Comparator<TransactionRequest> {
    public int compare(TransactionRequest a, TransactionRequest b) {
        if (a.getPriority() != b.getPriority()) {
            return b.getPriority() - a.getPriority();
        }
        if (a.getCreatedTick() != b.getCreatedTick()) {
            return a.getCreatedTick() - b.getCreatedTick();
        }
        return a.getId() - b.getId();
    }
}
