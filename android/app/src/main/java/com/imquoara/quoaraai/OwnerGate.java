package com.imquoara.quoaraai;

import android.app.Activity;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;

final class OwnerGate {
    interface Callback {
        void onAuthenticated();
        void onRejected();
    }

    private OwnerGate() {}

    static void authenticate(Activity activity, Callback callback) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            callback.onRejected();
            return;
        }

        BiometricPrompt.Builder builder = new BiometricPrompt.Builder(activity)
            .setTitle("Unlock QuoaraAi")
            .setSubtitle("Owner verification")
            .setDescription("Confirm your identity before opening the owner workspace.");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setDeviceCredentialAllowed(true);
        } else {
            builder.setNegativeButton("Cancel", activity.getMainExecutor(), (dialog, which) -> callback.onRejected());
        }

        BiometricPrompt prompt = builder.build();
        CancellationSignal cancel = new CancellationSignal();
        prompt.authenticate(cancel, activity.getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                callback.onAuthenticated();
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                callback.onRejected();
            }
        });
    }
}
