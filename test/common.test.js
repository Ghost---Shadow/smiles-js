import { test } from 'node:test';
import assert from 'node:assert';
import {
  methyl, ethyl, propyl, isopropyl, butyl, tbutyl,
  hydroxyl, amino, carboxyl, carbonyl, nitro, cyano,
  fluoro, chloro, bromo, iodo,
  benzene, cyclohexane, pyridine, pyrrole, furan, thiophene,
  naphthalene, indole, quinoline
} from '../src/common.js';

test('Common alkyls are defined', () => {
  assert.strictEqual(methyl.smiles, 'C');
  assert.strictEqual(ethyl.smiles, 'CC');
  assert.strictEqual(propyl.smiles, 'CCC');
  assert.strictEqual(isopropyl.smiles, 'C(C)C');
  assert.strictEqual(butyl.smiles, 'CCCC');
  assert.strictEqual(tbutyl.smiles, 'C(C)(C)C');
});

test('Common functional groups are defined', () => {
  assert.strictEqual(hydroxyl.smiles, 'O');
  assert.strictEqual(amino.smiles, 'N');
  assert.strictEqual(carboxyl.smiles, 'C(=O)O');
  assert.strictEqual(carbonyl.smiles, 'C=O');
  assert.strictEqual(nitro.smiles, '[N+](=O)[O-]');
  assert.strictEqual(cyano.smiles, 'C#N');
});

test('Common halogens are defined', () => {
  assert.strictEqual(fluoro.smiles, 'F');
  assert.strictEqual(chloro.smiles, 'Cl');
  assert.strictEqual(bromo.smiles, 'Br');
  assert.strictEqual(iodo.smiles, 'I');
});

test('Common rings are defined', () => {
  assert.strictEqual(benzene.smiles, 'c1ccccc1');
  assert.strictEqual(cyclohexane.smiles, 'C1CCCCC1');
  assert.strictEqual(pyridine.smiles, 'n1ccccc1');
  assert.strictEqual(pyrrole.smiles, '[nH]1cccc1');
  assert.strictEqual(furan.smiles, 'o1cccc1');
  assert.strictEqual(thiophene.smiles, 's1cccc1');
});

test('Common fused rings are defined', () => {
  assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
  assert.strictEqual(indole.smiles, 'c1ccc2ccc[nH]2c1');
  assert.strictEqual(quinoline.smiles, 'n1ccc2ccccc2c1');
});

test('Common fragments can be composed', () => {
  const toluene = benzene(methyl);
  assert.strictEqual(toluene.smiles, 'c1ccccc1(C)');

  const phenol = benzene(hydroxyl);
  assert.strictEqual(phenol.smiles, 'c1ccccc1(O)');

  const benzoicAcid = benzene(carboxyl);
  assert.strictEqual(benzoicAcid.smiles, 'c1ccccc1(C(=O)O)');
});
