package finguard.concurrent;

import finguard.model.TransactionRequest;

public class CustomerWorker implements Runnable {
    private String workerName;
    private ClearingHouse house;
    private TransactionRequest[] jobs;

    public CustomerWorker(String workerName, ClearingHouse house, TransactionRequest[] jobs) {
        this.workerName = workerName;
        this.house = house;
        this.jobs = jobs;
    }

    public void run() {
        System.out.println("  [THREAD] " + workerName + " RUNNABLE, jobs=" + jobs.length);
        for (int i = 0; i < jobs.length; i++) {
            try {
                house.submit(jobs[i]);
            } catch (InterruptedException e) {
                System.out.println("  [THREAD] " + workerName + " interrupted");
                return;
            }
        }
        System.out.println("  [THREAD] " + workerName + " finished producing");
    }
}
