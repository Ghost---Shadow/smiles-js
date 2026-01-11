import { test } from 'node:test';
import assert from 'node:assert';
import { Ring } from '../src/ring.js';
import { Fragment } from '../src/fragment.js';

test('Ring composition remaps ring numbers correctly', () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene(benzene);
  assert.strictEqual(biphenyl.smiles, 'c1ccccc1(c2ccccc2)');
});

test('Multiple ring compositions remap correctly', () => {
  const benzene = Ring('c', 6);
  const triphenyl = benzene(benzene)(benzene);
  assert.strictEqual(triphenyl.smiles, 'c1ccccc1(c2ccccc2)(c3ccccc3)');
});

test('Different sized rings compose correctly', () => {
  const benzene = Ring('c', 6);
  const cyclopentane = Ring('C', 5);
  const result = benzene(cyclopentane);
  assert.strictEqual(result.smiles, 'c1ccccc1(C2CCCC2)');
});

test('Ring with existing branches composes correctly', () => {
  const benzene = Ring('c', 6);
  const methyl = Fragment('C');
  const toluene = benzene(methyl);
  const result = toluene(benzene);
  assert.strictEqual(result.smiles, 'c1ccccc1(C)(c2ccccc2)');
});

test('Nested ring compositions work correctly', () => {
  const benzene = Ring('c', 6);
  const cyclohexane = Ring('C', 6);
  const inner = benzene(cyclohexane);
  const outer = benzene(inner);
  assert.strictEqual(outer.smiles, 'c1ccccc1(c3ccccc3(C2CCCCC2))');
});

test('Ring composition counts atoms correctly', () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene(benzene);
  assert.strictEqual(biphenyl.atoms, 12);
});

test('Ring composition counts rings correctly', () => {
  const benzene = Ring('c', 6);
  const biphenyl = benzene(benzene);
  assert.strictEqual(biphenyl.rings, 2);

  const triphenyl = benzene(benzene)(benzene);
  assert.strictEqual(triphenyl.rings, 3);
});
