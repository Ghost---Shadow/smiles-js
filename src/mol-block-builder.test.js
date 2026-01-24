import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from './index.js';
import { buildMolBlockFromMeta } from './mol-block-builder.js';
import { fuseFragmentsAtEdge } from './fuse-fragments.js';
import initRDKitModule from '@rdkit/rdkit';

test('buildMolBlockFromMeta - converts benzene meta to valid MOL block', async () => {
  const benzene = await Fragment('c1ccccc1');
  const molBlock = buildMolBlockFromMeta(benzene.meta);

  assert.deepStrictEqual(benzene.meta, {
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

  assert.strictEqual(molBlock, `
  Generated from RDKit JSON

  6  6  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
M  END`);

  // Should be parseable by RDKit
  const rdkit = await initRDKitModule();
  const mol = rdkit.get_mol(molBlock);
  assert.ok(mol.is_valid(), 'Generated MOL block should be valid');

  const smiles = mol.get_smiles();
  assert.strictEqual(smiles, 'c1ccccc1', 'Should parse back to same SMILES');

  mol.delete();
});

test('buildMolBlockFromMeta - converts toluene meta to valid MOL block', async () => {
  const toluene = await Fragment('Cc1ccccc1');
  const molBlock = buildMolBlockFromMeta(toluene.meta);

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

  assert.strictEqual(molBlock, `
  Generated from RDKit JSON

  7  7  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    9.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
  2  3  2  0
  3  4  1  0
  4  5  2  0
  5  6  1  0
  6  7  2  0
  7  2  1  0
M  END`);

  const rdkit = await initRDKitModule();
  const mol = rdkit.get_mol(molBlock);
  assert.ok(mol.is_valid(), 'Generated MOL block should be valid');

  const smiles = mol.get_smiles();
  assert.strictEqual(smiles, 'Cc1ccccc1', 'Should parse back to same SMILES');

  mol.delete();
});

test('buildMolBlockFromMeta - converts methanol meta to valid MOL block', async () => {
  const methanol = await Fragment('CO');
  const molBlock = buildMolBlockFromMeta(methanol.meta);

  assert.deepStrictEqual(methanol.meta, {
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
        { z: 8, impHs: 1 },
      ],
      bonds: [
        { atoms: [0, 1] },
      ],
      extensions: [{
        name: 'rdkitRepresentation',
        formatVersion: 2,
        toolkitVersion: '2025.03.4',
        cipRanks: [0, 1],
      }],
    }],
  });

  assert.strictEqual(molBlock, `
  Generated from RDKit JSON

  2  1  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0
M  END`);

  const rdkit = await initRDKitModule();
  const mol = rdkit.get_mol(molBlock);
  assert.ok(mol.is_valid(), 'Generated MOL block should be valid');

  const smiles = mol.get_smiles();
  assert.strictEqual(smiles, 'CO', 'Should parse back to same SMILES');

  mol.delete();
});

test('buildMolBlockFromMeta - handles correct atom and bond counts', async () => {
  const benzene = await Fragment('c1ccccc1');
  const molBlock = buildMolBlockFromMeta(benzene.meta);

  assert.deepStrictEqual(benzene.meta, {
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

  assert.strictEqual(molBlock, `
  Generated from RDKit JSON

  6  6  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
M  END`);

  // Extract counts line (4th line)
  const lines = molBlock.split('\n');
  const countsLine = lines[3];

  // First 3 digits are atom count, next 3 are bond count
  const atomCount = parseInt(countsLine.substring(0, 3).trim(), 10);
  const bondCount = parseInt(countsLine.substring(3, 6).trim(), 10);

  assert.strictEqual(atomCount, 6, 'Benzene should have 6 atoms');
  assert.strictEqual(bondCount, 6, 'Benzene should have 6 bonds');
});

test('buildMolBlockFromMeta - converts naphthalene meta to valid MOL block', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');
  const naphthalene = await fuseFragmentsAtEdge(benzene1, [0, 1], benzene2, Fragment);
  const molBlock = buildMolBlockFromMeta(naphthalene.meta);

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

  assert.strictEqual(molBlock, `
  Generated from RDKit JSON

 10 11  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    9.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   10.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   12.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   13.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  7  1  0
  7  8  2  0
  8  9  1  0
  9 10  2  0
 10  1  1  0
  9  4  1  0
M  END`);

  const rdkit = await initRDKitModule();
  const mol = rdkit.get_mol(molBlock);
  assert.ok(mol.is_valid(), 'Generated MOL block should be valid');

  const smiles = mol.get_smiles();
  assert.strictEqual(smiles, 'c1ccc2ccccc2c1', 'Should parse back to naphthalene SMILES');

  mol.delete();
});

test('buildMolBlockFromMeta - dummy coordinates are preserved by RDKit', async () => {
  const benzene = await Fragment('c1ccccc1');
  const molBlockWithDummyCoords = buildMolBlockFromMeta(benzene.meta);

  // Parse our MOL block with dummy coordinates
  const rdkit = await initRDKitModule();
  const mol = rdkit.get_mol(molBlockWithDummyCoords);

  // RDKit preserves the coordinates from the MOL block
  assert.ok(mol.has_coords(), 'RDKit should recognize molecule has coordinates');

  // Get RDKit's MOL block - should preserve our dummy coordinates
  const molBlockFromRDKit = mol.get_molblock();

  // Assert the complete MOL block string with dummy coordinates
  assert.strictEqual(molBlockFromRDKit, `
     RDKit          2D

  6  6  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0
  2  3  1  0
  3  4  2  0
  4  5  1  0
  5  6  2  0
  6  1  1  0
M  END
`);

  // Parse the coordinates from RDKit's MOL block
  const lines = molBlockFromRDKit.split('\n');
  const atomLines = lines.slice(4, 10); // Lines 4-9 are the 6 benzene atoms

  // Extract x,y coordinates for each atom
  const coords = atomLines.map((line) => ({
    x: parseFloat(line.substring(0, 10).trim()),
    y: parseFloat(line.substring(10, 20).trim()),
  }));

  // Verify our dummy coordinates are preserved (all y=0, x increases linearly)
  const allYZero = coords.every((coord) => coord.y === 0);
  assert.strictEqual(allYZero, true, 'Dummy coordinates should be preserved (all y=0)');

  // Verify linear spacing on x-axis
  const expectedX = [0, 1.5, 3.0, 4.5, 6.0, 7.5];
  coords.forEach((coord, i) => {
    assert.strictEqual(coord.x, expectedX[i], `Atom ${i} x-coordinate should match dummy value`);
  });

  mol.delete();
});
