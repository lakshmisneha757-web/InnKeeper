const test = require('node:test');
const assert = require('node:assert/strict');

const { generateDigitalKeyPayload } = require('../src/lock/lock.service.ts');

test('generateDigitalKeyPayload creates unique encrypted payloads', () => {
  const first = generateDigitalKeyPayload('res-001', 'LOCK-304-BLE');
  const second = generateDigitalKeyPayload('res-002', 'LOCK-304-BLE');

  assert.notEqual(first.encryptedKey, second.encryptedKey);
  assert.equal(first.lockId, 'LOCK-304-BLE');
  assert.equal(second.lockId, 'LOCK-304-BLE');
  assert.ok(first.nonce && first.nonce.length > 12);
  assert.ok(first.authTag && first.authTag.length > 12);
  assert.ok(first.plaintextKey.length > 0);
});
