import test from 'node:test';
import assert from 'node:assert/strict';

import { maskAadhaarNumber } from '../services/ai.js';
import { daysUntil, emergencyAccessOpen } from '../utils/dateUtils.js';

test('maskAadhaarNumber preserves the format and keeps only the last 4 digits', () => {
  assert.equal(maskAadhaarNumber('1234 5678 9012'), 'XXXX XXXX 9012');
  assert.equal(maskAadhaarNumber('123456789012'), 'XXXX XXXX 9012');
  assert.equal(maskAadhaarNumber(''), null);
});

test('daysUntil computes the expiry countdown correctly', () => {
  const now = new Date('2026-10-18T12:00:00Z');
  const expiry = new Date('2026-10-20T12:00:00Z');
  assert.equal(daysUntil(expiry, now), 2);
});

test('emergencyAccessOpen only opens after the configured waiting period', () => {
  const notifiedAt = new Date('2026-10-01T00:00:00Z');
  assert.equal(emergencyAccessOpen(notifiedAt, 7, new Date('2026-10-07T12:00:00Z')), false);
  assert.equal(emergencyAccessOpen(notifiedAt, 7, new Date('2026-10-08T00:00:00Z')), true);
});
