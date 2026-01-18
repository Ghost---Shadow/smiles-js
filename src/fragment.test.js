import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from './fragment.js';
import { isValidSMILES } from './test-utils.js';

test('Fragment creates basic fragments', async () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.smiles, 'C');
  assert.ok(await isValidSMILES(methyl.smiles));
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

test('Fragment supports branching', async () => {
  const methyl = Fragment('C');
  const ethyl = Fragment('CC');
  const result = methyl(ethyl);
  assert.strictEqual(result.smiles, 'C(CC)');
  assert.ok(await isValidSMILES(result.smiles));
});

test('Fragment supports multiple branches', async () => {
  const methyl = Fragment('C');
  const ethyl = Fragment('CC');
  const result = methyl(ethyl)(ethyl);
  assert.strictEqual(result.smiles, 'C(CC)(CC)');
  assert.ok(await isValidSMILES(result.smiles));
});

test('Fragment supports nested branches', async () => {
  const a = Fragment('C');
  const b = Fragment('CC');
  const c = Fragment('CCC');
  const result = a(b(c));
  assert.strictEqual(result.smiles, 'C(CC(CCC))');
  assert.ok(await isValidSMILES(result.smiles));
});

test('Fragment counts atoms correctly', async () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.atoms, 1);
  assert.ok(await isValidSMILES(methyl.smiles));

  const ethyl = Fragment('CC');
  assert.strictEqual(ethyl.atoms, 2);
  assert.ok(await isValidSMILES(ethyl.smiles));

  const benzene = Fragment('c1ccccc1');
  assert.strictEqual(benzene.atoms, 6);
  assert.ok(await isValidSMILES(benzene.smiles));
});

test('Fragment counts rings correctly', async () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.rings, 0);
  assert.ok(await isValidSMILES(methyl.smiles));

  const benzene = Fragment('c1ccccc1');
  assert.strictEqual(benzene.rings, 1);
  assert.ok(await isValidSMILES(benzene.smiles));

  const naphthalene = Fragment('c1ccc2ccccc2c1');
  assert.strictEqual(naphthalene.rings, 2);
  assert.ok(await isValidSMILES(naphthalene.smiles));
});

test('Fragment calculates formula correctly', async () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.formula, 'CH4');
  assert.ok(await isValidSMILES(methyl.smiles));

  const ethyl = Fragment('CC');
  assert.strictEqual(ethyl.formula, 'C2H6');
  assert.ok(await isValidSMILES(ethyl.smiles));

  const carbonyl = Fragment('C=O');
  assert.strictEqual(carbonyl.formula, 'CH2O');
  assert.ok(await isValidSMILES(carbonyl.smiles));
});

test('Fragment calculates molecular weight correctly', async () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.molecularWeight, 16.04);
  assert.ok(await isValidSMILES(methyl.smiles));

  const ethyl = Fragment('CC');
  assert.strictEqual(ethyl.molecularWeight, 30.07);
  assert.ok(await isValidSMILES(ethyl.smiles));
});

test('Fragment works with complex molecules', async () => {
  const benzene = Fragment('c1ccccc1');
  const methyl = Fragment('C');
  const toluene = benzene(methyl);
  assert.strictEqual(toluene.smiles, 'c1ccccc1(C)');
  assert.ok(await isValidSMILES(toluene.smiles));
});

test('Fragment toString and toPrimitive work correctly', async () => {
  const methyl = Fragment('C');
  assert.strictEqual(methyl.toString(), 'C');
  assert.ok(await isValidSMILES(methyl.smiles));
  assert.strictEqual(`${methyl}`, 'C');
});
