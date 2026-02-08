import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const CORTISONE_SMILES = 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12';

describe('Cortisone - Divide and Conquer', () => {
  // Debug tests for understanding fused ring generation
  test('DEBUG: inspect fused ring structure', () => {
    const smiles = 'C12CCCCC1CCC2';
    const ast = parse(smiles);

    console.log('=== AST Structure ===');
    console.log('Type:', ast.type);
    console.log('Number of rings:', ast.rings.length);

    ast.rings.forEach((ring, i) => {
      console.log(`\nRing ${i}:`);
      console.log('  ringNumber:', ring.ringNumber);
      console.log('  size:', ring.size);
      console.log('  offset:', ring.offset);
      console.log('  atoms:', ring.atoms);
    });

    console.log('\n=== Generated SMILES ===');
    console.log('AST smiles:', ast.smiles);

    // This test always passes - it's just for inspection
    expect(ast.smiles).toBe(smiles);
  });

  test('DEBUG: manual Ring construction - understanding offset and size', () => {
    // eslint-disable-next-line global-require
    const { Ring } = require('../src/constructors.js');

    console.log('\n=== Understanding Ring Offset and Size ===');

    // In C12CCCCC1CCC2:
    // - Ring 1: atoms 0-5 (6 atoms), opens at 0, closes at 5
    // - Ring 2: atoms 0,6,7,8 (4 atoms), opens at 0, closes at 8
    //
    // The SMILES layout is:
    // Position:  0  1  2  3  4  5  6  7  8
    // SMILES:    C  C  C  C  C  C  C  C  C
    // Markers:   12          1        2
    //
    // Ring 1 spans positions 0-5
    // Ring 2 spans positions 0, 6-8
    //
    // For manual construction:
    // - Ring 1: size=6, offset=0 (positions 0-5)
    // - Ring 2: needs to span positions 0 and 6-8
    //   If offset=0, size=4, it would span positions 0-3 (WRONG)
    //   If offset=6, size=3, it would span positions 6-8 (missing position 0!)
    //
    // The KEY: Ring 2 needs to "wrap around" back to position 0
    // This requires ring 2 to open at position 0 but extend to position 8
    // So: offset=0, size=9? That would span positions 0-8 (includes all of ring 1!)
    //
    // OR: Ring 2 opens at position 0, extends 3 atoms (0,6,7,8)?
    // This is not a continuous sequence in the position array!
    //
    // The correct model: offset indicates WHICH atom of ring 1 ring 2 fuses to
    // Size indicates how many atoms ring 2 has
    // For C12CCC CC1CCC2: ring 2 opens at atom 0 of ring 1, has 4 total atoms
    // But those 4 atoms are: shared atom 0, then 3 new atoms (6,7,8)

    // eslint-disable-next-line no-unused-vars
    const r1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });

    // The problem: fuse() is meant for rings that share an EDGE (2 atoms), not a single atom
    // For single-atom fusion like C12...1...2, we need a different approach

    // Let's see what the parser produces for comparison
    // eslint-disable-next-line no-shadow, global-require
    const { parse } = require('../src/parser/index.js');
    const parsed = parse('C12CCCCC1CCC2');
    console.log('Parsed Ring 1: size=', parsed.rings[0].size, 'offset=', parsed.rings[0].offset);
    console.log('Parsed Ring 2: size=', parsed.rings[1].size, 'offset=', parsed.rings[1].offset);
    console.log('Parsed smiles:', parsed.smiles);

    // The parser creates ring 2 with size=9 (ALL atoms from start to end)
    // This suggests that the Ring constructor model is different from what we expect
    // Manual construction might require a different size/offset than the parser uses

    expect(parsed.smiles).toBe('C12CCCCC1CCC2');
  });

  test('DEBUG: Root cause - computeFusedRingPositions bug (FIXED)', () => {
    // BUG WAS: In src/constructors.js, computeFusedRingPositions() lines 364-388
    // handled offset=0 inner rings, but only if innerRings.length > 1
    //
    // For C12CCCCC1CCC2:
    // - innerRings = [Ring2]
    // - innerRings.length = 1, NOT > 1
    // - So offset=0 handling was SKIPPED
    // - Ring 2 got classified as chainedRing
    // - chainedRings weren't properly handled, so Ring 2's metaPositions never got set
    //
    // FIX APPLIED: Added special case for offset=0 single inner rings
    // - Lines 366-371 now handle single offset=0 inner ring
    // - Added startSharingRings classification for rings that share only starting atom
    // - Added traversal logic at lines 505-540 for start-sharing fusion
    // eslint-disable-next-line global-require
    const { Ring } = require('../src/constructors.js');
    const v1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const v2 = Ring({ atoms: 'C', size: 9, ringNumber: 2 });
    const fused = v1.fuse(0, v2);

    console.log('\n=== Root Cause Analysis (FIXED) ===');
    console.log('Ring 0 metaPositions:', fused.rings[0].metaPositions);
    console.log('Ring 1 metaPositions:', fused.rings[1].metaPositions);
    console.log('Expected Ring 1 metaPositions: [0,1,2,3,4,5,6,7,8]');
    console.log('Actual Ring 1 metaPositions:', fused.rings[1].metaPositions || 'undefined');

    // Ring 1 should now have correct metaPositions
    expect(fused.rings[1].metaPositions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(fused.smiles).toBe('C12CCCCC1CCC2');
  });

  // Level 1: Simple components
  test('simple 6-ring with ketone', () => {
    const smiles = 'C1CCC(=O)CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('simple ring with double bond', () => {
    const smiles = 'C1=CCCCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('ring with ketone and double bond', () => {
    const smiles = 'C1CCC(=O)C=C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 2: Ring with methyl prefix
  test('methyl + ring with ketone and double bond', () => {
    const smiles = 'CC1CCC(=O)C=C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 3: Two fused rings (basic steroid core A+B)
  test('two simple fused rings', () => {
    const smiles = 'C1CCC2CCCCC2C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('fused rings with ring numbers 1 and 2', () => {
    const smiles = 'C12CCCCC1CCC2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('methyl + two fused rings pattern', () => {
    const smiles = 'CC12CCCCC1CCC2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 4: Adding the ketone and double bond to ring 1
  test('ring 1 with ketone+double bond, ring 2 simple', () => {
    const smiles = 'CC12CCC(=O)C=C1CCC2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 5: Adding third ring (ring 1)
  test('three fused rings (A+B+C core)', () => {
    const smiles = 'C12CCC(=O)C=C1CCC1C2CCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('three fused rings with methyl', () => {
    const smiles = 'CC12CCC(=O)C=C1CCC1C2CCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 6: Adding hydroxyl group in branch
  test('hydroxyl in branch C(O)', () => {
    const smiles = 'CC(O)';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('ring with hydroxyl branch', () => {
    const smiles = 'C1CC(O)CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('three rings with hydroxyl on middle ring', () => {
    const smiles = 'CC12CCC(=O)C=C1CCC1C2C(O)CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 7: Fourth ring (ring 2) with methyl branch
  test('four fused rings basic', () => {
    const smiles = 'C12CCC(=O)C=C1CCC1C2CCC2CCCC12';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('four rings with methyl on ring 2', () => {
    const smiles = 'CC12CCC(=O)C=C1CCC1C2CCC2(C)CCC12';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('four rings with hydroxyl and methyl', () => {
    const smiles = 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)CCC12';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 8: Side chain components
  test('simple ketone side chain C(=O)C', () => {
    const smiles = 'CC(=O)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('ketone + hydroxymethyl C(=O)CO', () => {
    const smiles = 'CC(=O)CO';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('carbon with ketone+hydroxymethyl branch C(C(=O)CO)', () => {
    const smiles = 'CC(C(=O)CO)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('ring with side chain C(C(=O)CO)', () => {
    const smiles = 'C1CC(C(=O)CO)CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 9: Building up to full cortisone
  test('four rings with side chain, no hydroxyl', () => {
    const smiles = 'CC12CCC(=O)C=C1CCC1C2CCC2(C)C(C(=O)CO)CCC12';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('full cortisone structure', () => {
    const smiles = CORTISONE_SMILES;
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Component isolation tests
  test('isolated: A ring (ring with ketone)', () => {
    const smiles = 'C1CCC(=O)C=C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('isolated: A+B rings', () => {
    const smiles = 'C1CCC(=O)C=C1CCC2CCCCC2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('isolated: A+B fused pattern CC12', () => {
    const smiles = 'CC12CCC(=O)C=C1CCCC2';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });
});
