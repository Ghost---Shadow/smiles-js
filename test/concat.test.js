import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from '../src/fragment.js';

test('concat combines two simple fragments', () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = a.concat(b);
  assert.strictEqual(result.smiles, 'CCCC');
});

test('concat works with method chaining', () => {
  const a = Fragment('C');
  const b = Fragment('C');
  const c = Fragment('C');
  const result = a.concat(b).concat(c);
  assert.strictEqual(result.smiles, 'CCC');
});

test('concat handles string arguments', () => {
  const a = Fragment('CC');
  const result = a.concat('CC');
  assert.strictEqual(result.smiles, 'CCCC');
});

test('concat preserves properties', () => {
  const a = Fragment('C');
  const b = Fragment('C');
  const result = a.concat(b);
  
  assert.strictEqual(result.atoms, 2);
  assert.strictEqual(result.formula, 'C2H6');
});

test('concat handles fragments with branches', () => {
  const a = Fragment('C(C)C');
  const b = Fragment('CC');
  const result = a.concat(b);
  assert.strictEqual(result.smiles, 'C(C)CCC');
});

test('concat handles rings without conflicts', () => {
  const a = Fragment('C1CCC1');
  const b = Fragment('CC');
  const result = a.concat(b);
  assert.strictEqual(result.smiles, 'C1CCC1CC');
});

test('concat remaps conflicting ring numbers', () => {
  const a = Fragment('C1CCC1');
  const b = Fragment('C1CCC1');
  const result = a.concat(b);
  
  // The second ring should be remapped to ring 2
  assert.strictEqual(result.smiles, 'C1CCC1C2CCC2');
});

test('concat handles multiple ring conflicts', () => {
  const a = Fragment('C1CCC1C2CCC2');
  const b = Fragment('C1CCC1C2CCC2');
  const result = a.concat(b);
  
  // Rings should be remapped to 3 and 4
  assert.strictEqual(result.smiles, 'C1CCC1C2CCC2C3CCC3C4CCC4');
});

test('concat handles aromatic rings', () => {
  const benzene1 = Fragment('c1ccccc1');
  const benzene2 = Fragment('c1ccccc1');
  const result = benzene1.concat(benzene2);
  
  assert.strictEqual(result.smiles, 'c1ccccc1c2ccccc2');
});

test('concat works with complex molecules', () => {
  const phenyl = Fragment('c1ccccc1');
  const methyl = Fragment('C');
  const result = phenyl.concat(methyl);
  
  assert.strictEqual(result.smiles, 'c1ccccc1C');
});

test('concat can be used multiple times', () => {
  const c = Fragment('C');
  const result = c.concat('C').concat('C').concat('C');
  
  assert.strictEqual(result.smiles, 'CCCC');
  assert.strictEqual(result.atoms, 4);
});

test('Static Fragment.concat works', () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = Fragment.concat(a, b);
  
  assert.strictEqual(result.smiles, 'CCCC');
});

test('Static Fragment.concat accepts strings', () => {
  const result = Fragment.concat('CC', 'CC');
  assert.strictEqual(result.smiles, 'CCCC');
});

test('concat with functional groups', () => {
  const ethyl = Fragment('CC');
  const hydroxyl = Fragment('O');
  const result = ethyl.concat(hydroxyl);
  
  assert.strictEqual(result.smiles, 'CCO');
  assert.strictEqual(result.formula, 'C2H6O');
});

test('concat preserves original fragments', () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = a.concat(b);
  
  // Original fragments should be unchanged
  assert.strictEqual(a.smiles, 'CC');
  assert.strictEqual(b.smiles, 'CC');
  assert.strictEqual(result.smiles, 'CCCC');
});

test('concat with heterocycles', () => {
  const pyridine = Fragment('n1ccccc1');
  const methyl = Fragment('C');
  const result = pyridine.concat(methyl);
  
  assert.strictEqual(result.smiles, 'n1ccccc1C');
});

test('concat builds polymer-like chains', () => {
  const ethylene = Fragment('CC');
  let polymer = ethylene;
  
  for (let i = 0; i < 4; i++) {
    polymer = polymer.concat(ethylene);
  }
  
  assert.strictEqual(polymer.smiles, 'CCCCCCCCCC'); // 5 ethylene units = 10 carbons
  assert.strictEqual(polymer.atoms, 10);
});

test('concat with charged species', () => {
  const a = Fragment('[NH4+]');
  const b = Fragment('[O-]');
  const result = a.concat(b);
  
  assert.strictEqual(result.smiles, '[NH4+][O-]');
});

test('concat handles double and triple bonds', () => {
  const ethylene = Fragment('C=C');
  const methyl = Fragment('C');
  const result = ethylene.concat(methyl);
  
  assert.strictEqual(result.smiles, 'C=CC');
});

test('concat with stereochemistry', () => {
  const a = Fragment('C[C@H](O)C');
  const b = Fragment('C');
  const result = a.concat(b);
  
  assert.strictEqual(result.smiles, 'C[C@H](O)CC');
});

test('concat example from requirement: Fragment("CC") + Fragment("CC")', () => {
  const a = Fragment('CC');
  const b = Fragment('CC');
  const result = a.concat(b);
  
  assert.strictEqual(result.smiles, 'CCCC');
  assert.strictEqual(String(result), 'CCCC');
});

test('concat returns a new Fragment with all methods', () => {
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
});
