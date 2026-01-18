import { test } from 'node:test';
import assert from 'node:assert';
import {
  buildFirstAtomWithSub,
  buildFirstRingMiddleAtomsWithSub,
  buildFirstBridgeAtomWithSub,
  buildSecondRingMiddleAtomsWithSub,
  buildSecondBridgeAtomWithSub,
  buildLastAtomWithSub,
  buildSmilesWithSubstituents,
} from './substituents.js';

// buildFirstAtomWithSub tests
test('buildFirstAtomWithSub creates atom without substituent', () => {
  const result = buildFirstAtomWithSub(0, {}, {}, 'c', '');
  assert.strictEqual(result, 'c1');
});

test('buildFirstAtomWithSub creates atom with substituent', () => {
  const substituents = { 0: 'C' };
  const result = buildFirstAtomWithSub(0, substituents, {}, 'c', '');
  assert.strictEqual(result, 'c1(C)');
});

test('buildFirstAtomWithSub uses heteroatom', () => {
  const heteroAtoms = { 0: 'n' };
  const result = buildFirstAtomWithSub(0, {}, heteroAtoms, 'c', '');
  assert.strictEqual(result, 'n1');
});

test('buildFirstAtomWithSub with both heteroatom and substituent', () => {
  const substituents = { 0: 'O' };
  const heteroAtoms = { 0: 'n' };
  const result = buildFirstAtomWithSub(0, substituents, heteroAtoms, 'c', '');
  assert.strictEqual(result, 'n1(O)');
});

test('buildFirstAtomWithSub remaps conflicting ring numbers', () => {
  const substituents = { 0: 'C1CC1' };
  const currentSmiles = 'C1CCC1';
  const result = buildFirstAtomWithSub(0, substituents, {}, 'c', currentSmiles);
  assert.ok(result.includes('c1'));
  assert.ok(!result.includes('C1CC1'));
});

// buildFirstRingMiddleAtomsWithSub tests
test('buildFirstRingMiddleAtomsWithSub creates atoms without substituents', () => {
  const result = buildFirstRingMiddleAtomsWithSub(1, 3, {}, {}, 'c', '');
  assert.strictEqual(result.smiles, 'ccc');
  assert.strictEqual(result.nextAtomPos, 4);
});

test('buildFirstRingMiddleAtomsWithSub creates atoms with substituent', () => {
  const substituents = { 2: 'C' };
  const result = buildFirstRingMiddleAtomsWithSub(1, 3, substituents, {}, 'c', '');
  assert.strictEqual(result.smiles, 'cc(C)c');
  assert.strictEqual(result.nextAtomPos, 4);
});

test('buildFirstRingMiddleAtomsWithSub uses heteroatoms', () => {
  const heteroAtoms = { 2: 'n' };
  const result = buildFirstRingMiddleAtomsWithSub(1, 3, {}, heteroAtoms, 'c', '');
  assert.strictEqual(result.smiles, 'cnc');
});

test('buildFirstRingMiddleAtomsWithSub handles zero atoms', () => {
  const result = buildFirstRingMiddleAtomsWithSub(1, 0, {}, {}, 'c', '');
  assert.strictEqual(result.smiles, '');
  assert.strictEqual(result.nextAtomPos, 1);
});

// buildFirstBridgeAtomWithSub tests
test('buildFirstBridgeAtomWithSub creates bridge without substituent', () => {
  const result = buildFirstBridgeAtomWithSub(3, {}, {}, 'c', '');
  assert.strictEqual(result, 'c2');
});

test('buildFirstBridgeAtomWithSub creates bridge with substituent', () => {
  const substituents = { 3: 'C' };
  const result = buildFirstBridgeAtomWithSub(3, substituents, {}, 'c', '');
  assert.strictEqual(result, 'c2(C)');
});

test('buildFirstBridgeAtomWithSub uses heteroatom', () => {
  const heteroAtoms = { 3: 'n' };
  const result = buildFirstBridgeAtomWithSub(3, {}, heteroAtoms, 'c', '');
  assert.strictEqual(result, 'n2');
});

// buildSecondRingMiddleAtomsWithSub tests
test('buildSecondRingMiddleAtomsWithSub creates atoms without substituents', () => {
  const result = buildSecondRingMiddleAtomsWithSub(4, 3, {}, {}, 'c', '');
  assert.strictEqual(result.smiles, 'ccc');
  assert.strictEqual(result.nextAtomPos, 7);
});

test('buildSecondRingMiddleAtomsWithSub creates atoms with substituent', () => {
  const substituents = { 5: 'C' };
  const result = buildSecondRingMiddleAtomsWithSub(4, 3, substituents, {}, 'c', '');
  assert.strictEqual(result.smiles, 'cc(C)c');
  assert.strictEqual(result.nextAtomPos, 7);
});

test('buildSecondRingMiddleAtomsWithSub uses heteroatoms', () => {
  const heteroAtoms = { 5: 'n' };
  const result = buildSecondRingMiddleAtomsWithSub(4, 3, {}, heteroAtoms, 'c', '');
  assert.strictEqual(result.smiles, 'cnc');
});

// buildSecondBridgeAtomWithSub tests
test('buildSecondBridgeAtomWithSub creates bridge without substituent', () => {
  const result = buildSecondBridgeAtomWithSub(7, {}, {}, 'c', '');
  assert.strictEqual(result, 'c2');
});

test('buildSecondBridgeAtomWithSub creates bridge with substituent', () => {
  const substituents = { 7: 'C' };
  const result = buildSecondBridgeAtomWithSub(7, substituents, {}, 'c', '');
  assert.strictEqual(result, 'c(C)2');
});

test('buildSecondBridgeAtomWithSub uses heteroatom', () => {
  const heteroAtoms = { 7: 'n' };
  const result = buildSecondBridgeAtomWithSub(7, {}, heteroAtoms, 'c', '');
  assert.strictEqual(result, 'n2');
});

// buildLastAtomWithSub tests
test('buildLastAtomWithSub creates atom without substituent', () => {
  const result = buildLastAtomWithSub(8, {}, {}, 'c', '');
  assert.strictEqual(result, 'c1');
});

test('buildLastAtomWithSub creates atom with substituent', () => {
  const substituents = { 8: 'C' };
  const result = buildLastAtomWithSub(8, substituents, {}, 'c', '');
  assert.strictEqual(result, 'c(C)1');
});

test('buildLastAtomWithSub uses heteroatom', () => {
  const heteroAtoms = { 8: 'n' };
  const result = buildLastAtomWithSub(8, {}, heteroAtoms, 'c', '');
  assert.strictEqual(result, 'n1');
});

// buildSmilesWithSubstituents tests
test('buildSmilesWithSubstituents creates naphthalene without substituents', () => {
  const result = buildSmilesWithSubstituents([6, 6], {}, {}, 'c');
  assert.strictEqual(result, 'c1ccc2ccccc2c1');
});

test('buildSmilesWithSubstituents creates structure with first atom substituent', () => {
  const substituents = { 0: 'C' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  assert.strictEqual(result, 'c1(C)ccc2ccccc2c1');
});

test('buildSmilesWithSubstituents creates structure with middle atom substituent', () => {
  const substituents = { 2: 'C' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  assert.strictEqual(result, 'c1cc(C)c2ccccc2c1');
});

test('buildSmilesWithSubstituents creates structure with bridge substituent', () => {
  const substituents = { 3: 'C' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  assert.strictEqual(result, 'c1ccc2(C)ccccc2c1');
});

test('buildSmilesWithSubstituents creates structure with multiple substituents', () => {
  const substituents = { 0: 'C', 5: 'O' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  assert.strictEqual(result, 'c1(C)ccc2cc(O)ccc2c1');
});

test('buildSmilesWithSubstituents uses heteroatoms', () => {
  const heteroAtoms = { 0: 'n' };
  const result = buildSmilesWithSubstituents([6, 6], {}, heteroAtoms, 'c');
  assert.strictEqual(result, 'n1ccc2ccccc2c1');
});

test('buildSmilesWithSubstituents combines heteroatoms and substituents', () => {
  const substituents = { 0: 'C' };
  const heteroAtoms = { 0: 'n' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, heteroAtoms, 'c');
  assert.strictEqual(result, 'n1(C)ccc2ccccc2c1');
});

test('buildSmilesWithSubstituents handles complex substituents', () => {
  const substituents = { 0: 'C(=O)O' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  assert.strictEqual(result, 'c1(C(=O)O)ccc2ccccc2c1');
});

test('buildSmilesWithSubstituents works with different ring sizes', () => {
  const result = buildSmilesWithSubstituents([6, 5], {}, {}, 'c');
  assert.strictEqual(result, 'c1ccc2cccc2c1');
});

test('buildSmilesWithSubstituents works with aliphatic rings', () => {
  const result = buildSmilesWithSubstituents([6, 6], {}, {}, 'C');
  assert.strictEqual(result, 'C1CCC2CCCCC2C1');
});

test('buildSmilesWithSubstituents with last atom substituent', () => {
  const substituents = { 9: 'C' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  assert.strictEqual(result, 'c1ccc2ccccc2c(C)1');
});

test('buildSmilesWithSubstituents remaps ring numbers in substituents', () => {
  const substituents = { 0: 'C1CC1' };
  const result = buildSmilesWithSubstituents([6, 6], substituents, {}, 'c');
  // Ring 1 and 2 are used by the fused rings, so the substituent ring should be 3
  assert.ok(result.includes('c1'));
  assert.ok(result.includes('2'));
  assert.ok(result.includes('3'));
});
