import { test } from 'node:test';
import assert from 'node:assert';
import { FusedRings } from '../src/fused-rings.js';

test('FusedRings creates naphthalene', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
});

test('FusedRings creates indene', () => {
  const indene = FusedRings([6, 5], 'c');
  assert.strictEqual(indene.smiles, 'c1ccc2cccc2c1');
});

test('FusedRings with hetero creates indole-like structure', () => {
  const indole = FusedRings([6, 5], 'c', { hetero: { 7: '[nH]' } });
  assert.strictEqual(indole.smiles, 'c1ccc2ccc[nH]2c1');
});

test('FusedRings with hetero creates quinoline', () => {
  const quinoline = FusedRings([6, 6], 'c', { hetero: { 0: 'n' } });
  assert.strictEqual(quinoline.smiles, 'n1ccc2ccccc2c1');
});

test('FusedRings throws on single ring', () => {
  assert.throws(() => FusedRings([6], 'c'), { message: 'FusedRings currently only supports 2 rings' });
});

test('FusedRings throws on 3+ rings', () => {
  assert.throws(() => FusedRings([6, 6, 6], 'c'), { message: 'FusedRings currently only supports 2 rings' });
});

test('FusedRings counts atoms correctly', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.strictEqual(naphthalene.atoms, 10);
});

test('FusedRings counts rings correctly', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.strictEqual(naphthalene.rings, 2);
});
