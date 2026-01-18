import { test } from 'node:test';
import assert from 'node:assert';
import {
  validatePosition,
  validateRingIndex,
  findGlobalPosition,
  extractSubstituentSmiles,
  remapRingNumbers,
  getAtomString,
  buildAtomWithSubstituent,
} from './utils.js';

test('validatePosition accepts valid position array', () => {
  assert.doesNotThrow(() => validatePosition([0, 1]));
  assert.doesNotThrow(() => validatePosition([1, 5]));
});

test('validatePosition throws on non-array', () => {
  assert.throws(() => validatePosition(5), { message: 'Position must be [ringIndex, atomIndex]' });
  assert.throws(() => validatePosition('test'), { message: 'Position must be [ringIndex, atomIndex]' });
});

test('validatePosition throws on wrong array length', () => {
  assert.throws(() => validatePosition([0]), { message: 'Position must be [ringIndex, atomIndex]' });
  assert.throws(() => validatePosition([0, 1, 2]), { message: 'Position must be [ringIndex, atomIndex]' });
});

test('validateRingIndex accepts valid ring index', () => {
  assert.doesNotThrow(() => validateRingIndex(0, [6, 6]));
  assert.doesNotThrow(() => validateRingIndex(1, [6, 6]));
});

test('validateRingIndex throws on negative index', () => {
  assert.throws(() => validateRingIndex(-1, [6, 6]), { message: 'Ring index -1 is out of range' });
});

test('validateRingIndex throws on index too large', () => {
  assert.throws(() => validateRingIndex(2, [6, 6]), { message: 'Ring index 2 is out of range' });
  assert.throws(() => validateRingIndex(5, [6, 6]), { message: 'Ring index 5 is out of range' });
});

test('findGlobalPosition finds position in first ring', () => {
  const atomPositions = [
    { ring: 0, index: 0 },
    { ring: 0, index: 1 },
    { ring: 0, index: 2 },
  ];
  assert.strictEqual(findGlobalPosition(0, 0, atomPositions, [6, 6]), 0);
  assert.strictEqual(findGlobalPosition(0, 1, atomPositions, [6, 6]), 1);
  assert.strictEqual(findGlobalPosition(0, 2, atomPositions, [6, 6]), 2);
});

test('findGlobalPosition finds position in second ring', () => {
  const atomPositions = [
    { ring: 0, index: 0 },
    { ring: 1, index: 0 },
    { ring: 1, index: 1 },
  ];
  assert.strictEqual(findGlobalPosition(1, 0, atomPositions, [6, 6]), 1);
  assert.strictEqual(findGlobalPosition(1, 1, atomPositions, [6, 6]), 2);
});

test('findGlobalPosition handles shared atoms', () => {
  const atomPositions = [
    { ring: 0, index: 0 },
    { ring: 0, index: 3, shared: true },
  ];
  assert.strictEqual(findGlobalPosition(0, 3, atomPositions, [6, 6]), 1);
  assert.strictEqual(findGlobalPosition(1, 0, atomPositions, [6, 6]), 1);
});

test('findGlobalPosition returns -1 for not found', () => {
  const atomPositions = [
    { ring: 0, index: 0 },
    { ring: 0, index: 1 },
  ];
  assert.strictEqual(findGlobalPosition(0, 5, atomPositions, [6, 6]), -1);
  assert.strictEqual(findGlobalPosition(1, 0, atomPositions, [6, 6]), -1);
});

test('extractSubstituentSmiles extracts from string', () => {
  assert.strictEqual(extractSubstituentSmiles('C'), 'C');
  assert.strictEqual(extractSubstituentSmiles('CCO'), 'CCO');
});

test('extractSubstituentSmiles extracts from object with smiles property', () => {
  assert.strictEqual(extractSubstituentSmiles({ smiles: 'C1CCCCC1' }), 'C1CCCCC1');
});

test('extractSubstituentSmiles converts to string as fallback', () => {
  assert.strictEqual(extractSubstituentSmiles(123), '123');
  assert.strictEqual(extractSubstituentSmiles(true), 'true');
});

test('remapRingNumbers remaps conflicting single digit ring numbers', () => {
  const current = 'C1CCC1';
  const sub = 'C1CC1';
  const remapped = remapRingNumbers(current, sub);
  assert.notStrictEqual(remapped, 'C1CC1');
  assert.ok(remapped.includes('3'));
});

test('remapRingNumbers remaps conflicting double digit ring numbers', () => {
  const current = 'C%10CCC%10';
  const sub = 'C%10CC%10';
  const remapped = remapRingNumbers(current, sub);
  assert.notStrictEqual(remapped, 'C%10CC%10');
});

test('remapRingNumbers preserves non-conflicting ring numbers', () => {
  const current = 'C1CCC1';
  const sub = 'C3CC3';
  const remapped = remapRingNumbers(current, sub);
  assert.strictEqual(remapped, 'C3CC3');
});

test('remapRingNumbers always reserves 1 and 2 for fused rings', () => {
  const current = 'C';
  const sub = 'C1CC1';
  const remapped = remapRingNumbers(current, sub);
  assert.notStrictEqual(remapped, 'C1CC1');
});

test('getAtomString returns heteroatom when defined', () => {
  const heteroAtoms = { 0: 'N', 2: 'O' };
  assert.strictEqual(getAtomString(0, heteroAtoms, 'C'), 'N');
  assert.strictEqual(getAtomString(2, heteroAtoms, 'C'), 'O');
});

test('getAtomString returns default atom when heteroatom not defined', () => {
  const heteroAtoms = { 0: 'N' };
  assert.strictEqual(getAtomString(1, heteroAtoms, 'C'), 'C');
  assert.strictEqual(getAtomString(5, heteroAtoms, 'c'), 'c');
});

test('buildAtomWithSubstituent builds atom without substituent', () => {
  assert.strictEqual(buildAtomWithSubstituent('C', null, '1', true), 'C1');
  assert.strictEqual(buildAtomWithSubstituent('N', null, '', false), 'N');
});

test('buildAtomWithSubstituent builds atom with substituent and marker before', () => {
  assert.strictEqual(buildAtomWithSubstituent('C', 'CCO', '1', true), 'C1(CCO)');
  assert.strictEqual(buildAtomWithSubstituent('N', 'C', '2', true), 'N2(C)');
});

test('buildAtomWithSubstituent builds atom with substituent and marker after', () => {
  assert.strictEqual(buildAtomWithSubstituent('C', 'CCO', '1', false), 'C(CCO)1');
  assert.strictEqual(buildAtomWithSubstituent('N', 'C', '2', false), 'N(C)2');
});

test('buildAtomWithSubstituent handles no marker', () => {
  assert.strictEqual(buildAtomWithSubstituent('C', 'O', '', false), 'C(O)');
});
