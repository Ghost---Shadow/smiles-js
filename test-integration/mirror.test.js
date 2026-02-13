import { describe, test, expect } from 'bun:test';
import { Ring, Linear, Molecule } from '../src/constructors.js';

describe('Mirror Integration - Linear', () => {
  test('diethyl ether: CCO mirrored → CCOCC', () => {
    const half = Linear(['C', 'C', 'O']);
    const ether = half.mirror();
    expect(ether.smiles).toBe('CCOCC');
  });

  test('diethylamine: CCN mirrored → CCNCC', () => {
    const half = Linear(['C', 'C', 'N']);
    const result = half.mirror();
    expect(result.smiles).toBe('CCNCC');
  });

  test('glycol-like: OCCO mirrored at pivot=3 → OCCOCCCO', () => {
    const half = Linear(['O', 'C', 'C', 'O']);
    const result = half.mirror(3);
    // Left: [O,C,C], Right: reverse of [O,C] → [C,O]
    expect(result.smiles).toBe('OCCCO');
  });

  test('symmetric alkene: C=C=O mirrored → C=COC=C', () => {
    const half = Linear(['C', 'C', 'O'], ['=']);
    const result = half.mirror();
    expect(result.smiles).toBe('C=COC=C');
  });

  test('symmetric chain with phenyl pendant', () => {
    const half = Linear(['C', 'C', 'O']).attach(
      1,
      Ring({ atoms: 'c', size: 6 }),
    );
    const result = half.mirror();
    expect(result.smiles).toBe('C(c1ccccc1)COCC(c2ccccc2)');
  });

  test('long palindromic chain', () => {
    const half = Linear(['C', 'C', 'C', 'C', 'N']);
    const result = half.mirror();
    expect(result.smiles).toBe('CCCCNCCCC');
  });
});

describe('Mirror Integration - Molecule (ABA copolymers)', () => {
  test('ABA: polyethylene-benzene-polyethylene', () => {
    const A = Linear(['C', 'C']);
    const B = Ring({ atoms: 'c', size: 6 });
    const AB = Molecule([A, B]);
    const ABA = AB.mirror();
    expect(ABA.smiles).toBe('CCc1ccccc1CC');
  });

  test('ABCBA: ethyl-benzene-oxygen-benzene-ethyl', () => {
    const block = Molecule([
      Linear(['C', 'C']),
      Ring({ atoms: 'c', size: 6 }),
      Linear(['O']),
    ]);
    const result = block.mirror();
    expect(result.smiles).toBe('CCc1ccccc1Oc2ccccc2CC');
  });

  test('ABA with polystyrene arms', () => {
    const styrene = Linear(['C', 'C']).attach(
      2,
      Ring({ atoms: 'c', size: 6 }),
    );
    const core = Linear(['O', 'C', 'O']);
    const halfBlock = Molecule([styrene, core]);
    const symmetric = halfBlock.mirror();
    // styrene-OCO-styrene (with shifted ring numbers)
    expect(symmetric.type).toBe('molecule');
    expect(symmetric.components).toHaveLength(3);
  });

  test('repeat + mirror: homopolymer arm with symmetric core', () => {
    const arm = Linear(['C', 'C']).repeat(2, 1, 2);
    const core = Ring({ atoms: 'c', size: 6 });
    const halfBlock = Molecule([arm, core]);
    const symmetric = halfBlock.mirror();
    expect(symmetric.smiles).toBe('CCCCc1ccccc1CCCC');
  });
});

describe('Mirror Integration - Ring', () => {
  test('meta-xylene: methyl at 2, mirror pivot=3', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    const result = mono.mirror(3);
    expect(result.smiles).toBe('c1c(C)cc(C)cc1');
  });

  test('1,3-disubstituted pyridine: N at 2, mirror pivot=1', () => {
    const ring = Ring({
      atoms: 'c',
      size: 6,
      substitutions: { 2: 'n' },
    });
    const result = ring.mirror(1);
    expect(result.substitutions[2]).toBe('n');
    expect(result.substitutions[6]).toBe('n');
  });

  test('symmetric ring with two pendant groups', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['O']));
    const result = mono.mirror(3);
    // Attachment at 2 and mirror at 4
    expect(result.attachments[2]).toHaveLength(1);
    expect(result.attachments[4]).toHaveLength(1);
  });
});

describe('Mirror edge cases', () => {
  test('mirror preserves immutability', () => {
    const chain = Linear(['C', 'C', 'O']);
    const original = chain.smiles;
    chain.mirror();
    expect(chain.smiles).toBe(original);

    const benzene = Ring({ atoms: 'c', size: 6 });
    const mono = benzene.attach(2, Linear(['C']));
    const originalSmiles = mono.smiles;
    mono.mirror(1);
    expect(mono.smiles).toBe(originalSmiles);

    const mol = Molecule([Linear(['C']), Linear(['N'])]);
    const originalMol = mol.smiles;
    mol.mirror();
    expect(mol.smiles).toBe(originalMol);
  });

  test('mirror of single atom is identity', () => {
    const single = Linear(['N']);
    expect(single.mirror().smiles).toBe('N');
  });

  test('mirror of two-atom chain', () => {
    const two = Linear(['C', 'N']);
    expect(two.mirror().smiles).toBe('CNC');
  });

  test('mirror of single-component molecule', () => {
    const mol = Molecule([Linear(['C', 'C'])]);
    const result = mol.mirror();
    expect(result.smiles).toBe('CC');
    expect(result.components).toHaveLength(1);
  });
});
