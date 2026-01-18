import { test } from 'node:test';
import assert from 'node:assert';
import { validateSMILES } from './validator.js';

// Valid SMILES tests
test('validateSMILES accepts simple carbon chain', () => {
  const result = validateSMILES('CCCC');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts single carbon', () => {
  const result = validateSMILES('C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts aromatic ring', () => {
  const result = validateSMILES('c1ccccc1');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts aliphatic ring', () => {
  const result = validateSMILES('C1CCC1');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts branched structure', () => {
  const result = validateSMILES('C(C)C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts multiple branches', () => {
  const result = validateSMILES('C(C)(C)C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts nested branches', () => {
  const result = validateSMILES('C(C(C)C)C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts double bond', () => {
  const result = validateSMILES('C=C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts triple bond', () => {
  const result = validateSMILES('C#C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts heteroatoms', () => {
  assert.deepStrictEqual(validateSMILES('CCO'), { valid: true });
  assert.deepStrictEqual(validateSMILES('CCN'), { valid: true });
  assert.deepStrictEqual(validateSMILES('CCS'), { valid: true });
});

test('validateSMILES accepts bracketed atoms', () => {
  const result = validateSMILES('[NH3+]');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts charged atoms', () => {
  assert.deepStrictEqual(validateSMILES('[O-]'), { valid: true });
  assert.deepStrictEqual(validateSMILES('[Na+]'), { valid: true });
});

test('validateSMILES accepts isotopes', () => {
  const result = validateSMILES('[13C]CC');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts stereochemistry', () => {
  const result = validateSMILES('C[C@H](O)C');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts double digit ring numbers', () => {
  const result = validateSMILES('C%10CCC%10');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts multiple rings', () => {
  const result = validateSMILES('C1CCC1C2CCC2');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts fused rings', () => {
  const result = validateSMILES('c1ccc2ccccc2c1');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES accepts complex molecules', () => {
  assert.deepStrictEqual(validateSMILES('c1ccccc1C'), { valid: true }); // toluene
  assert.deepStrictEqual(validateSMILES('CC(=O)O'), { valid: true }); // acetic acid
  assert.deepStrictEqual(validateSMILES('c1ccccc1O'), { valid: true }); // phenol
});

// Invalid SMILES tests - unclosed branches
test('validateSMILES rejects unclosed branch', () => {
  const result = validateSMILES('C(C');
  assert.deepStrictEqual(result, { valid: false, error: 'Unclosed branch' });
});

test('validateSMILES rejects multiple unclosed branches', () => {
  const result = validateSMILES('C(C(C');
  assert.deepStrictEqual(result, { valid: false, error: 'Unclosed branch' });
});

test('validateSMILES rejects unclosed nested branch', () => {
  const result = validateSMILES('C(C(C)');
  assert.deepStrictEqual(result, { valid: false, error: 'Unclosed branch' });
});

// Invalid SMILES tests - unmatched closing branches
test('validateSMILES rejects unmatched closing branch', () => {
  const result = validateSMILES('C)C');
  assert.deepStrictEqual(result, { valid: false, error: 'Unmatched closing branch' });
});

test('validateSMILES rejects extra closing branch', () => {
  const result = validateSMILES('C(C))');
  assert.deepStrictEqual(result, { valid: false, error: 'Unmatched closing branch' });
});

test('validateSMILES rejects multiple extra closing branches', () => {
  const result = validateSMILES('C(C)))');
  assert.deepStrictEqual(result, { valid: false, error: 'Unmatched closing branch' });
});

// Invalid SMILES tests - unclosed brackets
test('validateSMILES rejects unclosed bracket', () => {
  const result = validateSMILES('[NH3+');
  assert.deepStrictEqual(result, { valid: false, error: 'Unclosed bracket' });
});

test('validateSMILES rejects unclosed bracket in middle', () => {
  const result = validateSMILES('C[NH3+CC');
  assert.deepStrictEqual(result, { valid: false, error: 'Unclosed bracket' });
});

// Invalid SMILES tests - invalid ring closures
test('validateSMILES rejects unclosed ring', () => {
  const result = validateSMILES('C1CCC');
  assert.deepStrictEqual(result, { valid: false, error: 'Invalid ring closure' });
});

test('validateSMILES rejects multiple unclosed rings', () => {
  const result = validateSMILES('C1CCC2CCC');
  assert.deepStrictEqual(result, { valid: false, error: 'Invalid ring closure' });
});

test('validateSMILES rejects triple ring closure', () => {
  const result = validateSMILES('C111');
  assert.deepStrictEqual(result, { valid: false, error: 'Invalid ring closure' });
});

test('validateSMILES rejects unclosed double digit ring', () => {
  const result = validateSMILES('C%10CCC');
  assert.deepStrictEqual(result, { valid: false, error: 'Invalid ring closure' });
});

// Edge cases
test('validateSMILES accepts empty string', () => {
  const result = validateSMILES('');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES handles mixed valid and invalid characters', () => {
  const result = validateSMILES('C(C');
  assert.strictEqual(result.valid, false);
});

test('validateSMILES accepts complex valid SMILES', () => {
  const result = validateSMILES('c1c(C)c(c2ccccc2)ccc1');
  assert.deepStrictEqual(result, { valid: true });
});

test('validateSMILES rejects complex invalid SMILES with unclosed branch', () => {
  const result = validateSMILES('c1c(C)c(c2ccccc2ccc1');
  assert.deepStrictEqual(result, { valid: false, error: 'Unclosed branch' });
});

test('validateSMILES handles stereochemistry in validation', () => {
  assert.deepStrictEqual(validateSMILES('C[C@@H](O)C'), { valid: true });
  assert.deepStrictEqual(validateSMILES('C/C=C/C'), { valid: true });
  assert.deepStrictEqual(validateSMILES('C\\C=C\\C'), { valid: true });
});

test('validateSMILES accepts two-letter elements', () => {
  assert.deepStrictEqual(validateSMILES('CCl'), { valid: true });
  assert.deepStrictEqual(validateSMILES('CBr'), { valid: true });
  assert.deepStrictEqual(validateSMILES('[Cl-]'), { valid: true });
});
