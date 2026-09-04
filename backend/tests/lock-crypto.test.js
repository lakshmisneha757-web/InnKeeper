import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDigitalKeyPayload } from '../src/lock/lock.service.js';

test('generateDigitalKeyPayload creates unique encrypted payloads', () => {
  const first = generateDigitalKeyPayload('res-001', 'LOCK-304-BLE');
  const second = generateDigitalKeyPayload('res-002', 'LOCK-304-BLE');

  assert.notEqual(first.encryptedKey, second.encryptedKey);
  assert.equal(first.lockId, 'LOCK-304-BLE');
  assert.equal(second.lockId, 'LOCK-304-BLE');
  assert.ok(first.nonce && first.nonce.length > 12);
  assert.ok(first.salt && first.salt.length > 0);
  assert.equal(first.plaintextKey, undefined);
});
