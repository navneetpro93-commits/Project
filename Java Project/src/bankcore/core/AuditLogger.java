package bankcore.core;

import java.util.LinkedList;

/**
 * Daemon thread: it must not keep the JVM alive. It sleeps in wait() until
 * somebody calls log(). The final log is a StringBuffer (thread-safe).
 */
public class AuditLogger extends Thread {
    private final LinkedList<String> pending = new LinkedList<String>();
    private final StringBuffer log = new StringBuffer();

    public AuditLogger() {
        super("audit-logger");
        setDaemon(true);                               // must be called before start()
    }

    public synchronized void log(String msg) {
        pending.add("[" + Thread.currentThread().getName() + "] " + msg);
        notifyAll();
    }

    @Override
    public void run() {
        while (true) {
            String msg;
            synchronized (this) {
                while (pending.isEmpty()) {
                    try { wait(); } catch (InterruptedException e) { return; }
                }
                msg = pending.removeFirst();
            }
            log.append(msg).append('\n');
        }
    }

    public String getLog() { return log.toString(); }

    /** Last n lines of the audit log. */
    public String tail(int n) {
        String[] lines = log.toString().split("\n");
        StringBuilder sb = new StringBuilder();
        for (int i = Math.max(0, lines.length - n); i < lines.length; i++) {
            if (!lines[i].isEmpty()) sb.append(lines[i]).append('\n');
        }
        return sb.toString();
    }
}