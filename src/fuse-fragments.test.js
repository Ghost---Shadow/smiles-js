import { test } from 'node:test';
import assert from 'node:assert';
import { Fragment } from './index.js';
import { fuseFragmentsAtEdge } from './fuse-fragments.js';

test('fuseFragmentsAtEdge - fuse benzene to benzene at positions [0,1] to make naphthalene', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');

  const benzene1Meta = benzene1.meta;
  const benzene2Meta = benzene2.meta;

  const naphthalene = await fuseFragmentsAtEdge(benzene1, [0, 1], benzene2, Fragment);

  // Assert benzene before - 6 atoms each
  assert.strictEqual(benzene1Meta.molecules[0].atoms.length, 6);
  assert.strictEqual(benzene1Meta.molecules[0].bonds.length, 6);
  assert.strictEqual(benzene2Meta.molecules[0].atoms.length, 6);
  assert.strictEqual(benzene2Meta.molecules[0].bonds.length, 6);

  // Assert naphthalene after - 10 atoms (6+6-2 fused)
  assert.strictEqual(naphthalene.atoms, 10);
  assert.strictEqual(naphthalene.rings, 2);
  assert.strictEqual(naphthalene.formula, 'C10H8');
  assert.strictEqual(naphthalene.meta.molecules[0].atoms.length, 10);
  // Bonds: 6 (ring1) + 5 (ring2 minus fused edge) = 11
  assert.strictEqual(naphthalene.meta.molecules[0].bonds.length, 11);
  assert.strictEqual(naphthalene.meta.molecules[0].extensions[0].atomRings.length, 2);
});

test('fuseFragmentsAtEdge - fuse benzene to benzene at edge [1,2] to make naphthalene variant', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');

  const benzene1Meta = benzene1.meta;

  const naphthalene = await fuseFragmentsAtEdge(benzene1, [1, 2], benzene2, Fragment);

  // Assert benzene before
  assert.strictEqual(benzene1Meta.molecules[0].atoms.length, 6);
  assert.strictEqual(benzene1Meta.molecules[0].bonds.length, 6);

  // Assert naphthalene after
  assert.strictEqual(naphthalene.atoms, 10);
  assert.strictEqual(naphthalene.rings, 2);
  assert.strictEqual(naphthalene.formula, 'C10H8');
  assert.strictEqual(naphthalene.meta.molecules[0].atoms.length, 10);
  assert.strictEqual(naphthalene.meta.molecules[0].bonds.length, 11);
  assert.strictEqual(naphthalene.meta.molecules[0].extensions[0].atomRings.length, 2);
});

test('fuseFragmentsAtEdge - fuse three benzenes to make anthracene', async () => {
  const benzene1 = await Fragment('c1ccccc1');
  const benzene2 = await Fragment('c1ccccc1');
  const benzene3 = await Fragment('c1ccccc1');

  const benzene1Meta = benzene1.meta;

  const naphthalene = await fuseFragmentsAtEdge(benzene1, [0, 1], benzene2, Fragment);
  const naphthaleneMeta = naphthalene.meta;

  const anthracene = await fuseFragmentsAtEdge(naphthalene, [6, 7], benzene3, Fragment);

  // Assert benzene before
  assert.strictEqual(benzene1Meta.molecules[0].atoms.length, 6);

  // Assert naphthalene intermediate
  assert.strictEqual(naphthaleneMeta.molecules[0].atoms.length, 10);
  assert.strictEqual(naphthaleneMeta.molecules[0].bonds.length, 11);
  assert.strictEqual(naphthaleneMeta.molecules[0].extensions[0].atomRings.length, 2);

  // Assert anthracene after
  assert.strictEqual(anthracene.atoms, 14);
  assert.strictEqual(anthracene.rings, 3);
  assert.strictEqual(anthracene.formula, 'C14H10');
  assert.strictEqual(anthracene.meta.molecules[0].atoms.length, 14);
  // Bonds: 11 (naphthalene) + 5 (benzene minus fused edge) = 16
  assert.strictEqual(anthracene.meta.molecules[0].bonds.length, 16);
  assert.strictEqual(anthracene.meta.molecules[0].extensions[0].atomRings.length, 3);
});
