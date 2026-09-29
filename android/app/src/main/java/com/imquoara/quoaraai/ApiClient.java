package com.imquoara.quoaraai;

import android.webkit.CookieManager;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

final class ApiClient {
    static final class Result {
        final int status;
        final String body;
        Result(int status, String body) { this.status = status; this.body = body; }
        boolean ok() { return status >= 200 && status < 300; }
    }

    private final String baseUrl;
    private final String origin;

    ApiClient(String baseUrl) {
        this.baseUrl = trimSlash(baseUrl);
        String canonicalOrigin = BackendConfig.origin(this.baseUrl);
        if (canonicalOrigin == null) throw new IllegalArgumentException("Invalid HTTPS backend origin");
        this.origin = canonicalOrigin;
    }

    Result get(String path) throws Exception { return request("GET", path, null); }
    Result postJson(String path, String json) throws Exception { return request("POST", path, json); }

    private Result request(String method, String path, String json) throws Exception {
        URL url = new URL(baseUrl + (path.startsWith("/") ? path : "/" + path));
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(15_000);
        connection.setReadTimeout(90_000);
        connection.setInstanceFollowRedirects(false);
        connection.setRequestMethod(method);
        connection.setRequestProperty("Accept", "application/json, text/plain;q=0.9");
        connection.setRequestProperty("X-QuoaraAi-Client", "android_owner_v1");
        connection.setRequestProperty("Origin", origin);

        String cookies = CookieManager.getInstance().getCookie(baseUrl);
        if (cookies != null && !cookies.isBlank()) connection.setRequestProperty("Cookie", cookies);

        if (json != null) {
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(bytes.length);
            connection.getOutputStream().write(bytes);
        }

        int status = connection.getResponseCode();
        captureCookies(url.toString(), connection.getHeaderFields());
        InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
        String body = read(stream);
        connection.disconnect();
        return new Result(status, body);
    }

    private static void captureCookies(String url, Map<String, List<String>> headers) {
        CookieManager manager = CookieManager.getInstance();
        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            if (entry.getKey() == null || !"set-cookie".equalsIgnoreCase(entry.getKey())) continue;
            for (String value : entry.getValue()) manager.setCookie(url, value);
        }
        manager.flush();
    }

    private static String read(InputStream stream) throws Exception {
        if (stream == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            StringBuilder out = new StringBuilder();
            char[] buffer = new char[4096];
            int n;
            while ((n = reader.read(buffer)) != -1) out.append(buffer, 0, n);
            return out.toString();
        }
    }

    private static String trimSlash(String value) {
        String out = value;
        while (out.endsWith("/")) out = out.substring(0, out.length() - 1);
        return out;
    }
}
