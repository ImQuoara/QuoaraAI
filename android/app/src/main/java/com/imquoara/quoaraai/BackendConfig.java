package com.imquoara.quoaraai;

import android.content.Context;
import android.content.SharedPreferences;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

final class BackendConfig {
    private static final String PREFS = "quoaraai_owner_config";
    private static final String KEY_BACKEND_URL = "backend_url";

    private BackendConfig() {}

    static String load(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String saved = prefs.getString(KEY_BACKEND_URL, "");
        if (isValidHttpsUrl(saved)) return normalize(saved);

        String compiled = BuildConfig.QUOARAAI_APP_URL;
        if (isValidHttpsUrl(compiled) && !compiled.endsWith(".invalid")) return normalize(compiled);
        return null;
    }

    static boolean save(Context context, String url) {
        if (!isValidHttpsUrl(url)) return false;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_BACKEND_URL, normalize(url))
            .apply();
        return true;
    }

    static String origin(String url) {
        if (url == null || url.isBlank()) return null;
        try {
            URI uri = new URI(url.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getHost().isBlank() || uri.getUserInfo() != null) {
                return null;
            }
            int port = uri.getPort();
            String host = uri.getHost().toLowerCase(Locale.ROOT);
            if (host.contains(":")) host = "[" + host + "]";
            return "https://" + host + (port == -1 || port == 443 ? "" : ":" + port);
        } catch (URISyntaxException e) {
            return null;
        }
    }

    static boolean isValidHttpsUrl(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = new URI(url.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme())
                || uri.getHost() == null
                || uri.getHost().isBlank()
                || uri.getUserInfo() != null
                || uri.getQuery() != null
                || uri.getFragment() != null) {
                return false;
            }
            String path = uri.getPath();
            if (path != null && !path.isBlank() && !"/".equals(path)) return false;
            int port = uri.getPort();
            return port == -1 || (port >= 1 && port <= 65535);
        } catch (URISyntaxException e) {
            return false;
        }
    }

    private static String normalize(String url) {
        return origin(url);
    }
}
