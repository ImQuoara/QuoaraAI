import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { buildApprovalChallenge, buildDeviceRegistrationChallenge, deviceKeyId, verifyP256Signature } from '../src/lib/security/device-approval';

test('verifies an Android-compatible P-256 DER signature', () => {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  const challenge = buildApprovalChallenge({
    actionRequestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    actionHash: 'hash',
    expiresAt: '2026-09-28T16:00:00.000Z',
    nonce: 'nonce',
  });
  const signature = sign('sha256', Buffer.from(challenge), pair.privateKey).toString('base64');
  assert.equal(verifyP256Signature(publicKey, challenge, signature), true);
  assert.equal(verifyP256Signature(publicKey, `${challenge}x`, signature), false);
});

test('device id fingerprints the exact SPKI key', () => {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const publicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  assert.match(deviceKeyId(publicKey), /^[0-9a-f]{64}$/);
  assert.ok(buildDeviceRegistrationChallenge(deviceKeyId(publicKey), 123).startsWith('QUOARAAI_DEVICE_REGISTRATION_V1'));
});
