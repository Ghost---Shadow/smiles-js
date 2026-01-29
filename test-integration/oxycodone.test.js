import { describe, test, expect } from 'bun:test';
import { parse, buildAtomList } from '../src/parser.js';
import { tokenize } from '../src/tokenizer.js';
import { codegenRoundTrip } from './utils.js';

const OXYCODONE_SMILES = 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O';
// Codegen loses double bonds in rings
const OXYCODONE_CODEGEN = 'CN15CCC23C4C15(=O)(=O)(=O)CCC2CCCC3CO4O';

describe('Oxycodone Parser Analysis', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    expect(tokens.length).toBe(45);
  });

  test('builds atom list with correct ring boundaries', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    const { atoms, ringBoundaries } = buildAtomList(tokens);

    expect(atoms.length).toBe(23);
    expect(ringBoundaries.length).toBe(5);

    const ringNumbers = ringBoundaries.map((r) => r.ringNumber).sort((a, b) => a - b);
    expect(ringNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  test('ring 5 spans correct positions (13-18) across branch depths', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    const { atoms, ringBoundaries } = buildAtomList(tokens);

    const ring5 = ringBoundaries.find((r) => r.ringNumber === 5);
    expect(ring5).toEqual({
      ringNumber: 5,
      start: 13,
      end: 18,
      positions: [13, 14, 15, 16, 17, 18],
      branchDepth: 1,
      branchId: 19,
    });

    // Verify atoms at these positions have the right depths
    // Ring 5 traverses from depth 1 to depth 3
    expect(atoms[13].branchDepth).toBe(1);
    expect(atoms[14].branchDepth).toBe(1);
    expect(atoms[15].branchDepth).toBe(1);
    expect(atoms[16].branchDepth).toBe(2);
    expect(atoms[17].branchDepth).toBe(3);
    expect(atoms[18].branchDepth).toBe(3);
  });

  test('ring 4 spans correct positions with branch crossing', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    const { ringBoundaries } = buildAtomList(tokens);

    const ring4 = ringBoundaries.find((r) => r.ringNumber === 4);
    expect(ring4.start).toBe(5);
    expect(ring4.end).toBe(21);
    expect(ring4.positions).toContain(5);
    expect(ring4.positions).toContain(21);
  });

  test('parses to AST with correct type', () => {
    const ast = parse(OXYCODONE_SMILES);
    expect(ast.type).toBe('molecule');
  });

  test('AST has correct structure', () => {
    const ast = parse(OXYCODONE_SMILES);

    expect(ast.type).toBe('molecule');
    expect(ast.components.length).toBe(3);

    const types = ast.components.map((c) => c.type);
    expect(types).toEqual(['linear', 'fused_ring', 'linear']);
  });

  test('fused ring has all 5 rings (including bridge ring 5)', () => {
    const ast = parse(OXYCODONE_SMILES);

    const fusedRing = ast.components.find((c) => c.type === 'fused_ring');

    // All 5 rings should be in the fused group:
    // - Rings 1, 2, 3, 4 are at depth 0 (main chain)
    // - Ring 5 is at depth 1 but shares atoms (13, 14, 15) with depth-0 rings (3, 4)
    // - Ring 5 is a "bridge ring" that connects different depths
    const ringNumbers = fusedRing.rings.map((r) => r.ringNumber).sort((a, b) => a - b);
    expect(ringNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  test('SMILES -> AST -> SMILES', () => {
    const ast = parse(OXYCODONE_SMILES);
    expect(ast.smiles).toBe(OXYCODONE_SMILES);
  });

  test('SMILES -> AST -> CODE -> AST -> SMILES', () => {
    const reconstructed = codegenRoundTrip(OXYCODONE_SMILES);
    expect(reconstructed.smiles).toBe(OXYCODONE_CODEGEN);
  });
});
