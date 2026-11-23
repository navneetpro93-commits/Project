package finguard.concurrent;

public class RaceLab {
    private static class UnsafeBox {
        int balance;
    }

    private static class SafeBox {
        int balance;

        synchronized void depositOne() {
            int temp = balance;
            temp = temp + 1;
            balance = temp;
        }
    }

    public void runDemo() {
        System.out.println();
        System.out.println("======== CONCURRENCY LAB ========");
        raceWithoutLock();
        raceWithLock();
        lifecycleDemo();
        System.out.println("=================================");
    }

    private void raceWithoutLock() {
        final UnsafeBox box = new UnsafeBox();
        box.balance = 0;
        Thread t1 = new Thread(new Runnable() {
            public void run() {
                for (int i = 0; i < 10000; i++) {
                    int temp = box.balance;
                    temp = temp + 1;
                    box.balance = temp;
                }
            }
        }, "unsafe-A");
        Thread t2 = new Thread(new Runnable() {
            public void run() {
                for (int i = 0; i < 10000; i++) {
                    int temp = box.balance;
                    temp = temp + 1;
                    box.balance = temp;
                }
            }
        }, "unsafe-B");
        t1.start();
        t2.start();
        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("Race WITHOUT synchronized: expected 20000, actual " + box.balance
                + "  (lost updates)");
    }

    private void raceWithLock() {
        final SafeBox box = new SafeBox();
        Thread t1 = new Thread(new Runnable() {
            public void run() {
                for (int i = 0; i < 10000; i++) {
                    box.depositOne();
                }
            }
        }, "safe-A");
        Thread t2 = new Thread(new Runnable() {
            public void run() {
                for (int i = 0; i < 10000; i++) {
                    box.depositOne();
                }
            }
        }, "safe-B");
        t1.start();
        t2.start();
        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("Race WITH synchronized:    expected 20000, actual " + box.balance);
    }

    private void lifecycleDemo() {
        Thread parked = new Thread(new Runnable() {
            public void run() {
                synchronized (RaceLab.this) {
                    try {
                        RaceLab.this.wait();
                    } catch (InterruptedException e) {
                        return;
                    }
                }
            }
        }, "lifecycle-wait");
        System.out.println("State after new Thread(): " + parked.getState() + "  (NEW)");
        parked.start();
        try {
            Thread.sleep(150);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("State while wait():       " + parked.getState() + "  (WAITING)");
        synchronized (this) {
            notifyAll();
        }
        try {
            parked.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("State after join():       " + parked.getState() + "  (TERMINATED)");

        Thread sleeper = new Thread(new Runnable() {
            public void run() {
                try {
                    Thread.sleep(300);
                } catch (InterruptedException e) {
                    return;
                }
            }
        }, "lifecycle-sleep");
        sleeper.start();
        try {
            Thread.sleep(80);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("State while sleep():      " + sleeper.getState() + "  (TIMED_WAITING)");
        try {
            sleeper.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
