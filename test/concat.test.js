import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from '../src/fragment.js';
import { isValidSMILES } from './test-utils.js';

test('concat combines two simple fragments', async () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = a.concat(b);
  assert.strictEqual(result.smiles, 'CCCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat works with method chaining', async () => {
  const a = Fragment('C');
  const b = Fragment('C');
  const c = Fragment('C');
  const result = a.concat(b).concat(c);
  assert.strictEqual(result.smiles, 'CCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat handles string arguments', async () => {
  const a = Fragment('CC');
  const result = a.concat('CC');
  assert.strictEqual(result.smiles, 'CCCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat preserves properties', async () => {
  const a = Fragment('C');
  const b = Fragment('C');
  const result = a.concat(b);

  assert.strictEqual(result.atoms, 2);
  assert.strictEqual(result.formula, 'C2H6');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat handles fragments with branches', async () => {
  const a = Fragment('C(C)C');
  const b = Fragment('CC');
  const result = a.concat(b);
  assert.strictEqual(result.smiles, 'C(C)CCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat handles rings without conflicts', async () => {
  const a = Fragment('C1CCC1');
  const b = Fragment('CC');
  const result = a.concat(b);
  assert.strictEqual(result.smiles, 'C1CCC1CC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat remaps conflicting ring numbers', async () => {
  const a = Fragment('C1CCC1');
  const b = Fragment('C1CCC1');
  const result = a.concat(b);

  // The second ring should be remapped to ring 2
  assert.strictEqual(result.smiles, 'C1CCC1C2CCC2');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat handles multiple ring conflicts', async () => {
  const a = Fragment('C1CCC1C2CCC2');
  const b = Fragment('C1CCC1C2CCC2');
  const result = a.concat(b);

  // Rings should be remapped to 3 and 4
  assert.strictEqual(result.smiles, 'C1CCC1C2CCC2C3CCC3C4CCC4');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat handles aromatic rings', async () => {
  const benzene1 = Fragment('c1ccccc1');
  const benzene2 = Fragment('c1ccccc1');
  const result = benzene1.concat(benzene2);

  assert.strictEqual(result.smiles, 'c1ccccc1c2ccccc2');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat works with complex molecules', async () => {
  const phenyl = Fragment('c1ccccc1');
  const methyl = Fragment('C');
  const result = phenyl.concat(methyl);

  assert.strictEqual(result.smiles, 'c1ccccc1C');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat can be used multiple times', async () => {
  const c = Fragment('C');
  const result = c.concat('C').concat('C').concat('C');

  assert.strictEqual(result.smiles, 'CCCC');
  assert.strictEqual(result.atoms, 4);
  assert.ok(await isValidSMILES(result.smiles));
});

test('Static Fragment.concat works', async () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = Fragment.concat(a, b);

  assert.strictEqual(result.smiles, 'CCCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('Static Fragment.concat accepts strings', async () => {
  const result = Fragment.concat('CC', 'CC');
  assert.strictEqual(result.smiles, 'CCCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat with functional groups', async () => {
  const ethyl = Fragment('CC');
  const hydroxyl = Fragment('O');
  const result = ethyl.concat(hydroxyl);

  assert.strictEqual(result.smiles, 'CCO');
  assert.strictEqual(result.formula, 'C2H6O');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat preserves original fragments', async () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = a.concat(b);

  // Original fragments should be unchanged
  assert.strictEqual(a.smiles, 'CC');
  assert.strictEqual(b.smiles, 'CC');
  assert.strictEqual(result.smiles, 'CCCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat with heterocycles', async () => {
  const pyridine = Fragment('n1ccccc1');
  const methyl = Fragment('C');
  const result = pyridine.concat(methyl);

  assert.strictEqual(result.smiles, 'n1ccccc1C');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat builds polymer-like chains', async () => {
  const ethylene = Fragment('CC');
  let polymer = ethylene;

  for (let i = 0; i < 4; i++) {
    polymer = polymer.concat(ethylene);
  }

  assert.strictEqual(polymer.smiles, 'CCCCCCCCCC'); // 5 ethylene units = 10 carbons
  assert.strictEqual(polymer.atoms, 10);
  assert.ok(await isValidSMILES(polymer.smiles));
});

test('concat with charged species', async () => {
  const a = Fragment('[NH3+]');
  const b = Fragment('C');
  const result = a.concat(b);

  assert.strictEqual(result.smiles, '[NH3+]C');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat handles double and triple bonds', async () => {
  const ethylene = Fragment('C=C');
  const methyl = Fragment('C');
  const result = ethylene.concat(methyl);

  assert.strictEqual(result.smiles, 'C=CC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat with stereochemistry', async () => {
  const a = Fragment('C[C@H](O)C');
  const b = Fragment('C');
  const result = a.concat(b);

  assert.strictEqual(result.smiles, 'C[C@H](O)CC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat example from requirement: Fragment("CC") + Fragment("CC")', async () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = a.concat(b);

  assert.strictEqual(result.smiles, 'CCCC');
  assert.strictEqual(String(result), 'CCCC');
  assert.ok(await isValidSMILES(result.smiles));
});

test('concat returns a new Fragment with all methods', async () => {
  const a = Fragment('C');
  const b = Fragment('C');
  const result = a.concat(b);

  // Should have all Fragment methods
  assert.strictEqual(typeof result.concat, 'function');
  assert.strictEqual(typeof result.toString, 'function');
  assert.strictEqual(typeof result, 'function'); // Can be called as a function for branching

  // Can still use for branching
  const branched = result(Fragment('O'));
  assert.strictEqual(branched.smiles, 'CC(O)');
  assert.ok(await isValidSMILES(result.smiles));
  assert.ok(await isValidSMILES(branched.smiles));
});
