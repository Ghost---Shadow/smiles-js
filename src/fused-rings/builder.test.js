import { test } from 'node:test';
import assert from 'node:assert';
import {
  buildFirstAtom,
  buildFirstRingMiddleAtoms,
  buildFirstBridgeAtom,
  buildSecondRingMiddleAtoms,
  buildSecondBridgeAtom,
  buildLastAtom,
  buildBaseSmiles,
} from './builder.js';

// buildFirstAtom tests
test('buildFirstAtom creates first atom with ring marker 1', () => {
  const atomPositions = [];
  const result = buildFirstAtom(0, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'c1');
  assert.strictEqual(result.nextAtomPos, 1);
  assert.strictEqual(atomPositions.length, 1);
  assert.deepStrictEqual(atomPositions[0], { ring: 0, index: 0, smilesIndex: 0 });
});

test('buildFirstAtom uses heteroatom when specified', () => {
  const atomPositions = [];
  const heteroAtoms = { 0: 'n' };
  const result = buildFirstAtom(0, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'n1');
  assert.strictEqual(result.nextAtomPos, 1);
});

test('buildFirstAtom uses default atom when no heteroatom', () => {
  const atomPositions = [];
  const heteroAtoms = { 1: 'n' };
  const result = buildFirstAtom(0, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'c1');
});

// buildFirstRingMiddleAtoms tests
test('buildFirstRingMiddleAtoms creates multiple atoms', () => {
  const atomPositions = [];
  const result = buildFirstRingMiddleAtoms(1, 3, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'ccc');
  assert.strictEqual(result.nextAtomPos, 4);
  assert.strictEqual(atomPositions.length, 3);
});

test('buildFirstRingMiddleAtoms creates zero atoms when count is 0', () => {
  const atomPositions = [];
  const result = buildFirstRingMiddleAtoms(1, 0, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, '');
  assert.strictEqual(result.nextAtomPos, 1);
  assert.strictEqual(atomPositions.length, 0);
});

test('buildFirstRingMiddleAtoms uses heteroatoms', () => {
  const atomPositions = [];
  const heteroAtoms = { 2: 'n' };
  const result = buildFirstRingMiddleAtoms(1, 3, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'cnc');
  assert.strictEqual(result.nextAtomPos, 4);
});

test('buildFirstRingMiddleAtoms tracks atom positions', () => {
  const atomPositions = [];
  buildFirstRingMiddleAtoms(1, 2, {}, 'c', atomPositions);
  assert.strictEqual(atomPositions.length, 2);
  assert.strictEqual(atomPositions[0].ring, 0);
  assert.strictEqual(atomPositions[0].index, 1);
  assert.strictEqual(atomPositions[1].ring, 0);
  assert.strictEqual(atomPositions[1].index, 2);
});

// buildFirstBridgeAtom tests
test('buildFirstBridgeAtom creates bridge with ring marker 2', () => {
  const atomPositions = [];
  const result = buildFirstBridgeAtom(3, 6, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'c2');
  assert.strictEqual(result.nextAtomPos, 4);
  assert.strictEqual(atomPositions.length, 1);
  assert.strictEqual(atomPositions[0].shared, true);
});

test('buildFirstBridgeAtom calculates correct index', () => {
  const atomPositions = [];
  buildFirstBridgeAtom(3, 6, {}, 'c', atomPositions);
  assert.strictEqual(atomPositions[0].index, 3);
});

test('buildFirstBridgeAtom uses heteroatom', () => {
  const atomPositions = [];
  const heteroAtoms = { 3: 'n' };
  const result = buildFirstBridgeAtom(3, 6, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'n2');
});

// buildSecondRingMiddleAtoms tests
test('buildSecondRingMiddleAtoms creates atoms for second ring', () => {
  const atomPositions = [];
  const result = buildSecondRingMiddleAtoms(4, 3, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'ccc');
  assert.strictEqual(result.nextAtomPos, 7);
  assert.strictEqual(atomPositions.length, 3);
});

test('buildSecondRingMiddleAtoms tracks positions in ring 1', () => {
  const atomPositions = [];
  buildSecondRingMiddleAtoms(4, 2, {}, 'c', atomPositions);
  assert.strictEqual(atomPositions[0].ring, 1);
  assert.strictEqual(atomPositions[0].index, 1);
  assert.strictEqual(atomPositions[1].ring, 1);
  assert.strictEqual(atomPositions[1].index, 2);
});

test('buildSecondRingMiddleAtoms uses heteroatoms', () => {
  const atomPositions = [];
  const heteroAtoms = { 5: 'n' };
  const result = buildSecondRingMiddleAtoms(4, 3, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'cnc');
});

// buildSecondBridgeAtom tests
test('buildSecondBridgeAtom creates second bridge with marker 2', () => {
  const atomPositions = [];
  const result = buildSecondBridgeAtom(7, 6, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'c2');
  assert.strictEqual(result.nextAtomPos, 8);
  assert.strictEqual(atomPositions.length, 1);
  assert.strictEqual(atomPositions[0].shared, true);
});

test('buildSecondBridgeAtom calculates correct index for ring 1', () => {
  const atomPositions = [];
  buildSecondBridgeAtom(7, 6, {}, 'c', atomPositions);
  assert.strictEqual(atomPositions[0].ring, 1);
  assert.strictEqual(atomPositions[0].index, 5);
});

test('buildSecondBridgeAtom uses heteroatom', () => {
  const atomPositions = [];
  const heteroAtoms = { 7: 'n' };
  const result = buildSecondBridgeAtom(7, 6, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'n2');
});

// buildLastAtom tests
test('buildLastAtom creates last atom with ring marker 1', () => {
  const atomPositions = [];
  const result = buildLastAtom(8, 6, {}, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'c1');
  assert.strictEqual(result.nextAtomPos, 9);
  assert.strictEqual(atomPositions.length, 1);
});

test('buildLastAtom calculates correct index', () => {
  const atomPositions = [];
  buildLastAtom(8, 6, {}, 'c', atomPositions);
  assert.strictEqual(atomPositions[0].ring, 0);
  assert.strictEqual(atomPositions[0].index, 5);
});

test('buildLastAtom uses heteroatom', () => {
  const atomPositions = [];
  const heteroAtoms = { 8: 'n' };
  const result = buildLastAtom(8, 6, heteroAtoms, 'c', atomPositions);
  assert.strictEqual(result.smiles, 'n1');
});

// buildBaseSmiles tests
test('buildBaseSmiles creates naphthalene (two benzene rings)', () => {
  const result = buildBaseSmiles([6, 6], {}, 'c');
  assert.strictEqual(result.smiles, 'c1ccc2ccccc2c1');
  assert.strictEqual(result.totalAtoms, 10);
  assert.strictEqual(result.atomPositions.length, 10);
});

test('buildBaseSmiles creates correct structure for 6,5 fused rings', () => {
  const result = buildBaseSmiles([6, 5], {}, 'c');
  assert.strictEqual(result.smiles, 'c1ccc2cccc2c1');
  assert.strictEqual(result.totalAtoms, 9);
});

test('buildBaseSmiles creates correct structure for 5,6 fused rings', () => {
  const result = buildBaseSmiles([5, 6], {}, 'c');
  assert.strictEqual(result.smiles, 'c1cc2ccccc2c1');
  assert.strictEqual(result.totalAtoms, 9);
});

test('buildBaseSmiles uses heteroatoms at specified positions', () => {
  const heteroAtoms = { 0: 'n' };
  const result = buildBaseSmiles([6, 6], heteroAtoms, 'c');
  assert.strictEqual(result.smiles, 'n1ccc2ccccc2c1');
});

test('buildBaseSmiles uses heteroatoms at bridge positions', () => {
  const heteroAtoms = { 3: 'n', 7: 'n' };
  const result = buildBaseSmiles([6, 6], heteroAtoms, 'c');
  assert.strictEqual(result.smiles, 'c1ccn2cccnc2c1');
});

test('buildBaseSmiles uses different default atom types', () => {
  const result = buildBaseSmiles([6, 6], {}, 'C');
  assert.strictEqual(result.smiles, 'C1CCC2CCCCC2C1');
});

test('buildBaseSmiles tracks all atom positions correctly', () => {
  const result = buildBaseSmiles([6, 6], {}, 'c');
  assert.strictEqual(result.atomPositions.length, 10);
  assert.strictEqual(result.atomPositions[0].ring, 0);
  assert.strictEqual(result.atomPositions[0].index, 0);
});

test('buildBaseSmiles creates quinoline-like structure with heteroatom', () => {
  const heteroAtoms = { 8: 'n' };
  const result = buildBaseSmiles([6, 6], heteroAtoms, 'c');
  assert.strictEqual(result.smiles, 'c1ccc2ccccn2c1');
});
