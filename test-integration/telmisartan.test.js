import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { tokenize } from '../src/tokenizer.js';
import { codegenRoundTrip } from './utils.js';

const TELMISARTAN_SMILES = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
// With bond preservation, double bonds in rings are now preserved
const TELMISARTAN_OUTPUT = TELMISARTAN_SMILES;

describe('Telmisartan - Real Structure', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(TELMISARTAN_SMILES);
    const atoms = tokens.filter((t) => t.type === 'atom');
    const ringMarkers = tokens.filter((t) => t.type === 'ring_marker');

    expect(atoms.length).toBe(39);
    expect(ringMarkers.length).toBe(12);
  });

  test('identifies ring markers at correct atom indices', () => {
    const tokens = tokenize(TELMISARTAN_SMILES);

    const ringMarkerPositions = [];
    let atomIndex = -1;
    tokens.forEach((token) => {
      if (token.type === 'atom') atomIndex += 1;
      if (token.type === 'ring_marker') {
        ringMarkerPositions.push({ ringNumber: token.ringNumber, atomIndex });
      }
    });

    expect(ringMarkerPositions).toEqual([
      { ringNumber: 1, atomIndex: 3 },
      { ringNumber: 2, atomIndex: 5 },
      { ringNumber: 2, atomIndex: 10 },
      { ringNumber: 1, atomIndex: 11 },
      { ringNumber: 3, atomIndex: 13 },
      { ringNumber: 3, atomIndex: 18 },
      { ringNumber: 4, atomIndex: 19 },
      { ringNumber: 4, atomIndex: 24 },
      { ringNumber: 5, atomIndex: 28 },
      { ringNumber: 6, atomIndex: 30 },
      { ringNumber: 6, atomIndex: 35 },
      { ringNumber: 5, atomIndex: 36 },
    ]);
  });

  test('parses without error', () => {
    expect(() => parse(TELMISARTAN_SMILES)).not.toThrow();
  });

  test('round-trips correctly', () => {
    const ast = parse(TELMISARTAN_SMILES);
    expect(ast.smiles).toBe(TELMISARTAN_SMILES);
  });
  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(TELMISARTAN_SMILES);
    expect(reconstructed.smiles).toBe(TELMISARTAN_SMILES);
  });
});

describe('Telmisartan - Component Structures', () => {
  test('simple benzimidazole parses', () => {
    const ast = parse('c1nc2ccccc2n1');
    expect(ast.smiles).toBe('c1nc2ccccc2n1');
  });

  test('simple benzimidazole codegen', () => {
    const reconstructed = codegenRoundTrip('c1nc2ccccc2n1');
    expect(reconstructed.smiles).toBe('c1nc2ccccc2n1');
  });

  test('benzimidazole with explicit double bonds parses', () => {
    const ast = parse('C1=NC2=CC=CC=C2N1');
    expect(ast.smiles).toBe('C1=NC2=CC=CC=C2N1');
  });

  test('benzimidazole with explicit double bonds codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=CC=CC=C2N1');
    expect(reconstructed.smiles).toBe('C1=NC2=CC=CC=C2N1');
  });

  test('benzimidazole in branch parses', () => {
    const ast = parse('C(c1nc2ccccc2n1)C');
    expect(ast.smiles).toBe('C(c1nc2ccccc2n1)C');
  });

  test('benzimidazole in branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(c1nc2ccccc2n1)C');
    expect(reconstructed.smiles).toBe('C(c1nc2ccccc2n1)C');
  });

  test('fused ring with methyl substituent parses', () => {
    const ast = parse('c1nc2c(C)cc(C)cc2n1');
    expect(ast.smiles).toBe('c1nc2c(C)cc(C)cc2n1');
  });

  test('fused ring with methyl substituent codegen', () => {
    const reconstructed = codegenRoundTrip('c1nc2c(C)cc(C)cc2n1');
    expect(reconstructed.smiles).toBe('c1nc2c(C)cc(C)cc2n1');
  });

  test('benzimidazole substituent (C5=NC6=...) parses', () => {
    const ast = parse('C5=NC6=CC=CC=C6N5C');
    expect(ast.smiles).toBe('C5=NC6=CC=CC=C6N5C');
  });

  test('benzimidazole substituent (C5=NC6=...) codegen', () => {
    const reconstructed = codegenRoundTrip('C5=NC6=CC=CC=C6N5C');
    expect(reconstructed.smiles).toBe('C5=NC6=CC=CC=C6N5C');
  });

  test('nested fused ring in branch', () => {
    const ast = parse('c1ccc(C5=NC6=CC=CC=C6N5C)cc1');
    expect(ast.smiles).toBe('c1ccc(C5=NC6=CC=CC=C6N5C)cc1');
  });

  test('nested fused ring in branch codegen', () => {
    const reconstructed = codegenRoundTrip('c1ccc(C5=NC6=CC=CC=C6N5C)cc1');
    expect(reconstructed.smiles).toBe('c1ccc(C5=NC6=CC=CC=C6N5C)cc1');
  });
});

describe('Telmisartan - Deeply Nested Branch Issue', () => {
  test('fused ring inside single branch parses', () => {
    const ast = parse('C(c1nc2ccccc2n1)');
    expect(ast.smiles).toBe('C(c1nc2ccccc2n1)');
  });

  test('fused ring inside single branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(c1nc2ccccc2n1)');
    expect(reconstructed.smiles).toBe('C(c1nc2ccccc2n1)');
  });

  test('fused ring inside nested branch (depth 2)', () => {
    const ast = parse('C(C(c1nc2ccccc2n1))');
    expect(ast.smiles).toBe('C(C(c1nc2ccccc2n1))');
  });

  test('fused ring inside nested branch (depth 2) codegen', () => {
    const reconstructed = codegenRoundTrip('C(C(c1nc2ccccc2n1))');
    expect(reconstructed.smiles).toBe('C(C(c1nc2ccccc2n1))');
  });

  test('fused ring inside branch of ring', () => {
    const ast = parse('c1ccc(c2nc3ccccc3n2)cc1');
    expect(ast.smiles).toBe('c1ccc(c2nc3ccccc3n2)cc1');
  });

  test('fused ring inside branch of ring codegen', () => {
    const reconstructed = codegenRoundTrip('c1ccc(c2nc3ccccc3n2)cc1');
    expect(reconstructed.smiles).toBe('c1ccc(c2nc3ccccc3n2)cc1');
  });

  test('fused ring inside branch of ring inside branch', () => {
    const ast = parse('C(c1ccc(c2nc3ccccc3n2)cc1)');
    expect(ast.smiles).toBe('C(c1ccc(c2nc3ccccc3n2)cc1)');
  });

  test('fused ring inside branch of ring inside branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(c1ccc(c2nc3ccccc3n2)cc1)');
    expect(reconstructed.smiles).toBe('C(c1ccc(c2nc3ccccc3n2)cc1)');
  });

  test('simplified telmisartan middle section', () => {
    const ast = parse('c1nc2c(c3nc4ccccc4n3)cccc2n1');
    expect(ast.smiles).toBe('c1nc2c(c3nc4ccccc4n3)cccc2n1');
  });

  test('simplified telmisartan middle section codegen', () => {
    const reconstructed = codegenRoundTrip('c1nc2c(c3nc4ccccc4n3)cccc2n1');
    expect(reconstructed.smiles).toBe('c1nc2c(c3nc4ccccc4n3)cccc2n1');
  });

  test('core benzimidazole (rings 1+2)', () => {
    const ast = parse('C1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('C1=NC2=CCCCC2=N1');
  });

  test('core benzimidazole (rings 1+2) codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=CCCCC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=CCCCC2=N1');
  });

  test('core with propyl chain', () => {
    const ast = parse('CCCC1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('CCCC1=NC2=CCCCC2=N1');
  });

  test('core with propyl chain codegen', () => {
    const reconstructed = codegenRoundTrip('CCCC1=NC2=CCCCC2=N1');
    expect(reconstructed.smiles).toBe('CCCC1=NC2=CCCCC2=N1');
  });

  test('core with methyl branch', () => {
    const ast = parse('C1=NC2=C(C)CCC2=N1');
    expect(ast.smiles).toBe('C1=NC2=C(C)CCC2=N1');
  });

  test('core with methyl branch codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(C)CCC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=C(C)CCC2=N1');
  });

  test('core with two methyl branches', () => {
    const ast = parse('C1=NC2=C(C)CC(C)CC2=N1');
    expect(ast.smiles).toBe('C1=NC2=C(C)CC(C)CC2=N1');
  });

  test('core with two methyl branches codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(C)CC(C)CC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=C(C)CC(C)CC2=N1');
  });

  test('core with deeper branch containing ring 3', () => {
    const ast = parse('C1=NC2=C(CC3=CC=CC=C3)CCCC2=N1');
    expect(ast.smiles).toBe('C1=NC2=C(CC3=CC=CC=C3)CCCC2=N1');
  });

  test('core with deeper branch containing ring 3 codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(CC3=CC=CC=C3)CCCC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=C(CC3=CC=CC=C3)CCCC2=N1');
  });

  test('core with branch containing fused ring 5+6', () => {
    const ast = parse('C1=NC2=C(C5=NC6=CC=CC=C6N5)CCCC2=N1');
    expect(ast.smiles).toBe('C1=NC2=C(C5=NC6=CC=CC=C6N5)CCCC2=N1');
  });

  test('core with branch containing fused ring 5+6 codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(C5=NC6=CC=CC=C6N5)CCCC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=C(C5=NC6=CC=CC=C6N5)CCCC2=N1');
  });

  test('telmisartan without second benzimidazole', () => {
    const ast = parse('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
    expect(ast.smiles).toBe('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
  });

  test('telmisartan without second benzimidazole codegen', () => {
    const reconstructed = codegenRoundTrip('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
    expect(reconstructed.smiles).toBe('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
  });

  test('telmisartan core benzimidazole with methyls', () => {
    const ast = parse('c1nc2c(C)cc(C)cc2n1');
    expect(ast.smiles).toBe('c1nc2c(C)cc(C)cc2n1');
  });

  test('telmisartan core benzimidazole with methyls codegen', () => {
    const reconstructed = codegenRoundTrip('c1nc2c(C)cc(C)cc2n1');
    expect(reconstructed.smiles).toBe('c1nc2c(C)cc(C)cc2n1');
  });

  test('telmisartan with all branches except ring 5+6', () => {
    const ast = parse('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
    expect(ast.smiles).toBe('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
  });

  test('telmisartan with all branches except ring 5+6 codegen', () => {
    const reconstructed = codegenRoundTrip('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
    expect(reconstructed.smiles).toBe('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
  });

  test('telmisartan adding fused ring in deep branch', () => {
    const ast = parse('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C');
    expect(ast.smiles).toBe(TELMISARTAN_OUTPUT);
  });

  test('telmisartan adding fused ring in deep branch codegen', () => {
    const reconstructed = codegenRoundTrip('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C');
    expect(reconstructed.smiles).toBe(TELMISARTAN_OUTPUT);
  });

  test('propyl + benzimidazole base', () => {
    const ast = parse('CCCC1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('CCCC1=NC2=CCCCC2=N1');
  });

  test('propyl + benzimidazole base codegen', () => {
    const reconstructed = codegenRoundTrip('CCCC1=NC2=CCCCC2=N1');
    expect(reconstructed.smiles).toBe('CCCC1=NC2=CCCCC2=N1');
  });

  test('benzimidazole with N-CH2 linker', () => {
    const ast = parse('C1=NC2=CCCCC2=N1C');
    expect(ast.smiles).toBe('C1=NC2=CCCCC2=N1C');
  });

  test('benzimidazole with N-CH2 linker codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=CCCCC2=N1C');
    expect(reconstructed.smiles).toBe('C1=NC2=CCCCC2=N1C');
  });

  test('benzimidazole with N-CH2-ring3', () => {
    const ast = parse('C1=NC2=CCCCC2=N1CC3=CC=CC=C3');
    expect(ast.smiles).toBe('C1=NC2=CCCCC2=N1CC3=CC=CC=C3');
  });

  test('benzimidazole with N-CH2-ring3 codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=CCCCC2=N1CC3=CC=CC=C3');
    expect(reconstructed.smiles).toBe('C1=NC2=CCCCC2=N1CC3=CC=CC=C3');
  });

  test('ring3 with ring4 attached', () => {
    const ast = parse('C3=CC=C(C4=CC=CC=C4)C=C3');
    expect(ast.smiles).toBe('C3=CC=C(C4=CC=CC=C4)C=C3');
  });

  test('ring3 with ring4 attached codegen', () => {
    const reconstructed = codegenRoundTrip('C3=CC=C(C4=CC=CC=C4)C=C3');
    expect(reconstructed.smiles).toBe('C3=CC=C(C4=CC=CC=C4)C=C3');
  });

  test('benzimidazole with N-CH2-ring3-ring4', () => {
    const ast = parse('C1=NC2=CCCCC2=N1CC3=CC=C(C4=CC=CC=C4)C=C3');
    expect(ast.smiles).toBe('C1=NC2=CCCCC2=N1CC3=CC=C(C4=CC=CC=C4)C=C3');
  });

  test('benzimidazole with N-CH2-ring3-ring4 codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=CCCCC2=N1CC3=CC=C(C4=CC=CC=C4)C=C3');
    expect(reconstructed.smiles).toBe('C1=NC2=CCCCC2=N1CC3=CC=C(C4=CC=CC=C4)C=C3');
  });

  test('benzimidazole with nested branch structure', () => {
    const ast = parse('C1=NC2=C(C=C(C)C=C2N1)C');
    expect(ast.smiles).toBe('C1=NC2=C(C=C(C)C=C2N1)C');
  });

  test('benzimidazole with nested branch structure codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(C=C(C)C=C2N1)C');
    expect(reconstructed.smiles).toBe('C1=NC2=C(C=C(C)C=C2N1)C');
  });

  test('benzimidazole with deeper nested branches', () => {
    const ast = parse('C1=NC2=C(C=C(C=C2N1C)C)C');
    expect(ast.smiles).toBe('C1=NC2=C(C=C(C=C2N1C)C)C');
  });

  test('benzimidazole with deeper nested branches codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(C=C(C=C2N1C)C)C');
    expect(reconstructed.smiles).toBe('C1=NC2=C(C=C(C=C2N1C)C)C');
  });

  test('fused ring without nested branch issue', () => {
    const ast = parse('C1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('C1=NC2=CCCCC2=N1');
  });

  test('fused ring without nested branch issue codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=CCCCC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=CCCCC2=N1');
  });

  test('fused ring with branch at position 4', () => {
    const ast = parse('C1=NC2=C(C)CCC2=N1');
    expect(ast.smiles).toBe('C1=NC2=C(C)CCC2=N1');
  });

  test('fused ring with branch at position 4 codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(C)CCC2=N1');
    expect(reconstructed.smiles).toBe('C1=NC2=C(C)CCC2=N1');
  });

  test('fused ring - ring1 closure inside branch of ring2', () => {
    const ast = parse('C1=NC2=C(CC2N1)C');
    expect(ast.smiles).toBe('C1=NC2=C(CC2N1)C');
  });

  test('fused ring - ring1 closure inside branch of ring2 codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NC2=C(CC2N1)C');
    expect(reconstructed.smiles).toBe('C1=NC2=C(CC2N1)C');
  });

  test('alternative: aromatic benzimidazole avoids the issue', () => {
    const ast = parse('c1nc2c(C)cccc2n1');
    expect(ast.smiles).toBe('c1nc2c(C)cccc2n1');
  });

  test('alternative: aromatic benzimidazole avoids the issue codegen', () => {
    const reconstructed = codegenRoundTrip('c1nc2c(C)cccc2n1');
    expect(reconstructed.smiles).toBe('c1nc2c(C)cccc2n1');
  });

  test('ring closure can be at different branch depth than ring opening', () => {
    // C1CC(C1) is cyclobutane - the C1 inside the branch closes the ring
    // The branch notation is preserved in the output (both are valid SMILES for cyclobutane)
    // Preserving branch notation is necessary for more complex cases like fentanyl
    // where content follows the branch: N(CC1)CCC
    const ast = parse('C1CC(C1)');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'C',
      size: 4,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {},
      bonds: [null, null, null, null],
    });
    // Both C1CC(C1) and C1CCC1 are valid SMILES - we preserve the branch structure
    expect(ast.smiles).toBe('C1CC(C1)');
  });

  test('branch with separate ring - first atom shared', () => {
    const ast = parse('c1ccc(c2ccccc2)cc1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        4: [{
          type: 'ring',
          atoms: 'c',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: [null, null, null, null, null, null],
        }],
      },
      bonds: [null, null, null, null, null, null],
    });
    expect(ast.smiles).toBe('c1ccc(c2ccccc2)cc1');
  });
});

describe('Telmisartan - Bond Preservation', () => {
  test('double bonds in linear chains are preserved', () => {
    const ast = parse('C=C');
    expect(ast.smiles).toBe('C=C');
  });

  test('double bonds in rings are now preserved', () => {
    const ast = parse('C1=CC=CC=C1');
    expect(ast.smiles).toBe('C1=CC=CC=C1');
  });
});

describe('Telmisartan - Code Round-Trip (divide and conquer)', () => {
  // Level 1: Simple linear chains
  test('codegen: linear chain C-C-C', () => {
    const smiles = 'CCC';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: linear chain C-C-C-C', () => {
    const smiles = 'CCCC';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 2: Simple rings
  test('codegen: simple 6-membered ring', () => {
    const smiles = 'C1CCCCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene with explicit double bonds', () => {
    const smiles = 'C1=CC=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: 5-membered ring', () => {
    const smiles = 'C1CCCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 3: Rings with substitutions
  test('codegen: imidazole-like (5-ring with N substitutions)', () => {
    const smiles = 'C1=NC=CN1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzimidazole core', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 4: Rings with attachments
  test('codegen: benzene with methyl', () => {
    const smiles = 'CC1=CC=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene with branch attachment', () => {
    const smiles = 'C1=CC=C(C)C=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 5: Connected rings (biphenyl)
  test('codegen: biphenyl', () => {
    const smiles = 'C1=CC=C(C2=CC=CC=C2)C=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: biphenyl simpler', () => {
    const smiles = 'c1ccc(c2ccccc2)cc1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 6: Fused rings
  test('codegen: naphthalene (simple fused)', () => {
    const smiles = 'C1=CC2=CC=CC=C2C=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 7: Linear + ring
  test('codegen: propyl + benzene', () => {
    const smiles = 'CCCC1=CC=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: propyl + imidazole', () => {
    const smiles = 'CCCC1=NC=CN1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 8: Linear + fused ring (core of telmisartan)
  test('codegen: propyl + benzimidazole', () => {
    const smiles = 'CCCC1=NC2=CC=CC=C2N1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 9: Core with simple attachments
  test('codegen: benzimidazole with N-methyl', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: propyl + benzimidazole + N-methyl', () => {
    const smiles = 'CCCC1=NC2=CC=CC=C2N1C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 10: Ring in branch of fused ring
  test('codegen: benzimidazole with N-CH2-phenyl', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1CC3=CC=CC=C3';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 11: Carboxylic acid and related groups
  test('codegen: carbonyl C=O', () => {
    const smiles = 'CC(=O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: aldehyde C=O', () => {
    const smiles = 'CC=O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: simple COOH', () => {
    const smiles = 'CC(=O)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: acetic acid', () => {
    const smiles = 'CC(=O)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzoic acid', () => {
    const smiles = 'C1=CC=CC=C1C(=O)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: biphenyl carboxylic acid', () => {
    const smiles = 'C1=CC=C(C2=CC=CC=C2C(=O)O)C=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 12: Deeper nested structures
  test('codegen: benzimidazole with N-CH2-biphenyl', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1CC3=CC=C(C4=CC=CC=C4)C=C3';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzimidazole with N-CH2-biphenyl-COOH', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1CC3=CC=C(C4=CC=CC=C4C(=O)O)C=C3';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 13: Second benzimidazole fragment (isolated)
  test('codegen: second benzimidazole (ring 5+6)', () => {
    const smiles = 'C5=NC6=CC=CC=C6N5C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 14: Fused benzimidazole with methyl substituents
  test('codegen: benzimidazole with dimethyl on fused ring', () => {
    const smiles = 'C1=NC2=C(C)C=C(C)C=C2N1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: propyl + benzimidazole + dimethyl', () => {
    const smiles = 'CCCC1=NC2=C(C)C=C(C)C=C2N1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 15: Telmisartan without second benzimidazole
  test('codegen: telmisartan minus ring 5+6', () => {
    const smiles = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 16: Adding the second benzimidazole in branch
  test('codegen: benzimidazole with N-methyl (simple)', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzimidazole with higher ring numbers (5,6)', () => {
    const smiles = 'C5=NC6=CC=CC=C6N5C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: simple ring with benzimidazole branch', () => {
    const smiles = 'C1=CC=C(C5=NC6=CC=CC=C6N5C)C=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 17: Full telmisartan
  test('codegen: full telmisartan', () => {
    const smiles = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // ===== TARGETED FAILURE ISOLATION =====

  // Issue 1: Trailing atom after ring closure
  test('codegen issue: ring with trailing atom', () => {
    const smiles = 'C1CCC1C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: fused ring with trailing atom', () => {
    const smiles = 'C1=NC2=CC=CC=C2N1C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: fused ring in branch with trailing atom', () => {
    const smiles = 'C(C1=NC2=CC=CC=C2N1C)';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: ring in branch with trailing atom', () => {
    const smiles = 'C(C1CCCCC1C)';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: ring in branch attached to ring with trailing atom', () => {
    const smiles = 'c1ccc(C2CCCCC2C)cc1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // AST roundtrip tests for trailing atoms (checking if parser loses them)
  test('AST issue: ring in branch with trailing atom', () => {
    const smiles = 'C(C1CCCCC1C)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('AST issue: fused ring in branch with trailing atom', () => {
    const smiles = 'C(C1=NC2=CC=CC=C2N1C)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('AST issue: ring in branch with trailing COOH', () => {
    const smiles = 'C(C1CCCCC1C(=O)O)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  // Issue 2: Carboxylic acid (C(=O)O) in branch contexts
  test('codegen issue: simple carboxylic acid', () => {
    const smiles = 'CC(=O)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: carboxylic acid on ring', () => {
    const smiles = 'C1CCCCC1C(=O)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: carboxylic acid in branch', () => {
    const smiles = 'C(C(=O)O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: carboxylic acid on ring in branch', () => {
    const smiles = 'C(C1CCCCC1C(=O)O)';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: carboxylic acid at ring branch end', () => {
    const smiles = 'c1ccc(C(=O)O)cc1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: ring attached to ring with COOH', () => {
    const smiles = 'c1ccc(c2ccccc2C(=O)O)cc1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Issue 3: Nested branch attachments to fused rings
  test('codegen issue: fused ring with simple branch', () => {
    const smiles = 'C1=NC2=C(C)CCCC2=N1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: fused ring with branch containing ring closure', () => {
    const smiles = 'C1=NC2=C(C=C2N1)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: fused ring with nested branch', () => {
    const smiles = 'C1=NC2=C(C(C))CCCC2=N1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });
});
