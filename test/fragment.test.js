import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from '../src/fragment.js';

test('Fragment creates basic fragments', () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.smiles, 'C');
  assert.strictEqual(String(methyl), 'C');
});

test('Fragment validates SMILES on creation', () => {
  assert.throws(() => Fragment('C(C'), { message: 'Unclosed branch' });
});

test('Fragment.validate returns validation result', () => {
  const result1 = Fragment.validate('C(C');
  assert.deepStrictEqual(result1, { valid: false, error: 'Unclosed branch' });

  const result2 = Fragment.validate('CCO');
  assert.deepStrictEqual(result2, { valid: true });
});

test('Fragment supports branching', () => {
  const methyl = Fragment('C');
  const ethyl = Fragment('CC');
  const result = methyl(ethyl);
  assert.strictEqual(result.smiles, 'C(CC)');
});

test('Fragment supports multiple branches', () => {
  const methyl = Fragment('C');
  const ethyl = Fragment('CC');
  const result = methyl(ethyl)(ethyl);
  assert.strictEqual(result.smiles, 'C(CC)(CC)');
});

test('Fragment supports nested branches', () => {
  const a = Fragment('C');
  const b = Fragment('CC');
  const c = Fragment('CCC');
  const result = a(b(c));
  assert.strictEqual(result.smiles, 'C(CC(CCC))');
});

test('Fragment counts atoms correctly', () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.atoms, 1);

  const ethyl = Fragment('CC');
  assert.strictEqual(ethyl.atoms, 2);

  const benzene = Fragment('c1ccccc1');
  assert.strictEqual(benzene.atoms, 6);
});

test('Fragment counts rings correctly', () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.rings, 0);

  const benzene = Fragment('c1ccccc1');
  assert.strictEqual(benzene.rings, 1);

  const naphthalene = Fragment('c1ccc2ccccc2c1');
  assert.strictEqual(naphthalene.rings, 2);
});

test('Fragment calculates formula correctly', () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.formula, 'CH4');

  const ethyl = Fragment('CC');
  assert.strictEqual(ethyl.formula, 'C2H6');

  const carbonyl = Fragment('C=O');
  assert.strictEqual(carbonyl.formula, 'CH2O');
});

test('Fragment calculates molecular weight correctly', () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.molecularWeight, 16.04);

  const ethyl = Fragment('CC');
  assert.strictEqual(ethyl.molecularWeight, 30.07);
});

test('Fragment works with complex molecules', () => {
  const benzene = Fragment('c1ccccc1');
  const methyl = Fragment('C');
  const toluene = benzene(methyl);
  assert.strictEqual(toluene.smiles, 'c1ccccc1(C)');
});

test('Fragment toString and toPrimitive work correctly', () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.toString(), 'C');
  assert.strictEqual(`${methyl}`, 'C');
});
