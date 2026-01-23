import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from './index.js';
import { buildMolBlockFromMeta } from './mol-block-builder.js';
import initRDKitModule from '@rdkit/rdkit';

test('buildMolBlockFromMeta - converts benzene meta to valid MOL block', async () => {
  const benzene = await Fragment('c1ccccc1');
  const molBlock = buildMolBlockFromMeta(benzene.meta);

  // MOL block should have header, counts line, atom block, bond block, and M  END
  assert.ok(molBlock.includes('V2000'), 'Should be V2000 format');
  assert.ok(molBlock.includes('M  END'), 'Should have M  END marker');

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

  // Extract counts line (4th line)
  const lines = molBlock.split('\n');
  const countsLine = lines[3];

  // First 3 digits are atom count, next 3 are bond count
  const atomCount = parseInt(countsLine.substring(0, 3).trim(), 10);
  const bondCount = parseInt(countsLine.substring(3, 6).trim(), 10);

  assert.strictEqual(atomCount, 6, 'Benzene should have 6 atoms');
  assert.strictEqual(bondCount, 6, 'Benzene should have 6 bonds');
});
