import assert from 'node:assert/strict';
import test from 'node:test';

import { isMutationMetadataSameOrigin, isUnsafeContentLength } from '../src/lib/security/request-core';

const url = 'https://quoaraai.example/api/chat';

test('same-origin mutation accepts an exact Origin', () => {
  assert.equal(isMutationMetadataSameOrigin(url, 'https://quoaraai.example', null), true);
});

test('same-origin mutation rejects a different Origin', () => {
  assert.equal(isMutationMetadataSameOrigin(url, 'https://attacker.example', null), false);
});

test('missing Origin fails closed without trusted fetch metadata', () => {
  assert.equal(isMutationMetadataSameOrigin(url, null, null), false);
  assert.equal(isMutationMetadataSameOrigin(url, null, 'cross-site'), false);
});

test('missing Origin accepts only same-origin or none fetch metadata', () => {
  assert.equal(isMutationMetadataSameOrigin(url, null, 'same-origin'), true);
  assert.equal(isMutationMetadataSameOrigin(url, null, 'none'), true);
});

test('content-length rejects malformed and negative values', () => {
  assert.equal(isUnsafeContentLength('-1', 8192), true);
  assert.equal(isUnsafeContentLength('not-a-number', 8192), true);
  assert.equal(isUnsafeContentLength('1.5', 8192), true);
});

test('content-length treats missing header as unsafe and rejects overflow', () => {
  assert.equal(isUnsafeContentLength(null, 8192), true);
  assert.equal(isUnsafeContentLength('8192', 8192), false);
  assert.equal(isUnsafeContentLength('8193', 8192), true);
});
