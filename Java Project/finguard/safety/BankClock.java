package finguard.safety;

public class BankClock implements Runnable {
    private int tick;
    private boolean running;

    public BankClock() {
        this.tick = 0;
        this.running = true;
    }

    public synchronized int now() {
        return tick;
    }

    public synchronized void advance() {
        tick++;
        notifyAll();
    }

    public synchronized void awaitAtLeast(int targetTick) throws InterruptedException {
        while (tick < targetTick && running) {
            wait();
        }
    }

    public synchronized void stopClock() {
        running = false;
        notifyAll();
    }

    public synchronized boolean isRunning() {
        return running;
    }

    public void run() {
        while (isRunning()) {
            try {
                Thread.sleep(400);
            } catch (InterruptedException e) {
                break;
            }
            if (isRunning()) {
                advance();
            }
        }
    }
}
