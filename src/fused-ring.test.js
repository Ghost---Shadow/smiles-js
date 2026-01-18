import { test } from 'node:test';
import assert from 'node:assert';
import { FusedRing } from './fused-ring.js';

test('FusedRing creates benzene', () => {
  const benzene = FusedRing([
    {
      type: 'c',
      size: 6,
    },
  ]);
  assert.strictEqual(benzene, 'c1ccccc1');
});
