import { describe, test, expect } from 'bun:test';
import { Fragment } from './fragment.js';

describe('Fragment', () => {
  test('creates molecule from SMILES string', () => {
    const benzene = Fragment('c1ccccc1');
    expect(benzene.type).toBe('ring');
    expect(benzene.smiles).toBe('c1ccccc1');
  });

  test('Fragment.smiles() creates molecule from SMILES string', () => {
    const benzene = Fragment.smiles('c1ccccc1');
    expect(benzene.type).toBe('ring');
    expect(benzene.smiles).toBe('c1ccccc1');
  });

  test('creates linear chain from SMILES', () => {
    const propane = Fragment('CCC');
    expect(propane.type).toBe('linear');
    expect(propane.smiles).toBe('CCC');
  });

  test('creates fused ring from SMILES', () => {
    const benzimidazole = Fragment('c1nc2ccccc2n1');
    expect(benzimidazole.type).toBe('fused_ring');
    expect(benzimidazole.smiles).toBe('c1nc2ccccc2n1');
  });

  test('creates molecule with branches', () => {
    const toluene = Fragment('Cc1ccccc1');
    expect(toluene.type).toBe('molecule');
    expect(toluene.smiles).toBe('Cc1ccccc1');
  });

  test('has manipulation methods', () => {
    const benzene = Fragment('c1ccccc1');
    expect(typeof benzene.toObject).toBe('function');
    expect(typeof benzene.toCode).toBe('function');
  });

  test('throws on non-string input', () => {
    expect(() => Fragment(123)).toThrow('Fragment requires a SMILES string');
    expect(() => Fragment(null)).toThrow('Fragment requires a SMILES string');
  });

  test('throws on empty string', () => {
    expect(() => Fragment('')).toThrow('Fragment requires a non-empty SMILES string');
  });

  test('toObject works on fragment', () => {
    const benzene = Fragment('c1ccccc1');
    expect(benzene.toObject()).toEqual({
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {},
    });
  });

  test('toCode works on fragment', () => {
    const benzene = Fragment('c1ccccc1');
    expect(benzene.toCode('v')).toBe("const v1 = Ring({ atoms: 'c', size: 6 });");
  });
});
