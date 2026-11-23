package finguard.api;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;

public class ConsoleCapture {
    public static String run(Runnable action) {
        PrintStream original = System.out;
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        PrintStream captured = new PrintStream(buffer, true);
        System.setOut(captured);
        try {
            action.run();
        } finally {
            System.setOut(original);
            captured.close();
        }
        String text = buffer.toString();
        original.print(text);
        return text;
    }
}
