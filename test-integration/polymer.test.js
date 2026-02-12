import { describe, test, expect } from 'bun:test';
import { Ring, Linear, Molecule } from '../src/constructors.js';

describe('Polymer repeat() Integration', () => {
  test('polyethylene trimer: -[CH2CH2]3-', () => {
    const ethylene = Linear(['C', 'C']);
    const pe = ethylene.repeat(3, 1, 2);
    expect(pe.smiles).toBe('CCCCCC');
  });

  test('polystyrene dimer: styrene with phenyl pendant', () => {
    const styrene = Linear(['C', 'C']).attach(
      2,
      Ring({ atoms: 'c', size: 6 }),
    );
    const ps = styrene.repeat(2, 1, 2);
    expect(ps.smiles).toBe('CC(c1ccccc1)CC(c2ccccc2)');
  });

  test('polystyrene trimer', () => {
    const styrene = Linear(['C', 'C']).attach(
      2,
      Ring({ atoms: 'c', size: 6 }),
    );
    const ps = styrene.repeat(3, 1, 2);
    expect(ps.smiles).toBe('CC(c1ccccc1)CC(c2ccccc2)CC(c3ccccc3)');
  });

  test('poly(vinyl alcohol) dimer: -[CH2CH(OH)]2-', () => {
    const vinylAlcohol = Linear(['C', 'C']).attach(
      2,
      Linear(['O']),
    );
    const pva = vinylAlcohol.repeat(2, 1, 2);
    expect(pva.smiles).toBe('CC(O)CC(O)');
  });

  test('biphenyl: two linked benzene rings', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const biphenyl = benzene.repeat(2, 1, 6);
    expect(biphenyl.smiles).toBe('c1ccccc1c2ccccc2');
  });

  test('terphenyl: three linked benzene rings', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const terphenyl = benzene.repeat(3, 1, 6);
    expect(terphenyl.smiles).toBe('c1ccccc1c2ccccc2c3ccccc3');
  });

  test('bipyridine: two linked pyridine rings', () => {
    const pyridine = Ring({
      atoms: 'c',
      size: 6,
      substitutions: { 3: 'n' },
    });
    const bipyridine = pyridine.repeat(2, 1, 6);
    expect(bipyridine.smiles).toBe('c1cnccc1c2cnccc2');
  });

  test('polyoxymethylene trimer: -[CH2O]3-', () => {
    const oxymethylene = Linear(['C', 'O']);
    const pom = oxymethylene.repeat(3, 1, 2);
    expect(pom.smiles).toBe('COCOCO');
  });

  test('nylon 6,6 repeating unit dimer', () => {
    const unit = Molecule([
      Linear(['N', 'C'], [null, '=']),
      Linear(['C', 'C', 'C', 'C']),
      Linear(['C', 'N'], ['=', null]),
      Linear(['C', 'C', 'C', 'C', 'C', 'C']),
    ]);
    const dimer = unit.repeat(2, 1, 1);
    expect(dimer.type).toBe('molecule');
    expect(dimer.components).toHaveLength(2);
    expect(dimer.smiles).toBe('N=CCCCC=CNCCCCCCN=CCCCC=CNCCCCCC');
  });
});

describe('Polymer fusedRepeat() Integration', () => {
  test('naphthalene: 2 fused aromatic rings', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const naphthalene = benzene.fusedRepeat(2, 4);
    expect(naphthalene.type).toBe('fused_ring');
    expect(naphthalene.rings).toHaveLength(2);
    expect(naphthalene.rings[0].ringNumber).toBe(1);
    expect(naphthalene.rings[1].ringNumber).toBe(2);
  });

  test('anthracene: 3 fused aromatic rings', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const anthracene = benzene.fusedRepeat(3, 4);
    expect(anthracene.type).toBe('fused_ring');
    expect(anthracene.rings).toHaveLength(3);
  });

  test('tetracene: 4 fused aromatic rings', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const tetracene = benzene.fusedRepeat(4, 4);
    expect(tetracene.type).toBe('fused_ring');
    expect(tetracene.rings).toHaveLength(4);
  });

  test('fused cyclohexane dimer (decalin-like)', () => {
    const cyclohexane = Ring({ atoms: 'C', size: 6 });
    const decalin = cyclohexane.fusedRepeat(2, 4);
    expect(decalin.type).toBe('fused_ring');
    expect(decalin.rings).toHaveLength(2);
  });

  test('fused 5-membered rings (pentalene-like)', () => {
    const cp = Ring({ atoms: 'C', size: 5 });
    const pentalene = cp.fusedRepeat(2, 3);
    expect(pentalene.type).toBe('fused_ring');
    expect(pentalene.rings).toHaveLength(2);
  });
});

describe('Polymer edge cases', () => {
  test('repeat n=1 returns clone, not original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const clone = benzene.repeat(1, 1, 6);
    expect(clone.smiles).toBe('c1ccccc1');
    expect(clone).not.toBe(benzene);
  });

  test('fusedRepeat n=1 returns ring clone', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const clone = benzene.fusedRepeat(1, 4);
    expect(clone.smiles).toBe('c1ccccc1');
    expect(clone.type).toBe('ring');
    expect(clone).not.toBe(benzene);
  });

  test('large repeat count (n=10)', () => {
    const ethylene = Linear(['C', 'C']);
    const pe10 = ethylene.repeat(10, 1, 2);
    expect(pe10.smiles).toBe('C'.repeat(20));
  });

  test('repeat preserves immutability of original', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const original = benzene.smiles;
    benzene.repeat(5, 1, 6);
    benzene.fusedRepeat(3, 4);
    expect(benzene.smiles).toBe(original);
  });
});
