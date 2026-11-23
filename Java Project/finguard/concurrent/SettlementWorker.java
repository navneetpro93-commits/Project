package finguard.concurrent;

import finguard.model.TransactionRequest;

public class SettlementWorker implements Runnable {
    private ClearingHouse house;
    private boolean live;

    public SettlementWorker(ClearingHouse house) {
        this.house = house;
        this.live = true;
    }

    public void stopWorker() {
        live = false;
        house.shutdown();
    }

    public void run() {
        System.out.println("  [THREAD] SettlementWorker state after start: "
                + Thread.currentThread().getState());
        while (live && house.isRunning()) {
            try {
                TransactionRequest request = house.take();
                if (request == null) {
                    break;
                }
                System.out.println("  [SETTLE] " + request.shortLabel()
                        + "  workerState=" + Thread.currentThread().getState());
                house.getBank().settle(request, request.isReleasedFromCooldown());
            } catch (InterruptedException e) {
                break;
            }
        }
        System.out.println("  [THREAD] SettlementWorker leaving run()");
    }
}
