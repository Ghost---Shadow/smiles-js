import { test } from 'node:test';
import assert from 'node:assert';
import { Ring } from './ring.js';
import { Fragment } from './fragment.js';
import { isValidSMILES } from './test-utils.js';

test('Ring creates benzene', async () => {
  const benzene = Ring('c', 6);
  assert.strictEqual(benzene.smiles, 'c1ccccc1');
  assert.ok(await isValidSMILES(benzene.smiles));
});

test('Ring creates cyclohexane', async () => {
  const cyclohexane = Ring('C', 6);
  assert.strictEqual(cyclohexane.smiles, 'C1CCCCC1');
  assert.ok(await isValidSMILES(cyclohexane.smiles));
});

test('Ring creates cyclopentane', async () => {
  const cyclopentane = Ring('C', 5);
  assert.strictEqual(cyclopentane.smiles, 'C1CCCC1');
  assert.ok(await isValidSMILES(cyclopentane.smiles));
});

test('Ring with replace option creates pyridine', async () => {
  const pyridine = Ring('c', 6, { replace: { 0: 'n' } });
  assert.strictEqual(pyridine.smiles, 'n1ccccc1');
  assert.ok(await isValidSMILES(pyridine.smiles));
});

test('Ring supports substitution', async () => {
  const benzene = Ring('c', 6);
  const methyl = Fragment('C');
  const toluene = benzene(methyl);
  assert.strictEqual(toluene.smiles, 'c1ccccc1(C)');
  assert.ok(await isValidSMILES(toluene.smiles));
});

test('Ring supports multiple substitutions', async () => {
  const benzene = Ring('c', 6);
  const xylene = benzene.attachAt(2, 'C').attachAt(5, 'C');
  assert.strictEqual(xylene.smiles, 'c1c(C)ccc(C)c1');
  assert.ok(await isValidSMILES(xylene.smiles));
});

test('Ring counts atoms correctly', () => {
  const benzene = Ring('c', 6);
  assert.strictEqual(benzene.atoms, 6);

  const cyclopentane = Ring('C', 5);
  assert.strictEqual(cyclopentane.atoms, 5);
});

test('Ring counts rings correctly', () => {
  const benzene = Ring('c', 6);
  assert.strictEqual(benzene.rings, 1);
});

test('Ring.attachAt creates toluene at position 1', async () => {
  const benzene = Ring('c', 6);
  const toluene = benzene.attachAt(1, 'C');
  assert.strictEqual(toluene.smiles, 'c1(C)ccccc1');
  assert.ok(await isValidSMILES(toluene.smiles));
});

test('Ring.attachAt creates toluene at position 2', async () => {
  const benzene = Ring('c', 6);
  const toluene = benzene.attachAt(2, 'C');
  assert.strictEqual(toluene.smiles, 'c1c(C)cccc1');
  assert.ok(await isValidSMILES(toluene.smiles));
});

test('Ring.attachAt creates para-xylene', async () => {
  const benzene = Ring('c', 6);
  const toluene = benzene.attachAt(2, 'C');
  const xylene = toluene.attachAt(5, 'C');
  assert.strictEqual(xylene.smiles, 'c1c(C)ccc(C)c1');
  assert.ok(await isValidSMILES(xylene.smiles));
});

test('Ring.attachAt creates ibuprofen', async () => {
  const benzene = Ring('c', 6);
  const ibuprofen = benzene.attachAt(2, 'CC(C)C').attachAt(5, 'CC(C)C(=O)O');
  assert.strictEqual(ibuprofen.smiles, 'c1c(CC(C)C)ccc(CC(C)C(=O)O)c1');
  assert.ok(await isValidSMILES(ibuprofen.smiles));
});

test('Ring.attachAt throws on invalid position', () => {
  const benzene = Ring('c', 6);
  assert.throws(() => benzene.attachAt(0, 'C'), /out of range/);
  assert.throws(() => benzene.attachAt(7, 'C'), /out of range/);
});

test('Ring.attachAt works with Fragment substituents', async () => {
  const benzene = Ring('c', 6);
  const methyl = Fragment('C');
  const toluene = benzene.attachAt(2, methyl);
  assert.strictEqual(toluene.smiles, 'c1c(C)cccc1');
  assert.ok(await isValidSMILES(toluene.smiles));
});

test('Ring.attachAt works with Ring substituents', async () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene.attachAt(2, benzene);
  assert.strictEqual(biphenyl.smiles, 'c1c(c2ccccc2)cccc1');
  assert.ok(await isValidSMILES(biphenyl.smiles));
});

test('Ring.attachAt chains multiple rings', async () => {
  const benzene = Ring('c', 6);
  const terphenyl = benzene.attachAt(2, benzene).attachAt(5, benzene);
  assert.strictEqual(terphenyl.smiles, 'c1c(c2ccccc2)ccc(c3ccccc3)c1');
  assert.ok(await isValidSMILES(terphenyl.smiles));
});

test('Ring.attachAt validates with RDKit', async () => {
  const benzene = Ring('c', 6);

  // Test simple ring attachment
  const biphenyl = benzene.attachAt(2, benzene);
  assert.ok(await isValidSMILES(biphenyl.smiles));

  // Test chained ring attachments
  const terphenyl = benzene.attachAt(2, benzene).attachAt(5, benzene);
  assert.ok(await isValidSMILES(terphenyl.smiles));
});

// Ring composition tests
test('Ring composition remaps ring numbers correctly', async () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene(benzene);
  assert.ok(await isValidSMILES(biphenyl.smiles));
  assert.strictEqual(biphenyl.smiles, 'c1ccccc1(c2ccccc2)');
});

test('Multiple ring compositions remap correctly', async () => {
  const benzene = Ring('c', 6);
  const triphenyl = benzene.attachAt(2, benzene).attachAt(4, benzene);
  assert.ok(await isValidSMILES(triphenyl.smiles));
  assert.strictEqual(triphenyl.smiles, 'c1c(c2ccccc2)cc(c3ccccc3)cc1');
});

test('Different sized rings compose correctly', async () => {
  const benzene = Ring('c', 6);
  const cyclopentane = Ring('C', 5);
  const result = benzene(cyclopentane);
  assert.ok(await isValidSMILES(result.smiles));
  assert.strictEqual(result.smiles, 'c1ccccc1(C2CCCC2)');
});

test('Ring with existing branches composes correctly', async () => {
  const benzene = Ring('c', 6);
  const result = benzene.attachAt(2, 'C').attachAt(3, benzene);
  assert.ok(await isValidSMILES(result.smiles));
  assert.strictEqual(result.smiles, 'c1c(C)c(c2ccccc2)ccc1');
});

test('Nested ring compositions work correctly', async () => {
  const benzene = Ring('c', 6);
  const cyclohexane = Ring('C', 6);
  const inner = benzene(cyclohexane);
  const outer = benzene(inner);
  assert.ok(await isValidSMILES(outer.smiles));
  assert.strictEqual(outer.smiles, 'c1ccccc1(c3ccccc3(C2CCCCC2))');
});

test('Ring composition counts atoms correctly', async () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene(benzene);
  assert.ok(await isValidSMILES(biphenyl.smiles));
  assert.strictEqual(biphenyl.atoms, 12);
});

test('Ring composition counts rings correctly', async () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene(benzene);
  assert.ok(await isValidSMILES(biphenyl.smiles));
  assert.strictEqual(biphenyl.rings, 2);

  const triphenyl = benzene.attachAt(2, benzene).attachAt(4, benzene);
  assert.ok(await isValidSMILES(triphenyl.smiles));
  assert.strictEqual(triphenyl.rings, 3);
});

test('Phenol composition works correctly', async () => {
  const benzene = Ring('c', 6);
  const phenol = benzene.attachAt(1, 'O');
  assert.ok(await isValidSMILES(phenol.smiles));
  assert.strictEqual(phenol.smiles, 'c1(O)ccccc1');
});

test('Para-quinone (2,5-cyclohexadiene-1,4-dione) composition works correctly', async () => {
  const result = Ring('c', 6).attachAt(1, '=O').attachAt(4, '=O');
  assert.ok(await isValidSMILES(result.smiles));
  assert.strictEqual(result.smiles, 'c1(=O)ccc(=O)cc1');
});
