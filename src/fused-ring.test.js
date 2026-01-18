import { test } from 'node:test';
import assert from 'node:assert';
import { FusedRing } from './fused-rings.js';

test('FusedRing creates benzene', () => {
  assert.strictEqual(FusedRing([6], ['c']), 'c1ccccc1');
});
