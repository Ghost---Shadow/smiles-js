import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from '../src/index.js';

test('Fragment - benzene', async () => {
  const benzene = await Fragment('c1ccccc1');

  assert.strictEqual(benzene.smiles, 'c1ccccc1');
  assert.strictEqual(benzene.originalSmiles, 'c1ccccc1');
  assert.strictEqual(benzene.atoms, 6);
  assert.strictEqual(benzene.rings, 1);
  assert.strictEqual(benzene.formula, 'C6H6');
  assert.strictEqual(benzene.molecularWeight, 78.11);

  // Assert the complete meta object
  assert.deepStrictEqual(benzene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6,
        impHs: 0,
        chg: 0,
        nRad: 0,
        isotope: 0,
        stereo: 'unspecified',
      },
      bond: {
        bo: 1,
        stereo: 'unspecified',
      },
    },
    molecules: [
      {
        atoms: [
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
        ],
        bonds: [
          { bo: 2, atoms: [0, 1] },
          { atoms: [1, 2] },
          { bo: 2, atoms: [2, 3] },
          { atoms: [3, 4] },
          { bo: 2, atoms: [4, 5] },
          { atoms: [5, 0] },
        ],
        extensions: [
          {
            name: 'rdkitRepresentation',
            formatVersion: 2,
            toolkitVersion: '2025.03.4',
            aromaticAtoms: [0, 1, 2, 3, 4, 5],
            aromaticBonds: [0, 1, 2, 3, 4, 5],
            cipRanks: [0, 0, 0, 0, 0, 0],
            atomRings: [[0, 5, 4, 3, 2, 1]],
          },
        ],
      },
    ],
  });
});

test('Fragment - toluene', async () => {
  const toluene = await Fragment('Cc1ccccc1');

  assert.strictEqual(toluene.atoms, 7);
  assert.strictEqual(toluene.rings, 1);
  assert.strictEqual(toluene.formula, 'C7H8');

  // Assert the complete meta object
  assert.deepStrictEqual(toluene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6,
        impHs: 0,
        chg: 0,
        nRad: 0,
        isotope: 0,
        stereo: 'unspecified',
      },
      bond: {
        bo: 1,
        stereo: 'unspecified',
      },
    },
    molecules: [
      {
        atoms: [
          { impHs: 3 },
          {},
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
        ],
        bonds: [
          { atoms: [0, 1] },
          { bo: 2, atoms: [1, 2] },
          { atoms: [2, 3] },
          { bo: 2, atoms: [3, 4] },
          { atoms: [4, 5] },
          { bo: 2, atoms: [5, 6] },
          { atoms: [6, 1] },
        ],
        extensions: [
          {
            name: 'rdkitRepresentation',
            formatVersion: 2,
            toolkitVersion: '2025.03.4',
            aromaticAtoms: [1, 2, 3, 4, 5, 6],
            aromaticBonds: [1, 2, 3, 4, 5, 6],
            cipRanks: [0, 4, 3, 2, 1, 2, 3],
            atomRings: [[1, 6, 5, 4, 3, 2]],
          },
        ],
      },
    ],
  });
});

test('Fragment - ethanol', async () => {
  const ethanol = await Fragment('CCO');

  assert.strictEqual(ethanol.atoms, 3);
  assert.strictEqual(ethanol.rings, 0);
  assert.strictEqual(ethanol.formula, 'C2H6O');

  // Assert the complete meta object
  assert.deepStrictEqual(ethanol.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6,
        impHs: 0,
        chg: 0,
        nRad: 0,
        isotope: 0,
        stereo: 'unspecified',
      },
      bond: {
        bo: 1,
        stereo: 'unspecified',
      },
    },
    molecules: [
      {
        atoms: [
          { impHs: 3 },
          { impHs: 2 },
          { z: 8, impHs: 1 },
        ],
        bonds: [
          { atoms: [0, 1] },
          { atoms: [1, 2] },
        ],
        extensions: [
          {
            name: 'rdkitRepresentation',
            formatVersion: 2,
            toolkitVersion: '2025.03.4',
            cipRanks: [0, 1, 2],
          },
        ],
      },
    ],
  });
});

test('Fragment - invalid SMILES', async () => {
  await assert.rejects(
    async () => Fragment('c1ccc'),
    /Invalid SMILES/,
  );
});

test('Fragment.validate - valid SMILES', async () => {
  const result = await Fragment.validate('c1ccccc1');
  assert.strictEqual(result.valid, true);
});

test('Fragment.validate - invalid SMILES', async () => {
  const result = await Fragment.validate('c1ccc');
  assert.strictEqual(result.valid, false);
  assert.ok(result.error);
});

test('Fragment.toString', async () => {
  const benzene = await Fragment('c1ccccc1');
  assert.strictEqual(benzene.toString(), 'c1ccccc1');
  assert.strictEqual(String(benzene), 'c1ccccc1');
});

test('Fragment - meta contains complete RDKit JSON', async () => {
  const mol = await Fragment('c1ccccc1');

  // Assert the complete meta object
  assert.deepStrictEqual(mol.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6,
        impHs: 0,
        chg: 0,
        nRad: 0,
        isotope: 0,
        stereo: 'unspecified',
      },
      bond: {
        bo: 1,
        stereo: 'unspecified',
      },
    },
    molecules: [
      {
        atoms: [
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
          { impHs: 1 },
        ],
        bonds: [
          { bo: 2, atoms: [0, 1] },
          { atoms: [1, 2] },
          { bo: 2, atoms: [2, 3] },
          { atoms: [3, 4] },
          { bo: 2, atoms: [4, 5] },
          { atoms: [5, 0] },
        ],
        extensions: [
          {
            name: 'rdkitRepresentation',
            formatVersion: 2,
            toolkitVersion: '2025.03.4',
            aromaticAtoms: [0, 1, 2, 3, 4, 5],
            aromaticBonds: [0, 1, 2, 3, 4, 5],
            cipRanks: [0, 0, 0, 0, 0, 0],
            atomRings: [[0, 5, 4, 3, 2, 1]],
          },
        ],
      },
    ],
  });
});
