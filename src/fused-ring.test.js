import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import { FusedRing } from './fused-ring.js';
import { Fragment } from './fragment.js';
import { isValidSMILES } from './test-utils.js';

describe('FusedRing', () => {
  test('creates benzene', async () => {
    const parameters = {
      type: 'ring',
      atoms: 'c',
      size: 6,
    };
    const benzene = FusedRing([parameters]);
    assert.strictEqual(benzene.smiles, 'c1ccccc1');
    assert.deepStrictEqual(benzene.meta.toObject(), [{
      ...parameters,
      ringNumber: 1,
    }]);
    assert.ok(await isValidSMILES(benzene.smiles));
  });

  test('creates 1,3,5-triazine', async () => {
    const parameters = {
      type: 'ring',
      atoms: 'c',
      size: 6,
      substitutions: {
        2: 'n',
        4: 'n',
        6: 'n',
      },
    };
    const triazine = FusedRing([parameters]);
    assert.strictEqual(triazine.smiles, 'c1ncncn1');
    assert.deepStrictEqual(triazine.meta.toObject(), [{
      ...parameters,
      ringNumber: 1,
    }]);
    assert.ok(await isValidSMILES(triazine.smiles));
  });

  test('creates benzene with chlorine attachment', async () => {
    const parameters = {
      type: 'ring',
      atoms: 'c',
      size: 6,
      attachments: {
        3: 'Cl',
      },
    };
    const benzeneWithCl = FusedRing([parameters]);
    assert.strictEqual(benzeneWithCl.smiles, 'c1cc(Cl)ccc1');
    assert.deepStrictEqual(benzeneWithCl.meta.toObject(), [{
      ...parameters,
      ringNumber: 1,
      attachments: {
        3: [
          {
            type: 'linear',
            atoms: 'Cl',
          },
        ],
      },
    }]);
    assert.ok(await isValidSMILES(benzeneWithCl.smiles));
  });

  test('creates napthalene', async () => {
    const parameters = [
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
      },
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
        offset: 3,
      },
    ];
    const napthalene = FusedRing(parameters);
    assert.strictEqual(napthalene.smiles, 'c1ccc2ccccc2c1');
    assert.deepStrictEqual(napthalene.meta.toObject(), [
      {
        ...parameters[0],
        ringNumber: 1,
      },
      {
        ...parameters[1],
        ringNumber: 2,
      },
    ]);
    assert.ok(await isValidSMILES(napthalene.smiles));
  });

  test('throws error for empty array', () => {
    assert.throws(
      () => FusedRing([]),
      /FusedRing requires at least one ring/,
    );
  });
});

describe('buildRing method', () => {
  test('creates benzene atoms', () => {
    const atoms = FusedRing.buildRing({ type: 'c', size: 6 }, 1);
    assert.deepStrictEqual(atoms, ['c1', 'c', 'c', 'c', 'c', 'c1']);
  });

  test('creates ring with substitutions', () => {
    const atoms = FusedRing.buildRing(
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
    const atoms = FusedRing.buildRing({ type: 'c', size: 5 }, 3);
    assert.deepStrictEqual(atoms, ['c3', 'c', 'c', 'c', 'c3']);
  });
});

describe('FusedRing with ring counter on connection', () => {
  test('independent FusedRing always starts at ring 1', async () => {
    const parameters = { type: 'ring', atoms: 'c', size: 6 };
    const benzene1 = FusedRing([parameters]);
    const benzene2 = FusedRing([parameters]);
    // Both independent, both use ring number 1
    assert.strictEqual(benzene1.smiles, 'c1ccccc1');
    assert.deepStrictEqual(benzene1.meta.toObject(), [{
      ...parameters,
      ringNumber: 1,
    }]);
    assert.strictEqual(benzene2.smiles, 'c1ccccc1');
    assert.deepStrictEqual(benzene2.meta.toObject(), [{
      ...parameters,
      ringNumber: 1,
    }]);
    assert.ok(await isValidSMILES(benzene1.smiles));
    assert.ok(await isValidSMILES(benzene2.smiles));
  });

  test('avoids ring numbers when attached via branching on create', async () => {
    // This test will work once Fragment.attach() respects ring numbers
    const cyclohexane = FusedRing([
      { type: 'C', size: 6 },
    ]);
    const parameters = [
      {
        type: 'c',
        size: 6,
        attachments: {
          3: cyclohexane,
        },
      },
      {
        type: 'c',
        size: 6,
        offset: 3,
      },
    ];
    const newCompound = FusedRing(parameters);
    // Expected: benzene (ring 1) with cyclohexane (ring 2), then naphthalene ring 2 becomes ring 3
    assert.strictEqual(newCompound.smiles, 'c1cc(C2CCCCC2)c3ccccc3c1');
    assert.deepStrictEqual(newCompound.meta.toObject(), [
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
        ringNumber: 1,
        attachments: {
          3: [
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
            },
          ],
        },
      },
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
        offset: 3,
        ringNumber: 3,
      },
    ]);
    assert.ok(await isValidSMILES(newCompound.smiles));
  });

  test('avoids ring numbers when attached via branching later addition', async () => {
    // This test will work once Fragment.attach() respects ring numbers
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
    const cyclohexane = FusedRing([
      { type: 'C', size: 6 },
    ]);
    const newCompound = napthalene.getRing(1).attachAt(3, cyclohexane);
    assert.strictEqual(newCompound.smiles, 'c1cc(C2CCCCC2)c3ccccc3c1');
    assert.deepStrictEqual(newCompound.meta.toObject(), [
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
        ringNumber: 1,
        attachments: {
          3: [
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
            },
          ],
        },
      },
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
        offset: 3,
        ringNumber: 3,
      },
    ]);
    assert.ok(await isValidSMILES(newCompound.smiles));
  });

  test('avoids ring numbers when attached via branching', async () => {
    // This test will work once Fragment.attach() respects ring numbers
    const benzene = FusedRing([
      { type: 'c', size: 6 },
    ]);
    const cyclohexane = FusedRing([
      { type: 'C', size: 6 },
    ]);

    // When attached, the second fragment should use ring number 2
    const attached = benzene(cyclohexane); // overloaded function
    // Expected: benzene (ring 1) attached to cyclohexane (ring 2)
    assert.strictEqual(attached.smiles, 'c1ccccc1(C2CCCCC2)');
    assert.deepStrictEqual(attached.meta.toObject(), [{
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        6: [
          {
            type: 'ring',
            atoms: 'C',
            size: 6,
            ringNumber: 2,
          },
        ],
      },
    }]);
    assert.ok(await isValidSMILES(attached.smiles));
  });

  test('avoids ring numbers when attached via fusing', async () => {
    // This test will work once Fragment.attach() respects ring numbers
    const parameters1 = {
      type: 'ring',
      atoms: 'c',
      size: 6,
    };
    const parameters2 = {
      type: 'ring',
      atoms: 'c',
      size: 6,
      offset: 3,
    };
    const napthalenePart1 = FusedRing([parameters1]);
    const napthalenePart2 = FusedRing([parameters2]);

    // Picks up offset automatically
    const newCompound = napthalenePart1.fuse(napthalenePart2);

    // Expected: benzene (ring 1) attached to cyclohexane (ring 2)
    assert.strictEqual(newCompound.smiles, 'c1ccc2ccccc2c1');
    assert.deepStrictEqual(newCompound.meta.toObject(), [
      {
        ...parameters1,
        ringNumber: 1,
      },
      {
        ...parameters2,
        ringNumber: 2,
      },
    ]);
    assert.ok(await isValidSMILES(newCompound.smiles));
  });

  test('tracks used ring numbers in meta for connected fragments', async () => {
    const parameters = [
      { type: 'ring', atoms: 'c', size: 6 },
      {
        type: 'ring', atoms: 'c', size: 6, offset: 3,
      },
    ];
    const naphthalene = FusedRing(parameters);

    // Naphthalene uses rings 1 and 2
    assert.deepStrictEqual(naphthalene.meta.toObject(), [
      {
        ...parameters[0],
        ringNumber: 1,
      },
      {
        ...parameters[1],
        ringNumber: 2,
      },
    ]);
  });
});

describe('fuse method', () => {
  test('fuses two benzene rings to create naphthalene', async () => {
    const parameters1 = { type: 'ring', atoms: 'c', size: 6 };
    const parameters2 = {
      type: 'ring', atoms: 'c', size: 6, offset: 3,
    };
    const benzene1 = FusedRing([parameters1]);
    const benzene2 = FusedRing([parameters2]);

    const naphthalene = benzene1.fuse(benzene2);

    assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
    assert.deepStrictEqual(naphthalene.meta.toObject(), [
      {
        ...parameters1,
        ringNumber: 1,
      },
      {
        ...parameters2,
        ringNumber: 2,
      },
    ]);
    assert.ok(await isValidSMILES(naphthalene.smiles));
  });

  test('throws error when trying to fuse with non-FusedRing', () => {
    const regularFragment = Fragment('C');
    const benzene = FusedRing([
      { type: 'c', size: 6 },
    ]);

    assert.throws(
      () => benzene.fuse(regularFragment),
      /Can only fuse with another FusedRing instance/,
    );
  });

  test('accepts FusedRing as second parameter', async () => {
    const parameters1 = { type: 'ring', atoms: 'c', size: 6 };
    const parameters2 = {
      type: 'ring', atoms: 'c', size: 6, offset: 3,
    };
    const benzene1 = FusedRing([parameters1]);
    const benzene2 = FusedRing([parameters2]);

    const naphthalene = benzene1.fuse(benzene2);

    assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
    assert.deepStrictEqual(naphthalene.meta.toObject(), [
      {
        ...parameters1,
        ringNumber: 1,
      },
      {
        ...parameters2,
        ringNumber: 2,
      },
    ]);
    assert.ok(await isValidSMILES(naphthalene.smiles));
  });

  test('combines ring descriptors from both fragments', () => {
    const parameters1 = { type: 'ring', atoms: 'c', size: 6 };
    const parameters2 = {
      type: 'ring', atoms: 'c', size: 5, offset: 3,
    };
    const ring1 = FusedRing([parameters1]);
    const ring2 = FusedRing([parameters2]);

    const fused = ring1.fuse(ring2);

    assert.deepStrictEqual(fused.meta.toObject(), [
      {
        ...parameters1,
        ringNumber: 1,
      },
      {
        ...parameters2,
        ringNumber: 2,
      },
    ]);
  });
});
