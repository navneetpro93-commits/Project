package finguard.safety;

import java.util.ArrayList;

import finguard.model.TransactionRequest;

public class CooldownVault implements Runnable {
    private ArrayList<TransactionRequest> held;
    private BankClock clock;
    private boolean running;
    private finguard.concurrent.ClearingHouse clearingHouse;

    public CooldownVault(BankClock clock) {
        this.held = new ArrayList<TransactionRequest>();
        this.clock = clock;
        this.running = true;
    }

    public void setClearingHouse(finguard.concurrent.ClearingHouse clearingHouse) {
        this.clearingHouse = clearingHouse;
    }

    public synchronized void hold(TransactionRequest request, int extraTicks) {
        request.setReadyTick(clock.now() + extraTicks);
        held.add(request);
        notifyAll();
        System.out.println("  [COOLDOWN] Holding " + request.shortLabel()
                + " until tick " + request.getReadyTick());
    }

    public synchronized ArrayList<TransactionRequest> snapshot() {
        ArrayList<TransactionRequest> copy = new ArrayList<TransactionRequest>();
        for (int i = 0; i < held.size(); i++) {
            copy.add(held.get(i));
        }
        return copy;
    }

    public synchronized boolean cancel(int requestId) {
        for (int i = 0; i < held.size(); i++) {
            if (held.get(i).getId() == requestId) {
                held.remove(i);
                return true;
            }
        }
        return false;
    }

    public synchronized void stopVault() {
        running = false;
        notifyAll();
    }

    public void run() {
        while (running) {
            TransactionRequest ready = null;
            synchronized (this) {
                while (running && nextReady() == null) {
                    try {
                        wait();
                    } catch (InterruptedException e) {
                        return;
                    }
                }
                if (!running) {
                    return;
                }
                ready = nextReady();
                if (ready != null) {
                    held.remove(ready);
                }
            }
            if (ready != null && clearingHouse != null) {
                ready.setReleasedFromCooldown(true);
                System.out.println("  [COOLDOWN] Releasing " + ready.shortLabel()
                        + " at tick " + clock.now());
                try {
                    clearingHouse.submit(ready);
                } catch (InterruptedException e) {
                    return;
                }
            }
        }
    }

    private TransactionRequest nextReady() {
        int now = clock.now();
        for (int i = 0; i < held.size(); i++) {
            TransactionRequest r = held.get(i);
            if (r.getReadyTick() <= now) {
                return r;
            }
        }
        return null;
    }

    public void pulse() {
        synchronized (this) {
            notifyAll();
        }
    }
}
