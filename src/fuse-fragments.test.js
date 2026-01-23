import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from './index.js';
import { fuseFragmentsAtEdge } from './fuse-fragments.js';

test('fuseFragmentsAtEdge - fuse benzene to benzene at positions [0,1] to make naphthalene', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');

  const naphthalene = await fuseFragmentsAtEdge(benzene1, [0, 1], benzene2, Fragment);

  assert.strictEqual(naphthalene.atoms, 10);
  assert.strictEqual(naphthalene.rings, 2);
  assert.strictEqual(naphthalene.formula, 'C10H8');
  assert.deepStrictEqual(naphthalene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        { impHs: 1 },
      ],
      bonds: [
        { bo: 2, atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [5, 6] },
        { bo: 2, atoms: [6, 7] },
        { atoms: [7, 8] },
        { bo: 2, atoms: [8, 9] },
        { atoms: [9, 0] },
        { atoms: [8, 3] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        aromaticBonds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        cipRanks: [0, 0, 1, 2, 1, 0, 0, 1, 2, 1],
        atomRings: [[0, 9, 8, 3, 2, 1], [4, 5, 6, 7, 8, 3]],
      }],
    }],
  });
});

test('fuseFragmentsAtEdge - fuse benzene to benzene at edge [1,2] to make naphthalene variant', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');

  const naphthalene = await fuseFragmentsAtEdge(benzene1, [1, 2], benzene2, Fragment);

  assert.strictEqual(naphthalene.atoms, 10);
  assert.strictEqual(naphthalene.rings, 2);
  assert.strictEqual(naphthalene.formula, 'C10H8');
  assert.deepStrictEqual(naphthalene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        { impHs: 1 },
      ],
      bonds: [
        { bo: 2, atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [5, 6] },
        { bo: 2, atoms: [6, 7] },
        { atoms: [7, 8] },
        { bo: 2, atoms: [8, 9] },
        { atoms: [9, 0] },
        { atoms: [8, 3] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        aromaticBonds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        cipRanks: [0, 0, 1, 2, 1, 0, 0, 1, 2, 1],
        atomRings: [[0, 9, 8, 3, 2, 1], [4, 5, 6, 7, 8, 3]],
      }],
    }],
  });
});

test('fuseFragmentsAtEdge - fuse three benzenes to make anthracene', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');
  const benzene3 = await Fragment('c1ccccc1');

  const naphthalene = await fuseFragmentsAtEdge(benzene1, [0, 1], benzene2, Fragment);
  const anthracene = await fuseFragmentsAtEdge(naphthalene, [6, 7], benzene3, Fragment);

  assert.strictEqual(anthracene.atoms, 14);
  assert.strictEqual(anthracene.rings, 3);
  assert.strictEqual(anthracene.formula, 'C14H10');
  assert.deepStrictEqual(anthracene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
      ],
      bonds: [
        { bo: 2, atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [4, 6] },
        { bo: 2, atoms: [6, 7] },
        { atoms: [7, 8] },
        { bo: 2, atoms: [8, 9] },
        { atoms: [9, 10] },
        { bo: 2, atoms: [10, 11] },
        { atoms: [11, 12] },
        { bo: 2, atoms: [12, 13] },
        { atoms: [5, 0] },
        { atoms: [13, 8] },
        { atoms: [13, 3] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        aromaticBonds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        cipRanks: [0, 1, 4, 6, 5, 2, 3, 3, 5, 2, 0, 1, 4, 6],
        atomRings: [[0, 5, 4, 3, 2, 1], [6, 7, 8, 13, 3, 4], [9, 10, 11, 12, 13, 8]],
      }],
    }],
  });
});
