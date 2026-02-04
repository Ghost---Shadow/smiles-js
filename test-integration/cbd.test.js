import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { tokenize } from '../src/tokenizer.js';
import { codegenRoundTrip } from './utils.js';

const CBD_SMILES = 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';

describe('CBD - Real Structure', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(CBD_SMILES);
    const atoms = tokens.filter((t) => t.type === 'atom');
    const ringMarkers = tokens.filter((t) => t.type === 'ring_marker');

    expect(atoms.length).toBe(23);
    expect(ringMarkers.length).toBe(4);
  });

  test('identifies ring markers at correct atom indices', () => {
    const tokens = tokenize(CBD_SMILES);

    const ringMarkerPositions = [];
    let atomIndex = -1;
    tokens.forEach((token) => {
      if (token.type === 'atom') atomIndex += 1;
      if (token.type === 'ring_marker') {
        ringMarkerPositions.push({ ringNumber: token.ringNumber, atomIndex });
      }
    });

    expect(ringMarkerPositions).toEqual([
      { ringNumber: 1, atomIndex: 5 },
      { ringNumber: 1, atomIndex: 10 },
      { ringNumber: 2, atomIndex: 12 },
      { ringNumber: 2, atomIndex: 17 },
    ]);
  });

  test('parses without error', () => {
    expect(() => parse(CBD_SMILES)).not.toThrow();
  });

  test('round-trips correctly', () => {
    const ast = parse(CBD_SMILES);
    expect(ast.smiles).toBe(CBD_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(CBD_SMILES);
    expect(reconstructed.smiles).toBe(CBD_SMILES);
  });
});

describe('CBD - Component Structures', () => {
  test('simple 6-membered ring parses', () => {
    const ast = parse('C1CCCCC1');
    expect(ast.smiles).toBe('C1CCCCC1');
  });

  test('simple 6-membered ring codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCCCC1');
    expect(reconstructed.smiles).toBe('C1CCCCC1');
  });

  test('benzene ring parses', () => {
    const ast = parse('C1=CC=CC=C1');
    expect(ast.smiles).toBe('C1=CC=CC=C1');
  });

  test('benzene ring codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC=CC=C1');
    expect(reconstructed.smiles).toBe('C1=CC=CC=C1');
  });

  test('hexyl chain parses', () => {
    const ast = parse('CCCCCC');
    expect(ast.smiles).toBe('CCCCCC');
  });

  test('hexyl chain codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCCC');
    expect(reconstructed.smiles).toBe('CCCCCC');
  });

  test('hexyl-benzene parses', () => {
    const ast = parse('CCCCCC1=CC=CC=C1');
    expect(ast.smiles).toBe('CCCCCC1=CC=CC=C1');
  });

  test('hexyl-benzene codegen', () => {
    const reconstructed = codegenRoundTrip('CCCCCC1=CC=CC=C1');
    expect(reconstructed.smiles).toBe('CCCCCC1=CC=CC=C1');
  });

  test('benzene with hydroxyl branch parses', () => {
    const ast = parse('C1=CC(O)=CC=C1');
    expect(ast.smiles).toBe('C1=CC(O)=CC=C1');
  });

  test('benzene with hydroxyl branch codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC(O)=CC=C1');
    expect(reconstructed.smiles).toBe('C1=CC(O)=CC=C1');
  });

  test('cyclohexene parses', () => {
    const ast = parse('C1C=CCCC1');
    expect(ast.smiles).toBe('C1C=CCCC1');
  });

  test('cyclohexene codegen', () => {
    const reconstructed = codegenRoundTrip('C1C=CCCC1');
    expect(reconstructed.smiles).toBe('C1C=CCCC1');
  });

  test('cyclohexene with methyl parses', () => {
    const ast = parse('C1C=C(C)CCC1');
    expect(ast.smiles).toBe('C1C=C(C)CCC1');
  });

  test('cyclohexene with methyl codegen', () => {
    const reconstructed = codegenRoundTrip('C1C=C(C)CCC1');
    expect(reconstructed.smiles).toBe('C1C=C(C)CCC1');
  });

  test('cyclohexene with isopropenyl parses', () => {
    const ast = parse('C1C=CCCC1C(=C)C');
    expect(ast.smiles).toBe('C1C=CCCC1C(=C)C');
  });

  test('cyclohexene with isopropenyl codegen', () => {
    const reconstructed = codegenRoundTrip('C1C=CCCC1C(=C)C');
    expect(reconstructed.smiles).toBe('C1C=CCCC1C(=C)C');
  });

  test('cyclohexene with p-menthane structure parses', () => {
    const ast = parse('C2C=C(CCC2C(=C)C)C');
    expect(ast.smiles).toBe('C2C=C(CCC2C(=C)C)C');
  });

  test('cyclohexene with p-menthane structure codegen', () => {
    const reconstructed = codegenRoundTrip('C2C=C(CCC2C(=C)C)C');
    expect(reconstructed.smiles).toBe('C2C=C(CCC2C(=C)C)C');
  });
});

describe('CBD - Deeply Nested Branch Issue', () => {
  test('simple nested branch parses', () => {
    const ast = parse('C(C)');
    expect(ast.smiles).toBe('C(C)');
  });

  test('simple nested branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(C)');
    expect(reconstructed.smiles).toBe('C(C)');
  });

  test('double nested branch parses', () => {
    const ast = parse('C(C(C))');
    expect(ast.smiles).toBe('C(C(C))');
  });

  test('double nested branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(C(C))');
    expect(reconstructed.smiles).toBe('C(C(C))');
  });

  test('ring in branch parses', () => {
    const ast = parse('C(C1CCCCC1)');
    expect(ast.smiles).toBe('C(C1CCCCC1)');
  });

  test('ring in branch codegen', () => {
    const reconstructed = codegenRoundTrip('C(C1CCCCC1)');
    expect(reconstructed.smiles).toBe('C(C1CCCCC1)');
  });

  test('ring with branch in branch parses', () => {
    const ast = parse('C1=CC(=C(C)C=C1)O');
    expect(ast.smiles).toBe('C1=CC(=C(C)C=C1)O');
  });

  test('ring with branch in branch codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC(=C(C)C=C1)O');
    expect(reconstructed.smiles).toBe('C1=CC(=C(C)C=C1)O');
  });

  test('ring with nested ring in branch parses', () => {
    const ast = parse('C1=CC(=C(C2CCCCC2)C=C1)O');
    expect(ast.smiles).toBe('C1=CC(=C(C2CCCCC2)C=C1)O');
  });

  test('ring with nested ring in branch codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC(=C(C2CCCCC2)C=C1)O');
    expect(reconstructed.smiles).toBe('C1=CC(=C(C2CCCCC2)C=C1)O');
  });

  test('CBD core structure without hexyl chain', () => {
    const ast = parse('C1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O');
    expect(ast.smiles).toBe('C1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O');
  });

  test('CBD core structure without hexyl chain codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O');
    expect(reconstructed.smiles).toBe('C1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O');
  });
});

describe('CBD - Code Round-Trip (divide and conquer)', () => {
  // Level 1: Simple chains
  test('codegen: simple chain', () => {
    const smiles = 'CCC';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: hexyl chain', () => {
    const smiles = 'CCCCCC';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 2: Simple rings
  test('codegen: cyclohexane', () => {
    const smiles = 'C1CCCCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene', () => {
    const smiles = 'C1=CC=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 3: Chain + ring
  test('codegen: hexylbenzene', () => {
    const smiles = 'CCCCCC1=CC=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 4: Simple branches
  test('codegen: methyl branch', () => {
    const smiles = 'C(C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: hydroxyl branch', () => {
    const smiles = 'C(O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: double bond in branch', () => {
    const smiles = 'C(=C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 5: Isopropenyl group
  test('codegen: isopropenyl', () => {
    const smiles = 'CC(=C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: carbon with isopropenyl', () => {
    const smiles = 'C(C(=C)C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 6: Cyclohexene variations
  test('codegen: cyclohexene', () => {
    const smiles = 'C1C=CCCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: cyclohexene with methyl', () => {
    const smiles = 'C1C=C(C)CCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: cyclohexene with terminal isopropenyl', () => {
    const smiles = 'C1C=CCCC1C(=C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 7: p-Menthane structure (ring 2 of CBD)
  test('codegen: p-menthane core', () => {
    const smiles = 'C2C=C(CCC2C(=C)C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 8: Benzene with branches
  test('codegen: benzene with methyl', () => {
    const smiles = 'C1=CC(C)=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene with hydroxyl', () => {
    const smiles = 'C1=CC(O)=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: resorcinol (two hydroxyls)', () => {
    const smiles = 'C1=C(O)C=C(O)C=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 9: Benzene with nested branches
  test('codegen: benzene with double nested branch', () => {
    const smiles = 'C1=CC(=C(C)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene with triple nested branch', () => {
    const smiles = 'C1=CC(=C(C(C)C)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 10: Connecting two rings
  test('codegen: benzene with cyclohexane attachment', () => {
    const smiles = 'C1=CC(C2CCCCC2)=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene with cyclohexene attachment', () => {
    const smiles = 'C1=CC(C2C=CCCC2)=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 11: Ring attachment in nested branch
  test('codegen: benzene with ring in nested branch', () => {
    const smiles = 'C1=CC(=C(C2CCCCC2)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen: benzene with cyclohexene in nested branch', () => {
    const smiles = 'C1=CC(=C(C2C=CCCC2)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 12: Adding p-menthane structure
  test('codegen: benzene with p-menthane in branch', () => {
    const smiles = 'C1=CC(=C(C2C=C(CCC2C(=C)C)C)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 13: Adding second hydroxyl
  test('codegen: resorcinol with p-menthane', () => {
    const smiles = 'C1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 14: Full CBD structure
  test('codegen: full CBD', () => {
    const smiles = 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // ===== TARGETED FAILURE ISOLATION =====

  // Issue 1: Multiple branches on same atom
  test('codegen issue: multiple branches on carbon', () => {
    const smiles = 'C(C)(C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: three branches on carbon', () => {
    const smiles = 'C(C)(C)(C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // TODO: This edge case is not yet supported - ring opens inside branch, closes outside
  // The ring opens at depth 1 and closes at depth 0, which is the opposite direction
  // from the typical branch-crossing pattern. Parser loses the ring entirely.
  // Uncomment when this is fixed:
  // test('codegen issue: branches with ring closure', () => {
  //   const smiles = 'C(=C1)(C)C=CC=C1';
  //   const reconstructed = codegenRoundTrip(smiles);
  //   expect(reconstructed.smiles).toBe(smiles);
  // });

  // Issue 2: Nested branches with hydroxyls
  test('codegen issue: hydroxyl after nested branch', () => {
    const smiles = 'C1=CC(=C(C)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: hydroxyl in middle branch', () => {
    const smiles = 'C1=CC(=C(C(O)C)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Issue 3: Ring continuation after branch
  test('codegen issue: ring continues after branch', () => {
    const smiles = 'C1=CC(C)=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: ring continues after nested branch', () => {
    const smiles = 'C1=CC(=C(C)C=C1)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: ring continues after deep nested branch', () => {
    const smiles = 'C1=CC(=C(C(C)C)C=C1)O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // AST roundtrip tests
  test('AST issue: multiple branches on carbon', () => {
    const smiles = 'C(C)(C)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('AST issue: benzene with nested branch and hydroxyl', () => {
    const smiles = 'C1=CC(=C(C)C=C1)O';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('AST issue: CBD core structure', () => {
    const smiles = 'C1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  // Issue 4: Isopropenyl group handling
  test('codegen issue: simple isopropenyl', () => {
    const smiles = 'C(=C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: isopropenyl on ring', () => {
    const smiles = 'C1CCCCC1C(=C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('codegen issue: ring with isopropenyl in structure', () => {
    const smiles = 'C1C=CCCC1C(=C)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });
});
