import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment, Ring } from '../src/index.js';
import { benzene, methyl, hydroxyl, carboxyl } from '../src/common.js';

test('README example: toluene', () => {
  const benzeneRing = Ring('c', 6);
  const methylGroup = Fragment('C');
  const toluene = benzeneRing(methylGroup);
  assert.strictEqual(String(toluene), 'c1ccccc1(C)');
});

test('README example: ethanol', () => {
  const ethyl = Fragment('CC');
  const hydroxylGroup = Fragment('O');
  const ethanol = ethyl(hydroxylGroup);
  assert.strictEqual(ethanol.smiles, 'CC(O)');
});

test('README example: acetone', () => {
  const methylGroup = Fragment('C');
  const acetone = methylGroup(Fragment('=O'))(methylGroup);
  assert.strictEqual(acetone.smiles, 'C(=O)(C)');
});

test('README example: nested branching', () => {
  const a = Fragment('C');
  const b = Fragment('CC');
  const c = Fragment('CCC');
  const molecule = a(b(c));
  assert.strictEqual(molecule.smiles, 'C(CC(CCC))');
});

test('README example: aspirin', () => {
  const aspirin = benzene(carboxyl)(Fragment('OC(=O)C'));
  assert.strictEqual(aspirin.smiles, 'c1ccccc1(C(=O)O)(OC(=O)C)');
});

test('README example: ibuprofen', () => {
  const ibuprofen = benzene(Fragment('CC(C)C'))(Fragment('CC(C)C(=O)O'));
  assert.strictEqual(ibuprofen.smiles, 'c1ccccc1(CC(C)C)(CC(C)C(=O)O)');
});

test('README example: molecule library', () => {
  const acetyl = Fragment('C(=O)C');
  const phenyl = benzene;

  const molecules = {
    toluene: phenyl(methyl),
    phenol: phenyl(hydroxyl),
    benzoicAcid: phenyl(carboxyl),
    acetophenone: phenyl(acetyl),
  };

  assert.strictEqual(String(molecules.toluene), 'c1ccccc1(C)');
  assert.strictEqual(String(molecules.phenol), 'c1ccccc1(O)');
  assert.strictEqual(String(molecules.benzoicAcid), 'c1ccccc1(C(=O)O)');
  assert.strictEqual(String(molecules.acetophenone), 'c1ccccc1(C(=O)C)');
});
