import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import { Ring } from './ring.js';
import { Fragment } from './fragment.js';
import { isValidSMILES } from './test-utils.js';

describe('Ring', () => {
  test('creates benzene', async () => {
    const benzene = Ring({
      type: 'c',
      size: 6,
    });
    assert.strictEqual(benzene.smiles, 'c1ccccc1');
    assert.ok(await isValidSMILES(benzene.smiles));
  });

  test('creates 1,3,5-triazine', async () => {
    const triazine = Ring({
      type: 'c',
      size: 6,
      substitutions: {
        2: 'n',
        4: 'n',
        6: 'n',
      },
    });
    assert.strictEqual(triazine.smiles, 'c1ncncn1');
    assert.ok(await isValidSMILES(triazine.smiles));
  });

  test('creates benzene with chlorine attachment', async () => {
    const benzeneWithCl = Ring({
      type: 'c',
      size: 6,
      attachments: {
        3: 'Cl',
      },
    });
    assert.strictEqual(benzeneWithCl.smiles, 'c1cc(Cl)ccc1');
    assert.strictEqual(benzeneWithCl.meta.rings[0].ringNumber, 1);
    assert.ok(await isValidSMILES(benzeneWithCl.smiles));
  });
});

describe('buildRing method', () => {
  test('creates benzene atoms', () => {
    const atoms = Ring.buildRing({ type: 'c', size: 6 }, 1);
    assert.deepStrictEqual(atoms, ['c1', 'c', 'c', 'c', 'c', 'c1']);
  });

  test('creates ring with substitutions', () => {
    const atoms = Ring.buildRing(
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
    const atoms = Ring.buildRing({ type: 'c', size: 5 }, 3);
    assert.deepStrictEqual(atoms, ['c3', 'c', 'c', 'c', 'c3']);
  });
});

describe('Ring with ring counter on connection', () => {
  test('independent Ring always starts at ring 1', async () => {
    const benzene1 = Ring({ type: 'c', size: 6 });
    const benzene2 = Ring({ type: 'c', size: 6 });
    // Both independent, both use ring number 1
    assert.strictEqual(benzene1.smiles, 'c1ccccc1');
    assert.strictEqual(benzene2.smiles, 'c1ccccc1');
    assert.ok(await isValidSMILES(benzene1.smiles));
    assert.ok(await isValidSMILES(benzene2.smiles));
  });

  test('avoids ring numbers when attached via branching', async () => {
    const benzene = Ring({ type: 'c', size: 6 });
    const cyclohexane = Ring({ type: 'C', size: 6 });

    // When attached, the second fragment should use ring number 2
    const attached = benzene(cyclohexane); // overloaded function
    // Expected: benzene (ring 1) attached to cyclohexane (ring 2)
    assert.strictEqual(attached.smiles, 'c1ccccc1(C2CCCCC2)');
    assert.ok(await isValidSMILES(attached.smiles));
  });

  test('avoids ring numbers when attached via fusing', async () => {
    const napthalenePart1 = Ring({
      type: 'c',
      size: 6,
    });
    const napthalenePart2 = Ring({
      type: 'c',
      size: 6,
      offset: 3,
    });

    // Picks up offset automatically
    const newCompound = napthalenePart1.fuse(napthalenePart2);

    // Expected: benzene (ring 1) attached to cyclohexane (ring 2)
    assert.strictEqual(newCompound.smiles, 'c1ccc2ccccc2c1');
    assert.ok(await isValidSMILES(newCompound.smiles));
  });

  test('tracks used ring numbers in meta for connected fragments', async () => {
    const benzene = Ring({ type: 'c', size: 6 });
    const naphthalene = benzene.fuse(Ring({ type: 'c', size: 6, offset: 3 }));

    // Naphthalene uses rings 1 and 2, should track this in meta
    assert.ok(naphthalene.meta.usedRingNumbers);
    assert.deepStrictEqual(naphthalene.meta.usedRingNumbers, [1, 2]);
  });
});

describe('fuse method', () => {
  test('fuses two benzene rings to create naphthalene', async () => {
    const benzene1 = Ring({ type: 'c', size: 6 });
    const benzene2 = Ring({ type: 'c', size: 6, offset: 3 });

    const naphthalene = benzene1.fuse(benzene2);

    assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
    assert.ok(await isValidSMILES(naphthalene.smiles));
  });

  test('throws error when trying to fuse with non-Ring', () => {
    const regularFragment = Fragment('C');
    const benzene = Ring({ type: 'c', size: 6 });

    assert.throws(
      () => benzene.fuse(regularFragment),
      /Can only fuse with another FusedRing instance/,
    );
  });

  test('accepts Ring as second parameter', async () => {
    const benzene1 = Ring({ type: 'c', size: 6 });
    const benzene2 = Ring({ type: 'c', size: 6, offset: 3 });

    const naphthalene = benzene1.fuse(benzene2);

    assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
    assert.ok(await isValidSMILES(naphthalene.smiles));
  });

  test('combines ring descriptors from both fragments', () => {
    const ring1 = Ring({ type: 'c', size: 6 });
    const ring2 = Ring({ type: 'c', size: 5, offset: 3 });

    const fused = ring1.fuse(ring2);

    assert.strictEqual(fused.meta.rings.length, 2);
    assert.deepStrictEqual(fused.meta.rings[0], {
      type: 'c', size: 6, offset: 0, ringNumber: 1, substitutions: {}, attachments: {},
    });
    assert.deepStrictEqual(fused.meta.rings[1], {
      type: 'c', size: 5, offset: 3, ringNumber: 2, substitutions: {}, attachments: {},
    });
  });
});
