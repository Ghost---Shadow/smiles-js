import { describe, test, expect } from 'bun:test';
import { Ring, Linear, Molecule } from './constructors.js';

describe('Ring.attach()', () => {
  test('attaches a linear chain to a ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1);

    expect(toluene.attachments[1]).toHaveLength(1);
    expect(toluene.attachments[1][0].type).toBe('linear');
    expect(toluene.smiles).toBe('c1(C)ccccc1');
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
    expect(pyridine.smiles).toBe('n1ccccc1');
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

describe('Linear.attach()', () => {
  test('attaches a linear chain to a linear chain', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);
    const branched = propyl.attach(methyl, 2);

    expect(branched.attachments[2]).toHaveLength(1);
    expect(branched.attachments[2][0].type).toBe('linear');
  });

  test('returns a new linear without modifying original', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);
    const branched = propyl.attach(methyl, 2);

    expect(propyl.attachments).toEqual({});
    expect(branched.attachments[2]).toHaveLength(1);
  });

  test('can attach multiple groups to same position', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const result = propyl.attach(methyl1, 2).attach(methyl2, 2);

    expect(result.attachments[2]).toHaveLength(2);
  });

  test('throws error for invalid position', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);

    expect(() => propyl.attach(methyl, 0)).toThrow('Position must be an integer between 1 and 3');
    expect(() => propyl.attach(methyl, 4)).toThrow('Position must be an integer between 1 and 3');
  });
});

describe('Linear.branch()', () => {
  test('adds single branch at position', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);
    const branched = propyl.branch(2, methyl);

    expect(branched.attachments[2]).toHaveLength(1);
  });

  test('adds multiple branches at same position', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const branched = propyl.branch(2, methyl1, methyl2);

    expect(branched.attachments[2]).toHaveLength(2);
  });

  test('throws error for invalid branch point', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);

    expect(() => propyl.branch(0, methyl)).toThrow('Branch point must be an integer between 1 and 3');
    expect(() => propyl.branch(4, methyl)).toThrow('Branch point must be an integer between 1 and 3');
  });
});

describe('Linear.branchAt()', () => {
  test('adds branches at multiple positions', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);
    const branched = propyl.branchAt({
      1: methyl,
      3: methyl,
    });

    expect(branched.attachments[1]).toHaveLength(1);
    expect(branched.attachments[3]).toHaveLength(1);
  });

  test('adds multiple branches at same position via array', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const branched = propyl.branchAt({
      2: [methyl1, methyl2],
    });

    expect(branched.attachments[2]).toHaveLength(2);
  });

  test('handles mixed single and array branches', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const ethyl = Linear(['C', 'C']);
    const branched = propyl.branchAt({
      1: methyl1,
      2: [methyl2, ethyl],
    });

    expect(branched.attachments[1]).toHaveLength(1);
    expect(branched.attachments[2]).toHaveLength(2);
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

describe('Linear.clone()', () => {
  test('creates a deep clone', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);
    const branched = propyl.attach(methyl, 2);
    const cloned = branched.clone();

    expect(cloned).toEqual(branched);
    expect(cloned).not.toBe(branched);
    expect(cloned.attachments).not.toBe(branched.attachments);
  });
});

describe('FusedRing methods', () => {
  test('addRing() adds a ring to fused system', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const ring3 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const expanded = fusedRing.addRing(ring3, 8);

    expect(expanded.rings).toHaveLength(3);
    expect(expanded.rings[2].size).toBe(5);
    expect(expanded.rings[2].offset).toBe(8);
  });

  test('getRing() retrieves ring by number', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const retrieved = fusedRing.getRing(2);

    expect(retrieved.ringNumber).toBe(2);
    expect(retrieved.size).toBe(6);
  });

  test('getRing() returns undefined for non-existent ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const retrieved = fusedRing.getRing(99);

    expect(retrieved).toBeUndefined();
  });

  test('substituteInRing() substitutes in specific ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const modified = fusedRing.substituteInRing(2, 3, 'N');

    expect(modified.rings[1].substitutions[3]).toBe('N');
    expect(fusedRing.rings[1].substitutions).toEqual({});
  });

  test('attachToRing() attaches to specific ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const methyl = Linear(['C']);
    const modified = fusedRing.attachToRing(2, methyl, 3);

    expect(modified.rings[1].attachments[3]).toHaveLength(1);
    expect(fusedRing.rings[1].attachments).toEqual({});
  });

  test('renumber() renumbers rings sequentially', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 5 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 7 });
    const fusedRing = ring1.fuse(ring2, 2);

    const renumbered = fusedRing.renumber();

    expect(renumbered.rings[0].ringNumber).toBe(1);
    expect(renumbered.rings[1].ringNumber).toBe(2);
  });

  test('renumber() with custom start number', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const renumbered = fusedRing.renumber(10);

    expect(renumbered.rings[0].ringNumber).toBe(10);
    expect(renumbered.rings[1].ringNumber).toBe(11);
  });

  test('concat() creates molecule', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const methyl = Linear(['C']);
    const molecule = fusedRing.concat(methyl);

    expect(molecule.type).toBe('molecule');
    expect(molecule.components).toHaveLength(2);
  });

  test('clone() creates deep copy', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const cloned = fusedRing.clone();

    expect(cloned).toEqual(fusedRing);
    expect(cloned).not.toBe(fusedRing);
    expect(cloned.rings).not.toBe(fusedRing.rings);
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
