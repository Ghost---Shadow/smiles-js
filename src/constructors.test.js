import { describe, test, expect } from 'bun:test';
import {
  Ring, Linear, FusedRing, Molecule, RawFragment,
  cloneAttachments, cloneSubstitutions, cloneComponents,
  deepCloneRing, deepCloneLinear, deepCloneFusedRing, deepCloneMolecule,
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
    expect(benzene.smiles).toBe('c1ccccc1');
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

    expect(propylbenzene.smiles).toBe('CCCc1ccccc1');
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

describe('Helper Functions - Clone Functions', () => {
  test('cloneAttachments creates deep copy', () => {
    const attachments = {
      1: [Linear(['C', 'H'])],
      2: [Linear(['O', 'H'])],
    };
    const cloned = cloneAttachments(attachments);

    expect(cloned).toEqual(attachments);
    expect(cloned).not.toBe(attachments);
    expect(cloned[1]).not.toBe(attachments[1]);
    expect(cloned[2]).not.toBe(attachments[2]);
  });

  test('cloneSubstitutions creates shallow copy', () => {
    const substitutions = { 1: 'N', 2: 'O' };
    const cloned = cloneSubstitutions(substitutions);

    expect(cloned).toEqual(substitutions);
    expect(cloned).not.toBe(substitutions);
  });

  test('cloneComponents creates shallow copy of array', () => {
    const components = [Linear(['C', 'C']), Linear(['N', 'N'])];
    const cloned = cloneComponents(components);

    expect(cloned).toEqual(components);
    expect(cloned).not.toBe(components);
  });

  test('deepCloneRing clones all ring properties', () => {
    const ring = Ring({
      atoms: 'C',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: { 1: 'N' },
      attachments: { 2: [Linear(['C', 'H'])] },
      bonds: ['=', '-', '='],
    });

    const cloned = deepCloneRing(ring);

    expect(cloned).toEqual(ring);
    expect(cloned).not.toBe(ring);
    expect(cloned.substitutions).not.toBe(ring.substitutions);
    expect(cloned.attachments).not.toBe(ring.attachments);
    expect(cloned.bonds).not.toBe(ring.bonds);
  });

  test('deepCloneLinear clones all linear properties', () => {
    const linear = Linear(['C', 'C', 'N'], ['=', '-'], { 1: [Linear(['O'])] });

    const cloned = deepCloneLinear(linear);

    expect(cloned).toEqual(linear);
    expect(cloned).not.toBe(linear);
    expect(cloned.atoms).not.toBe(linear.atoms);
    expect(cloned.bonds).not.toBe(linear.bonds);
    expect(cloned.attachments).not.toBe(linear.attachments);
  });

  test('deepCloneFusedRing clones all rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'C', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    const cloned = deepCloneFusedRing(fused);

    expect(cloned).not.toBe(fused);
    expect(cloned.rings).not.toBe(fused.rings);
    expect(cloned.rings[0]).not.toBe(fused.rings[0]);
  });

  test('deepCloneMolecule clones components array', () => {
    const molecule = Molecule([Linear(['C', 'C']), Linear(['N', 'N'])]);

    const cloned = deepCloneMolecule(molecule);

    expect(cloned).not.toBe(molecule);
    expect(cloned.components).not.toBe(molecule.components);
  });
});

describe('Ring Methods', () => {
  test('ring.clone() returns deep clone', () => {
    const ring = Ring({ atoms: 'c', size: 6, substitutions: { 1: 'N' } });
    const cloned = ring.clone();

    expect(cloned).toEqual(ring);
    expect(cloned).not.toBe(ring);
  });

  test('ring.attach() attaches a component', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const attachment = Linear(['C', 'H']);
    const result = ring.attach(attachment, 1);

    expect(result.attachments[1]).toBeDefined();
    expect(result.attachments[1]).toHaveLength(1);
  });

  test('ring.substitute() substitutes an atom', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const result = ring.substitute(1, 'N');

    expect(result.substitutions[1]).toBe('N');
  });

  test('ring.substituteMultiple() substitutes multiple atoms', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const result = ring.substituteMultiple({ 1: 'N', 3: 'O' });

    expect(result.substitutions).toEqual({ 1: 'N', 3: 'O' });
  });

  test('ring.fuse() fuses with another ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const result = ring1.fuse(ring2, 2);

    expect(result.type).toBe('fused_ring');
    expect(result.rings).toHaveLength(2);
  });

  test('ring.concat() concatenates with another component', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const linear = Linear(['C', 'C']);
    const result = ring.concat(linear);

    expect(result.type).toBe('molecule');
    expect(result.components).toHaveLength(2);
  });

  test('ring.toObject() returns plain object', () => {
    const ring = Ring({
      atoms: 'C',
      size: 6,
      substitutions: { 1: 'N' },
      bonds: ['='],
    });
    const attachment = Linear(['C', 'H']);
    const ringWithAttachments = ring.attach(attachment, 2);

    const obj = ringWithAttachments.toObject();

    expect(obj.type).toBe('ring');
    expect(obj.atoms).toBe('C');
    expect(obj.size).toBe(6);
    expect(obj.substitutions).toEqual({ 1: 'N' });
    expect(obj.attachments[2]).toHaveLength(1);
    expect(obj.attachments[2][0]).toEqual(attachment.toObject());
  });

  test('ring.toCode() returns decompiled code', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const code = ring.toCode('benzene');

    expect(code).toContain('benzene');
  });

  test('ring.toCode() uses default varName', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const code = ring.toCode();

    expect(code).toContain('ring');
  });
});

describe('Linear Methods', () => {
  test('linear.clone() returns deep clone', () => {
    const linear = Linear(['C', 'C', 'C']);
    const cloned = linear.clone();

    expect(cloned).toEqual(linear);
    expect(cloned).not.toBe(linear);
  });

  test('linear.attach() attaches a component', () => {
    const linear = Linear(['C', 'C', 'C']);
    const attachment = Linear(['O']);
    const result = linear.attach(attachment, 1);

    expect(result.attachments[1]).toBeDefined();
    expect(result.attachments[1]).toHaveLength(1);
  });

  test('linear.branch() adds branches at position', () => {
    const linear = Linear(['C', 'C', 'C']);
    const branch1 = Linear(['O']);
    const branch2 = Linear(['N']);
    const result = linear.branch(1, branch1, branch2);

    expect(result.attachments[1]).toHaveLength(2);
  });

  test('linear.branchAt() adds branches at multiple positions', () => {
    const linear = Linear(['C', 'C', 'C']);
    const result = linear.branchAt({
      1: [Linear(['O'])],
      2: [Linear(['N'])],
    });

    expect(result.attachments[1]).toHaveLength(1);
    expect(result.attachments[2]).toHaveLength(1);
  });

  test('linear.concat() concatenates with another component', () => {
    const linear1 = Linear(['C', 'C']);
    const linear2 = Linear(['N', 'N']);
    const result = linear1.concat(linear2);

    expect(result.atoms).toEqual(['C', 'C', 'N', 'N']);
  });

  test('linear.toObject() returns plain object', () => {
    const linear = Linear(['C', 'N'], ['=']);
    const attachment = Linear(['O']);
    const linearWithAttachments = linear.attach(attachment, 1);

    const obj = linearWithAttachments.toObject();

    expect(obj.type).toBe('linear');
    expect(obj.atoms).toEqual(['C', 'N']);
    expect(obj.bonds).toEqual(['=']);
    expect(obj.attachments[1]).toHaveLength(1);
  });

  test('linear.toCode() returns decompiled code', () => {
    const linear = Linear(['C', 'C', 'C']);
    const code = linear.toCode('propane');

    expect(code).toContain('propane');
  });

  test('linear.toCode() uses default varName', () => {
    const linear = Linear(['C', 'C', 'C']);
    const code = linear.toCode();

    expect(code).toContain('linear');
  });
});

describe('Molecule Methods', () => {
  test('molecule.clone() returns deep clone', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const cloned = molecule.clone();

    expect(cloned).not.toBe(molecule);
    expect(cloned.components).not.toBe(molecule.components);
  });

  test('molecule.append() adds component to end', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const result = molecule.append(Linear(['N', 'N']));

    expect(result.components).toHaveLength(2);
    expect(result.components[1].atoms).toEqual(['N', 'N']);
  });

  test('molecule.prepend() adds component to start', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const result = molecule.prepend(Linear(['N', 'N']));

    expect(result.components).toHaveLength(2);
    expect(result.components[0].atoms).toEqual(['N', 'N']);
  });

  test('molecule.concat() concatenates with another molecule', () => {
    const mol1 = Molecule([Linear(['C', 'C'])]);
    const mol2 = Molecule([Linear(['N', 'N'])]);
    const result = mol1.concat(mol2);

    expect(result.components).toHaveLength(2);
  });

  test('molecule.getComponent() retrieves component by index', () => {
    const linear = Linear(['C', 'C']);
    const ring = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([linear, ring]);

    const component = molecule.getComponent(1);
    expect(component.type).toBe('ring');
  });

  test('molecule.replaceComponent() replaces component at index', () => {
    const molecule = Molecule([Linear(['C', 'C']), Linear(['O', 'O'])]);
    const newComponent = Linear(['N', 'N']);
    const result = molecule.replaceComponent(1, newComponent);

    expect(result.components[1].atoms).toEqual(['N', 'N']);
  });

  test('molecule.toObject() returns plain object', () => {
    const linear = Linear(['C', 'C']);
    const ring = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([linear, ring]);

    const obj = molecule.toObject();

    expect(obj.type).toBe('molecule');
    expect(obj.components).toHaveLength(2);
    expect(obj.components[0]).toEqual(linear.toObject());
    expect(obj.components[1]).toEqual(ring.toObject());
  });

  test('molecule.toCode() returns decompiled code', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const code = molecule.toCode('myMol');

    expect(code).toContain('myMol');
  });

  test('molecule.toCode() uses default varName', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const code = molecule.toCode();

    expect(code).toContain('molecule');
  });
});

describe('FusedRing Methods', () => {
  test('fusedRing.clone() returns deep clone', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'c', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    const cloned = fused.clone();

    expect(cloned).not.toBe(fused);
    expect(cloned.rings).not.toBe(fused.rings);
  });

  test('fusedRing.addRing() adds a ring to the system', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = FusedRing([ring1, ring2]);
    const ring3 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });

    const result = fused.addRing(ring3, 2);

    expect(result.rings).toHaveLength(3);
  });

  test('fusedRing.getRing() retrieves ring by number', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = FusedRing([ring1, ring2]);

    const retrieved = fused.getRing(2);
    expect(retrieved.ringNumber).toBe(2);
  });

  test('fusedRing.substituteInRing() substitutes atom in specific ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = FusedRing([ring1, ring2]);

    const result = fused.substituteInRing(2, 1, 'N');

    expect(result.rings[1].substitutions[1]).toBe('N');
  });

  test('fusedRing.attachToRing() attaches to specific ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = FusedRing([ring1, ring2]);
    const attachment = Linear(['O']);

    const result = fused.attachToRing(2, attachment, 1);

    expect(result.rings[1].attachments[1]).toHaveLength(1);
  });

  test('fusedRing.renumber() renumbers rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = FusedRing([ring1, ring2]);

    const result = fused.renumber(5);

    expect(result.rings[0].ringNumber).toBe(5);
    expect(result.rings[1].ringNumber).toBe(6);
  });

  test('fusedRing.concat() concatenates with another component', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = FusedRing([ring1, ring2]);
    const linear = Linear(['C', 'C']);

    const result = fused.concat(linear);

    expect(result.type).toBe('molecule');
    expect(result.components).toHaveLength(2);
  });

  test('fusedRing.toObject() returns plain object with rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'C', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    const obj = fused.toObject();

    expect(obj.type).toBe('fused_ring');
    expect(obj.rings).toHaveLength(2);
    expect(obj.rings[0].type).toBe('ring');
    expect(obj.rings[1].type).toBe('ring');
  });

  test('fusedRing.toObject() handles rings without toObject method', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'C', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    delete fused.rings[0].toObject;

    const obj = fused.toObject();

    expect(obj.rings[0].type).toBe('ring');
    expect(obj.rings[0].atoms).toBe('C');
  });

  test('fusedRing.toCode() returns decompiled code', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'c', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    const code = fused.toCode('naphthalene');

    expect(code).toContain('naphthalene');
  });

  test('fusedRing.toCode() uses default varName', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'c', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    const code = fused.toCode();

    expect(code).toContain('fusedRing');
  });
});

describe('FusedRing - Position Computation', () => {
  test('computes positions for inside rings', () => {
    const ring1 = Ring({
      atoms: 'C', size: 10, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaAllPositions).toBeDefined();
  });

  test('computes positions for extending rings', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 7, ringNumber: 2, offset: 3,
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('computes positions for endpoint rings', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 4,
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
  });

  test('handles spiro rings with branchDepths', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C',
      size: 6,
      ringNumber: 2,
      offset: 3,
      branchDepths: [0, 1, 1, 1, 1, 1],
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
  });

  test('handles chained rings (3+ ring systems)', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 7, ringNumber: 2, offset: 3,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 0,
    });
    const fused = FusedRing([ring1, ring2, ring3]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaRingOrderMap).toBeDefined();
  });

  test('handles extending rings with chained rings', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 7, ringNumber: 2, offset: 3,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 0,
    });
    const fused = FusedRing([ring1, ring2, ring3]);

    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('applies ring branchDepths to fused ring', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C',
      size: 6,
      ringNumber: 2,
      offset: 2,
      branchDepths: [0, 0, 0, 0, 0, 0],
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('uses maximum branch depth when applying ring depths', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C',
      size: 6,
      ringNumber: 2,
      offset: 2,
      branchDepths: [2, 2, 2, 2, 2, 2],
    });
    const fused = FusedRing([ring1, ring2]);

    const depths = Array.from(fused.metaBranchDepthMap.values());
    expect(Math.max(...depths)).toBeGreaterThanOrEqual(2);
  });

  test('handles FusedRing with leadingBond option', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'c', size: 6, offset: 2, ringNumber: 2,
    });
    const fused = FusedRing([ring1, ring2], { leadingBond: '=' });

    expect(fused.metaLeadingBond).toBe('=');
  });

  test('skips position computation for parser-generated rings', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'c', size: 6, offset: 2, ringNumber: 2,
    });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeUndefined();
  });

  test('handles chained rings inside extending rings', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 7, ringNumber: 2, offset: 3,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 0,
    });
    const fused = FusedRing([ring1, ring2, ring3]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('handles chained rings with inside ring host', () => {
    const ring1 = Ring({
      atoms: 'C', size: 10, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 7, ringNumber: 2, offset: 2,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 0,
    });
    const fused = FusedRing([ring1, ring2, ring3]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('handles endpoint rings with multiple rings at same position', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 4, ringNumber: 2, offset: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('handles endpoint ring that ends at base ring end', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 3, ringNumber: 2, offset: 3,
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
    expect(fused.metaBranchDepthMap).toBeDefined();
  });

  test('sorts ring order for chained and endpoint rings', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 7, ringNumber: 2, offset: 3,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 0,
    });
    const fused = FusedRing([ring1, ring2, ring3]);

    expect(fused.metaRingOrderMap).toBeDefined();
  });

  test('handles extending ring without chained rings - benzimidazole case', () => {
    const ring1 = Ring({
      atoms: 'C', size: 6, ringNumber: 1, offset: 0,
    });
    const ring2 = Ring({
      atoms: 'C', size: 5, ringNumber: 2, offset: 2,
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaTotalAtoms).toBeGreaterThan(0);
  });
});

describe('Ring Constructor - Edge Cases', () => {
  test('creates ring with branchDepths parameter', () => {
    const ring = Ring({
      atoms: 'C',
      size: 6,
      branchDepths: [0, 1, 1, 0, 0, 0],
    });

    expect(ring.metaBranchDepths).toEqual([0, 1, 1, 0, 0, 0]);
  });

  test('creates ring with null branchDepths', () => {
    const ring = Ring({
      atoms: 'C',
      size: 6,
      branchDepths: null,
    });

    expect(ring.metaBranchDepths).toBeUndefined();
  });

  test('ring with bonds array', () => {
    const ring = Ring({
      atoms: 'C',
      size: 6,
      bonds: ['=', '-', '=', '-', '='],
    });

    expect(ring.bonds).toEqual(['=', '-', '=', '-', '=']);
  });
});

describe('FusedRing Constructor - Edge Cases', () => {
  test('throws error for non-Ring elements', () => {
    const ring1 = Ring({ atoms: 'c', size: 6 });
    const notARing = { type: 'linear', atoms: ['C', 'C'] };

    expect(() => FusedRing([ring1, notARing])).toThrow('All elements must be Ring nodes');
  });
});

describe('RawFragment Constructor', () => {
  test('creates a RawFragment node', () => {
    const raw = RawFragment('C1CC1');

    expect(raw.type).toBe('raw_fragment');
    expect(raw.smiles).toBe('C1CC1');
  });

  test('throws error for non-string input', () => {
    expect(() => RawFragment(123)).toThrow('RawFragment requires a SMILES string');
  });

  test('RawFragment.toObject() returns plain object', () => {
    const raw = RawFragment('C1CC1');
    const obj = raw.toObject();

    expect(obj.type).toBe('raw_fragment');
    expect(obj.smiles).toBe('C1CC1');
  });

  test('RawFragment.toCode() returns code string', () => {
    const raw = RawFragment('C1CC1');
    const code = raw.toCode('myRaw');

    expect(code).toContain('myRaw');
    expect(code).toContain('C1CC1');
  });

  test('RawFragment.toCode() uses default varName', () => {
    const raw = RawFragment('C1CC1');
    const code = raw.toCode();

    expect(code).toContain('raw');
  });

  test('RawFragment.clone() creates a clone', () => {
    const raw = RawFragment('C1CC1');
    const cloned = raw.clone();

    expect(cloned.smiles).toBe('C1CC1');
    expect(cloned).not.toBe(raw);
  });
});
