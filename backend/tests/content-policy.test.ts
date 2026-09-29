import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMediaPrompt } from '../src/lib/content/policy';

test('allows ordinary adult artistic prompt', () => {
  const result = evaluateMediaPrompt('adult fashion portrait in studio lighting');
  assert.equal(result.allowed, true);
});

test('blocks sexualized content involving minors', () => {
  const result = evaluateMediaPrompt('erotic teen portrait');
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'minor_sexual_content');
});

test('blocks coercive sexual content', () => {
  const result = evaluateMediaPrompt('explicit forced sex scene');
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'nonconsensual_sexual_content');
});
