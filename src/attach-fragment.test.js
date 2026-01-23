import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from './index.js';
import { attachFragmentAt } from './attach-fragment.js';

test('attachFragmentAt - attach CH3 to benzene at position 0 to make toluene', async () => {
  const benzene = await Fragment('c1ccccc1');
  const methyl = await Fragment('C');

  const benzeneMeta = benzene.meta;
  const methylMeta = methyl.meta;

  const toluene = await attachFragmentAt(benzene, 0, methyl, { FragmentConstructor: Fragment });

  // Assert before meta
  assert.deepStrictEqual(benzeneMeta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [{ impHs: 1 }, { impHs: 1 }, { impHs: 1 }, { impHs: 1 }, { impHs: 1 }, { impHs: 1 }],
      bonds: [
        { bo: 2, atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [5, 0] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [0, 1, 2, 3, 4, 5],
        aromaticBonds: [0, 1, 2, 3, 4, 5],
        cipRanks: [0, 0, 0, 0, 0, 0],
        atomRings: [[0, 5, 4, 3, 2, 1]],
      }],
    }],
  });

  assert.deepStrictEqual(methylMeta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [{ impHs: 3 }],
      bonds: [],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        cipRanks: [0],
      }],
    }],
  });

  // Assert after meta - toluene structure
  assert.strictEqual(toluene.smiles, 'Cc1ccccc1');
  assert.strictEqual(toluene.meta.molecules[0].atoms.length, 7);
  assert.strictEqual(toluene.meta.molecules[0].bonds.length, 7);
  assert.strictEqual(toluene.meta.molecules[0].atoms[0].impHs, 3); // CH3
  assert.strictEqual(toluene.meta.molecules[0].extensions[0].aromaticAtoms.length, 6);
  assert.strictEqual(toluene.meta.molecules[0].extensions[0].atomRings.length, 1);
});

test('attachFragmentAt - attach benzene to benzene at position 0 to make biphenyl', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');

  const benzene1Meta = benzene1.meta;

  const biphenyl = await attachFragmentAt(benzene1, 0, benzene2, { FragmentConstructor: Fragment });

  // Assert benzene meta before
  assert.deepStrictEqual(benzene1Meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [{ impHs: 1 }, { impHs: 1 }, { impHs: 1 }, { impHs: 1 }, { impHs: 1 }, { impHs: 1 }],
      bonds: [
        { bo: 2, atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [5, 0] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [0, 1, 2, 3, 4, 5],
        aromaticBonds: [0, 1, 2, 3, 4, 5],
        cipRanks: [0, 0, 0, 0, 0, 0],
        atomRings: [[0, 5, 4, 3, 2, 1]],
      }],
    }],
  });

  // Assert biphenyl structure after
  assert.strictEqual(biphenyl.atoms, 12);
  assert.strictEqual(biphenyl.rings, 2);
  assert.strictEqual(biphenyl.formula, 'C12H10');
  assert.ok(biphenyl.meta.molecules[0].atoms.length === 12);
  assert.ok(biphenyl.meta.molecules[0].bonds.length === 13);
});

test('attachFragmentAt - attach CH3 to benzene at position 1', async () => {
  const benzene = await Fragment('c1ccccc1');
  const methyl = await Fragment('C');

  const toluene = await attachFragmentAt(benzene, 1, methyl, { FragmentConstructor: Fragment });

  assert.strictEqual(toluene.atoms, 7);
  assert.strictEqual(toluene.rings, 1);
  assert.strictEqual(toluene.formula, 'C7H8');
  assert.deepStrictEqual(toluene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
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
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [1, 2, 3, 4, 5, 6],
        aromaticBonds: [1, 2, 3, 4, 5, 6],
        cipRanks: [0, 4, 3, 2, 1, 2, 3],
        atomRings: [[1, 6, 5, 4, 3, 2]],
      }],
    }],
  });
});

test('attachFragmentAt - attach two CH3 groups to benzene at positions 0 and 3 to make xylene', async () => {
  const benzene = await Fragment('c1ccccc1');
  const methyl1 = await Fragment('C');
  const methyl2 = await Fragment('C');

  const withFirstMethyl = await attachFragmentAt(benzene, 0, methyl1, {
    FragmentConstructor: Fragment,
  });

  const xylene = await attachFragmentAt(withFirstMethyl, 3, methyl2, {
    FragmentConstructor: Fragment,
  });

  assert.strictEqual(xylene.atoms, 8);
  assert.strictEqual(xylene.rings, 1);
  assert.strictEqual(xylene.formula, 'C8H10');
  assert.deepStrictEqual(xylene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 3 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        {},
        { impHs: 3 },
        { impHs: 1 },
      ],
      bonds: [
        { atoms: [0, 1] },
        { bo: 2, atoms: [1, 2] },
        { atoms: [2, 3] },
        { bo: 2, atoms: [3, 4] },
        { atoms: [4, 5] },
        { atoms: [5, 6] },
        { bo: 2, atoms: [5, 7] },
        { atoms: [7, 1] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [1, 2, 3, 4, 5, 7],
        aromaticBonds: [1, 2, 3, 4, 6, 7],
        cipRanks: [0, 4, 2, 1, 2, 4, 0, 3],
        atomRings: [[1, 7, 5, 4, 3, 2]],
      }],
    }],
  });
});

test('attachFragmentAt - attach OH to benzene at position 0 to make phenol', async () => {
  const benzene = await Fragment('c1ccccc1');
  const hydroxyl = await Fragment('O');

  const phenol = await attachFragmentAt(benzene, 0, hydroxyl, { FragmentConstructor: Fragment });

  assert.strictEqual(phenol.atoms, 7);
  assert.strictEqual(phenol.rings, 1);
  assert.strictEqual(phenol.formula, 'C6H6O');
  assert.deepStrictEqual(phenol.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { z: 8, impHs: 1 },
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
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [1, 2, 3, 4, 5, 6],
        aromaticBonds: [1, 2, 3, 4, 5, 6],
        cipRanks: [4, 3, 2, 1, 0, 1, 2],
        atomRings: [[1, 6, 5, 4, 3, 2]],
      }],
    }],
  });
});

test('attachFragmentAt - attach NH2 to benzene at position 0 to make aniline', async () => {
  const benzene = await Fragment('c1ccccc1');
  const amino = await Fragment('N');

  const aniline = await attachFragmentAt(benzene, 0, amino, { FragmentConstructor: Fragment });

  assert.strictEqual(aniline.atoms, 7);
  assert.strictEqual(aniline.rings, 1);
  assert.strictEqual(aniline.formula, 'C6H7N');
  assert.deepStrictEqual(aniline.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { z: 7, impHs: 2 },
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
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [1, 2, 3, 4, 5, 6],
        aromaticBonds: [1, 2, 3, 4, 5, 6],
        cipRanks: [4, 3, 2, 1, 0, 1, 2],
        atomRings: [[1, 6, 5, 4, 3, 2]],
      }],
    }],
  });
});

test('attachFragmentAt - attach ethyl (CC) to benzene at position 0 to make ethylbenzene', async () => {
  const benzene = await Fragment('c1ccccc1');
  const ethyl = await Fragment('CC');

  const ethylbenzene = await attachFragmentAt(benzene, 0, ethyl, { FragmentConstructor: Fragment });

  assert.strictEqual(ethylbenzene.atoms, 8);
  assert.strictEqual(ethylbenzene.rings, 1);
  assert.strictEqual(ethylbenzene.formula, 'C8H10');
  assert.deepStrictEqual(ethylbenzene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 3 },
        { impHs: 2 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
      ],
      bonds: [
        { atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [5, 6] },
        { bo: 2, atoms: [6, 7] },
        { atoms: [7, 2] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [2, 3, 4, 5, 6, 7],
        aromaticBonds: [2, 3, 4, 5, 6, 7],
        cipRanks: [0, 1, 5, 4, 3, 2, 3, 4],
        atomRings: [[2, 7, 6, 5, 4, 3]],
      }],
    }],
  });
});

test('attachFragmentAt - attach propyl (CCC) to benzene to make propylbenzene', async () => {
  const benzene = await Fragment('c1ccccc1');
  const propyl = await Fragment('CCC');

  const propylbenzene = await attachFragmentAt(benzene, 0, propyl, {
    FragmentConstructor: Fragment,
  });

  assert.strictEqual(propylbenzene.atoms, 9);
  assert.strictEqual(propylbenzene.rings, 1);
  assert.strictEqual(propylbenzene.formula, 'C9H12');
  assert.deepStrictEqual(propylbenzene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 3 },
        { impHs: 2 },
        { impHs: 2 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
      ],
      bonds: [
        { atoms: [0, 1] },
        { atoms: [1, 2] },
        { atoms: [2, 3] },
        { bo: 2, atoms: [3, 4] },
        { atoms: [4, 5] },
        { bo: 2, atoms: [5, 6] },
        { atoms: [6, 7] },
        { bo: 2, atoms: [7, 8] },
        { atoms: [8, 3] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [3, 4, 5, 6, 7, 8],
        aromaticBonds: [3, 4, 5, 6, 7, 8],
        cipRanks: [0, 1, 2, 6, 5, 4, 3, 4, 5],
        atomRings: [[3, 8, 7, 6, 5, 4]],
      }],
    }],
  });
});

test('attachFragmentAt - invalid position throws error', async () => {
  const benzene = await Fragment('c1ccccc1');
  const methyl = await Fragment('C');

  await assert.rejects(
    async () => attachFragmentAt(benzene, 10, methyl, { FragmentConstructor: Fragment }),
    /Invalid position/,
  );
});

test('attachFragmentAt - negative position throws error', async () => {
  const benzene = await Fragment('c1ccccc1');
  const methyl = await Fragment('C');

  await assert.rejects(
    async () => attachFragmentAt(benzene, -1, methyl, { FragmentConstructor: Fragment }),
    /Invalid position/,
  );
});

test('attachFragmentAt - attach at position 0 with attachment position specified', async () => {
  const benzene = await Fragment('c1ccccc1');
  const ethyl = await Fragment('CC');

  const ethylbenzene = await attachFragmentAt(benzene, 0, ethyl, {
    attachmentPosition: 1,
    FragmentConstructor: Fragment,
  });

  assert.strictEqual(ethylbenzene.atoms, 8);
  assert.strictEqual(ethylbenzene.formula, 'C8H10');
  assert.deepStrictEqual(ethylbenzene.meta, {
    rdkitjson: { version: 12 },
    defaults: {
      atom: {
        z: 6, impHs: 0, chg: 0, nRad: 0, isotope: 0, stereo: 'unspecified',
      },
      bond: { bo: 1, stereo: 'unspecified' },
    },
    molecules: [{
      atoms: [
        { impHs: 3 },
        { impHs: 2 },
        {},
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
        { impHs: 1 },
      ],
      bonds: [
        { atoms: [0, 1] },
        { atoms: [1, 2] },
        { bo: 2, atoms: [2, 3] },
        { atoms: [3, 4] },
        { bo: 2, atoms: [4, 5] },
        { atoms: [5, 6] },
        { bo: 2, atoms: [6, 7] },
        { atoms: [7, 2] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        aromaticAtoms: [2, 3, 4, 5, 6, 7],
        aromaticBonds: [2, 3, 4, 5, 6, 7],
        cipRanks: [0, 1, 5, 4, 3, 2, 3, 4],
        atomRings: [[2, 7, 6, 5, 4, 3]],
      }],
    }],
  });
});
