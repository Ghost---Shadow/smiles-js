import { test } from 'node:test';
import assert from 'node:assert';
import { Ring } from '../src/ring.js';
import { Fragment } from '../src/fragment.js';

test('Ring creates benzene', () => {
  const benzene = Ring('c', 6);
  assert.strictEqual(benzene.smiles, 'c1ccccc1');
});

test('Ring creates cyclohexane', () => {
  const cyclohexane = Ring('C', 6);
  assert.strictEqual(cyclohexane.smiles, 'C1CCCCC1');
});

test('Ring creates cyclopentane', () => {
  const cyclopentane = Ring('C', 5);
  assert.strictEqual(cyclopentane.smiles, 'C1CCCC1');
});

test('Ring with replace option creates pyridine', () => {
  const pyridine = Ring('c', 6, { replace: { 0: 'n' } });
  assert.strictEqual(pyridine.smiles, 'n1ccccc1');
});

test('Ring supports substitution', () => {
  const benzene = Ring('c', 6);
  const methyl = Fragment('C');
  const toluene = benzene(methyl);
  assert.strictEqual(toluene.smiles, 'c1ccccc1(C)');
});

test('Ring supports multiple substitutions', () => {
  const benzene = Ring('c', 6);
  const methyl = Fragment('C');
  const xylene = benzene(methyl)(methyl);
  assert.strictEqual(xylene.smiles, 'c1ccccc1(C)(C)');
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
