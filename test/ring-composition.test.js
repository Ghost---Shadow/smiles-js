import { test } from 'node:test';
import assert from 'node:assert';
import { Ring } from '../src/ring.js';
import { isValidSMILES } from './test-utils.js';

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
