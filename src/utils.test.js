import { test } from 'node:test';
import assert from 'node:assert';
import { findUsedRingNumbers, getNextRingNumber, deepMerge } from './utils.js';

// findUsedRingNumbers tests
test('findUsedRingNumbers finds single digit ring numbers', () => {
  const result = findUsedRingNumbers('C1CCC1');
  assert.ok(result.has('1'));
  assert.strictEqual(result.size, 1);
});

test('findUsedRingNumbers finds multiple single digit ring numbers', () => {
  const result = findUsedRingNumbers('C1CCC1C2CCC2');
  assert.ok(result.has('1'));
  assert.ok(result.has('2'));
  assert.strictEqual(result.size, 2);
});

test('findUsedRingNumbers finds double digit ring numbers with % prefix', () => {
  const result = findUsedRingNumbers('C%10CCC%10');
  assert.ok(result.has('10'));
  assert.strictEqual(result.size, 1);
});

test('findUsedRingNumbers finds mixed single and double digit ring numbers', () => {
  const result = findUsedRingNumbers('C1CCC1C%10CCC%10');
  assert.ok(result.has('1'));
  assert.ok(result.has('10'));
  assert.strictEqual(result.size, 2);
});

test('findUsedRingNumbers returns empty set for no rings', () => {
  const result = findUsedRingNumbers('CCCC');
  assert.strictEqual(result.size, 0);
});

test('findUsedRingNumbers handles aromatic rings', () => {
  const result = findUsedRingNumbers('c1ccccc1');
  assert.ok(result.has('1'));
  assert.strictEqual(result.size, 1);
});

test('findUsedRingNumbers handles multiple rings in benzene derivatives', () => {
  const result = findUsedRingNumbers('c1ccccc1c2ccccc2');
  assert.ok(result.has('1'));
  assert.ok(result.has('2'));
  assert.strictEqual(result.size, 2);
});

test('findUsedRingNumbers handles fused rings', () => {
  const result = findUsedRingNumbers('c1ccc2ccccc2c1');
  assert.ok(result.has('1'));
  assert.ok(result.has('2'));
  assert.strictEqual(result.size, 2);
});

test('findUsedRingNumbers detects ring numbers (does not skip bracket contents)', () => {
  const result = findUsedRingNumbers('[13C]1CCC1');
  assert.ok(result.has('1'));
  assert.ok(result.has('3'));
  assert.strictEqual(result.size, 2);
});

test('findUsedRingNumbers handles all single digits 1-9', () => {
  const smiles = 'C1CCC1C2CCC2C3CCC3C4CCC4C5CCC5C6CCC6C7CCC7C8CCC8C9CCC9';
  const result = findUsedRingNumbers(smiles);
  assert.strictEqual(result.size, 9);
  for (let i = 1; i <= 9; i += 1) {
    assert.ok(result.has(String(i)));
  }
});

// getNextRingNumber tests
test('getNextRingNumber returns 1 for empty SMILES', () => {
  const result = getNextRingNumber('');
  assert.strictEqual(result, '1');
});

test('getNextRingNumber returns 1 for SMILES without rings', () => {
  const result = getNextRingNumber('CCCC');
  assert.strictEqual(result, '1');
});

test('getNextRingNumber returns 2 when 1 is used', () => {
  const result = getNextRingNumber('C1CCC1');
  assert.strictEqual(result, '2');
});

test('getNextRingNumber returns 3 when 1 and 2 are used', () => {
  const result = getNextRingNumber('C1CCC1C2CCC2');
  assert.strictEqual(result, '3');
});

test('getNextRingNumber finds first available number', () => {
  const result = getNextRingNumber('C1CCC1C3CCC3');
  assert.strictEqual(result, '2');
});

test('getNextRingNumber returns %10 when all single digits are used', () => {
  const smiles = 'C1CCC1C2CCC2C3CCC3C4CCC4C5CCC5C6CCC6C7CCC7C8CCC8C9CCC9';
  const result = getNextRingNumber(smiles);
  assert.strictEqual(result, '%10');
});

test('getNextRingNumber handles existing double digit ring numbers', () => {
  const smiles = 'C1CCC1C2CCC2C3CCC3C4CCC4C5CCC5C6CCC6C7CCC7C8CCC8C9CCC9C%10CCC%10';
  const result = getNextRingNumber(smiles);
  assert.strictEqual(result, '%11');
});

test('getNextRingNumber finds gaps in double digit ring numbers', () => {
  const smiles = 'C%10CCC%10C%12CCC%12';
  const result = getNextRingNumber(smiles);
  assert.strictEqual(result, '1');
});

test('getNextRingNumber handles complex molecules with multiple ring types', () => {
  const result = getNextRingNumber('c1ccccc1C2CCC2');
  assert.strictEqual(result, '3');
});

test('getNextRingNumber throws error when all ring numbers exhausted', () => {
  // Create a SMILES with all ring numbers 1-99 used
  let smiles = '';
  for (let i = 1; i <= 9; i += 1) {
    smiles += `C${i}CCC${i}`;
  }
  for (let i = 10; i <= 99; i += 1) {
    smiles += `C%${i}CCC%${i}`;
  }
  assert.throws(() => getNextRingNumber(smiles), /Too many rings/);
});

// deepMerge tests
test('deepMerge merges two flat objects', () => {
  const target = { a: 1, b: 2 };
  const source = { b: 3, c: 4 };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
});

test('deepMerge does not mutate target', () => {
  const target = { a: 1, b: 2 };
  const source = { b: 3, c: 4 };
  deepMerge(target, source);
  assert.deepStrictEqual(target, { a: 1, b: 2 });
});

test('deepMerge merges nested objects', () => {
  const target = { a: 1, b: { c: 2, d: 3 } };
  const source = { b: { d: 4, e: 5 }, f: 6 };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1, b: { c: 2, d: 4, e: 5 }, f: 6 });
});

test('deepMerge overwrites primitives', () => {
  const target = { a: 1, b: 'old' };
  const source = { b: 'new', c: true };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1, b: 'new', c: true });
});

test('deepMerge overwrites arrays', () => {
  const target = { a: [1, 2, 3], b: 2 };
  const source = { a: [4, 5] };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: [4, 5], b: 2 });
});

test('deepMerge handles null values', () => {
  const target = { a: 1, b: { c: 2 } };
  const source = { b: null };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1, b: null });
});

test('deepMerge handles undefined in source', () => {
  const target = { a: 1, b: 2 };
  const source = { b: undefined };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1, b: undefined });
});

test('deepMerge merges deeply nested objects', () => {
  const target = { a: { b: { c: { d: 1 } } } };
  const source = { a: { b: { c: { e: 2 }, f: 3 } } };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: { b: { c: { d: 1, e: 2 }, f: 3 } } });
});

test('deepMerge handles empty objects', () => {
  const target = { a: 1 };
  const source = {};
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1 });
});

test('deepMerge merges into empty target', () => {
  const target = {};
  const source = { a: 1, b: 2 };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, { a: 1, b: 2 });
});

test('deepMerge handles object with nested attachments', () => {
  const target = {
    type: 'c',
    size: 6,
    attachments: { 1: 'Cl' },
  };
  const source = {
    attachments: { 3: 'Br' },
  };
  const result = deepMerge(target, source);
  assert.deepStrictEqual(result, {
    type: 'c',
    size: 6,
    attachments: { 1: 'Cl', 3: 'Br' },
  });
});
