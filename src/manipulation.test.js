import { describe, test, expect } from 'bun:test';
import {
  Ring, Linear, Molecule,
} from './constructors.js';
import {
  repeat, fusedRepeat, linearMirror, moleculeMirror, ringMirror,
} from './manipulation.js';

describe('Ring.attach()', () => {
  test('attaches a linear chain to a ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(1, methyl);

    expect(toluene.attachments[1]).toHaveLength(1);
    expect(toluene.attachments[1][0].type).toBe('linear');
    expect(toluene.smiles).toBe('c1(C)ccccc1');
  });

  test('returns a new ring without modifying original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(1, methyl);

    expect(benzene.attachments).toEqual({});
    expect(toluene.attachments[1]).toHaveLength(1);
  });

  test('can attach multiple groups to same position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const result = benzene.attach(1, methyl1).attach(1, methyl2);

    expect(result.attachments[1]).toHaveLength(2);
  });

  test('throws error for invalid position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    expect(() => benzene.attach(0, methyl)).toThrow('Position must be an integer between 1 and 6');
    expect(() => benzene.attach(7, methyl)).toThrow('Position must be an integer between 1 and 6');
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
      .attach(2, methyl);

    expect(result.substitutions).toEqual({ 1: 'n', 3: 'n' });
    expect(result.attachments[2]).toHaveLength(1);
  });
});

describe('Ring.fuse()', () => {
  test('fuses two rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const naphthalene = ring1.fuse(2, ring2);

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
    const branched = propyl.attach(2, methyl);

    expect(branched.attachments[2]).toHaveLength(1);
    expect(branched.attachments[2][0].type).toBe('linear');
  });

  test('returns a new linear without modifying original', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);
    const branched = propyl.attach(2, methyl);

    expect(propyl.attachments).toEqual({});
    expect(branched.attachments[2]).toHaveLength(1);
  });

  test('can attach multiple groups to same position', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);
    const result = propyl.attach(2, methyl1).attach(2, methyl2);

    expect(result.attachments[2]).toHaveLength(2);
  });

  test('throws error for invalid position', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const methyl = Linear(['C']);

    expect(() => propyl.attach(0, methyl)).toThrow('Position must be an integer between 1 and 3');
    expect(() => propyl.attach(4, methyl)).toThrow('Position must be an integer between 1 and 3');
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

  test('concatenates linear chains with bonds', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const ethyl = Linear(['C', 'C'], ['=']);
    const result = propyl.concat(ethyl);

    expect(result.atoms).toEqual(['C', 'C', 'C', 'C', 'C']);
    expect(result.bonds).toEqual(['=']);
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
    const branched = propyl.attach(2, methyl);
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
    const fusedRing = ring1.fuse(2, ring2);

    const ring3 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const expanded = fusedRing.addRing(8, ring3);

    expect(expanded.rings).toHaveLength(3);
    expect(expanded.rings[2].size).toBe(5);
    expect(expanded.rings[2].offset).toBe(8);
  });

  test('getRing() retrieves ring by number', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    const retrieved = fusedRing.getRing(2);

    expect(retrieved.ringNumber).toBe(2);
    expect(retrieved.size).toBe(6);
  });

  test('getRing() returns undefined for non-existent ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    const retrieved = fusedRing.getRing(99);

    expect(retrieved).toBeUndefined();
  });

  test('substituteInRing() throws for non-existent ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    expect(() => fusedRing.substituteInRing(99, 3, 'N')).toThrow('Ring 99 not found in fused ring system');
  });

  test('substituteInRing() substitutes in specific ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    const modified = fusedRing.substituteInRing(2, 3, 'N');

    expect(modified.rings[1].substitutions[3]).toBe('N');
    expect(fusedRing.rings[1].substitutions).toEqual({});
  });

  test('attachToRing() attaches to specific ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    const methyl = Linear(['C']);
    const modified = fusedRing.attachToRing(2, 3, methyl);

    expect(modified.rings[1].attachments[3]).toHaveLength(1);
    expect(fusedRing.rings[1].attachments).toEqual({});
  });

  test('renumber() renumbers rings sequentially', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 5 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 7 });
    const fusedRing = ring1.fuse(2, ring2);

    const renumbered = fusedRing.renumber();

    expect(renumbered.rings[0].ringNumber).toBe(1);
    expect(renumbered.rings[1].ringNumber).toBe(2);
  });

  test('renumber() with custom start number', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    const renumbered = fusedRing.renumber(10);

    expect(renumbered.rings[0].ringNumber).toBe(10);
    expect(renumbered.rings[1].ringNumber).toBe(11);
  });

  test('concat() creates molecule', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

    const methyl = Linear(['C']);
    const molecule = fusedRing.concat(methyl);

    expect(molecule.type).toBe('molecule');
    expect(molecule.components).toHaveLength(2);
  });

  test('clone() creates deep copy', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(2, ring2);

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

describe('repeat()', () => {
  test('Linear repeat n=1 returns clone', () => {
    const ethylene = Linear(['C', 'C']);
    const result = ethylene.repeat(1, 1, 2);
    expect(result.smiles).toBe('CC');
    expect(result.type).toBe('linear');
  });

  test('Linear repeat n=3 (polyethylene trimer)', () => {
    const ethylene = Linear(['C', 'C']);
    const result = ethylene.repeat(3, 1, 2);
    expect(result.smiles).toBe('CCCCCC');
  });

  test('Linear with attachments repeat preserves branches', () => {
    const styrene = Linear(['C', 'C']).attach(2, Ring({ atoms: 'c', size: 6 }));
    const dimer = styrene.repeat(2, 1, 2);
    expect(dimer.smiles).toBe('CC(c1ccccc1)CC(c2ccccc2)');
  });

  test('Linear with attachments repeat trimer', () => {
    const styrene = Linear(['C', 'C']).attach(2, Ring({ atoms: 'c', size: 6 }));
    const trimer = styrene.repeat(3, 1, 2);
    expect(trimer.smiles).toBe('CC(c1ccccc1)CC(c2ccccc2)CC(c3ccccc3)');
  });

  test('Ring repeat n=1 returns clone', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.repeat(1, 1, 6);
    expect(result.smiles).toBe('c1ccccc1');
    expect(result.type).toBe('ring');
  });

  test('Ring repeat n=2 (biphenyl)', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.repeat(2, 1, 6);
    expect(result.smiles).toBe('c1ccccc1c2ccccc2');
  });

  test('Ring repeat n=3 (terphenyl)', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.repeat(3, 1, 6);
    expect(result.smiles).toBe('c1ccccc1c2ccccc2c3ccccc3');
  });

  test('Ring with substitutions repeat', () => {
    const pyridine = Ring({ atoms: 'c', size: 6, substitutions: { 3: 'n' } });
    const result = pyridine.repeat(2, 1, 6);
    expect(result.smiles).toBe('c1cnccc1c2cnccc2');
  });

  test('repeat does not modify original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    benzene.repeat(3, 1, 6);
    expect(benzene.smiles).toBe('c1ccccc1');
    expect(benzene.ringNumber).toBe(1);
  });

  test('repeat throws for n < 1', () => {
    const ethylene = Linear(['C', 'C']);
    expect(() => ethylene.repeat(0, 1, 2)).toThrow('Repeat count n must be an integer >= 1');
  });

  test('repeat throws for invalid leftId', () => {
    const ethylene = Linear(['C', 'C']);
    expect(() => ethylene.repeat(2, 0, 2)).toThrow('leftId must be a positive integer');
  });

  test('repeat throws for invalid rightId', () => {
    const ethylene = Linear(['C', 'C']);
    expect(() => ethylene.repeat(2, 1, 0)).toThrow('rightId must be a positive integer');
  });

  test('Molecule repeat', () => {
    const unit = Molecule([Linear(['C']), Ring({ atoms: 'c', size: 6 })]);
    const dimer = unit.repeat(2, 1, 1);
    expect(dimer.type).toBe('molecule');
    expect(dimer.smiles).toBe('Cc1ccccc1Cc2ccccc2');
  });

  test('functional API repeat()', () => {
    const ethylene = Linear(['C', 'C']);
    const result = repeat(ethylene, 3, 1, 2);
    expect(result.smiles).toBe('CCCCCC');
  });
});

describe('fusedRepeat()', () => {
  test('fusedRepeat n=1 returns ring clone', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.fusedRepeat(1, 4);
    expect(result.smiles).toBe('c1ccccc1');
    expect(result.type).toBe('ring');
  });

  test('fusedRepeat n=2 (naphthalene)', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.fusedRepeat(2, 4);
    expect(result.type).toBe('fused_ring');
    expect(result.rings).toHaveLength(2);
  });

  test('fusedRepeat n=3 (anthracene)', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.fusedRepeat(3, 4);
    expect(result.type).toBe('fused_ring');
    expect(result.rings).toHaveLength(3);
  });

  test('fusedRepeat does not modify original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    benzene.fusedRepeat(3, 4);
    expect(benzene.smiles).toBe('c1ccccc1');
    expect(benzene.type).toBe('ring');
  });

  test('fusedRepeat throws for non-ring', () => {
    expect(() => fusedRepeat(Linear(['C', 'C']), 2, 4)).toThrow('fusedRepeat requires a Ring node');
  });

  test('fusedRepeat throws for n < 1', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(() => benzene.fusedRepeat(0, 4)).toThrow('Repeat count n must be an integer >= 1');
  });

  test('fusedRepeat throws for invalid offset', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(() => benzene.fusedRepeat(2, 0)).toThrow('Fusion offset must be a positive integer');
  });

  test('functional API fusedRepeat()', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = fusedRepeat(benzene, 2, 4);
    expect(result.type).toBe('fused_ring');
    expect(result.rings).toHaveLength(2);
  });

  test('fusedRepeat with substitutions', () => {
    const ring = Ring({ atoms: 'C', size: 6, substitutions: { 3: 'N' } });
    const result = ring.fusedRepeat(2, 4);
    expect(result.type).toBe('fused_ring');
    expect(result.rings).toHaveLength(2);
  });
});

describe('linearMirror()', () => {
  test('simple chain mirror (diethyl ether)', () => {
    const half = Linear(['C', 'C', 'O']);
    const result = half.mirror();
    expect(result.smiles).toBe('CCOCC');
  });

  test('default pivot is last atom', () => {
    const half = Linear(['C', 'C', 'C', 'N']);
    const result = half.mirror();
    expect(result.smiles).toBe('CCCNCCC');
  });

  test('explicit pivot in the middle', () => {
    const chain = Linear(['C', 'C', 'C', 'O', 'C']);
    const result = chain.mirror(4);
    expect(result.smiles).toBe('CCCOCCC');
  });

  test('single atom mirror returns clone', () => {
    const single = Linear(['O']);
    const result = single.mirror();
    expect(result.smiles).toBe('O');
  });

  test('two atoms mirror (pivot at 2)', () => {
    const two = Linear(['C', 'O']);
    const result = two.mirror();
    expect(result.smiles).toBe('COC');
  });

  test('mirrors bonds correctly', () => {
    const half = Linear(['C', 'C', 'O'], ['=']);
    const result = half.mirror();
    expect(result.smiles).toBe('C=COC=C');
  });

  test('mirrors multiple bond types', () => {
    const half = Linear(['C', 'C', 'N', 'O'], ['=', '#']);
    const result = half.mirror();
    expect(result.smiles).toBe('C=C#NON#C=C');
  });

  test('mirrors attachments with ring renumbering', () => {
    const half = Linear(['C', 'C', 'O']).attach(
      1,
      Ring({ atoms: 'c', size: 6 }),
    );
    const result = half.mirror();
    expect(result.smiles).toBe('C(c1ccccc1)COCC(c2ccccc2)');
  });

  test('does not modify original', () => {
    const half = Linear(['C', 'C', 'O']);
    half.mirror();
    expect(half.smiles).toBe('CCO');
  });

  test('throws for invalid pivotId', () => {
    const chain = Linear(['C', 'C', 'O']);
    expect(() => chain.mirror(0)).toThrow();
    expect(() => chain.mirror(4)).toThrow();
  });

  test('functional API linearMirror()', () => {
    const half = Linear(['C', 'C', 'O']);
    const result = linearMirror(half);
    expect(result.smiles).toBe('CCOCC');
  });
});

describe('moleculeMirror()', () => {
  test('ABA triblock copolymer', () => {
    const A = Linear(['C', 'C']);
    const B = Ring({ atoms: 'c', size: 6 });
    const AB = Molecule([A, B]);
    const result = AB.mirror();
    expect(result.smiles).toBe('CCc1ccccc1CC');
  });

  test('ABCBA from ABC', () => {
    const block = Molecule([
      Linear(['C', 'C']),
      Ring({ atoms: 'c', size: 6 }),
      Linear(['O']),
    ]);
    const result = block.mirror();
    expect(result.smiles).toBe('CCc1ccccc1Oc2ccccc2CC');
  });

  test('default pivot is last component', () => {
    const mol = Molecule([Linear(['C']), Linear(['N']), Linear(['O'])]);
    const result = mol.mirror();
    expect(result.smiles).toBe('CNONC');
  });

  test('explicit pivot at component 0 returns clone of single', () => {
    const mol = Molecule([Linear(['C']), Linear(['N'])]);
    const result = mol.mirror(0);
    expect(result.smiles).toBe('C');
    expect(result.components).toHaveLength(1);
  });

  test('explicit pivot at middle component', () => {
    const mol = Molecule([Linear(['C']), Linear(['N']), Linear(['O'])]);
    const result = mol.mirror(1);
    expect(result.smiles).toBe('CNC');
  });

  test('does not modify original', () => {
    const mol = Molecule([Linear(['C']), Linear(['N'])]);
    mol.mirror();
    expect(mol.smiles).toBe('CN');
    expect(mol.components).toHaveLength(2);
  });

  test('throws for invalid pivotComponent', () => {
    const mol = Molecule([Linear(['C']), Linear(['N'])]);
    expect(() => mol.mirror(-1)).toThrow();
    expect(() => mol.mirror(2)).toThrow();
  });

  test('functional API moleculeMirror()', () => {
    const mol = Molecule([Linear(['C']), Ring({ atoms: 'c', size: 6 })]);
    const result = moleculeMirror(mol);
    expect(result.smiles).toBe('Cc1ccccc1C');
  });
});

describe('ringMirror()', () => {
  test('mirrors substitution (pyrimidine from pyridine)', () => {
    const pyridine = Ring({
      atoms: 'c',
      size: 6,
      substitutions: { 2: 'n' },
    });
    const result = pyridine.mirror(1);
    // pos 2 mirrors to pos 6 around pivot 1
    expect(result.substitutions).toEqual({ 2: 'n', 6: 'n' });
  });

  test('mirrors attachment to symmetric position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    const result = mono.mirror(1);
    // pos 2 mirrors to pos 6 around pivot 1
    expect(result.attachments[2]).toHaveLength(1);
    expect(result.attachments[6]).toHaveLength(1);
  });

  test('meta substitution pattern via mirror', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    const result = mono.mirror(3);
    // pos 2 mirrors to pos 4 around pivot 3
    expect(result.smiles).toBe('c1c(C)cc(C)cc1');
  });

  test('attachment at pivot stays (no duplication)', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(1, Linear(['C']));
    const result = mono.mirror(1);
    // pos 1 is the pivot, mirrors to self → no duplicate
    expect(result.attachments[1]).toHaveLength(1);
  });

  test('default pivot is 1', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    const result = mono.mirror();
    // default pivot=1, pos 2 mirrors to pos 6
    expect(result.attachments[2]).toHaveLength(1);
    expect(result.attachments[6]).toHaveLength(1);
  });

  test('ring renumbering in mirrored attachments', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Ring({ atoms: 'c', size: 5 }));
    const result = mono.mirror(1);
    // Attachment at pos 2 has ring with ringNumber=1
    // Mirrored attachment at pos 6 should have ringNumber=2 (shifted)
    const origAtt = result.attachments[2][0];
    const mirrorAtt = result.attachments[6][0];
    expect(origAtt.ringNumber).toBe(1);
    expect(mirrorAtt.ringNumber).toBe(2);
  });

  test('does not modify original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    mono.mirror(1);
    expect(mono.attachments[6]).toBeUndefined();
  });

  test('throws for invalid pivotId', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(() => benzene.mirror(0)).toThrow();
    expect(() => benzene.mirror(7)).toThrow();
  });

  test('functional API ringMirror()', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    const result = ringMirror(mono, 3);
    expect(result.smiles).toBe('c1c(C)cc(C)cc1');
  });
});
