import { test } from 'node:test';
import assert from 'node:assert';
import { Repeat } from '../src/repeat.js';
import { Fragment } from '../src/fragment.js';
import { isValidSMILES } from './test-utils.js';

test('Repeat creates hexane', async () => {
  const hexane = Repeat('C', 6);
  assert.ok(await isValidSMILES(hexane.smiles));
  assert.strictEqual(hexane.smiles, 'CCCCCC');
});

test('Repeat creates PEG-like chain', async () => {
  const peg = Repeat('CCO', 4);
  assert.ok(await isValidSMILES(peg.smiles));
  assert.strictEqual(peg.smiles, 'CCOCCOCCOCCO');
});

test('Repeat creates polyethylene', async () => {
  const polyethylene = Repeat('CC', 100);
  assert.ok(await isValidSMILES(polyethylene.smiles));
  assert.strictEqual(polyethylene.smiles, 'CC'.repeat(100));
});

test('Repeat works with Fragment objects', async () => {
  const methyl = Fragment('C');
  const chain = Repeat(methyl, 5);
  assert.ok(await isValidSMILES(chain.smiles));
  assert.strictEqual(chain.smiles, 'CCCCC');
});

test('Repeat counts atoms correctly', async () => {
  const hexane = Repeat('C', 6);
  assert.ok(await isValidSMILES(hexane.smiles));
  assert.strictEqual(hexane.atoms, 6);
});
