const {
  Ring, Linear, Molecule, FusedRing,
} = require('./constructors');

describe('Integration Tests - Programmatic Construction API', () => {
  describe('Building simple molecules', () => {
    test('creates benzene', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      expect(benzene.smiles).toBe('c1ccccc1');
    });

    test('creates propane', () => {
      const propane = Linear(['C', 'C', 'C']);
      expect(propane.smiles).toBe('CCC');
    });

    test('creates toluene', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      const methyl = Linear(['C']);
      const toluene = benzene.attach(methyl, 1);
      expect(toluene.smiles).toBe('c1(C)ccccc1');
    });
  });

  describe('Building heteroaromatic compounds', () => {
    test('creates pyridine', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      const pyridine = benzene.substitute(1, 'n');
      expect(pyridine.smiles).toBe('n1ccccc1');
    });

    test('creates triazine', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      const triazine = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });
      expect(triazine.smiles).toBe('n1cncnc1');
    });
  });

  describe('Building complex molecules', () => {
    test('creates propylbenzene', () => {
      const propyl = Linear(['C', 'C', 'C']);
      const benzene = Ring({ atoms: 'c', size: 6 });
      const propylbenzene = Molecule([propyl, benzene]);
      expect(propylbenzene.smiles).toBe('CCCc1ccccc1');
    });

    test('creates naphthalene', () => {
      const ring1 = Ring({
        atoms: 'C', size: 10, offset: 0, ringNumber: 1,
      });
      const ring2 = Ring({
        atoms: 'C', size: 6, offset: 2, ringNumber: 2,
      });
      const naphthalene = FusedRing([ring1, ring2]);
      expect(naphthalene.smiles).toBe('C1CC2CCCCC2CCCCCC1');
    });

    test('creates biphenyl', () => {
      const benzene1 = Ring({ atoms: 'c', size: 6, ringNumber: 1 });
      const benzene2 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
      const biphenyl = benzene1.attach(benzene2, 1);
      expect(biphenyl.smiles).toBe('c1(c2ccccc2)ccccc1');
    });
  });

  describe('Fluent API / Method chaining', () => {
    test('chains multiple operations', () => {
      const molecule = Ring({ atoms: 'c', size: 6 })
        .substitute(1, 'n')
        .attach(Linear(['C', 'C']), 4);

      expect(molecule.smiles).toBe('n1ccc(CC)cc1');
    });

    test('builds molecule step by step', () => {
      const base = Ring({ atoms: 'c', size: 6 });
      const withNitrogen = base.substitute(1, 'n');
      const withEthyl = withNitrogen.attach(Linear(['C', 'C']), 4);

      expect(base.smiles).toBe('c1ccccc1');
      expect(withNitrogen.smiles).toBe('n1ccccc1');
      expect(withEthyl.smiles).toBe('n1ccc(CC)cc1');
    });
  });

  describe('Immutability', () => {
    test('operations do not mutate original', () => {
      const benzene = Ring({ atoms: 'c', size: 6 });
      const pyridine = benzene.substitute(1, 'n');
      const toluene = benzene.attach(Linear(['C']), 1);

      expect(benzene.smiles).toBe('c1ccccc1');
      expect(pyridine.smiles).toBe('n1ccccc1');
      expect(toluene.smiles).toBe('c1(C)ccccc1');
    });

    test('can build multiple molecules from same base', () => {
      const base = Ring({ atoms: 'c', size: 6 });
      const molecules = [1, 2, 3, 4, 5, 6].map((pos) => base.substitute(pos, 'n'));

      expect(molecules.map((m) => m.smiles)).toEqual([
        'n1ccccc1',
        'c1ncccc1',
        'c1cnccc1',
        'c1ccncc1',
        'c1cccnc1',
        'c1ccccn1',
      ]);
    });
  });

  describe('Cloning and copying', () => {
    test('clones rings', () => {
      const original = Ring({ atoms: 'c', size: 6 });
      const cloned = original.clone();
      const modified = cloned.substitute(1, 'n');

      expect(original.smiles).toBe('c1ccccc1');
      expect(cloned.smiles).toBe('c1ccccc1');
      expect(modified.smiles).toBe('n1ccccc1');
    });

    test('clones linear chains', () => {
      const original = Linear(['C', 'C', 'C']);
      const cloned = original.clone();

      expect(cloned.smiles).toBe('CCC');
      expect(cloned).not.toBe(original);
    });
  });

  describe('Concatenation', () => {
    test('concatenates linear chains', () => {
      const propyl = Linear(['C', 'C', 'C']);
      const ethyl = Linear(['C', 'C']);
      const pentyl = propyl.concat(ethyl);

      expect(pentyl.smiles).toBe('CCCCC');
    });

    test('concatenates linear with ring creates molecule', () => {
      const propyl = Linear(['C', 'C', 'C']);
      const benzene = Ring({ atoms: 'c', size: 6 });
      const result = propyl.concat(benzene);

      expect(result.smiles).toBe('CCCc1ccccc1');
    });

    test('concatenates molecules', () => {
      const mol1 = Molecule([Linear(['C', 'C'])]);
      const mol2 = Molecule([Linear(['C', 'C'])]);
      const combined = mol1.concat(mol2);

      expect(combined.smiles).toBe('CCCC');
    });
  });

  describe('Building with explicit bonds', () => {
    test('creates ethene with double bond', () => {
      const ethene = Linear(['C', 'C'], ['=']);
      expect(ethene.smiles).toBe('C=C');
    });

    test('creates propyne with triple bond', () => {
      const propyne = Linear(['C', 'C', 'C'], ['#', '']);
      expect(propyne.smiles).toBe('C#CC');
    });
  });
});
