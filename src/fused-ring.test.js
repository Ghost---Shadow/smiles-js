import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import { FusedRing, buildRing } from './fused-ring.js';
import { isValidSMILES } from './test-utils.js';

describe('FusedRing', () => {
  test('creates benzene', async () => {
    const benzene = FusedRing([
      {
        type: 'c',
        size: 6,
      },
    ]);
    assert.strictEqual(benzene.smiles, 'c1ccccc1');
    assert.ok(await isValidSMILES(benzene.smiles));
  });

  test('creates 1,3,5-triazine', async () => {
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

  test('creates napthalene', async () => {
    const parameters = [
      {
        type: 'c',
        size: 6,
      },
      {
        type: 'c',
        size: 6,
        offset: 3,
      },
    ];
    const napthalene = FusedRing(parameters);
    assert.strictEqual(napthalene.smiles, 'c1ccc2ccccc2c1');
    assert.deepStrictEqual(napthalene.meta, parameters);
    assert.ok(await isValidSMILES(napthalene.smiles));
  });

  test('throws error for empty array', () => {
    assert.throws(
      () => FusedRing([]),
      /FusedRing requires at least one ring/,
    );
  });
});

describe('buildRing', () => {
  test('creates benzene atoms', () => {
    const atoms = buildRing({ type: 'c', size: 6 }, 1);
    assert.deepStrictEqual(atoms, ['c1', 'c', 'c', 'c', 'c', 'c1']);
  });

  test('creates ring with substitutions', () => {
    const atoms = buildRing(
      {
        type: 'c',
        size: 6,
        substitutions: { 2: 'n', 4: 'n', 6: 'n' },
      },
      1,
    );
    assert.deepStrictEqual(atoms, ['c1', 'n', 'c', 'n', 'c', 'n1']);
  });

  test('uses correct ring number', () => {
    const atoms = buildRing({ type: 'c', size: 5 }, 3);
    assert.deepStrictEqual(atoms, ['c3', 'c', 'c', 'c', 'c3']);
  });
});
