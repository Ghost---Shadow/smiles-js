import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const FLUVASTATIN_SMILES = 'CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1/C=C/c1ccccc1';

describe('Fluvastatin - Real Structure', () => {
  test('parses without error', () => {
    expect(() => parse(FLUVASTATIN_SMILES)).not.toThrow();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(FLUVASTATIN_SMILES);
    expect(ast.smiles).toBe(FLUVASTATIN_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(FLUVASTATIN_SMILES);
    expect(reconstructed.smiles).toBe(FLUVASTATIN_SMILES);
  });
});

describe('Fluvastatin - Directional Bonds (E/Z stereo)', () => {
  // Level 1: Simple directional bonds in linear chains
  test('AST: simple /C=C/', () => {
    expect(parse('C/C=C/C').smiles).toBe('C/C=C/C');
  });
  test('codegen: simple /C=C/', () => {
    expect(codegenRoundTrip('C/C=C/C').smiles).toBe('C/C=C/C');
  });

  test('AST: simple \\C=C\\', () => {
    expect(parse('C\\C=C\\C').smiles).toBe('C\\C=C\\C');
  });

  test('AST: trans /C=C\\', () => {
    expect(parse('C/C=C\\C').smiles).toBe('C/C=C\\C');
  });

  // Level 2: Directional bond after a ring
  test('AST: ring then /C=C/C', () => {
    expect(parse('c1cccc1/C=C/C').smiles).toBe('c1cccc1/C=C/C');
  });
  test('codegen: ring then /C=C/C', () => {
    expect(codegenRoundTrip('c1cccc1/C=C/C').smiles).toBe('c1cccc1/C=C/C');
  });

  test('AST: 6-ring then /C=C/C', () => {
    expect(parse('c1ccccc1/C=C/C').smiles).toBe('c1ccccc1/C=C/C');
  });
  test('codegen: 6-ring then /C=C/C', () => {
    expect(codegenRoundTrip('c1ccccc1/C=C/C').smiles).toBe('c1ccccc1/C=C/C');
  });

  // Level 3: Directional bond connecting ring to ring
  test('AST: ring /C=C/ ring', () => {
    expect(parse('c1cccc1/C=C/c1ccccc1').smiles).toBe('c1cccc1/C=C/c1ccccc1');
  });
  test('codegen: ring /C=C/ ring', () => {
    expect(codegenRoundTrip('c1cccc1/C=C/c1ccccc1').smiles).toBe('c1cccc1/C=C/c1ccccc1');
  });

  // Level 4: Directional bond after ring with prefix
  test('AST: prefix + ring + /C=C/C', () => {
    expect(parse('Cc1cccc1/C=C/C').smiles).toBe('Cc1cccc1/C=C/C');
  });
  test('codegen: prefix + ring + /C=C/C', () => {
    expect(codegenRoundTrip('Cc1cccc1/C=C/C').smiles).toBe('Cc1cccc1/C=C/C');
  });
});

describe('Fluvastatin - Component Structures', () => {
  // Level 1: Isopropyl group
  test('AST: isopropylamine CC(C)N', () => {
    expect(parse('CC(C)N').smiles).toBe('CC(C)N');
  });
  test('codegen: isopropylamine CC(C)N', () => {
    expect(codegenRoundTrip('CC(C)N').smiles).toBe('CC(C)N');
  });

  // Level 2: Pyrrole ring
  test('AST: pyrrole n1cccc1', () => {
    expect(parse('n1cccc1').smiles).toBe('n1cccc1');
  });
  test('codegen: pyrrole n1cccc1', () => {
    expect(codegenRoundTrip('n1cccc1').smiles).toBe('n1cccc1');
  });

  // Level 3: N-isopropyl pyrrole
  test('AST: N-isopropyl pyrrole CC(C)n1cccc1', () => {
    expect(parse('CC(C)n1cccc1').smiles).toBe('CC(C)n1cccc1');
  });
  test('codegen: N-isopropyl pyrrole CC(C)n1cccc1', () => {
    expect(codegenRoundTrip('CC(C)n1cccc1').smiles).toBe('CC(C)n1cccc1');
  });

  // Level 4: Amide group
  test('AST: amide C(=O)N', () => {
    expect(parse('C(=O)N').smiles).toBe('C(=O)N');
  });
  test('codegen: amide C(=O)N', () => {
    expect(codegenRoundTrip('C(=O)N').smiles).toBe('C(=O)N');
  });

  // Level 5: Amide connected to ring
  test('AST: amide + benzene C(=O)Nc1ccccc1', () => {
    expect(parse('C(=O)Nc1ccccc1').smiles).toBe('C(=O)Nc1ccccc1');
  });
  test('codegen: amide + benzene C(=O)Nc1ccccc1', () => {
    expect(codegenRoundTrip('C(=O)Nc1ccccc1').smiles).toBe('C(=O)Nc1ccccc1');
  });

  // Level 6: Anthranilic acid fragment (benzene with NH and COOH)
  test('AST: anthranilic acid Nc1ccccc1C(=O)O', () => {
    expect(parse('Nc1ccccc1C(=O)O').smiles).toBe('Nc1ccccc1C(=O)O');
  });
  test('codegen: anthranilic acid Nc1ccccc1C(=O)O', () => {
    expect(codegenRoundTrip('Nc1ccccc1C(=O)O').smiles).toBe('Nc1ccccc1C(=O)O');
  });

  // Level 7: Full amide-anthranilic acid piece
  test('AST: C(=O)Nc2ccccc2C(=O)O', () => {
    expect(parse('C(=O)Nc2ccccc2C(=O)O').smiles).toBe('C(=O)Nc2ccccc2C(=O)O');
  });
  test('codegen: C(=O)Nc2ccccc2C(=O)O', () => {
    expect(codegenRoundTrip('C(=O)Nc2ccccc2C(=O)O').smiles).toBe('C(=O)Nc2ccccc2C(=O)O');
  });

  // Level 8: Fluorophenyl
  test('AST: fluorobenzene c1ccc(F)cc1', () => {
    expect(parse('c1ccc(F)cc1').smiles).toBe('c1ccc(F)cc1');
  });
  test('codegen: fluorobenzene c1ccc(F)cc1', () => {
    expect(codegenRoundTrip('c1ccc(F)cc1').smiles).toBe('c1ccc(F)cc1');
  });

  // Level 9: Fluorophenyl as branch with dash-bond
  test('AST: -c2ccc(F)cc2 as branch', () => {
    expect(parse('C(-c2ccc(F)cc2)').smiles).toBe('C(-c2ccc(F)cc2)');
  });
  test('codegen: -c2ccc(F)cc2 as branch', () => {
    expect(codegenRoundTrip('C(-c2ccc(F)cc2)').smiles).toBe('C(-c2ccc(F)cc2)');
  });

  // Level 10: Hydroxyl branch
  test('AST: c(O) hydroxyl on ring', () => {
    expect(parse('c1cc(O)cc1').smiles).toBe('c1cc(O)cc1');
  });
  test('codegen: c(O) hydroxyl on ring', () => {
    expect(codegenRoundTrip('c1cc(O)cc1').smiles).toBe('c1cc(O)cc1');
  });

  // Level 11: Styryl group (vinyl benzene)
  test('AST: styrene C/C=C/c1ccccc1', () => {
    expect(parse('C/C=C/c1ccccc1').smiles).toBe('C/C=C/c1ccccc1');
  });
  test('codegen: styrene C/C=C/c1ccccc1', () => {
    expect(codegenRoundTrip('C/C=C/c1ccccc1').smiles).toBe('C/C=C/c1ccccc1');
  });
});

describe('Fluvastatin - Building Up (Divide and Conquer)', () => {
  // Step 1: Pyrrole with two simple substituents
  test('AST: pyrrole with substituents c1c(C)c(C)c(C)c1C', () => {
    expect(parse('c1c(C)c(C)c(C)c1C').smiles).toBe('c1c(C)c(C)c(C)c1C');
  });
  test('codegen: pyrrole with substituents c1c(C)c(C)c(C)c1C', () => {
    expect(codegenRoundTrip('c1c(C)c(C)c(C)c1C').smiles).toBe('c1c(C)c(C)c(C)c1C');
  });

  // Step 2: Pyrrole with N-isopropyl
  test('AST: CC(C)n1cccc1C', () => {
    expect(parse('CC(C)n1cccc1C').smiles).toBe('CC(C)n1cccc1C');
  });
  test('codegen: CC(C)n1cccc1C', () => {
    expect(codegenRoundTrip('CC(C)n1cccc1C').smiles).toBe('CC(C)n1cccc1C');
  });

  // Step 3: Pyrrole with amide branch
  test('AST: n1c(C(=O)N)ccc1', () => {
    expect(parse('n1c(C(=O)N)ccc1').smiles).toBe('n1c(C(=O)N)ccc1');
  });
  test('codegen: n1c(C(=O)N)ccc1', () => {
    expect(codegenRoundTrip('n1c(C(=O)N)ccc1').smiles).toBe('n1c(C(=O)N)ccc1');
  });

  // Step 4: Pyrrole with amide-benzene branch
  test('AST: n1c(C(=O)Nc2ccccc2)ccc1', () => {
    expect(parse('n1c(C(=O)Nc2ccccc2)ccc1').smiles).toBe('n1c(C(=O)Nc2ccccc2)ccc1');
  });
  test('codegen: n1c(C(=O)Nc2ccccc2)ccc1', () => {
    expect(codegenRoundTrip('n1c(C(=O)Nc2ccccc2)ccc1').smiles).toBe('n1c(C(=O)Nc2ccccc2)ccc1');
  });

  // Step 5: Pyrrole with full anthranilic acid branch
  test('AST: n1c(C(=O)Nc2ccccc2C(=O)O)ccc1', () => {
    expect(parse('n1c(C(=O)Nc2ccccc2C(=O)O)ccc1').smiles).toBe('n1c(C(=O)Nc2ccccc2C(=O)O)ccc1');
  });
  test('codegen: n1c(C(=O)Nc2ccccc2C(=O)O)ccc1', () => {
    expect(codegenRoundTrip('n1c(C(=O)Nc2ccccc2C(=O)O)ccc1').smiles).toBe('n1c(C(=O)Nc2ccccc2C(=O)O)ccc1');
  });

  // Step 6: Pyrrole with fluorophenyl branch
  test('AST: n1cc(-c2ccc(F)cc2)cc1', () => {
    expect(parse('n1cc(-c2ccc(F)cc2)cc1').smiles).toBe('n1cc(-c2ccc(F)cc2)cc1');
  });
  test('codegen: n1cc(-c2ccc(F)cc2)cc1', () => {
    expect(codegenRoundTrip('n1cc(-c2ccc(F)cc2)cc1').smiles).toBe('n1cc(-c2ccc(F)cc2)cc1');
  });

  // Step 7: Pyrrole with hydroxyl and fluorophenyl
  test('AST: n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1', () => {
    const s = 'n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1', () => {
    const s = 'n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 8: Add isopropyl prefix
  test('AST: CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1', () => {
    const s = 'CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1', () => {
    const s = 'CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 9: Ring with trailing C=C (no directional bonds)
  test('AST: c1cccc1C=CC', () => {
    expect(parse('c1cccc1C=CC').smiles).toBe('c1cccc1C=CC');
  });
  test('codegen: c1cccc1C=CC', () => {
    expect(codegenRoundTrip('c1cccc1C=CC').smiles).toBe('c1cccc1C=CC');
  });

  // Step 10: Ring with trailing /C=C/ (the crux issue)
  test('AST: c1cccc1/C=C/C', () => {
    expect(parse('c1cccc1/C=C/C').smiles).toBe('c1cccc1/C=C/C');
  });
  test('codegen: c1cccc1/C=C/C', () => {
    expect(codegenRoundTrip('c1cccc1/C=C/C').smiles).toBe('c1cccc1/C=C/C');
  });

  // Step 11: Ring with trailing /C=C/ connecting to another ring
  test('AST: c1cccc1/C=C/c1ccccc1', () => {
    expect(parse('c1cccc1/C=C/c1ccccc1').smiles).toBe('c1cccc1/C=C/c1ccccc1');
  });
  test('codegen: c1cccc1/C=C/c1ccccc1', () => {
    expect(codegenRoundTrip('c1cccc1/C=C/c1ccccc1').smiles).toBe('c1cccc1/C=C/c1ccccc1');
  });

  // Step 12: Pyrrole core + trailing /C=C/phenyl (almost fluvastatin tail)
  test('AST: CC(C)n1cccc1/C=C/c1ccccc1', () => {
    expect(parse('CC(C)n1cccc1/C=C/c1ccccc1').smiles).toBe('CC(C)n1cccc1/C=C/c1ccccc1');
  });
  test('codegen: CC(C)n1cccc1/C=C/c1ccccc1', () => {
    expect(codegenRoundTrip('CC(C)n1cccc1/C=C/c1ccccc1').smiles).toBe('CC(C)n1cccc1/C=C/c1ccccc1');
  });

  // Step 13: Pyrrole with one branch + trailing /C=C/phenyl
  test('AST: CC(C)n1c(C)cc(O)c1/C=C/c1ccccc1', () => {
    const s = 'CC(C)n1c(C)cc(O)c1/C=C/c1ccccc1';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: CC(C)n1c(C)cc(O)c1/C=C/c1ccccc1', () => {
    const s = 'CC(C)n1c(C)cc(O)c1/C=C/c1ccccc1';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 14: Full fluvastatin without the /C=C/phenyl tail
  test('AST: fluvastatin without styryl tail', () => {
    const s = 'CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1C';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: fluvastatin without styryl tail', () => {
    const s = 'CC(C)n1c(C(=O)Nc2ccccc2C(=O)O)c(-c2ccc(F)cc2)c(O)c1C';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 15: Full fluvastatin (adding /C=C/phenyl)
  test('AST: full fluvastatin', () => {
    expect(parse(FLUVASTATIN_SMILES).smiles).toBe(FLUVASTATIN_SMILES);
  });
  test('codegen: full fluvastatin', () => {
    expect(codegenRoundTrip(FLUVASTATIN_SMILES).smiles).toBe(FLUVASTATIN_SMILES);
  });
});
