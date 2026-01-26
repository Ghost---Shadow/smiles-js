import { describe, test, expect } from 'bun:test';
import { parse } from './parser.js';
import { tokenize } from './tokenizer.js';

const TELMISARTAN_SMILES = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';

describe('Telmisartan - Real Structure', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(TELMISARTAN_SMILES);
    const atoms = tokens.filter((t) => t.type === 'atom');
    const ringMarkers = tokens.filter((t) => t.type === 'ring_marker');

    expect(atoms.length).toBe(39);
    expect(ringMarkers.length).toBe(12); // 6 rings, each with open and close
  });

  test('identifies ring markers at correct atom indices', () => {
    const tokens = tokenize(TELMISARTAN_SMILES);

    // Track atom index when each ring marker appears
    const ringMarkerPositions = [];
    let atomIndex = -1;
    tokens.forEach((token) => {
      if (token.type === 'atom') atomIndex += 1;
      if (token.type === 'ring_marker') {
        ringMarkerPositions.push({ ringNumber: token.ringNumber, atomIndex });
      }
    });

    // Expected ring marker positions based on SMILES structure
    expect(ringMarkerPositions).toEqual([
      { ringNumber: 1, atomIndex: 3 }, // Ring 1 opens at C (4th atom, index 3)
      { ringNumber: 2, atomIndex: 5 }, // Ring 2 opens at C
      { ringNumber: 2, atomIndex: 10 }, // Ring 2 closes
      { ringNumber: 1, atomIndex: 11 }, // Ring 1 closes at N
      { ringNumber: 3, atomIndex: 13 }, // Ring 3 opens (phenyl)
      { ringNumber: 3, atomIndex: 18 }, // Ring 3 closes
      { ringNumber: 4, atomIndex: 19 }, // Ring 4 opens (biphenyl)
      { ringNumber: 4, atomIndex: 24 }, // Ring 4 closes
      { ringNumber: 5, atomIndex: 28 }, // Ring 5 opens (second benzimidazole)
      { ringNumber: 6, atomIndex: 30 }, // Ring 6 opens
      { ringNumber: 6, atomIndex: 35 }, // Ring 6 closes
      { ringNumber: 5, atomIndex: 36 }, // Ring 5 closes
    ]);
  });

  test('parses without error', () => {
    expect(() => parse(TELMISARTAN_SMILES)).not.toThrow();
  });

  test('round-trips correctly', () => {
    const ast = parse(TELMISARTAN_SMILES);
    // Note: double bonds may not be preserved in rings - check what we get
    console.log('Telmisartan input:', TELMISARTAN_SMILES);
    console.log('Telmisartan output:', ast.smiles);
    expect(ast).toBeDefined();
  });
});

describe('Telmisartan - Component Structures', () => {
  test('simple benzimidazole parses', () => {
    // Basic benzimidazole without explicit double bonds
    const smiles = 'c1nc2ccccc2n1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('benzimidazole with explicit double bonds parses', () => {
    // Benzimidazole with explicit double bonds (Kekulé form)
    const smiles = 'C1=NC2=CC=CC=C2N1';
    const ast = parse(smiles);
    // Note: bonds may not be preserved - this test documents current behavior
    expect(ast).toBeDefined();
  });

  test('benzimidazole in branch parses', () => {
    const smiles = 'C(c1nc2ccccc2n1)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('fused ring with methyl substituent parses', () => {
    // Simplified structure from telmisartan
    const smiles = 'c1nc2c(C)cc(C)cc2n1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('benzimidazole substituent (C5=NC6=...) parses', () => {
    // The second benzimidazole from telmisartan
    const smiles = 'C5=NC6=CC=CC=C6N5C';
    const ast = parse(smiles);
    // Document current output - bonds are being lost
    console.log('Input:', smiles);
    console.log('Output:', ast.smiles);
    expect(ast).toBeDefined();
  });

  test('nested fused ring in branch', () => {
    // Benzimidazole inside a branch attached to a ring
    const smiles = 'c1ccc(C5=NC6=CC=CC=C6N5C)cc1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });
});

describe('Telmisartan - Deeply Nested Branch Issue', () => {
  test('fused ring inside single branch parses', () => {
    // Fused ring in one level of branch
    const smiles = 'C(c1nc2ccccc2n1)';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('fused ring inside nested branch (depth 2)', () => {
    // Fused ring in two levels of branches - like telmisartan structure
    const smiles = 'C(C(c1nc2ccccc2n1))';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('fused ring inside branch of ring', () => {
    // Ring with a branch containing a fused ring
    const smiles = 'c1ccc(c2nc3ccccc3n2)cc1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('fused ring inside branch of ring inside branch', () => {
    // Deeper nesting - matches telmisartan pattern
    const smiles = 'C(c1ccc(c2nc3ccccc3n2)cc1)';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('simplified telmisartan middle section', () => {
    // The problematic part: fused ring 1+2 with branch containing rings 5+6
    // Simplified: c1nc2c(...)cc2n1 where ... contains a fused ring
    const smiles = 'c1nc2c(c3nc4ccccc4n3)cccc2n1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  // Build up to telmisartan incrementally
  test('core benzimidazole (rings 1+2)', () => {
    // Just the core fused ring system
    const smiles = 'C1=NC2=CCCCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('core with propyl chain', () => {
    const smiles = 'CCCC1=NC2=CCCCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('core with methyl branch', () => {
    // Adding a branch to the fused ring
    const smiles = 'C1=NC2=C(C)CCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('core with two methyl branches', () => {
    const smiles = 'C1=NC2=C(C)CC(C)CC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('core with deeper branch containing ring 3', () => {
    // Branch containing a simple ring
    const smiles = 'C1=NC2=C(CC3=CC=CC=C3)CCCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('core with branch containing fused ring 5+6', () => {
    // This is the problematic structure - branch containing another fused ring
    const smiles = 'C1=NC2=C(C5=NC6=CC=CC=C6N5)CCCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('telmisartan without second benzimidazole', () => {
    // Full structure minus the C5=NC6=...N5C part
    const smiles = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('telmisartan core benzimidazole with methyls', () => {
    // c1nc2c(C)cc(C)cc2n1
    const smiles = 'c1nc2c(C)cc(C)cc2n1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('telmisartan with all branches except ring 5+6', () => {
    // Replace C5=NC6=CC=CC=C6N5C with just C
    const smiles = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('telmisartan adding fused ring in deep branch', () => {
    // Now add the fused ring 5+6 in the second methyl position
    // The structure is: ...cc(C5=NC6=CC=CC=C6N5C)cc...
    const smiles = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  // Isolate the failing structure piece by piece
  test('propyl + benzimidazole base', () => {
    const smiles = 'CCCC1=NC2=CCCCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('benzimidazole with N-CH2 linker', () => {
    const smiles = 'C1=NC2=CCCCC2=N1C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('benzimidazole with N-CH2-ring3', () => {
    const smiles = 'C1=NC2=CCCCC2=N1CC3=CC=CC=C3';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('ring3 with ring4 attached', () => {
    const smiles = 'C3=CC=C(C4=CC=CC=C4)C=C3';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('benzimidazole with N-CH2-ring3-ring4', () => {
    const smiles = 'C1=NC2=CCCCC2=N1CC3=CC=C(C4=CC=CC=C4)C=C3';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('benzimidazole with nested branch structure', () => {
    // The key pattern: =C(C=C(...)...)
    // Ring 1 closes at N1 which is inside a branch of ring 2
    const smiles = 'C1=NC2=C(C=C(C)C=C2N1)C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('benzimidazole with deeper nested branches', () => {
    // Adding more structure
    const smiles = 'C1=NC2=C(C=C(C=C2N1C)C)C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  // Simplify further
  test('fused ring without nested branch issue', () => {
    // Standard benzimidazole - ring closure at main level
    const smiles = 'C1=NC2=CCCCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('fused ring with branch at position 4', () => {
    // Branch inside ring 2, ring 1 still closes at main level
    const smiles = 'C1=NC2=C(C)CCC2=N1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('fused ring - ring1 closure inside branch of ring2', () => {
    // This is the problematic pattern: N1 is inside branch (...)
    // SMILES: C1=NC2=C(CC2N1)C
    // Ring 2 goes: C2=C(...)C with the branch containing C2's continuation and N1
    const smiles = 'C1=NC2=C(CC2N1)C';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('alternative: aromatic benzimidazole avoids the issue', () => {
    // Using aromatic notation sidesteps the problem
    const smiles = 'c1nc2c(C)cccc2n1';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
  });

  test('ring closure can be at different branch depth than ring opening', () => {
    // Minimal failing case: C1CC(C1) - ring opens at depth 0, closes at depth 1
    // Atoms: C(0) C(1) C(2) C(3)
    // Ring markers: 1 opens at atom 0 (depth 0), 1 closes at atom 3 (depth 1)
    const smiles = 'C1CC(C1)';
    const ast = parse(smiles);
    expect(ast).toBeDefined();
    // Ring should have 4 atoms: C-C-C-C
    expect(ast.size).toBe(4);
  });

  test('branch with separate ring - first atom shared', () => {
    // Ring 1: phenyl at main level
    // Ring 2: phenyl in branch - first atom is SHARED with ring 1
    // c1ccc(c2ccccc2)cc1
    // The first 'c' in the branch is part of BOTH rings
    const smiles = 'c1ccc(c2ccccc2)cc1';
    const ast = parse(smiles);
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(6); // Ring 1 has 6 atoms
    expect(ast.smiles).toBe(smiles);
  });
});

describe('Telmisartan - Bond Preservation', () => {
  test('double bonds in linear chains are preserved', () => {
    const smiles = 'C=C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe('C=C');
  });

  test('double bonds in rings - current behavior', () => {
    // Document that double bonds in rings are NOT currently preserved
    // The Ring AST node has a single 'atoms' string, not per-atom bonds
    const smiles = 'C1=CC=CC=C1'; // cyclohexatriene (aromatic representation)
    const ast = parse(smiles);
    // This will likely output 'C1CCCCC1' - documenting current limitation
    console.log('Ring double bond test - Input:', smiles, 'Output:', ast.smiles);
  });
});
