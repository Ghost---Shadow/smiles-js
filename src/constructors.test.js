import { describe, test, expect } from 'bun:test';
import {
  Ring, Linear, FusedRing, Molecule,
} from './constructors.js';

describe('Ring Constructor', () => {
  test('creates a simple benzene ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });

    expect(benzene.type).toBe('ring');
    expect(benzene.atoms).toBe('c');
    expect(benzene.size).toBe(6);
    expect(benzene.ringNumber).toBe(1);
    expect(benzene.offset).toBe(0);
    expect(benzene.substitutions).toEqual({});
    expect(benzene.attachments).toEqual({});
  });

  test('has .smiles property', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(benzene.smiles).toBe('1cccccc1');
  });

  test('throws error for invalid size', () => {
    expect(() => Ring({ atoms: 'c', size: 2 })).toThrow('Ring size must be an integer >= 3');
    expect(() => Ring({ atoms: 'c', size: 3.5 })).toThrow('Ring size must be an integer >= 3');
  });

  test('throws error for empty atoms', () => {
    expect(() => Ring({ atoms: '', size: 6 })).toThrow('Atoms string cannot be empty');
  });
});

describe('Linear Constructor', () => {
  test('creates a simple linear chain', () => {
    const propane = Linear(['C', 'C', 'C']);

    expect(propane.type).toBe('linear');
    expect(propane.atoms).toEqual(['C', 'C', 'C']);
    expect(propane.bonds).toEqual([]);
  });

  test('has .smiles property', () => {
    const propane = Linear(['C', 'C', 'C']);
    expect(propane.smiles).toBe('CCC');
  });

  test('handles bonds', () => {
    const ethene = Linear(['C', 'C'], ['=']);
    expect(ethene.smiles).toBe('C=C');
  });

  test('throws error for empty atoms array', () => {
    expect(() => Linear([])).toThrow('Atoms array cannot be empty');
  });

  test('throws error for non-array atoms', () => {
    expect(() => Linear('CCC')).toThrow('Linear atoms must be an array');
  });
});

describe('FusedRing Constructor', () => {
  test('creates a fused ring system', () => {
    const ring1 = Ring({
      atoms: 'C', size: 10, offset: 0, ringNumber: 1,
    });
    const ring2 = Ring({
      atoms: 'C', size: 6, offset: 2, ringNumber: 2,
    });
    const naphthalene = FusedRing([ring1, ring2]);

    expect(naphthalene.type).toBe('fused_ring');
    expect(naphthalene.rings).toHaveLength(2);
  });

  test('throws error for less than 2 rings', () => {
    const ring1 = Ring({ atoms: 'c', size: 6 });
    expect(() => FusedRing([ring1])).toThrow('FusedRing requires at least 2 rings');
  });

  test('throws error for non-array input', () => {
    expect(() => FusedRing('not an array')).toThrow('FusedRing requires an array of rings');
  });
});

describe('Molecule Constructor', () => {
  test('creates a molecule with multiple components', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);

    expect(molecule.type).toBe('molecule');
    expect(molecule.components).toHaveLength(2);
  });

  test('has .smiles property', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const propylbenzene = Molecule([propyl, benzene]);

    expect(propylbenzene.smiles).toBe('CCC1cccccc1');
  });

  test('handles empty components', () => {
    const molecule = Molecule([]);
    expect(molecule.components).toEqual([]);
    expect(molecule.smiles).toBe('');
  });

  test('throws error for non-array input', () => {
    expect(() => Molecule('not an array')).toThrow('Molecule components must be an array');
  });
});
