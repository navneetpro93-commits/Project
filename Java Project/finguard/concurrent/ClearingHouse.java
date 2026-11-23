package finguard.concurrent;

import java.util.PriorityQueue;

import finguard.model.TransactionRequest;
import finguard.service.Bank;

public class ClearingHouse {
    private PriorityQueue<TransactionRequest> queue;
    private int capacity;
    private boolean running;
    private Bank bank;

    public ClearingHouse(int capacity, Bank bank) {
        this.capacity = capacity;
        this.bank = bank;
        this.running = true;
        this.queue = new PriorityQueue<TransactionRequest>(capacity, new TransactionPriorityComparator());
    }

    public synchronized void submit(TransactionRequest request) throws InterruptedException {
        while (running && queue.size() >= capacity) {
            System.out.println("  [QUEUE FULL] " + Thread.currentThread().getName() + " WAITING");
            wait();
        }
        if (!running) {
            return;
        }
        queue.offer(request);
        System.out.println("  [ENQUEUE] " + request.shortLabel() + "  size=" + queue.size()
                + "  by " + Thread.currentThread().getName());
        notifyAll();
    }

    public synchronized TransactionRequest take() throws InterruptedException {
        while (running && queue.isEmpty()) {
            wait();
        }
        if (!running) {
            return null;
        }
        TransactionRequest request = queue.poll();
        notifyAll();
        return request;
    }

    public synchronized void shutdown() {
        running = false;
        notifyAll();
    }

    public boolean isRunning() {
        return running;
    }

    public Bank getBank() {
        return bank;
    }

    public synchronized int size() {
        return queue.size();
    }
}
