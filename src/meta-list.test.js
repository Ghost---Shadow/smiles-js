import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import { Meta, MetaType } from './meta.js';
import { MetaList } from './meta-list.js';

describe('MetaList', () => {
  test('creates empty MetaList', () => {
    const list = new MetaList();
    assert.strictEqual(list.length, 0);
    assert.ok(list instanceof Array);
    assert.ok(list instanceof MetaList);
  });

  test('creates MetaList from array of Meta instances', () => {
    const meta1 = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const meta2 = new Meta({ type: MetaType.LINEAR, atoms: 'CC' });
    const list = MetaList.from([meta1, meta2]);

    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0], meta1);
    assert.strictEqual(list[1], meta2);
  });

  test('toObject converts all Meta instances to plain objects', () => {
    const meta1 = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const meta2 = new Meta({ type: MetaType.LINEAR, atoms: 'CC' });
    const list = MetaList.from([meta1, meta2]);

    const result = list.toObject();

    assert.deepStrictEqual(result, [
      { type: 'linear', atoms: 'C', attachments: {} },
      { type: 'linear', atoms: 'CC', attachments: {} },
    ]);
  });

  test('toObject handles ring Meta instances', () => {
    const ring1 = new Meta({
      type: MetaType.RING,
      atoms: 'c',
      size: 6,
      ringNumber: 1,
    });
    const ring2 = new Meta({
      type: MetaType.RING,
      atoms: 'c',
      size: 6,
      ringNumber: 2,
      offset: 3,
    });
    const list = MetaList.from([ring1, ring2]);

    const result = list.toObject();

    assert.deepStrictEqual(result, [
      {
        type: 'ring', atoms: 'c', size: 6, ringNumber: 1, attachments: {},
      },
      {
        type: 'ring', atoms: 'c', size: 6, ringNumber: 2, offset: 3, attachments: {},
      },
    ]);
  });

  test('toObject handles Meta with attachments', () => {
    const attachment = new Meta({ type: MetaType.LINEAR, atoms: 'Cl' });
    const ring = new Meta({
      type: MetaType.RING,
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      attachments: {
        3: [attachment],
      },
    });
    const list = MetaList.from([ring]);

    const result = list.toObject();

    assert.deepStrictEqual(result, [
      {
        type: 'ring',
        atoms: 'c',
        size: 6,
        ringNumber: 1,
        attachments: {
          3: [{ type: 'linear', atoms: 'Cl', attachments: {} }],
        },
      },
    ]);
  });

  test('supports array methods like push', () => {
    const list = new MetaList();
    const meta1 = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const meta2 = new Meta({ type: MetaType.LINEAR, atoms: 'O' });

    list.push(meta1);
    list.push(meta2);

    assert.strictEqual(list.length, 2);
    assert.deepStrictEqual(list.toObject(), [
      { type: 'linear', atoms: 'C', attachments: {} },
      { type: 'linear', atoms: 'O', attachments: {} },
    ]);
  });

  test('supports array methods like map', () => {
    const meta1 = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const meta2 = new Meta({ type: MetaType.LINEAR, atoms: 'O' });
    const list = MetaList.from([meta1, meta2]);

    const atoms = list.map((m) => m.atoms);

    assert.deepStrictEqual(atoms, ['C', 'O']);
  });

  test('supports array methods like filter', () => {
    const linear = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const ring = new Meta({ type: MetaType.RING, atoms: 'c', size: 6 });
    const list = MetaList.from([linear, ring]);

    const rings = list.filter((m) => m.type === MetaType.RING);

    assert.strictEqual(rings.length, 1);
    assert.strictEqual(rings[0], ring);
  });

  test('supports array indexing', () => {
    const meta1 = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const meta2 = new Meta({ type: MetaType.LINEAR, atoms: 'O' });
    const list = MetaList.from([meta1, meta2]);

    assert.strictEqual(list[0], meta1);
    assert.strictEqual(list[1], meta2);
    assert.deepStrictEqual(list[0].toObject(), { type: 'linear', atoms: 'C', attachments: {} });
  });

  test('handles empty list toObject', () => {
    const list = new MetaList();
    const result = list.toObject();

    assert.deepStrictEqual(result, []);
  });

  test('throws error for non-Meta items', () => {
    const list = new MetaList();
    const meta = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    list.push(meta);
    list.push(null);

    assert.throws(() => {
      list.toObject();
    }, Error, 'Not Meta');
  });

  test('from() converts plain objects to Meta instances', () => {
    const plainObjects = [
      { type: MetaType.LINEAR, atoms: 'C' },
      { type: MetaType.LINEAR, atoms: 'O' },
    ];
    const list = MetaList.from(plainObjects);

    assert.strictEqual(list.length, 2);
    assert.ok(list[0] instanceof Meta);
    assert.ok(list[1] instanceof Meta);
    assert.deepStrictEqual(list.toObject(), [
      { type: 'linear', atoms: 'C', attachments: {} },
      { type: 'linear', atoms: 'O', attachments: {} },
    ]);
  });

  test('from() handles mixed Meta instances and plain objects', () => {
    const meta = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const plainObject = { type: MetaType.LINEAR, atoms: 'O' };
    const list = MetaList.from([meta, plainObject]);

    assert.strictEqual(list.length, 2);
    assert.ok(list[0] instanceof Meta);
    assert.ok(list[1] instanceof Meta);
    assert.deepStrictEqual(list.toObject(), [
      { type: 'linear', atoms: 'C', attachments: {} },
      { type: 'linear', atoms: 'O', attachments: {} },
    ]);
  });

  test('round trip: from() and toObject() are inverses', () => {
    const plainObjects = [
      { type: MetaType.LINEAR, atoms: 'C', attachments: {} },
      {
        type: MetaType.RING, atoms: 'c', size: 6, ringNumber: 1, attachments: {},
      },
      {
        type: MetaType.RING,
        atoms: 'c',
        size: 6,
        ringNumber: 2,
        offset: 3,
        attachments: {
          3: [{ type: MetaType.LINEAR, atoms: 'Cl', attachments: {} }],
        },
      },
    ];

    const list = MetaList.from(plainObjects);
    const result = list.toObject();

    assert.deepStrictEqual(result, plainObjects);
  });

  test('round trip: toObject() then from() recreates MetaList', () => {
    const meta1 = new Meta({ type: MetaType.LINEAR, atoms: 'C' });
    const meta2 = new Meta({
      type: MetaType.RING, atoms: 'c', size: 6, ringNumber: 1,
    });
    const originalList = MetaList.from([meta1, meta2]);

    const plainObjects = originalList.toObject();
    const recreatedList = MetaList.from(plainObjects);

    assert.strictEqual(recreatedList.length, originalList.length);
    assert.deepStrictEqual(recreatedList.toObject(), originalList.toObject());
  });
});
