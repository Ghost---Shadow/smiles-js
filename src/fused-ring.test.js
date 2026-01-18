import { test } from 'node:test';
import assert from 'node:assert';
import { FusedRing } from './fused-ring.js';
import { isValidSMILES } from './test-utils.js';

test('FusedRing creates benzene', async () => {
  const benzene = FusedRing([
    {
      type: 'c',
      size: 6,
    },
  ]);
  assert.strictEqual(benzene.smiles, 'c1ccccc1');
  assert.ok(await isValidSMILES(benzene.smiles));
});

test('FusedRing creates 1,3,5-triazine', async () => {
  const triazine = FusedRing([
    {
      type: 'c',
      size: 6,
      substitutions: {
        2: 'n',
        4: 'n',
        6: 'n',
      },
    },
  ]);
  assert.strictEqual(triazine.smiles, 'c1ncncn1');
  assert.ok(await isValidSMILES(triazine.smiles));
});
