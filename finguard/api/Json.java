package finguard.api;

import java.util.HashMap;

public class Json {
    public static String esc(String value) {
        if (value == null) {
            return "";
        }
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\\' || c == '"') {
                out.append('\\').append(c);
            } else if (c == '\n') {
                out.append("\\n");
            } else if (c == '\r') {
                out.append("\\r");
            } else if (c == '\t') {
                out.append("\\t");
            } else {
                out.append(c);
            }
        }
        return out.toString();
    }

    public static String q(String value) {
        return "\"" + esc(value) + "\"";
    }

    public static String field(String json, String key) {
        String needle = "\"" + key + "\"";
        int keyAt = json.indexOf(needle);
        if (keyAt < 0) {
            return "";
        }
        int colon = json.indexOf(':', keyAt + needle.length());
        if (colon < 0) {
            return "";
        }
        int i = colon + 1;
        while (i < json.length() && (json.charAt(i) == ' ' || json.charAt(i) == '\n')) {
            i++;
        }
        if (i >= json.length()) {
            return "";
        }
        if (json.charAt(i) == '"') {
            StringBuilder value = new StringBuilder();
            i++;
            while (i < json.length()) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) {
                    value.append(json.charAt(i + 1));
                    i += 2;
                    continue;
                }
                if (c == '"') {
                    break;
                }
                value.append(c);
                i++;
            }
            return value.toString();
        }
        int end = i;
        while (end < json.length()) {
            char c = json.charAt(end);
            if ((c >= '0' && c <= '9') || c == '.' || c == '-') {
                end++;
            } else {
                break;
            }
        }
        return json.substring(i, end);
    }

    public static double num(String json, String key) {
        String raw = field(json, key);
        if (raw.length() == 0) {
            return 0;
        }
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    public static HashMap<String, Double> parseDoubleMap(String json, String parentKey) {
        HashMap<String, Double> map = new HashMap<String, Double>();
        if (json == null) return map;
        int keyIndex = json.indexOf("\"" + parentKey + "\"");
        if (keyIndex < 0) return map;
        int openBrace = json.indexOf('{', keyIndex);
        if (openBrace < 0) return map;
        int closeBrace = json.indexOf('}', openBrace);
        if (closeBrace < 0) return map;
        String content = json.substring(openBrace + 1, closeBrace);
        String[] pairs = content.split(",");
        for (String pair : pairs) {
            int colon = pair.indexOf(':');
            if (colon > 0) {
                String k = pair.substring(0, colon).replaceAll("[\"\\s]", "");
                String v = pair.substring(colon + 1).replaceAll("[\"\\s]", "");
                try {
                    if (!k.isEmpty() && !v.isEmpty()) {
                        map.put(k.toUpperCase(), Double.parseDouble(v));
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return map;
    }
}
