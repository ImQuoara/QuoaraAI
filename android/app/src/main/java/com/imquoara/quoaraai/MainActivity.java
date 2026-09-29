package com.imquoara.quoaraai;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.SafeBrowsingResponse;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MainActivity extends Activity {
    private WebView authWebView;
    private QuoaraAiShell shell;
    private String allowedOrigin;
    private String appUrl;
    private final ExecutorService bootstrapExecutor = Executors.newSingleThreadExecutor();

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showLockedScreen();
        OwnerGate.authenticate(this, new OwnerGate.Callback() {
            @Override public void onAuthenticated() { openConfiguredBackendOrSetup(); }
            @Override public void onRejected() { finishAndRemoveTask(); }
        });
    }

    private void showLockedScreen() {
        TextView view = new TextView(this);
        view.setBackgroundColor(Color.rgb(10, 10, 10));
        view.setTextColor(Color.WHITE);
        view.setTextSize(18f);
        view.setGravity(Gravity.CENTER);
        view.setText("QuoaraAi\n\nOwner verification required");
        setContentView(view);
    }

    private void openConfiguredBackendOrSetup() {
        appUrl = BackendConfig.load(this);
        if (appUrl == null) { showConfigurationScreen(); return; }
        verifySessionOrLogin();
    }

    private void showConfigurationScreen() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(48, 80, 48, 48);
        layout.setBackgroundColor(Color.rgb(10, 10, 10));

        TextView title = new TextView(this);
        title.setTextColor(Color.WHITE);
        title.setTextSize(22f);
        title.setText("Connect QuoaraAi backend");
        layout.addView(title);

        TextView detail = new TextView(this);
        detail.setTextColor(Color.LTGRAY);
        detail.setTextSize(14f);
        detail.setPadding(0, 24, 0, 24);
        detail.setText("Enter the HTTPS address for your trusted QuoaraAi backend. AI-provider and service-role secrets stay on the server.");
        layout.addView(detail);

        EditText input = new EditText(this);
        input.setHint("https://quoaraai.example.com");
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setTextColor(Color.WHITE);
        input.setHintTextColor(Color.GRAY);
        layout.addView(input, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView error = new TextView(this);
        error.setTextColor(Color.rgb(255, 140, 140));
        error.setPadding(0, 16, 0, 8);
        layout.addView(error);

        Button save = new Button(this);
        save.setText("Save trusted backend");
        save.setOnClickListener(v -> {
            String value = input.getText().toString();
            if (!BackendConfig.save(this, value)) {
                error.setText("Use a root HTTPS origin only, with no path, query, fragment, or embedded credentials.");
                return;
            }
            appUrl = BackendConfig.load(this);
            verifySessionOrLogin();
        });
        layout.addView(save);
        setContentView(layout);
    }

    private void verifySessionOrLogin() {
        bootstrapExecutor.execute(() -> {
            try {
                ApiClient.Result result = new ApiClient(appUrl).get("/api/mobile/capabilities");
                runOnUiThread(() -> {
                    if (result.ok()) showNativeShell(); else showAuthWebView();
                });
            } catch (Exception error) {
                runOnUiThread(this::showAuthWebView);
            }
        });
    }

    private void showNativeShell() {
        destroyAuthWebView();
        if (shell != null) shell.close();
        shell = new QuoaraAiShell(this, appUrl);
        setContentView(shell.build());
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void showAuthWebView() {
        if (appUrl == null || !BackendConfig.isValidHttpsUrl(appUrl)) { showConfigurationScreen(); return; }
        allowedOrigin = BackendConfig.origin(appUrl);
        if (allowedOrigin == null) { showConfigurationScreen(); return; }

        authWebView = new WebView(this);
        authWebView.setBackgroundColor(Color.rgb(10, 10, 10));
        WebSettings s = authWebView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setSaveFormData(false);
        s.setSupportMultipleWindows(false);
        s.setUserAgentString(s.getUserAgentString() + " QuoaraAi-Android/" + BuildConfig.VERSION_NAME + " AuthBootstrap");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(authWebView, false);

        authWebView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String targetOrigin = BackendConfig.origin(uri.toString());
                if (targetOrigin != null && allowedOrigin.equalsIgnoreCase(targetOrigin)) return false;
                String scheme = uri.getScheme();
                // Off-origin HTTPS links may leave the auth WebView for the system browser.
                // Insecure HTTP and custom schemes (intent:, tel:, mailto:, etc.) are blocked.
                if ("https".equalsIgnoreCase(scheme)) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
                }
                return true;
            }

            @Override public void onSafeBrowsingHit(WebView view, WebResourceRequest request, int threatType, SafeBrowsingResponse callback) {
                callback.backToSafety(true);
            }

            @Override public void onPageFinished(WebView view, String url) {
                CookieManager.getInstance().flush();
                bootstrapExecutor.execute(() -> {
                    try {
                        ApiClient.Result result = new ApiClient(appUrl).get("/api/mobile/capabilities");
                        if (result.ok()) runOnUiThread(MainActivity.this::showNativeShell);
                    } catch (Exception ignored) {}
                });
            }
        });

        setContentView(authWebView);
        authWebView.loadUrl(appUrl + "/login?next=/chat");
    }

    private void destroyAuthWebView() {
        if (authWebView == null) return;
        authWebView.stopLoading();
        authWebView.removeAllViews();
        authWebView.destroy();
        authWebView = null;
    }

    @Override protected void onDestroy() {
        destroyAuthWebView();
        if (shell != null) shell.close();
        bootstrapExecutor.shutdownNow();
        super.onDestroy();
    }
}
