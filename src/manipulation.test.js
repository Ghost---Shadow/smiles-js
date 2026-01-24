import { describe, test, expect } from 'bun:test';
import { Ring, Linear, Molecule } from './constructors.js';

describe('Ring.attach()', () => {
  test('attaches a linear chain to a ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1);

    expect(toluene.attachments[1]).toHaveLength(1);
    expect(toluene.attachments[1][0].type).toBe('linear');
    expect(toluene.smiles).toBe('1c(C)ccccc1');
  });

  test('returns a new ring without modifying original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1);

    expect(benzene.attachments).toEqual({});
    expect(toluene.attachments[1]).toHaveLength(1);
  });

  test('can attach multiple groups to same position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const result = benzene.attach(methyl1, 1).attach(methyl2, 1);

    expect(result.attachments[1]).toHaveLength(2);
  });

  test('throws error for invalid position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    expect(() => benzene.attach(methyl, 0)).toThrow('Position must be an integer between 1 and 6');
    expect(() => benzene.attach(methyl, 7)).toThrow('Position must be an integer between 1 and 6');
  });
});

describe('Ring.substitute()', () => {
  test('substitutes an atom in a ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const pyridine = benzene.substitute(1, 'n');

    expect(pyridine.substitutions[1]).toBe('n');
    expect(pyridine.smiles).toBe('1nccccc1');
  });

  test('returns a new ring without modifying original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const pyridine = benzene.substitute(1, 'n');

    expect(benzene.substitutions).toEqual({});
    expect(pyridine.substitutions[1]).toBe('n');
  });

  test('removes substitution when new atom matches base', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const pyridine = benzene.substitute(1, 'n');
    const backToBenzene = pyridine.substitute(1, 'c');

    expect(backToBenzene.substitutions).toEqual({});
  });

  test('throws error for invalid position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });

    expect(() => benzene.substitute(0, 'n')).toThrow('Position must be an integer between 1 and 6');
    expect(() => benzene.substitute(7, 'n')).toThrow('Position must be an integer between 1 and 6');
  });
});

describe('Ring.substituteMultiple()', () => {
  test('applies multiple substitutions', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const triazine = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });

    expect(triazine.substitutions).toEqual({
      1: 'n',
      3: 'n',
      5: 'n',
    });
  });

  test('can chain with other methods', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const result = benzene
      .substituteMultiple({ 1: 'n', 3: 'n' })
      .attach(methyl, 2);

    expect(result.substitutions).toEqual({ 1: 'n', 3: 'n' });
    expect(result.attachments[2]).toHaveLength(1);
  });
});

describe('Ring.fuse()', () => {
  test('fuses two rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const naphthalene = ring1.fuse(ring2, 2);

    expect(naphthalene.type).toBe('fused_ring');
    expect(naphthalene.rings).toHaveLength(2);
    expect(naphthalene.rings[0].offset).toBe(0);
    expect(naphthalene.rings[1].offset).toBe(2);
  });
});

describe('Ring.concat()', () => {
  test('concatenates ring with linear chain', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const propyl = Linear(['C', 'C', 'C']);
    const molecule = benzene.concat(propyl);

    expect(molecule.type).toBe('molecule');
    expect(molecule.components).toHaveLength(2);
  });
});

describe('Ring.clone()', () => {
  test('creates a deep clone', () => {
    const original = Ring({ atoms: 'c', size: 6, substitutions: { 1: 'n' } });
    const cloned = original.clone();

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.substitutions).not.toBe(original.substitutions);
  });
});

describe('Linear.concat()', () => {
  test('concatenates two linear chains', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const ethyl = Linear(['C', 'C']);
    const pentyl = propyl.concat(ethyl);

    expect(pentyl.atoms).toEqual(['C', 'C', 'C', 'C', 'C']);
    expect(pentyl.smiles).toBe('CCCCC');
  });

  test('concatenates linear with ring', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = propyl.concat(benzene);

    expect(molecule.type).toBe('molecule');
    expect(molecule.components).toHaveLength(2);
  });
});

describe('Molecule methods', () => {
  test('append() adds component to end', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    const molecule = Molecule([propyl, benzene]).append(methyl);

    expect(molecule.components).toHaveLength(3);
    expect(molecule.components[2]).toBe(methyl);
  });

  test('prepend() adds component to beginning', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    const molecule = Molecule([propyl, benzene]).prepend(methyl);

    expect(molecule.components).toHaveLength(3);
    expect(molecule.components[0]).toBe(methyl);
  });

  test('concat() merges molecules', () => {
    const mol1 = Molecule([Linear(['C', 'C'])]);
    const mol2 = Molecule([Linear(['C', 'C', 'C'])]);

    const combined = mol1.concat(mol2);

    expect(combined.components).toHaveLength(2);
  });

  test('getComponent() retrieves component by index', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);

    expect(molecule.getComponent(0)).toBe(propyl);
    expect(molecule.getComponent(1)).toBe(benzene);
  });

  test('replaceComponent() replaces component at index', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    const molecule = Molecule([propyl, benzene]);
    const updated = molecule.replaceComponent(0, methyl);

    expect(updated.components[0]).toBe(methyl);
    expect(updated.components[1]).toBe(benzene);
  });
});
