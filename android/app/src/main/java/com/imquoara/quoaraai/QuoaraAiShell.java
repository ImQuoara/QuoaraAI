package com.imquoara.quoaraai;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.text.method.LinkMovementMethod;
import android.text.util.Linkify;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class QuoaraAiShell {
    private final Activity activity;
    private final ApiClient api;
    private final String backendUrl;
    private final ExecutorService executor = Executors.newFixedThreadPool(3);
    private final FrameLayout content;
    private String conversationId;

    QuoaraAiShell(Activity activity, String backendUrl) {
        this.activity = activity;
        this.backendUrl = backendUrl;
        this.api = new ApiClient(backendUrl);
        this.content = new FrameLayout(activity);
    }

    View build() {
        LinearLayout root = vertical();
        root.setBackgroundColor(Color.rgb(10, 10, 10));

        TextView header = text("QuoaraAi", 20f, Color.WHITE);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(18), dp(14), dp(18), dp(10));
        root.addView(header, matchWrap());
        root.addView(content, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout nav = new LinearLayout(activity);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setPadding(dp(6), dp(6), dp(6), dp(10));
        root.addView(nav, matchWrap());

        nav.addView(navButton("Chat", this::showChat), weighted());
        nav.addView(navButton("Research", this::showResearch), weighted());
        nav.addView(navButton("Create", this::showCreate), weighted());
        nav.addView(navButton("Control", this::showControl), weighted());
        showChat();
        return root;
    }

    void close() { executor.shutdownNow(); }

    private void showChat() {
        LinearLayout page = page("Chat", "Native chat using the QuoaraAi backend. Provider secrets remain server-side.");
        ScrollView scroll = new ScrollView(activity);
        TextView transcript = text("Ready.", 15f, Color.LTGRAY);
        transcript.setPadding(0, 0, 0, dp(12));
        scroll.addView(transcript);
        page.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        EditText input = input("Message QuoaraAi…");
        page.addView(input, matchWrap());
        Button send = button("Send");
        page.addView(send, matchWrap());
        send.setOnClickListener(v -> {
            String message = input.getText().toString().trim();
            if (message.isEmpty()) return;
            send.setEnabled(false);
            transcript.append("\n\nYou: " + message + "\n\nQuoaraAi: ");
            input.setText("");
            executor.execute(() -> {
                try {
                    String id = ensureConversation();
                    JSONObject body = new JSONObject().put("conversationId", id).put("message", message);
                    ApiClient.Result result = api.postJson("/api/chat", body.toString());
                    String answer = result.ok() ? result.body : safeError(result);
                    activity.runOnUiThread(() -> {
                        transcript.append(answer);
                        send.setEnabled(true);
                        scroll.post(() -> scroll.fullScroll(View.FOCUS_DOWN));
                    });
                } catch (Exception error) {
                    activity.runOnUiThread(() -> { transcript.append("Request failed safely."); send.setEnabled(true); });
                }
            });
        });
        swap(page);
    }

    private void showResearch() {
        LinearLayout page = page("Research", "Source-backed research. Retrieved web content is treated as untrusted data, not instructions.");
        EditText query = input("What do you want researched?");
        page.addView(query, matchWrap());
        Button search = button("Research");
        page.addView(search, matchWrap());
        ScrollView scroll = new ScrollView(activity);
        TextView results = text("", 14f, Color.LTGRAY);
        results.setTextIsSelectable(true);
        results.setAutoLinkMask(Linkify.WEB_URLS);
        results.setMovementMethod(LinkMovementMethod.getInstance());
        scroll.addView(results);
        page.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        search.setOnClickListener(v -> {
            String q = query.getText().toString().trim();
            if (q.isEmpty()) return;
            search.setEnabled(false);
            results.setText("Researching…");
            executor.execute(() -> {
                try {
                    ApiClient.Result result = api.postJson("/api/research", new JSONObject().put("query", q).toString());
                    String rendered = result.ok() ? renderResearch(result.body) : safeError(result);
                    activity.runOnUiThread(() -> { results.setText(rendered); search.setEnabled(true); });
                } catch (Exception error) {
                    activity.runOnUiThread(() -> { results.setText("Research failed safely."); search.setEnabled(true); });
                }
            });
        });
        swap(page);
    }

    private void showCreate() {
        LinearLayout page = page("Create", "Free-first image generation. No paid fallback. Exact external generations require owner approval.");
        EditText prompt = input("Describe an image…");
        prompt.setMinLines(4);
        page.addView(prompt, matchWrap());
        Button prepare = button("Prepare free image");
        page.addView(prepare, matchWrap());
        TextView status = text("", 13f, Color.LTGRAY);
        page.addView(status, matchWrap());
        ImageView image = new ImageView(activity);
        image.setAdjustViewBounds(true);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        page.addView(image, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        prepare.setOnClickListener(v -> {
            String p = prompt.getText().toString().trim();
            if (p.isEmpty()) return;
            prepare.setEnabled(false);
            status.setText("Preparing exact $0 action…");
            executor.execute(() -> {
                try {
                    JSONObject body = new JSONObject().put("prompt", p).put("aspectRatio", "1:1").put("mode", "auto");
                    ApiClient.Result result = api.postJson("/api/image/prepare", body.toString());
                    if (!result.ok()) {
                        activity.runOnUiThread(() -> { status.setText(safeError(result)); prepare.setEnabled(true); });
                        return;
                    }
                    JSONObject prepared = new JSONObject(result.body);
                    activity.runOnUiThread(() -> showImageApproval(prepared, image, status, prepare));
                } catch (Exception error) {
                    activity.runOnUiThread(() -> { status.setText("Could not prepare image action."); prepare.setEnabled(true); });
                }
            });
        });
        swap(page);
    }

    private void showImageApproval(JSONObject prepared, ImageView image, TextView status, Button prepare) {
        String id = prepared.optString("actionRequestId");
        String challenge = prepared.optString("approvalChallenge");
        if (id.isBlank() || challenge.isBlank()) {
            status.setText("Device-signed approval is not available on the backend yet.");
            prepare.setEnabled(true);
            return;
        }

        new AlertDialog.Builder(activity)
            .setTitle("Approve exact image generation?")
            .setMessage("Provider cost ceiling: US$0.0000\n\nYour Android Keystore key will sign only this exact action.")
            .setNegativeButton("Cancel", (d, w) -> prepare.setEnabled(true))
            .setPositiveButton("Sign & generate", (d, w) -> DeviceSigner.signWithOwnerAuth(activity, challenge, new DeviceSigner.Callback() {
                @Override public void onSigned(String keyId, String publicKey, String signatureB64) {
                    status.setText("Verifying device signature…");
                    executor.execute(() -> approveAndGenerate(id, keyId, signatureB64, image, status, prepare));
                }
                @Override public void onRejected(String reason) {
                    status.setText("Approval cancelled: " + reason);
                    prepare.setEnabled(true);
                }
            }))
            .show();
    }

    private void approveAndGenerate(String id, String keyId, String signatureB64, ImageView image, TextView status, Button prepare) {
        try {
            JSONObject approval = new JSONObject().put("id", id).put("deviceKeyId", keyId).put("signatureB64", signatureB64);
            ApiClient.Result approved = api.postJson("/api/mobile/actions/approve", approval.toString());
            if (!approved.ok()) {
                activity.runOnUiThread(() -> { status.setText(safeError(approved)); prepare.setEnabled(true); });
                return;
            }
            ApiClient.Result generated = api.postJson("/api/image", new JSONObject().put("actionRequestId", id).toString());
            if (!generated.ok()) {
                activity.runOnUiThread(() -> { status.setText(safeError(generated)); prepare.setEnabled(true); });
                return;
            }
            JSONObject payload = new JSONObject(generated.body);
            Bitmap bitmap = decodeDataUrl(payload.optString("dataUrl"));
            activity.runOnUiThread(() -> {
                if (bitmap != null) image.setImageBitmap(bitmap);
                status.setText("Generated with " + payload.optString("model") + " · provider cost $0");
                prepare.setEnabled(true);
            });
        } catch (Exception error) {
            activity.runOnUiThread(() -> { status.setText("Generation failed safely."); prepare.setEnabled(true); });
        }
    }

    private void showControl() {
        LinearLayout page = page("Control", "Owner Root controls. QuoaraAi cannot silently spend, change policy, expand permissions, or activate upgrades.");
        TextView buildInfo = text(
            "Installed app\n" +
            "Package: " + BuildConfig.APPLICATION_ID + "\n" +
            "Version: " + BuildConfig.VERSION_NAME + " (" + BuildConfig.VERSION_CODE + ")\n" +
            "Source baseline: " + BuildConfig.QUOARAAI_SOURCE_BASELINE + "\n" +
            "Backend: " + backendUrl,
            13f,
            Color.LTGRAY
        );
        buildInfo.setTextIsSelectable(true);
        buildInfo.setPadding(0, 0, 0, dp(14));
        page.addView(buildInfo, matchWrap());
        TextView device = text("Device key: checking…", 14f, Color.LTGRAY);
        page.addView(device, matchWrap());
        Button register = button("Register this phone as Owner device");
        page.addView(register, matchWrap());
        TextView providers = text("Providers: loading…", 13f, Color.LTGRAY);
        providers.setPadding(0, dp(14), 0, dp(10));
        page.addView(providers, matchWrap());
        Button web = button("Open web console");
        web.setOnClickListener(v -> activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(backendUrl + "/control"))));
        page.addView(web, matchWrap());

        executor.execute(() -> {
            try {
                String keyId = DeviceSigner.keyId();
                ApiClient.Result state = api.get("/api/mobile/device?keyId=" + Uri.encode(keyId));
                boolean registered = state.ok() && new JSONObject(state.body).optBoolean("registered", false);
                ApiClient.Result caps = api.get("/api/mobile/capabilities");
                String capText = caps.ok() ? renderCapabilities(caps.body) : safeError(caps);
                activity.runOnUiThread(() -> {
                    device.setText("Device key: " + (registered ? "registered" : "not registered") + "\n" + shortId(keyId));
                    providers.setText(capText);
                });
            } catch (Exception error) {
                activity.runOnUiThread(() -> device.setText("Device key status unavailable."));
            }
        });

        register.setOnClickListener(v -> registerDevice(device, register));
        swap(page);
    }

    private void registerDevice(TextView status, Button button) {
        button.setEnabled(false);
        final long timestamp = System.currentTimeMillis();
        try {
            String keyId = DeviceSigner.keyId();
            String challenge = "QUOARAAI_DEVICE_REGISTRATION_V1\n" + keyId + "\n" + timestamp;
            DeviceSigner.signWithOwnerAuth(activity, challenge, new DeviceSigner.Callback() {
                @Override public void onSigned(String signedKeyId, String publicKey, String signatureB64) {
                    executor.execute(() -> {
                        try {
                            JSONObject body = new JSONObject()
                                .put("deviceKeyId", signedKeyId)
                                .put("publicKeySpkiB64", publicKey)
                                .put("timestampMs", timestamp)
                                .put("signatureB64", signatureB64)
                                .put("label", "Steve Android Owner");
                            ApiClient.Result result = api.postJson("/api/mobile/device", body.toString());
                            activity.runOnUiThread(() -> {
                                status.setText(result.ok() ? "Device key: registered\n" + shortId(signedKeyId) : safeError(result));
                                button.setEnabled(true);
                            });
                        } catch (Exception error) {
                            activity.runOnUiThread(() -> { status.setText("Device registration failed safely."); button.setEnabled(true); });
                        }
                    });
                }
                @Override public void onRejected(String reason) {
                    status.setText("Registration cancelled: " + reason);
                    button.setEnabled(true);
                }
            });
        } catch (Exception error) {
            status.setText("Device key unavailable.");
            button.setEnabled(true);
        }
    }

    private String ensureConversation() throws Exception {
        if (conversationId != null) return conversationId;
        ApiClient.Result list = api.get("/api/conversations");
        if (!list.ok()) throw new IllegalStateException("conversation list unavailable");
        JSONArray items = new JSONArray(list.body);
        if (items.length() > 0) {
            conversationId = items.getJSONObject(0).getString("id");
            return conversationId;
        }
        ApiClient.Result created = api.postJson("/api/conversations", new JSONObject().put("title", "QuoaraAi Android").toString());
        if (!created.ok()) throw new IllegalStateException("conversation create unavailable");
        conversationId = new JSONObject(created.body).getString("id");
        return conversationId;
    }

    private static String renderResearch(String body) throws Exception {
        JSONObject root = new JSONObject(body);
        JSONArray results = root.optJSONArray("results");
        StringBuilder out = new StringBuilder();
        if (results == null || results.length() == 0) return "No sources returned.";
        for (int i = 0; i < results.length(); i++) {
            JSONObject item = results.getJSONObject(i);
            out.append(item.optString("title", "Source")).append("\n")
               .append(item.optString("url")).append("\n")
               .append(item.optString("content")).append("\n\n");
        }
        return out.toString();
    }

    private static String renderCapabilities(String body) throws Exception {
        JSONObject root = new JSONObject(body);
        JSONArray providers = root.optJSONArray("providers");
        StringBuilder out = new StringBuilder();
        out.append("Backend: ").append(root.optString("backendVersion", "unknown"))
            .append(" · baseline ").append(root.optString("sourceBaseline", "unknown"))
            .append("\n\nProviders\n");
        if (providers != null) {
            for (int i = 0; i < providers.length(); i++) {
                JSONObject p = providers.getJSONObject(i);
                String providerStatus = p.optString("status", p.optBoolean("enabled") ? "ready" : "off");
                out.append("• ").append(p.optString("capability")).append(": ")
                    .append(p.optString("displayName")).append(" — ")
                    .append(providerStatus.replace('_', ' ')).append("\n");
                String reason = p.optString("reason");
                if (!reason.isBlank()) out.append("  ").append(reason).append("\n");
            }
        }
        return out.toString();
    }

    private static Bitmap decodeDataUrl(String value) {
        int comma = value.indexOf(',');
        if (comma < 0) return null;
        try {
            byte[] bytes = Base64.decode(value.substring(comma + 1), Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception ignored) { return null; }
    }

    private LinearLayout page(String title, String detail) {
        LinearLayout page = vertical();
        page.setPadding(dp(18), dp(10), dp(18), dp(10));
        page.addView(text(title, 26f, Color.WHITE), matchWrap());
        TextView sub = text(detail, 13f, Color.LTGRAY);
        sub.setPadding(0, dp(6), 0, dp(14));
        page.addView(sub, matchWrap());
        return page;
    }

    private LinearLayout vertical() {
        LinearLayout layout = new LinearLayout(activity);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }

    private EditText input(String hint) {
        EditText view = new EditText(activity);
        view.setHint(hint);
        view.setTextColor(Color.WHITE);
        view.setHintTextColor(Color.GRAY);
        view.setBackgroundColor(Color.rgb(24, 24, 24));
        view.setPadding(dp(14), dp(12), dp(14), dp(12));
        return view;
    }

    private Button button(String label) {
        Button button = new Button(activity);
        button.setText(label);
        return button;
    }

    private Button navButton(String label, Runnable action) {
        Button button = button(label);
        button.setAllCaps(false);
        button.setOnClickListener(v -> action.run());
        return button;
    }

    private TextView text(String value, float size, int color) {
        TextView view = new TextView(activity);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        return view;
    }

    private void swap(View view) {
        content.removeAllViews();
        content.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private static String safeError(ApiClient.Result result) {
        try {
            String error = new JSONObject(result.body).optString("error");
            if (!error.isBlank()) return error;
        } catch (Exception ignored) {}
        return "QuoaraAi request failed safely (HTTP " + result.status + ").";
    }

    private static String shortId(String value) {
        return value.length() <= 18 ? value : value.substring(0, 10) + "…" + value.substring(value.length() - 6);
    }

    private int dp(int value) { return Math.round(value * activity.getResources().getDisplayMetrics().density); }
    private static LinearLayout.LayoutParams matchWrap() { return new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT); }
    private static LinearLayout.LayoutParams weighted() { return new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f); }
}
