import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { tokenize } from '../src/tokenizer.js';
import { codegenRoundTrip } from './utils.js';

const VALSARTAN_SMILES = 'CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C(=O)O';

describe('Valsartan - Real Structure', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(VALSARTAN_SMILES);
    const atoms = tokens.filter((t) => t.type === 'atom');
    const ringMarkers = tokens.filter((t) => t.type === 'ring_marker');

    expect(atoms.length).toBe(32);
    expect(ringMarkers.length).toBe(6); // 3 rings with open + close markers each
  });

  test('identifies ring markers at correct atom indices', () => {
    const tokens = tokenize(VALSARTAN_SMILES);

    const ringMarkerPositions = [];
    let atomIndex = -1;
    tokens.forEach((token) => {
      if (token.type === 'atom') atomIndex += 1;
      if (token.type === 'ring_marker') {
        ringMarkerPositions.push({ ringNumber: token.ringNumber, atomIndex });
      }
    });

    expect(ringMarkerPositions).toEqual([
      { ringNumber: 1, atomIndex: 8 },
      { ringNumber: 1, atomIndex: 13 },
      { ringNumber: 2, atomIndex: 14 },
      { ringNumber: 2, atomIndex: 19 },
      { ringNumber: 3, atomIndex: 20 },
      { ringNumber: 3, atomIndex: 24 },
    ]);
  });

  test('parses without error', () => {
    expect(() => parse(VALSARTAN_SMILES)).not.toThrow();
  });

  test('round-trips correctly', () => {
    const ast = parse(VALSARTAN_SMILES);
    expect(ast.smiles).toBe(VALSARTAN_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(VALSARTAN_SMILES);
    expect(reconstructed.smiles).toBe(VALSARTAN_SMILES);
  });
});

describe('Valsartan - Component Structures', () => {
  test('simple tetrazole ring parses', () => {
    const ast = parse('C1=NNN=N1');
    expect(ast.smiles).toBe('C1=NNN=N1');
  });

  test('simple tetrazole ring codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NNN=N1');
    expect(reconstructed.smiles).toBe('C1=NNN=N1');
  });

  test('tetrazole in branch parses', () => {
    const ast = parse('C(C1=NNN=N1)C');
    expect(ast.smiles).toBe('C(C1=NNN=N1)C');
  });

  test('tetrazole in branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(C1=NNN=N1)C');
    expect(reconstructed.smiles).toBe('C(C1=NNN=N1)C');
  });

  test('biphenyl with tetrazole parses', () => {
    const ast = parse('C1=CC=CC=C1C2=NNN=N2');
    expect(ast.smiles).toBe('C1=CC=CC=C1C2=NNN=N2');
  });

  test('biphenyl with tetrazole codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC=CC=C1C2=NNN=N2');
    expect(reconstructed.smiles).toBe('C1=CC=CC=C1C2=NNN=N2');
  });

  test('biphenyl-tetrazole attached to another benzene', () => {
    const ast = parse('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
    expect(ast.smiles).toBe('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
  });

  test('biphenyl-tetrazole attached to another benzene codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
    expect(reconstructed.smiles).toBe('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
  });
});

describe('Valsartan - Divide and Conquer Build-Up', () => {
  // Level 1: Simple chains
  test('pentanoyl chain', () => {
    const smiles = 'CCCCC(=O)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('pentanoyl chain codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCC(=O)');
    expect(reconstructed.smiles).toBe('CCCCC(=O)');
  });

  // Level 2: Amide with simple substituents
  test('pentanoyl + nitrogen', () => {
    const smiles = 'CCCCC(=O)N';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('pentanoyl + nitrogen codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCC(=O)N');
    expect(reconstructed.smiles).toBe('CCCCC(=O)N');
  });

  test('pentanoyl + N-methyl', () => {
    const smiles = 'CCCCC(=O)NC';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('pentanoyl + N-methyl codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCC(=O)NC');
    expect(reconstructed.smiles).toBe('CCCCC(=O)NC');
  });

  // Level 3: N-substituted amide with branches
  // Level 3: N-substituted amide with branches
  const amideWithTwoBranchesSmiles = 'CC(=O)N(C)C';

  test('amide with two branches', () => {
    const ast = parse(amideWithTwoBranchesSmiles);
    expect(ast.smiles).toBe(amideWithTwoBranchesSmiles);
  });

  test('amide with two branches codegen', () => {
    const reconstructed = codegenRoundTrip(amideWithTwoBranchesSmiles);
    expect(reconstructed.smiles).toBe(amideWithTwoBranchesSmiles);
  });

  // Level 4: Simple benzene ring
  test('benzene ring', () => {
    const smiles = 'C1=CC=CC=C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('benzene ring codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC=CC=C1');
    expect(reconstructed.smiles).toBe('C1=CC=CC=C1');
  });

  // Level 5: Benzene with CH2 attachment
  test('N-benzyl substituent', () => {
    const smiles = 'N(CC1=CC=CC=C1)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('N-benzyl substituent codegen', () => {
    const reconstructed = codegenRoundTrip('N(CC1=CC=CC=C1)');
    expect(reconstructed.smiles).toBe('N(CC1=CC=CC=C1)');
  });

  // Level 6: Biphenyl structure
  test('biphenyl', () => {
    const smiles = 'C1=CC=C(C=C1)C2=CC=CC=C2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('biphenyl codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC=C(C=C1)C2=CC=CC=C2');
    expect(reconstructed.smiles).toBe('C1=CC=C(C=C1)C2=CC=CC=C2');
  });

  // Level 7: Tetrazole ring
  test('tetrazole', () => {
    const smiles = 'C1=NNN=N1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('tetrazole codegen', () => {
    const reconstructed = codegenRoundTrip('C1=NNN=N1');
    expect(reconstructed.smiles).toBe('C1=NNN=N1');
  });

  // Level 8: Biphenyl with tetrazole
  test('biphenyl-tetrazole', () => {
    const smiles = 'C1=CC=CC=C1C2=NNN=N2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('biphenyl-tetrazole codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC=CC=C1C2=NNN=N2');
    expect(reconstructed.smiles).toBe('C1=CC=CC=C1C2=NNN=N2');
  });

  // Level 9: Three ring system
  test('benzene-biphenyl-tetrazole', () => {
    const smiles = 'CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('benzene-biphenyl-tetrazole codegen', () => {
    const reconstructed = codegenRoundTrip('CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
    expect(reconstructed.smiles).toBe('CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
  });

  // Level 10: Amide attached to three ring system
  test('N-benzyl with three ring system', () => {
    const smiles = 'CC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('N-benzyl with three ring system codegen', () => {
    const reconstructed = codegenRoundTrip('CC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)');
    expect(reconstructed.smiles).toBe('CC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)');
  });

  // Level 11: Pentanoyl version
  test('pentanoyl-N-benzyl with three ring system', () => {
    const smiles = 'CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('pentanoyl-N-benzyl with three ring system codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)');
    expect(reconstructed.smiles).toBe('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)');
  });

  // Level 12: Valine fragment
  test('isopropyl', () => {
    const smiles = 'C(C)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('isopropyl codegen', () => {
    const reconstructed = codegenRoundTrip('C(C)C');
    expect(reconstructed.smiles).toBe('C(C)C');
  });

  test('valine-like structure', () => {
    const smiles = 'NC(C(C)C)C(=O)O';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('valine-like structure codegen', () => {
    const reconstructed = codegenRoundTrip('NC(C(C)C)C(=O)O');
    expect(reconstructed.smiles).toBe('NC(C(C)C)C(=O)O');
  });

  // Level 13: Simplified valsartan without valine
  test('valsartan without valine tail', () => {
    const smiles = 'CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('valsartan without valine tail codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C');
    expect(reconstructed.smiles).toBe('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C');
  });

  // Level 14: Adding valine without COOH
  test('valsartan without terminal COOH', () => {
    const smiles = 'CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('valsartan without terminal COOH codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C');
    expect(reconstructed.smiles).toBe('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C');
  });

  // Level 15: Full valsartan
  test('full valsartan', () => {
    const smiles = VALSARTAN_SMILES;
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('full valsartan codegen', () => {
    const reconstructed = codegenRoundTrip(VALSARTAN_SMILES);
    expect(reconstructed.smiles).toBe(VALSARTAN_SMILES);
  });
});

describe('Valsartan - Isolated Issue Detection', () => {
  // Issue: Ring marker duplication in tetrazole
  test('tetrazole does not duplicate ring markers', () => {
    const smiles = 'C1=NNN=N1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe('C1=NNN=N1');
    expect(ast.smiles).not.toContain('C1=NNN=N1C1=NNN=N1');
  });

  test('tetrazole codegen does not duplicate ring markers', () => {
    const reconstructed = codegenRoundTrip('C1=NNN=N1');
    expect(reconstructed.smiles).toBe('C1=NNN=N1');
    expect(reconstructed.smiles).not.toContain('C1=NNN=N1C1=NNN=N1');
  });

  // Issue: Ring attached to previous ring via trailing atom
  test('biphenyl-tetrazole does not duplicate tetrazole', () => {
    const smiles = 'C1=CC=CC=C1C2=NNN=N2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe('C1=CC=CC=C1C2=NNN=N2');
    expect(ast.smiles).not.toContain('C2=NNN=N2C2=NNN=N2');
  });

  test('biphenyl-tetrazole codegen does not duplicate tetrazole', () => {
    const reconstructed = codegenRoundTrip('C1=CC=CC=C1C2=NNN=N2');
    expect(reconstructed.smiles).toBe('C1=CC=CC=C1C2=NNN=N2');
    expect(reconstructed.smiles).not.toContain('C2=NNN=N2C2=NNN=N2');
  });

  // Issue: Ring marker after ring closure in branch
  test('three-ring system does not duplicate tetrazole', () => {
    const smiles = 'C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3';
    const ast = parse(smiles);
    expect(ast.smiles).toBe('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
    expect(ast.smiles).not.toContain('C3=NNN=N3C3=NNN=N3');
  });

  test('three-ring system codegen does not duplicate tetrazole', () => {
    const reconstructed = codegenRoundTrip('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
    expect(reconstructed.smiles).toBe('C1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3');
    expect(reconstructed.smiles).not.toContain('C3=NNN=N3C3=NNN=N3');
  });
});
