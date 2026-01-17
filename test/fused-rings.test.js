import { test } from 'node:test';
import assert from 'node:assert';
import { FusedRings } from '../src/fused-rings.js';
import { isValidSMILES } from './test-utils.js';

test('FusedRings creates naphthalene', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.ok(await isValidSMILES(naphthalene.smiles));
  assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
});

test('FusedRings creates fused 6-5 ring system', async () => {
  const fused = FusedRings([6, 5], 'C');
  assert.ok(await isValidSMILES(fused.smiles));
  assert.strictEqual(fused.smiles, 'C1CCC2CCCC2C1');
});

test('FusedRings with hetero creates indole-like structure', async () => {
  const indole = FusedRings([6, 5], 'c', { hetero: { 4: '[nH]' } });
  assert.ok(await isValidSMILES(indole.smiles));
  assert.strictEqual(indole.smiles, 'c1ccc2[nH]ccc2c1');
});

test('FusedRings with hetero creates quinoline', async () => {
  const quinoline = FusedRings([6, 6], 'c', { hetero: { 0: 'n' } });
  assert.ok(await isValidSMILES(quinoline.smiles));
  assert.strictEqual(quinoline.smiles, 'n1ccc2ccccc2c1');
});

test('FusedRings throws on single ring', () => {
  assert.throws(() => FusedRings([6], 'c'), { message: 'FusedRings currently only supports 2 rings' });
});

test('FusedRings throws on 3+ rings', () => {
  assert.throws(() => FusedRings([6, 6, 6], 'c'), { message: 'FusedRings currently only supports 2 rings' });
});

test('FusedRings counts atoms correctly', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.ok(await isValidSMILES(naphthalene.smiles));
  assert.strictEqual(naphthalene.atoms, 10);
});

test('FusedRings counts rings correctly', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.ok(await isValidSMILES(naphthalene.smiles));
  assert.strictEqual(naphthalene.rings, 2);
});
