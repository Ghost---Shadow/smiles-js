import { test } from 'node:test';
import assert from 'node:assert';
import { isValidSMILES } from './test-utils.js';
import {
  methyl, ethyl, propyl, isopropyl, butyl, tbutyl,
  hydroxyl, amino, carboxyl, carbonyl, nitro, cyano,
  fluoro, chloro, bromo, iodo,
  benzene, cyclohexane, pyridine, pyrrole, furan, thiophene,
  naphthalene, indole, quinoline,
} from './common.js';

test('Common alkyls are defined', async () => {
  assert.strictEqual(methyl.smiles, 'C');
  assert.ok(await isValidSMILES(methyl.smiles));
  assert.strictEqual(ethyl.smiles, 'CC');
  assert.ok(await isValidSMILES(ethyl.smiles));
  assert.strictEqual(propyl.smiles, 'CCC');
  assert.ok(await isValidSMILES(propyl.smiles));
  assert.strictEqual(isopropyl.smiles, 'C(C)C');
  assert.ok(await isValidSMILES(isopropyl.smiles));
  assert.strictEqual(butyl.smiles, 'CCCC');
  assert.ok(await isValidSMILES(butyl.smiles));
  assert.strictEqual(tbutyl.smiles, 'C(C)(C)C');
  assert.ok(await isValidSMILES(tbutyl.smiles));
});

test('Common functional groups are defined', async () => {
  assert.strictEqual(hydroxyl.smiles, 'O');
  assert.ok(await isValidSMILES(hydroxyl.smiles));
  assert.strictEqual(amino.smiles, 'N');
  assert.ok(await isValidSMILES(amino.smiles));
  assert.strictEqual(carboxyl.smiles, 'C(=O)O');
  assert.ok(await isValidSMILES(carboxyl.smiles));
  assert.strictEqual(carbonyl.smiles, 'C=O');
  assert.ok(await isValidSMILES(carbonyl.smiles));
  assert.strictEqual(nitro.smiles, '[N+](=O)[O-]');
  assert.ok(await isValidSMILES(nitro.smiles));
  assert.strictEqual(cyano.smiles, 'C#N');
  assert.ok(await isValidSMILES(cyano.smiles));
});

test('Common halogens are defined', async () => {
  assert.strictEqual(fluoro.smiles, 'F');
  assert.ok(await isValidSMILES(fluoro.smiles));
  assert.strictEqual(chloro.smiles, 'Cl');
  assert.ok(await isValidSMILES(chloro.smiles));
  assert.strictEqual(bromo.smiles, 'Br');
  assert.ok(await isValidSMILES(bromo.smiles));
  assert.strictEqual(iodo.smiles, 'I');
  assert.ok(await isValidSMILES(iodo.smiles));
});

test('Common rings are defined', async () => {
  assert.strictEqual(benzene.smiles, 'c1ccccc1');
  assert.ok(await isValidSMILES(benzene.smiles));
  assert.strictEqual(cyclohexane.smiles, 'C1CCCCC1');
  assert.ok(await isValidSMILES(cyclohexane.smiles));
  assert.strictEqual(pyridine.smiles, 'n1ccccc1');
  assert.ok(await isValidSMILES(pyridine.smiles));
  assert.strictEqual(pyrrole.smiles, '[nH]1cccc1');
  assert.ok(await isValidSMILES(pyrrole.smiles));
  assert.strictEqual(furan.smiles, 'o1cccc1');
  assert.ok(await isValidSMILES(furan.smiles));
  assert.strictEqual(thiophene.smiles, 's1cccc1');
  assert.ok(await isValidSMILES(thiophene.smiles));
});

test('Common fused rings are defined', async () => {
  assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
  assert.ok(await isValidSMILES(naphthalene.smiles));
  assert.strictEqual(indole.smiles, 'c1ccc2[nH]ccc2c1');
  assert.ok(await isValidSMILES(indole.smiles));
  assert.strictEqual(quinoline.smiles, 'n1ccc2ccccc2c1');
  assert.ok(await isValidSMILES(quinoline.smiles));
});

test('Common fragments can be composed', async () => {
  const toluene = benzene(methyl);
  assert.strictEqual(toluene.smiles, 'c1ccccc1(C)');
  assert.ok(await isValidSMILES(toluene.smiles));
  assert.deepStrictEqual(toluene.meta.map((m) => m.toObject()), [
    {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        6: [
          {
            type: 'linear',
            atoms: 'C',
            attachments: {},
          },
        ],
      },
    },
  ]);

  const phenol = benzene(hydroxyl);
  assert.strictEqual(phenol.smiles, 'c1ccccc1(O)');
  assert.ok(await isValidSMILES(phenol.smiles));
  assert.deepStrictEqual(phenol.meta.map((m) => m.toObject()), [
    {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        6: [
          {
            type: 'linear',
            atoms: 'O',
            attachments: {},
          },
        ],
      },
    },
  ]);

  const benzoicAcid = benzene(carboxyl);
  assert.strictEqual(benzoicAcid.smiles, 'c1ccccc1(C(=O)O)');
  assert.ok(await isValidSMILES(benzoicAcid.smiles));
  assert.deepStrictEqual(benzoicAcid.meta.map((m) => m.toObject()), [
    {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        6: [
          {
            type: 'linear',
            atoms: 'CO',
            attachments: {
              1: [
                {
                  type: 'linear',
                  atoms: '=O',
                  attachments: {},
                },
              ],
            },
          },
        ],
      },
    },
  ]);
});
