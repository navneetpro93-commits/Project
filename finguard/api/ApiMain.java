package finguard.api;

import finguard.concurrent.ClearingHouse;
import finguard.concurrent.SettlementWorker;
import finguard.safety.BankClock;
import finguard.safety.CooldownVault;
import finguard.service.Bank;

public class ApiMain {
    public static void main(String[] args) throws Exception {
        BankClock clock = new BankClock();
        CooldownVault vault = new CooldownVault(clock);
        Bank bank = new Bank(clock, vault);
        ClearingHouse house = new ClearingHouse(5, bank);
        vault.setClearingHouse(house);
        SettlementWorker settler = new SettlementWorker(house);

        Thread clockThread = new Thread(clock, "bank-clock");
        Thread vaultThread = new Thread(vault, "cooldown-watcher");
        Thread settleThread = new Thread(settler, "settlement");
        Thread pulseThread = new Thread(new Runnable() {
            public void run() {
                while (clock.isRunning()) {
                    try {
                        clock.awaitAtLeast(clock.now() + 1);
                    } catch (InterruptedException e) {
                        return;
                    }
                    vault.pulse();
                }
            }
        }, "cooldown-pulse");
        clockThread.setDaemon(true);
        vaultThread.setDaemon(true);
        settleThread.setDaemon(true);
        pulseThread.setDaemon(true);
        clockThread.start();
        vaultThread.start();
        settleThread.start();
        pulseThread.start();

        bank.initDatabase();
        int port = 8080;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        }
        new ApiServer(bank, house, vault, clock).start(port);
    }
}
