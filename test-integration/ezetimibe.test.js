import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const EZETIMIBE_SMILES = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3C(=O)N4CCC(CC4)c5ccc(F)cc5';

describe('Ezetimibe - Real Structure', () => {
  test('parses without error', () => {
    expect(() => parse(EZETIMIBE_SMILES)).not.toThrow();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(EZETIMIBE_SMILES);
    expect(ast.smiles).toBe(EZETIMIBE_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(EZETIMIBE_SMILES);
    expect(reconstructed.smiles).toBe(EZETIMIBE_SMILES);
  });
});

describe('Ezetimibe - Component Structures', () => {
  // Level 1: Simple rings
  test('AST: simple 6-ring c1ccccc1', () => {
    expect(parse('c1ccccc1').smiles).toBe('c1ccccc1');
  });
  test('codegen: simple 6-ring c1ccccc1', () => {
    expect(codegenRoundTrip('c1ccccc1').smiles).toBe('c1ccccc1');
  });

  // Level 2: Ring with fluorine
  test('AST: fluorobenzene c1ccc(F)cc1', () => {
    expect(parse('c1ccc(F)cc1').smiles).toBe('c1ccc(F)cc1');
  });
  test('codegen: fluorobenzene c1ccc(F)cc1', () => {
    expect(codegenRoundTrip('c1ccc(F)cc1').smiles).toBe('c1ccc(F)cc1');
  });

  // Level 3: Ring with hydroxyl
  test('AST: phenol c1ccc(O)cc1', () => {
    expect(parse('c1ccc(O)cc1').smiles).toBe('c1ccc(O)cc1');
  });
  test('codegen: phenol c1ccc(O)cc1', () => {
    expect(codegenRoundTrip('c1ccc(O)cc1').smiles).toBe('c1ccc(O)cc1');
  });

  // Level 4: Piperidine ring
  test('AST: piperidine C1CCNCC1', () => {
    expect(parse('C1CCNCC1').smiles).toBe('C1CCNCC1');
  });
  test('codegen: piperidine C1CCNCC1', () => {
    expect(codegenRoundTrip('C1CCNCC1').smiles).toBe('C1CCNCC1');
  });

  // Level 5: Amide group
  test('AST: amide C(=O)N', () => {
    expect(parse('C(=O)N').smiles).toBe('C(=O)N');
  });
  test('codegen: amide C(=O)N', () => {
    expect(codegenRoundTrip('C(=O)N').smiles).toBe('C(=O)N');
  });

  // Level 6: Stereochemistry basics
  test('AST: chiral center [C@H]', () => {
    expect(parse('C[C@H](O)F').smiles).toBe('C[C@H](O)F');
  });
  test('codegen: chiral center [C@H]', () => {
    expect(codegenRoundTrip('C[C@H](O)F').smiles).toBe('C[C@H](O)F');
  });

  test('AST: double chiral [C@@H]', () => {
    expect(parse('C[C@@H](O)F').smiles).toBe('C[C@@H](O)F');
  });
  test('codegen: double chiral [C@@H]', () => {
    expect(codegenRoundTrip('C[C@@H](O)F').smiles).toBe('C[C@@H](O)F');
  });
});

describe('Ezetimibe - Azetidinone Ring (5-membered with stereochemistry)', () => {
  // Level 1: Simple 5-ring with bracket atoms
  test('AST: simple 5-ring [C@H]1CCCC1', () => {
    expect(parse('[C@H]1CCCC1').smiles).toBe('[C@H]1CCCC1');
  });
  test('codegen: simple 5-ring [C@H]1CCCC1', () => {
    expect(codegenRoundTrip('[C@H]1CCCC1').smiles).toBe('[C@H]1CCCC1');
  });

  // Level 2: 5-ring with substitutions
  test('AST: C[C@H]1[C@@H]C[C@H]C1', () => {
    expect(parse('C[C@H]1[C@@H]C[C@H]C1').smiles).toBe('C[C@H]1[C@@H]C[C@H]C1');
  });
  test('codegen: C[C@H]1[C@@H]C[C@H]C1', () => {
    expect(codegenRoundTrip('C[C@H]1[C@@H]C[C@H]C1').smiles).toBe('C[C@H]1[C@@H]C[C@H]C1');
  });

  // Level 3: 5-ring with attachment (the crucial test)
  test('AST: ring with (O) attachment [C@@H](O)', () => {
    expect(parse('[C@H]1[C@@H](O)CCC1').smiles).toBe('[C@H]1[C@@H](O)CCC1');
  });
  test('codegen: ring with (O) attachment [C@@H](O)', () => {
    expect(codegenRoundTrip('[C@H]1[C@@H](O)CCC1').smiles).toBe('[C@H]1[C@@H](O)CCC1');
  });

  // Level 4: Ring with O-ether in chain
  test('AST: ring with O in chain C[C@H]1[C@@H](O)[C@H](O)C1', () => {
    expect(parse('C[C@H]1[C@@H](O)[C@H](O)C1').smiles).toBe('C[C@H]1[C@@H](O)[C@H](O)C1');
  });
  test('codegen: ring with O in chain C[C@H]1[C@@H](O)[C@H](O)C1', () => {
    expect(codegenRoundTrip('C[C@H]1[C@@H](O)[C@H](O)C1').smiles).toBe('C[C@H]1[C@@H](O)[C@H](O)C1');
  });
});

describe('Ezetimibe - Ring with Sequential Rings (Fused Ring Decompiler)', () => {
  // Level 1: Simple ring + sequential ring
  test('AST: C1CC(c2ccccc2)CC1', () => {
    expect(parse('C1CC(c2ccccc2)CC1').smiles).toBe('C1CC(c2ccccc2)CC1');
  });
  test('codegen: C1CC(c2ccccc2)CC1', () => {
    expect(codegenRoundTrip('C1CC(c2ccccc2)CC1').smiles).toBe('C1CC(c2ccccc2)CC1');
  });

  // Level 2: Ring + sequential ring with attachment (fluorine)
  test('AST: C1CC(c2ccc(F)cc2)CC1', () => {
    expect(parse('C1CC(c2ccc(F)cc2)CC1').smiles).toBe('C1CC(c2ccc(F)cc2)CC1');
  });
  test('codegen: C1CC(c2ccc(F)cc2)CC1', () => {
    expect(codegenRoundTrip('C1CC(c2ccc(F)cc2)CC1').smiles).toBe('C1CC(c2ccc(F)cc2)CC1');
  });

  // Level 3: Ring with bracket atoms + sequential ring
  test('AST: [C@H]1CC(c2ccccc2)CC1', () => {
    expect(parse('[C@H]1CC(c2ccccc2)CC1').smiles).toBe('[C@H]1CC(c2ccccc2)CC1');
  });
  test('codegen: [C@H]1CC(c2ccccc2)CC1', () => {
    expect(codegenRoundTrip('[C@H]1CC(c2ccccc2)CC1').smiles).toBe('[C@H]1CC(c2ccccc2)CC1');
  });

  // Level 4: Ring with attachment + sequential ring with attachment
  test('AST: [C@H]1[C@@H](O)C(c2ccc(F)cc2)CC1', () => {
    expect(parse('[C@H]1[C@@H](O)C(c2ccc(F)cc2)CC1').smiles).toBe('[C@H]1[C@@H](O)C(c2ccc(F)cc2)CC1');
  });
  test('codegen: [C@H]1[C@@H](O)C(c2ccc(F)cc2)CC1', () => {
    expect(codegenRoundTrip('[C@H]1[C@@H](O)C(c2ccc(F)cc2)CC1').smiles).toBe('[C@H]1[C@@H](O)C(c2ccc(F)cc2)CC1');
  });

  // Level 5: Ezetimibe azetidinone core with sequential fluorophenyl
  test('AST: C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)C', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)C';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)C', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)C';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });
});

describe('Ezetimibe - Phenol + Amide-Piperidine Fragment', () => {
  // Level 1: Phenol with trailing chain
  test('AST: c1ccc(O)cc1C', () => {
    expect(parse('c1ccc(O)cc1C').smiles).toBe('c1ccc(O)cc1C');
  });
  test('codegen: c1ccc(O)cc1C', () => {
    expect(codegenRoundTrip('c1ccc(O)cc1C').smiles).toBe('c1ccc(O)cc1C');
  });

  // Level 2: Phenol with amide
  test('AST: c1ccc(O)cc1C(=O)N', () => {
    expect(parse('c1ccc(O)cc1C(=O)N').smiles).toBe('c1ccc(O)cc1C(=O)N');
  });
  test('codegen: c1ccc(O)cc1C(=O)N', () => {
    expect(codegenRoundTrip('c1ccc(O)cc1C(=O)N').smiles).toBe('c1ccc(O)cc1C(=O)N');
  });

  // Level 3: Piperidine with ring number 4
  test('AST: N4CCCCC4', () => {
    expect(parse('N4CCCCC4').smiles).toBe('N4CCCCC4');
  });
  test('codegen: N4CCCCC4', () => {
    expect(codegenRoundTrip('N4CCCCC4').smiles).toBe('N4CCCCC4');
  });

  // Level 4: Piperidine with branch ring closure
  test('AST: N4CCC(CC4)C', () => {
    expect(parse('N4CCC(CC4)C').smiles).toBe('N4CCC(CC4)C');
  });
  test('codegen: N4CCC(CC4)C', () => {
    expect(codegenRoundTrip('N4CCC(CC4)C').smiles).toBe('N4CCC(CC4)C');
  });

  // Level 5: Amide-piperidine
  test('AST: C(=O)N4CCC(CC4)C', () => {
    expect(parse('C(=O)N4CCC(CC4)C').smiles).toBe('C(=O)N4CCC(CC4)C');
  });
  test('codegen: C(=O)N4CCC(CC4)C', () => {
    expect(codegenRoundTrip('C(=O)N4CCC(CC4)C').smiles).toBe('C(=O)N4CCC(CC4)C');
  });

  // Level 6: Piperidine with fluorophenyl
  test('AST: N4CCC(CC4)c5ccc(F)cc5', () => {
    expect(parse('N4CCC(CC4)c5ccc(F)cc5').smiles).toBe('N4CCC(CC4)c5ccc(F)cc5');
  });
  test('codegen: N4CCC(CC4)c5ccc(F)cc5', () => {
    expect(codegenRoundTrip('N4CCC(CC4)c5ccc(F)cc5').smiles).toBe('N4CCC(CC4)c5ccc(F)cc5');
  });

  // Level 7: Full amide-piperidine-fluorophenyl fragment
  test('AST: C(=O)N4CCC(CC4)c5ccc(F)cc5', () => {
    expect(parse('C(=O)N4CCC(CC4)c5ccc(F)cc5').smiles).toBe('C(=O)N4CCC(CC4)c5ccc(F)cc5');
  });
  test('codegen: C(=O)N4CCC(CC4)c5ccc(F)cc5', () => {
    expect(codegenRoundTrip('C(=O)N4CCC(CC4)c5ccc(F)cc5').smiles).toBe('C(=O)N4CCC(CC4)c5ccc(F)cc5');
  });

  // Level 8: Phenol + amide-piperidine-fluorophenyl
  test('AST: c3ccc(O)cc3C(=O)N4CCC(CC4)c5ccc(F)cc5', () => {
    const s = 'c3ccc(O)cc3C(=O)N4CCC(CC4)c5ccc(F)cc5';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: c3ccc(O)cc3C(=O)N4CCC(CC4)c5ccc(F)cc5', () => {
    const s = 'c3ccc(O)cc3C(=O)N4CCC(CC4)c5ccc(F)cc5';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });
});

describe('Ezetimibe - Full Assembly (Divide and Conquer)', () => {
  // Step 1: Azetidinone core only (no sequential rings)
  test('AST: azetidinone C[C@H]1[C@@H](O)[C@H](O)C1', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O)C1';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: azetidinone C[C@H]1[C@@H](O)[C@H](O)C1', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O)C1';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 2: Azetidinone with fluorophenyl sequential ring
  test('AST: azetidinone + fluorophenyl', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)C';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: azetidinone + fluorophenyl', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)C';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 3: Azetidinone + fluorophenyl + phenol
  test('AST: azetidinone + fluorophenyl + phenol', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: azetidinone + fluorophenyl + phenol', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 4: Add amide
  test('AST: core + phenol + amide', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3C(=O)N';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: core + phenol + amide', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3C(=O)N';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 5: Add piperidine
  test('AST: core + phenol + amide-piperidine', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3C(=O)N4CCC(CC4)C';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: core + phenol + amide-piperidine', () => {
    const s = 'C[C@H]1[C@@H](O)[C@H](O[C@H]1c2ccc(F)cc2)c3ccc(O)cc3C(=O)N4CCC(CC4)C';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 6: Full ezetimibe (add terminal fluorophenyl)
  test('AST: full ezetimibe', () => {
    expect(parse(EZETIMIBE_SMILES).smiles).toBe(EZETIMIBE_SMILES);
  });
  test('codegen: full ezetimibe', () => {
    expect(codegenRoundTrip(EZETIMIBE_SMILES).smiles).toBe(EZETIMIBE_SMILES);
  });
});
