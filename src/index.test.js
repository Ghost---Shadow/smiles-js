import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment, Ring } from './index.js';
import {
  benzene, methyl, hydroxyl, carboxyl,
} from './common.js';
import { isValidSMILES } from './test-utils.js';

test('README example: toluene', async () => {
  const benzeneRing = Ring({ type: 'c', size: 6 });
  const methylGroup = Fragment('C');
  const toluene = benzeneRing(methylGroup);
  assert.ok(await isValidSMILES(toluene.smiles));
  assert.strictEqual(String(toluene), 'c1ccccc1(C)');
  assert.deepStrictEqual(toluene.meta.toObject(), [
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
});

test('README example: ethanol', async () => {
  const ethyl = Fragment('CC');
  const hydroxylGroup = Fragment('O');
  const ethanol = ethyl(hydroxylGroup);
  assert.ok(await isValidSMILES(ethanol.smiles));
  assert.strictEqual(ethanol.smiles, 'CC(O)');
  assert.deepStrictEqual(ethanol.meta.toObject(), [
    {
      type: 'linear',
      atoms: 'CC',
      attachments: {
        2: [
          {
            type: 'linear',
            atoms: 'O',
            attachments: {},
          },
        ],
      },
    },
  ]);
});

test('README example: acetone', async () => {
  const methylGroup = Fragment('C');
  const acetone = methylGroup(Fragment('=O'))(methylGroup);
  assert.ok(await isValidSMILES(acetone.smiles));
  assert.strictEqual(acetone.smiles, 'C(=O)(C)');
  assert.deepStrictEqual(acetone.meta.toObject(), [
    {
      type: 'linear',
      atoms: 'C',
      attachments: {
        1: [
          {
            type: 'linear',
            atoms: '=O',
            attachments: {},
          },
          {
            type: 'linear',
            atoms: 'C',
            attachments: {},
          },
        ],
      },
    },
  ]);
});

test('README example: nested branching', async () => {
  const a = Fragment('C');
  const b = Fragment('CC');
  const c = Fragment('CCC');
  const molecule = a(b(c));
  assert.ok(await isValidSMILES(molecule.smiles));
  assert.strictEqual(molecule.smiles, 'C(CC(CCC))');
  assert.deepStrictEqual(molecule.meta.toObject(), [
    {
      type: 'linear',
      atoms: 'C',
      attachments: {
        1: [
          {
            type: 'linear',
            atoms: 'CC',
            attachments: {
              2: [
                {
                  type: 'linear',
                  atoms: 'CCC',
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

test('README example: aspirin', async () => {
  const benzeneRing = Ring({ type: 'c', size: 6 });
  const aspirin = benzeneRing.attachAt(2, carboxyl).attachAt(3, Fragment('OC(=O)C'));
  assert.ok(await isValidSMILES(aspirin.smiles));
  assert.strictEqual(aspirin.smiles, 'c1c(C(=O)O)c(OC(=O)C)ccc1');
  assert.deepStrictEqual(aspirin.meta.toObject(), [
    {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        2: [
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
        3: [
          {
            type: 'linear',
            atoms: 'OCC',
            attachments: {
              2: [
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

test('README example: ibuprofen', async () => {
  const benzeneRing = Ring({ type: 'c', size: 6 });
  const ibuprofen = benzeneRing.attachAt(2, Fragment('CC(C)C')).attachAt(5, Fragment('CC(C)C(=O)O'));
  assert.ok(await isValidSMILES(ibuprofen.smiles));
  assert.strictEqual(ibuprofen.smiles, 'c1c(CC(C)C)ccc(CC(C)C(=O)O)c1');
  assert.deepStrictEqual(ibuprofen.meta.toObject(), [
    {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        2: [
          {
            type: 'linear',
            atoms: 'CCC',
            attachments: {
              2: [
                {
                  type: 'linear',
                  atoms: 'C',
                  attachments: {},
                },
              ],
            },
          },
        ],
        5: [
          {
            type: 'linear',
            atoms: 'CCCO',
            attachments: {
              2: [
                {
                  type: 'linear',
                  atoms: 'C',
                  attachments: {},
                },
              ],
              3: [
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

test('README example: molecule library', async () => {
  // TODO: One test for each molecule
  const acetyl = Fragment('C(=O)C');
  const phenyl = benzene;

  const molecules = {
    toluene: phenyl(methyl),
    phenol: phenyl(hydroxyl),
    benzoicAcid: phenyl(carboxyl),
    acetophenone: phenyl(acetyl),
  };

  assert.ok(await isValidSMILES(molecules.toluene.smiles));
  assert.ok(await isValidSMILES(molecules.phenol.smiles));
  assert.ok(await isValidSMILES(molecules.benzoicAcid.smiles));
  assert.strictEqual(String(molecules.toluene), 'c1ccccc1(C)');
  assert.strictEqual(String(molecules.phenol), 'c1ccccc1(O)');
  assert.strictEqual(String(molecules.benzoicAcid), 'c1ccccc1(C(=O)O)');

  assert.deepStrictEqual(molecules.toluene.meta.toObject(), [
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
  assert.deepStrictEqual(molecules.phenol.meta.toObject(), [
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
  assert.deepStrictEqual(molecules.benzoicAcid.meta.toObject(), [
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

  assert.ok(await isValidSMILES(molecules.acetophenone.smiles));
  assert.strictEqual(String(molecules.acetophenone), 'c1ccccc1(C(=O)C)');
  assert.deepStrictEqual(molecules.acetophenone.meta.toObject(), [
    {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        6: [
          {
            type: 'linear',
            atoms: 'CC',
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
