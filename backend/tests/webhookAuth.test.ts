import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWebhookSignature,
  normalizeWebhookSignature,
  safeCompareSignatures,
} from '../src/middlewares/webhookAuth.js';

test('crea y compara firmas HMAC de webhook sobre timestamp y raw body', () => {
  const secret = 'test-secret';
  const timestamp = '1770000000';
  const rawBody = Buffer.from(JSON.stringify({ event_id: 'evt_1', provider: 'sinpe' }));
  const signature = createWebhookSignature(secret, timestamp, rawBody);

  assert.equal(safeCompareSignatures(signature, signature), true);
  assert.equal(safeCompareSignatures(`sha256=${signature}`, signature), true);
  assert.equal(safeCompareSignatures(signature.replace(/.$/, '0'), signature), false);
});

test('normaliza prefijo sha256 en firmas entrantes', () => {
  assert.equal(normalizeWebhookSignature('sha256=abc123'), 'abc123');
  assert.equal(normalizeWebhookSignature('abc123'), 'abc123');
});
