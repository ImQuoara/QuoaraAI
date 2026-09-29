import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';

export function createApprovalNonce() {
  return randomBytes(24).toString('base64url');
}

export function deviceKeyId(publicKeySpkiB64: string) {
  const der = Buffer.from(publicKeySpkiB64, 'base64');
  return createHash('sha256').update(der).digest('hex');
}

export function buildDeviceRegistrationChallenge(keyId: string, timestampMs: number) {
  return `QUOARAAI_DEVICE_REGISTRATION_V1\n${keyId}\n${timestampMs}`;
}

export function buildApprovalChallenge(input: {
  actionRequestId: string;
  actionHash: string;
  expiresAt: string;
  nonce: string;
}) {
  return [
    'QUOARAAI_APPROVAL_V1',
    input.actionRequestId,
    input.actionHash,
    input.expiresAt,
    input.nonce,
  ].join('\n');
}

export function verifyP256Signature(publicKeySpkiB64: string, challenge: string, signatureB64: string) {
  try {
    const key = createPublicKey({
      key: Buffer.from(publicKeySpkiB64, 'base64'),
      format: 'der',
      type: 'spki',
    });
    if (key.asymmetricKeyType !== 'ec') return false;
    return verify('sha256', Buffer.from(challenge, 'utf8'), key, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}
