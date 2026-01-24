const {
  createRingNode,
  createLinearNode,
  createMoleculeNode,
  createFusedRingNode,
  Ring,
  Linear,
  Molecule,
  FusedRing,
} = require('./constructors');
const { ASTNodeType } = require('./ast');

describe('Internal Node Creation Functions', () => {
  describe('createRingNode', () => {
    test('creates a ring node with all properties', () => {
      const node = createRingNode('c', 6, 1, 0, { 2: 'n' }, { 1: [{ type: 'linear', atoms: ['C'] }] });

      expect(node).toEqual({
        type: ASTNodeType.RING,
        ringNumber: 1,
        size: 6,
        offset: 0,
        atoms: 'c',
        substitutions: { 2: 'n' },
        attachments: { 1: [{ type: 'linear', atoms: ['C'] }] },
      });
    });

    test('creates a ring node with defaults', () => {
      const node = createRingNode('C', 5);

      expect(node).toEqual({
        type: ASTNodeType.RING,
        ringNumber: 1,
        size: 5,
        offset: 0,
        atoms: 'C',
        substitutions: {},
        attachments: {},
      });
    });
  });

  describe('createLinearNode', () => {
    test('creates a linear node with atoms and bonds', () => {
      const node = createLinearNode(['C', 'C', 'C'], ['-', '-']);

      expect(node).toEqual({
        type: ASTNodeType.LINEAR,
        atoms: ['C', 'C', 'C'],
        bonds: ['-', '-'],
      });
    });

    test('creates a linear node with default bonds', () => {
      const node = createLinearNode(['C', 'C']);

      expect(node).toEqual({
        type: ASTNodeType.LINEAR,
        atoms: ['C', 'C'],
        bonds: [],
      });
    });
  });

  describe('createMoleculeNode', () => {
    test('creates a molecule node with components', () => {
      const linear = createLinearNode(['C', 'C']);
      const ring = createRingNode('c', 6);
      const node = createMoleculeNode([linear, ring]);

      expect(node).toEqual({
        type: ASTNodeType.MOLECULE,
        components: [linear, ring],
      });
    });

    test('creates an empty molecule node', () => {
      const node = createMoleculeNode();

      expect(node).toEqual({
        type: ASTNodeType.MOLECULE,
        components: [],
      });
    });
  });

  describe('createFusedRingNode', () => {
    test('creates a fused ring node with multiple rings', () => {
      const ring1 = createRingNode('C', 10, 1, 0);
      const ring2 = createRingNode('C', 6, 2, 2);
      const node = createFusedRingNode([ring1, ring2]);

      expect(node).toEqual({
        type: ASTNodeType.FUSED_RING,
        rings: [ring1, ring2],
      });
    });
  });
});

describe('Ring Constructor', () => {
  describe('validation', () => {
    test('throws error when atoms is missing', () => {
      expect(() => Ring({ size: 6 })).toThrow('Ring requires atoms (string)');
    });

    test('throws error when atoms is not a string', () => {
      expect(() => Ring({ atoms: 123, size: 6 })).toThrow('Ring requires atoms (string)');
    });

    test('throws error when size is missing', () => {
      expect(() => Ring({ atoms: 'c' })).toThrow('Ring requires size >= 3');
    });

    test('throws error when size is not a number', () => {
      expect(() => Ring({ atoms: 'c', size: '6' })).toThrow('Ring requires size >= 3');
    });

    test('throws error when size is less than 3', () => {
      expect(() => Ring({ atoms: 'c', size: 2 })).toThrow('Ring requires size >= 3');
    });
  });

  describe('construction', () => {
    test('creates a basic ring with required parameters', () => {
      const ring = Ring({ atoms: 'c', size: 6 });

      expect(ring.type).toBe(ASTNodeType.RING);
      expect(ring.atoms).toBe('c');
      expect(ring.size).toBe(6);
      expect(ring.ringNumber).toBe(1);
      expect(ring.offset).toBe(0);
      expect(ring.substitutions).toEqual({});
      expect(ring.attachments).toEqual({});
    });

    test('creates a ring with all optional parameters', () => {
      const ring = Ring({
        atoms: 'C',
        size: 5,
        ringNumber: 2,
        offset: 3,
        substitutions: { 2: 'N' },
        attachments: { 1: [{ type: 'linear', atoms: ['C'] }] },
      });

      expect(ring.type).toBe(ASTNodeType.RING);
      expect(ring.atoms).toBe('C');
      expect(ring.size).toBe(5);
      expect(ring.ringNumber).toBe(2);
      expect(ring.offset).toBe(3);
      expect(ring.substitutions).toEqual({ 2: 'N' });
      expect(ring.attachments).toEqual({ 1: [{ type: 'linear', atoms: ['C'] }] });
    });
  });

  describe('.smiles getter', () => {
    test('returns SMILES for simple aromatic ring', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      expect(benzene.smiles).toBe('c1ccccc1');
    });

    test('returns SMILES for simple aliphatic ring', () => {
      const cyclohexane = Ring({ atoms: 'C', size: 6 });
      expect(cyclohexane.smiles).toBe('C1CCCCC1');
    });

    test('returns SMILES for pentagon ring', () => {
      const cyclopentane = Ring({ atoms: 'C', size: 5 });
      expect(cyclopentane.smiles).toBe('C1CCCC1');
    });

    test('returns SMILES for larger ring', () => {
      const ring = Ring({ atoms: 'C', size: 7 });
      expect(ring.smiles).toBe('C1CCCCCC1');
    });

    test('returns SMILES for ring with custom ring number', () => {
      const ring = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
      expect(ring.smiles).toBe('c2ccccc2');
    });

    test('returns SMILES for ring with ring number > 9', () => {
      const ring = Ring({ atoms: 'c', size: 6, ringNumber: 10 });
      expect(ring.smiles).toBe('c%10ccccc%10');
    });
  });
});

describe('Linear Constructor', () => {
  describe('validation', () => {
    test('throws error when atoms is not an array', () => {
      expect(() => Linear('C')).toThrow('Linear requires atoms array');
    });

    test('throws error when atoms array is empty', () => {
      expect(() => Linear([])).toThrow('Linear requires at least one atom');
    });

    test('throws error when atoms array contains non-strings', () => {
      expect(() => Linear(['C', 123])).toThrow('Linear atoms must all be strings');
    });
  });

  describe('construction', () => {
    test('creates a linear chain with just atoms', () => {
      const linear = Linear(['C', 'C', 'C']);

      expect(linear.type).toBe(ASTNodeType.LINEAR);
      expect(linear.atoms).toEqual(['C', 'C', 'C']);
      expect(linear.bonds).toEqual([]);
    });

    test('creates a linear chain with atoms and bonds', () => {
      const linear = Linear(['C', 'C', 'C'], ['-', '=']);

      expect(linear.type).toBe(ASTNodeType.LINEAR);
      expect(linear.atoms).toEqual(['C', 'C', 'C']);
      expect(linear.bonds).toEqual(['-', '=']);
    });

    test('creates a single atom linear chain', () => {
      const linear = Linear(['C']);

      expect(linear.type).toBe(ASTNodeType.LINEAR);
      expect(linear.atoms).toEqual(['C']);
      expect(linear.bonds).toEqual([]);
    });
  });

  describe('.smiles getter', () => {
    test('returns SMILES for simple linear chain', () => {
      const propane = Linear(['C', 'C', 'C']);
      expect(propane.smiles).toBe('CCC');
    });

    test('returns SMILES for single atom', () => {
      const methyl = Linear(['C']);
      expect(methyl.smiles).toBe('C');
    });

    test('returns SMILES for chain with explicit single bonds', () => {
      const ethane = Linear(['C', 'C'], ['-']);
      expect(ethane.smiles).toBe('C-C');
    });

    test('returns SMILES for chain with double bond', () => {
      const ethene = Linear(['C', 'C'], ['=']);
      expect(ethene.smiles).toBe('C=C');
    });

    test('returns SMILES for chain with mixed bonds', () => {
      const chain = Linear(['C', 'C', 'C'], ['-', '=']);
      expect(chain.smiles).toBe('C-C=C');
    });

    test('returns SMILES for aromatic atoms', () => {
      const chain = Linear(['c', 'c']);
      expect(chain.smiles).toBe('cc');
    });

    test('returns SMILES for mixed atom types', () => {
      const chain = Linear(['C', 'N', 'O']);
      expect(chain.smiles).toBe('CNO');
    });
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

  test('concatenates linear with ring returns molecule', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = propyl.concat(benzene);

    expect(result.type).toBe(ASTNodeType.MOLECULE);
    expect(result.smiles).toBe('CCCc1ccccc1');
  });

  test('does not mutate original chains', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const ethyl = Linear(['C', 'C']);
    const pentyl = propyl.concat(ethyl);

    expect(propyl.atoms).toEqual(['C', 'C', 'C']);
    expect(ethyl.atoms).toEqual(['C', 'C']);
    expect(pentyl.atoms).toEqual(['C', 'C', 'C', 'C', 'C']);
  });

  test('concatenates chains with bonds', () => {
    const chain1 = Linear(['C', 'C'], ['-']);
    const chain2 = Linear(['C', 'C'], ['=']);
    const result = chain1.concat(chain2);

    expect(result.bonds).toEqual(['-', '=']);
    expect(result.smiles).toBe('C-C=CC');
  });
});

describe('Linear.clone()', () => {
  test('creates a deep copy of linear chain', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const cloned = propyl.clone();

    expect(cloned.type).toBe(propyl.type);
    expect(cloned.atoms).toEqual(propyl.atoms);
    expect(cloned.bonds).toEqual(propyl.bonds);
    expect(cloned).not.toBe(propyl);
    expect(cloned.atoms).not.toBe(propyl.atoms);
  });

  test('cloned chain is independent', () => {
    const chain = Linear(['C', 'C', 'C']);
    const cloned = chain.clone();

    expect(chain.atoms).toEqual(['C', 'C', 'C']);
    expect(cloned.atoms).toEqual(['C', 'C', 'C']);
  });
});

describe('Ring.attach()', () => {
  test('attaches a linear chain to a ring position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1);

    expect(toluene.attachments[1]).toEqual([methyl]);
    expect(toluene.atoms).toBe('c');
    expect(toluene.size).toBe(6);
  });

  test('does not mutate original ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1);

    expect(benzene.attachments).toEqual({});
    expect(toluene.attachments[1]).toEqual([methyl]);
  });

  test('can attach multiple items to the same position', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const methyl1 = Linear(['C']);
    const methyl2 = Linear(['C']);

    const withOne = ring.attach(methyl1, 1);
    const withTwo = withOne.attach(methyl2, 1);

    expect(withTwo.attachments[1]).toEqual([methyl1, methyl2]);
  });

  test('can attach to different positions', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const ethyl = Linear(['C', 'C']);

    const withFirst = ring.attach(methyl, 1);
    const withBoth = withFirst.attach(ethyl, 4);

    expect(withBoth.attachments[1]).toEqual([methyl]);
    expect(withBoth.attachments[4]).toEqual([ethyl]);
  });

  test('generates correct SMILES for ring with attachment', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1);

    expect(toluene.smiles).toBe('c1(C)ccccc1');
  });

  test('generates correct SMILES for ring with attachment at last position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const result = benzene.attach(methyl, 6);

    expect(result.smiles).toBe('c1ccccc1(C)');
  });

  test('generates correct SMILES for ring with multiple attachments', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    const result = benzene.attach(methyl, 1).attach(methyl, 4);

    expect(result.smiles).toBe('c1(C)ccc(C)cc1');
  });

  test('can attach rings to rings', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const phenyl = Ring({ atoms: 'c', size: 6, ringNumber: 2 });

    const biphenyl = benzene.attach(phenyl, 1);

    expect(biphenyl.attachments[1]).toEqual([phenyl]);
    expect(biphenyl.smiles).toBe('c1(c2ccccc2)ccccc1');
  });
});

describe('Ring.substitute()', () => {
  test('substitutes an atom at a specific position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const pyridine = benzene.substitute(1, 'n');

    expect(pyridine.substitutions[1]).toBe('n');
    expect(pyridine.atoms).toBe('c');
    expect(pyridine.size).toBe(6);
  });

  test('does not mutate original ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const pyridine = benzene.substitute(1, 'n');

    expect(benzene.substitutions).toEqual({});
    expect(pyridine.substitutions[1]).toBe('n');
  });

  test('can substitute multiple positions', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.substitute(1, 'n').substitute(3, 'n');

    expect(result.substitutions).toEqual({ 1: 'n', 3: 'n' });
  });

  test('removes substitution when newAtom matches base atom', () => {
    const ring = Ring({ atoms: 'c', size: 6, substitutions: { 1: 'n' } });
    const result = ring.substitute(1, 'c');

    expect(result.substitutions).toEqual({});
  });

  test('generates correct SMILES for pyridine', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const pyridine = benzene.substitute(1, 'n');

    expect(pyridine.smiles).toBe('n1ccccc1');
  });

  test('generates correct SMILES for substitution at middle position', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.substitute(4, 'n');

    expect(result.smiles).toBe('c1ccncc1');
  });

  test('generates correct SMILES for multiple substitutions', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.substitute(1, 'n').substitute(4, 'n');

    expect(result.smiles).toBe('n1ccncc1');
  });

  test('generates correct SMILES for triazine (3 nitrogen substitutions)', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const triazine = benzene.substitute(1, 'n').substitute(3, 'n').substitute(5, 'n');

    expect(triazine.smiles).toBe('n1cncnc1');
  });

  test('can combine substitutions and attachments', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const result = benzene.substitute(1, 'n').attach(methyl, 4);

    expect(result.substitutions[1]).toBe('n');
    expect(result.attachments[4]).toEqual([methyl]);
    expect(result.smiles).toBe('n1ccc(C)cc1');
  });

  test('substitution preserves existing attachments', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const withAttachment = benzene.attach(methyl, 1);
    const result = withAttachment.substitute(4, 'n');

    expect(result.attachments[1]).toEqual([methyl]);
    expect(result.substitutions[4]).toBe('n');
  });
});

describe('Ring.substituteMultiple()', () => {
  test('applies multiple substitutions at once', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });

    expect(result.substitutions).toEqual({ 1: 'n', 3: 'n', 5: 'n' });
    expect(result.smiles).toBe('n1cncnc1');
  });

  test('does not mutate original ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.substituteMultiple({ 1: 'n', 4: 'n' });

    expect(benzene.substitutions).toEqual({});
    expect(result.substitutions).toEqual({ 1: 'n', 4: 'n' });
  });

  test('handles empty substitution map', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const result = benzene.substituteMultiple({});

    expect(result.substitutions).toEqual({});
    expect(result.smiles).toBe('c1ccccc1');
  });
});

describe('Ring.clone()', () => {
  test('creates a deep copy of the ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);
    const toluene = benzene.attach(methyl, 1).substitute(4, 'n');

    const cloned = toluene.clone();

    expect(cloned.type).toBe(toluene.type);
    expect(cloned.atoms).toBe(toluene.atoms);
    expect(cloned.size).toBe(toluene.size);
    expect(cloned.substitutions).toEqual(toluene.substitutions);
    expect(cloned).not.toBe(toluene);
    expect(cloned.attachments).not.toBe(toluene.attachments);
  });

  test('cloned ring is independent', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const cloned = ring.clone();
    const modified = cloned.substitute(1, 'n');

    expect(ring.substitutions).toEqual({});
    expect(cloned.substitutions).toEqual({});
    expect(modified.substitutions[1]).toBe('n');
  });
});

describe('Molecule Constructor', () => {
  describe('validation', () => {
    test('throws error when components is not an array', () => {
      expect(() => Molecule('invalid')).toThrow('Molecule requires components array');
    });
  });

  describe('construction', () => {
    test('creates a molecule with multiple components', () => {
      const linear = Linear(['C', 'C', 'C']);
      const ring = Ring({ atoms: 'c', size: 6 });
      const molecule = Molecule([linear, ring]);

      expect(molecule.type).toBe(ASTNodeType.MOLECULE);
      expect(molecule.components).toEqual([linear, ring]);
    });

    test('creates an empty molecule', () => {
      const molecule = Molecule();

      expect(molecule.type).toBe(ASTNodeType.MOLECULE);
      expect(molecule.components).toEqual([]);
    });

    test('creates a molecule with single component', () => {
      const ring = Ring({ atoms: 'c', size: 6 });
      const molecule = Molecule([ring]);

      expect(molecule.components).toEqual([ring]);
    });
  });

  describe('.smiles getter', () => {
    test('returns SMILES for molecule with linear and ring', () => {
      const propyl = Linear(['C', 'C', 'C']);
      const benzene = Ring({ atoms: 'c', size: 6 });
      const propylbenzene = Molecule([propyl, benzene]);

      expect(propylbenzene.smiles).toBe('CCCc1ccccc1');
    });

    test('returns empty string for empty molecule', () => {
      const molecule = Molecule();
      expect(molecule.smiles).toBe('');
    });

    test('returns SMILES for molecule with single component', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      const molecule = Molecule([benzene]);

      expect(molecule.smiles).toBe('c1ccccc1');
    });

    test('returns SMILES for molecule with multiple linear chains', () => {
      const ethyl = Linear(['C', 'C']);
      const methyl = Linear(['C']);
      const molecule = Molecule([ethyl, methyl]);

      expect(molecule.smiles).toBe('CCC');
    });

    test('returns SMILES for complex molecule', () => {
      const leading = Linear(['C', 'C', 'C', 'C']);
      const ring = Ring({ atoms: 'c', size: 6 });
      const trailing = Linear(['C']);
      const molecule = Molecule([leading, ring, trailing]);

      expect(molecule.smiles).toBe('CCCCc1ccccc1C');
    });

    test('returns SMILES for molecule with ring and attachment', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      const methyl = Linear(['C']);
      const toluene = benzene.attach(methyl, 1);
      const propyl = Linear(['C', 'C', 'C']);
      const molecule = Molecule([propyl, toluene]);

      expect(molecule.smiles).toBe('CCCc1(C)ccccc1');
    });
  });
});

describe('Molecule.append()', () => {
  test('adds component to end of molecule', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const methyl = Linear(['C']);

    const molecule = Molecule([propyl, benzene]);
    const extended = molecule.append(methyl);

    expect(extended.components.length).toBe(3);
    expect(extended.smiles).toBe('CCCc1ccccc1C');
  });

  test('does not mutate original molecule', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const extended = molecule.append(Linear(['C']));

    expect(molecule.components.length).toBe(1);
    expect(extended.components.length).toBe(2);
  });
});

describe('Molecule.prepend()', () => {
  test('adds component to beginning of molecule', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const propyl = Linear(['C', 'C', 'C']);

    const molecule = Molecule([benzene]);
    const extended = molecule.prepend(propyl);

    expect(extended.components.length).toBe(2);
    expect(extended.smiles).toBe('CCCc1ccccc1');
  });
});

describe('Molecule.concat()', () => {
  test('concatenates two molecules', () => {
    const mol1 = Molecule([Linear(['C', 'C'])]);
    const mol2 = Molecule([Linear(['C', 'C'])]);
    const combined = mol1.concat(mol2);

    expect(combined.components.length).toBe(2);
    expect(combined.smiles).toBe('CCCC');
  });

  test('concatenates molecule with other component', () => {
    const molecule = Molecule([Linear(['C', 'C'])]);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const combined = molecule.concat(benzene);

    expect(combined.components.length).toBe(2);
    expect(combined.smiles).toBe('CCc1ccccc1');
  });
});

describe('Molecule.clone()', () => {
  test('creates a deep copy of molecule', () => {
    const molecule = Molecule([Linear(['C', 'C']), Ring({ atoms: 'c', size: 6 })]);
    const cloned = molecule.clone();

    expect(cloned.type).toBe(molecule.type);
    expect(cloned.components.length).toBe(molecule.components.length);
    expect(cloned.smiles).toBe(molecule.smiles);
    expect(cloned).not.toBe(molecule);
    expect(cloned.components).not.toBe(molecule.components);
  });
});

describe('FusedRing Constructor', () => {
  describe('validation', () => {
    test('throws error when rings is not an array', () => {
      expect(() => FusedRing('invalid')).toThrow('FusedRing requires rings array');
    });

    test('throws error when rings array is empty', () => {
      expect(() => FusedRing([])).toThrow('FusedRing requires at least one ring');
    });

    test('throws error when rings array contains non-ring nodes', () => {
      const linear = Linear(['C', 'C']);
      expect(() => FusedRing([linear])).toThrow('Ring at index 0 is not a valid ring node');
    });
  });

  describe('construction', () => {
    test('creates a fused ring with two rings', () => {
      const ring1 = Ring({
        atoms: 'C', size: 10, offset: 0, ringNumber: 1,
      });
      const ring2 = Ring({
        atoms: 'C', size: 6, offset: 2, ringNumber: 2,
      });
      const fusedRing = FusedRing([ring1, ring2]);

      expect(fusedRing.type).toBe(ASTNodeType.FUSED_RING);
      expect(fusedRing.rings).toEqual([ring1, ring2]);
    });

    test('creates a fused ring with single ring', () => {
      const ring = Ring({ atoms: 'c', size: 6 });
      const fusedRing = FusedRing([ring]);

      expect(fusedRing.rings).toEqual([ring]);
    });
  });

  describe('.smiles getter', () => {
    test('returns SMILES for naphthalene (simple fused ring)', () => {
      const ring1 = Ring({
        atoms: 'C', size: 10, offset: 0, ringNumber: 1,
      });
      const ring2 = Ring({
        atoms: 'C', size: 6, offset: 2, ringNumber: 2,
      });
      const naphthalene = FusedRing([ring1, ring2]);

      // Note: double bonds not yet supported, so SMILES will have implicit bonds
      expect(naphthalene.smiles).toBe('C1CC2CCCCC2CCCCCC1');
    });

    test('returns SMILES for single ring in fused ring', () => {
      const ring = Ring({ atoms: 'c', size: 6 });
      const fusedRing = FusedRing([ring]);

      expect(fusedRing.smiles).toBe('c1ccccc1');
    });

    test('returns SMILES for benzimidazole-like structure', () => {
      const ring1 = Ring({
        atoms: 'c', size: 9, offset: 0, ringNumber: 1, substitutions: { 2: 'n', 9: 'n' },
      });
      const ring2 = Ring({
        atoms: 'c', size: 6, offset: 2, ringNumber: 2,
      });
      const benzimidazole = FusedRing([ring1, ring2]);

      expect(benzimidazole.smiles).toBe('c1nc2ccccc2ccccn1');
    });

    test('returns SMILES for aromatic fused rings', () => {
      const ring1 = Ring({
        atoms: 'c', size: 10, offset: 0, ringNumber: 1,
      });
      const ring2 = Ring({
        atoms: 'c', size: 6, offset: 2, ringNumber: 2,
      });
      const fusedRing = FusedRing([ring1, ring2]);

      expect(fusedRing.smiles).toBe('c1cc2ccccc2cccccc1');
    });

    test('returns SMILES for fused ring with different ring numbers', () => {
      const ring1 = Ring({
        atoms: 'C', size: 10, offset: 0, ringNumber: 3,
      });
      const ring2 = Ring({
        atoms: 'C', size: 6, offset: 2, ringNumber: 5,
      });
      const fusedRing = FusedRing([ring1, ring2]);

      expect(fusedRing.smiles).toBe('C3CC5CCCCC5CCCCCC3');
    });
  });
});
