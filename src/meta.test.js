import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import { Meta, MetaType } from './meta.js';

describe('Meta constructor', () => {
  test('creates linear meta', () => {
    const meta = new Meta({
      type: MetaType.LINEAR,
      smiles: 'CCC',
    });
    assert.strictEqual(meta.type, 'linear');
    assert.strictEqual(meta.smiles, 'CCC');
  });

  test('creates ring meta', () => {
    const meta = new Meta({
      type: MetaType.RING,
      atoms: 'c',
      size: 6,
      ringNumber: 1,
    });
    assert.strictEqual(meta.type, 'ring');
    assert.strictEqual(meta.atoms, 'c');
    assert.strictEqual(meta.size, 6);
    assert.strictEqual(meta.ringNumber, 1);
  });
});

describe('Meta.update', () => {
  test('updates linear meta', () => {
    const meta = new Meta({
      type: MetaType.LINEAR,
      smiles: 'CC',
    });
    const updated = meta.update({ smiles: 'CCO' });
    assert.strictEqual(updated.smiles, 'CCO');
    assert.strictEqual(meta.smiles, 'CC');
  });

  test('updates ring meta', () => {
    const meta = new Meta({
      type: MetaType.RING,
      atoms: 'c',
      size: 6,
    });
    const updated = meta.update({ ringNumber: 1 });
    assert.strictEqual(updated.ringNumber, 1);
    assert.strictEqual(meta.ringNumber, null);
  });
});

describe('Meta.toObject', () => {
  test('converts linear meta to object', () => {
    const meta = new Meta({
      type: MetaType.LINEAR,
      smiles: 'CCC',
    });
    assert.deepStrictEqual(meta.toObject(), {
      type: 'linear',
      smiles: 'CCC',
    });
  });

  test('converts ring meta to object', () => {
    const meta = new Meta({
      type: MetaType.RING,
      atoms: 'c',
      size: 6,
      ringNumber: 1,
    });
    assert.deepStrictEqual(meta.toObject(), {
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
    });
  });

  test('recursively converts nested meta', () => {
    const inner = new Meta({
      type: MetaType.LINEAR,
      smiles: 'CC',
    });
    const outer = new Meta({
      type: MetaType.LINEAR,
      smiles: 'CC',
      attachments: { 1: inner },
    });
    assert.deepStrictEqual(outer.toObject(), {
      type: 'linear',
      smiles: 'CC',
      attachments: {
        1: {
          type: 'linear',
          smiles: 'CC',
        },
      },
    });
  });
});

describe('Meta.shouldInclude', () => {
  test('excludes null values', () => {
    assert.strictEqual(Meta.shouldInclude(null), false);
  });

  test('excludes undefined values', () => {
    assert.strictEqual(Meta.shouldInclude(undefined), false);
  });

  test('excludes default zero', () => {
    assert.strictEqual(Meta.shouldInclude(0, 0), false);
  });

  test('includes non-zero numbers', () => {
    assert.strictEqual(Meta.shouldInclude(5), true);
  });

  test('excludes empty objects', () => {
    assert.strictEqual(Meta.shouldInclude({}), false);
  });

  test('includes non-empty objects', () => {
    assert.strictEqual(Meta.shouldInclude({ a: 1 }), true);
  });
});
