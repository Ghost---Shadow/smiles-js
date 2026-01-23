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

  // Check meta structure
  assert.ok(benzene.meta);
  assert.ok(benzene.meta.molecules);
  assert.strictEqual(benzene.meta.molecules[0].atoms.length, 6);
  assert.strictEqual(benzene.meta.molecules[0].bonds.length, 6);

  // Check aromatic ring in extensions
  const ext = benzene.meta.molecules[0].extensions[0];
  assert.deepStrictEqual(ext.aromaticAtoms, [0, 1, 2, 3, 4, 5]);
  assert.deepStrictEqual(ext.atomRings, [[0, 5, 4, 3, 2, 1]]);
});

test('Fragment - toluene', async () => {
  const toluene = await Fragment('Cc1ccccc1');

  assert.strictEqual(toluene.atoms, 7);
  assert.strictEqual(toluene.rings, 1);
  assert.strictEqual(toluene.formula, 'C7H8');

  // Check that methyl group is properly represented
  const firstAtom = toluene.meta.molecules[0].atoms[0];
  assert.strictEqual(firstAtom.impHs, 3); // CH3
});

test('Fragment - ethanol', async () => {
  const ethanol = await Fragment('CCO');

  assert.strictEqual(ethanol.atoms, 3);
  assert.strictEqual(ethanol.rings, 0);
  assert.strictEqual(ethanol.formula, 'C2H6O');
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

  // Check top-level structure (rdkitjson in newer versions, commonchem in older)
  assert.ok(mol.meta.rdkitjson || mol.meta.commonchem);
  assert.ok(mol.meta.defaults);
  assert.ok(mol.meta.molecules);

  // Check defaults
  assert.strictEqual(mol.meta.defaults.atom.z, 6); // Carbon
  assert.strictEqual(mol.meta.defaults.bond.bo, 1); // Single bond

  // Check molecule data
  assert.ok(Array.isArray(mol.meta.molecules[0].atoms));
  assert.ok(Array.isArray(mol.meta.molecules[0].bonds));
  assert.ok(Array.isArray(mol.meta.molecules[0].extensions));
});
