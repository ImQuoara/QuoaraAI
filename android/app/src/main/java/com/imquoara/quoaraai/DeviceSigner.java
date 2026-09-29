package com.imquoara.quoaraai;

import android.app.Activity;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;

final class DeviceSigner {
    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String ALIAS = "quoaraai_owner_approval_p256_v1";

    interface Callback {
        void onSigned(String keyId, String publicKeySpkiB64, String signatureB64);
        void onRejected(String reason);
    }

    private DeviceSigner() {}

    static String keyId() throws Exception {
        PublicKey publicKey = keyPair().getPublic();
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(publicKey.getEncoded());
        return hex(digest);
    }

    static String publicKeySpkiB64() throws Exception {
        return Base64.encodeToString(keyPair().getPublic().getEncoded(), Base64.NO_WRAP);
    }

    static void signWithOwnerAuth(Activity activity, String challenge, Callback callback) {
        try {
            KeyPair pair = keyPair();
            Signature signature = Signature.getInstance("SHA256withECDSA");
            PrivateKey privateKey = pair.getPrivate();
            signature.initSign(privateKey);

            BiometricPrompt.Builder builder = new BiometricPrompt.Builder(activity)
                .setTitle("Approve QuoaraAi action")
                .setSubtitle("Owner device signature")
                .setDescription("Your phone signs this exact action. The private key never leaves Android Keystore.");

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                builder.setDeviceCredentialAllowed(true);
            } else {
                builder.setNegativeButton("Cancel", activity.getMainExecutor(), (dialog, which) -> callback.onRejected("Cancelled"));
            }

            BiometricPrompt prompt = builder.build();
            prompt.authenticate(new BiometricPrompt.CryptoObject(signature), new CancellationSignal(), activity.getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    try {
                        Signature authenticated = result.getCryptoObject() != null ? result.getCryptoObject().getSignature() : null;
                        if (authenticated == null) throw new IllegalStateException("No authenticated signature object");
                        authenticated.update(challenge.getBytes(StandardCharsets.UTF_8));
                        String signed = Base64.encodeToString(authenticated.sign(), Base64.NO_WRAP);
                        callback.onSigned(hex(sha256(pair.getPublic().getEncoded())), Base64.encodeToString(pair.getPublic().getEncoded(), Base64.NO_WRAP), signed);
                    } catch (Exception error) {
                        callback.onRejected("Could not sign approval");
                    }
                }

                @Override public void onAuthenticationError(int errorCode, CharSequence errString) {
                    callback.onRejected(errString == null ? "Authentication failed" : errString.toString());
                }
            });
        } catch (Exception error) {
            callback.onRejected("Device key unavailable");
        }
    }

    private static KeyPair keyPair() throws Exception {
        KeyStore store = KeyStore.getInstance(KEYSTORE);
        store.load(null);
        if (!store.containsAlias(ALIAS)) createKey();
        KeyStore.PrivateKeyEntry entry = (KeyStore.PrivateKeyEntry) store.getEntry(ALIAS, null);
        return new KeyPair(entry.getCertificate().getPublicKey(), entry.getPrivateKey());
    }

    private static void createKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE);
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
            ALIAS,
            KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
        )
            .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setUserAuthenticationRequired(true)
            .setInvalidatedByBiometricEnrollment(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(
                0,
                KeyProperties.AUTH_BIOMETRIC_STRONG | KeyProperties.AUTH_DEVICE_CREDENTIAL
            );
        } else {
            builder.setUserAuthenticationValidityDurationSeconds(-1);
        }
        generator.initialize(builder.build());
        generator.generateKeyPair();
    }

    private static byte[] sha256(byte[] input) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(input);
    }

    private static String hex(byte[] input) {
        StringBuilder out = new StringBuilder(input.length * 2);
        for (byte b : input) out.append(String.format("%02x", b & 0xff));
        return out.toString();
    }
}
