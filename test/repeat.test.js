import { test } from 'node:test';
import assert from 'node:assert';
import { Repeat } from '../src/repeat.js';
import { Fragment } from '../src/fragment.js';

test('Repeat creates hexane', () => {
  const hexane = Repeat('C', 6);
  assert.strictEqual(hexane.smiles, 'CCCCCC');
});

test('Repeat creates PEG-like chain', () => {
  const peg = Repeat('CCO', 4);
  assert.strictEqual(peg.smiles, 'CCOCCOCCOCCO');
});

test('Repeat creates polyethylene', () => {
  const polyethylene = Repeat('CC', 100);
  assert.strictEqual(polyethylene.smiles, 'CC'.repeat(100));
});

test('Repeat works with Fragment objects', () => {
  const methyl = Fragment('C');
  const chain = Repeat(methyl, 5);
  assert.strictEqual(chain.smiles, 'CCCCC');
});

test('Repeat counts atoms correctly', () => {
  const hexane = Repeat('C', 6);
  assert.strictEqual(hexane.atoms, 6);
});
