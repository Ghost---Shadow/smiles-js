import { test } from 'node:test';
import assert from 'node:assert';
import { FusedRings } from './index.js';
import { Fragment } from '../fragment.js';
import { Ring } from '../ring.js';
import { isValidSMILES } from '../test-utils.js';

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

test('FusedRings.attachAt attaches methyl to naphthalene', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const methylNaphthalene = naphthalene.attachAt([0, 0], 'C');
  assert.ok(await isValidSMILES(methylNaphthalene.smiles));
  assert.strictEqual(methylNaphthalene.smiles, 'c1(C)ccc2ccccc2c1');
});

test('FusedRings.attachAt attaches to second ring', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const substituted = naphthalene.attachAt([1, 1], 'C');
  assert.ok(await isValidSMILES(substituted.smiles));
  assert.strictEqual(substituted.smiles, 'c1ccc2c(C)cccc2c1');
});

test('FusedRings.attachAt chains multiple attachments', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const disubstituted = naphthalene.attachAt([0, 0], 'C').attachAt([1, 2], 'O');
  assert.ok(await isValidSMILES(disubstituted.smiles));
  assert.strictEqual(disubstituted.smiles, 'c1(C)ccc2cc(O)ccc2c1');
});

test('FusedRings.attachAt works with Fragment substituents', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const methyl = Fragment('C');
  const methylNaphthalene = naphthalene.attachAt([0, 1], methyl);
  assert.ok(await isValidSMILES(methylNaphthalene.smiles));
  assert.strictEqual(methylNaphthalene.smiles, 'c1c(C)cc2ccccc2c1');
});

test('FusedRings.attachAt throws on invalid position format', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.throws(() => naphthalene.attachAt(1, 'C'), /Position must be \[ringIndex, atomIndex\]/);
});

test('FusedRings.attachAt throws on invalid ring index', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.throws(() => naphthalene.attachAt([5, 0], 'C'), /Ring index 5 is out of range/);
});

test('FusedRings.attachAt works with heteroatom ring', async () => {
  const indole = FusedRings([6, 5], 'c', { hetero: { 4: '[nH]' } });
  const substituted = indole.attachAt([0, 0], 'C');
  assert.ok(await isValidSMILES(substituted.smiles));
});

test('FusedRings.attachAt attaches ring substituent', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const benzene = Ring('c', 6);
  const phenylNaphthalene = naphthalene.attachAt([0, 0], benzene);
  assert.ok(await isValidSMILES(phenylNaphthalene.smiles));
});

test('FusedRings.attachAt with options.at connects two naphthalenes', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const binaphthyl = naphthalene.attachAt([0, 1], naphthalene, { at: [0, 2] });
  assert.ok(await isValidSMILES(binaphthyl.smiles));
});

test('FusedRings.attachAt with options.at attaches at different ring positions', async () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const connected = naphthalene.attachAt([1, 1], naphthalene, { at: [1, 2] });
  assert.ok(await isValidSMILES(connected.smiles));
});

test('FusedRings.attachAt with options.at connects benzimidazoles', async () => {
  const benzimidazole = FusedRings([6, 5], 'c', { hetero: { 4: 'n', 6: '[nH]' } });
  const bisBenzimidazole = benzimidazole.attachAt([0, 3], benzimidazole, { at: [1, 1] });
  assert.ok(await isValidSMILES(bisBenzimidazole.smiles));
});

test('FusedRings.attachAt with options.at throws on invalid position', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  assert.throws(
    () => naphthalene.attachAt([0, 0], naphthalene, { at: [5, 0] }),
    /Attachment position \[5, 0\] not found/,
  );
});

test('FusedRings.attachAt with options.at throws on non-FusedRings substituent', () => {
  const naphthalene = FusedRings([6, 6], 'c');
  const methyl = Fragment('C');
  assert.throws(
    () => naphthalene.attachAt([0, 0], methyl, { at: [0, 0] }),
    /options.at is currently only supported for FusedRings substituents/,
  );
});

// Integration test: Telmisartan built from components
test('Telmisartan: build complete molecule from DSL components', async () => {
  // Benzimidazole core
  const benzimidazole = FusedRings([6, 5], 'c', { hetero: { 4: 'n', 6: '[nH]' } });
  assert.strictEqual(benzimidazole.smiles, 'c1ccc2nc[nH]c2c1');

  // N-methyl benzimidazole (second ring system)
  const nMethylBenzimidazole = benzimidazole.attachAt([1, 2], 'C');

  // Bis-benzimidazole: connect two benzimidazole systems
  const bisBenzimidazole = benzimidazole.attachAt([0, 2], nMethylBenzimidazole);

  // N-substituent: propyl + methylene-biphenyl-carboxylic acid linker
  const nSubstituent = Fragment('C(CCC)Cc1ccc(c2ccccc2C(=O)O)cc1');

  // Complete telmisartan: attach N-substituent to imidazole nitrogen
  const telmisartan = bisBenzimidazole.attachAt([1, 2], nSubstituent);

  // Validate the complete molecule
  assert.ok(await isValidSMILES(telmisartan.smiles));
});

test('Telmisartan: build with options.at (from README)', async () => {
  const benzimidazole = FusedRings([6, 5], 'c', { hetero: { 4: 'n', 6: '[nH]' } });
  const bisBenzimidazole = benzimidazole.attachAt([0, 3], benzimidazole, { at: [1, 1] });
  assert.ok(await isValidSMILES(bisBenzimidazole.smiles));
});
