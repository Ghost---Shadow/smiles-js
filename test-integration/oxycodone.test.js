import { describe, test, expect } from 'bun:test';
import { parse, buildAtomList } from '../src/parser.js';
import { tokenize } from '../src/tokenizer.js';

const OXYCODONE_SMILES = 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O';

describe('Oxycodone Parser Analysis', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    expect(tokens.length).toBeGreaterThan(0);
  });

  test('builds atom list with correct ring boundaries', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    const { atoms, ringBoundaries } = buildAtomList(tokens);

    // Should have 23 atoms (0-22)
    expect(atoms.length).toBe(23);

    // Should have 5 rings
    expect(ringBoundaries.length).toBe(5);

    // Ring numbers should be 1, 2, 3, 4, 5
    const ringNumbers = ringBoundaries.map((r) => r.ringNumber).sort((a, b) => a - b);
    expect(ringNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  test('ring 5 spans correct positions (13-18) across branch depths', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    const { atoms, ringBoundaries } = buildAtomList(tokens);

    const ring5 = ringBoundaries.find((r) => r.ringNumber === 5);
    expect(ring5).toBeDefined();
    expect(ring5.start).toBe(13);
    expect(ring5.end).toBe(18);
    expect(ring5.positions).toEqual([13, 14, 15, 16, 17, 18]);
    expect(ring5.branchDepth).toBe(1);

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
    const { atoms, ringBoundaries } = buildAtomList(tokens);

    const ring4 = ringBoundaries.find((r) => r.ringNumber === 4);
    expect(ring4).toBeDefined();
    expect(ring4.start).toBe(5);
    expect(ring4.end).toBe(21);
    // Ring 4 should include atoms through the branch structure
    expect(ring4.positions).toContain(5);
    expect(ring4.positions).toContain(21);
  });

  test('parses to AST', () => {
    const ast = parse(OXYCODONE_SMILES);
    expect(ast).toBeDefined();
    expect(ast.type).toBeDefined();
  });

  test('AST has correct structure', () => {
    const ast = parse(OXYCODONE_SMILES);

    // Should be a molecule with multiple components (linear + fused ring + linear)
    if (ast.type === 'molecule') {
      expect(ast.components.length).toBeGreaterThan(0);
      const types = ast.components.map((c) => c.type);
      // Should contain at least one fused_ring
      expect(types).toContain('fused_ring');
    } else if (ast.type === 'fused_ring') {
      // Or the whole thing is a fused ring
      expect(ast.rings.length).toBeGreaterThan(0);
    }
  });

  test('fused ring has all 5 rings (including bridge ring 5)', () => {
    const ast = parse(OXYCODONE_SMILES);

    // Find the fused ring component
    let fusedRing;
    if (ast.type === 'fused_ring') {
      fusedRing = ast;
    } else if (ast.type === 'molecule') {
      fusedRing = ast.components.find((c) => c.type === 'fused_ring');
    }

    expect(fusedRing).toBeDefined();

    // All 5 rings should be in the fused group:
    // - Rings 1, 2, 3, 4 are at depth 0 (main chain)
    // - Ring 5 is at depth 1 but shares atoms (13, 14, 15) with depth-0 rings (3, 4)
    // - Ring 5 is a "bridge ring" that connects different depths
    const ringNumbers = fusedRing.rings.map((r) => r.ringNumber).sort((a, b) => a - b);
    expect(ringNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  test('round-trips correctly', () => {
    const ast = parse(OXYCODONE_SMILES);
    expect(ast.smiles).toBe(OXYCODONE_SMILES);
  });
});

describe('Oxycodone Debug Info', () => {
  test('logs AST structure for debugging', () => {
    const ast = parse(OXYCODONE_SMILES);

    console.log('Input:', OXYCODONE_SMILES);
    console.log('Output:', ast.smiles);
    console.log('Match:', ast.smiles === OXYCODONE_SMILES);
    console.log('');
    console.log('AST type:', ast.type);

    if (ast.components) {
      console.log('Components:', ast.components.length);
      ast.components.forEach((c, i) => {
        console.log(`  Component ${i}:`, c.type);
      });
    }

    // Find fused ring
    const fusedRing = ast.type === 'fused_ring' ? ast : ast.components?.find((c) => c.type === 'fused_ring');
    if (fusedRing) {
      console.log('');
      console.log('=== Fused Ring ===');
      console.log('Rings:', fusedRing.rings?.length);
      // eslint-disable-next-line no-underscore-dangle
      console.log('All positions:', fusedRing._allPositions);
      // eslint-disable-next-line no-underscore-dangle
      console.log('Sequential rings:', fusedRing._sequentialRings?.length);
      console.log('');

      fusedRing.rings.forEach((r, i) => {
        // eslint-disable-next-line no-underscore-dangle
        console.log(`Ring ${i} - number: ${r.ringNumber}, size: ${r.size}, positions: ${JSON.stringify(r._positions)}, branchDepths: ${JSON.stringify(r._branchDepths)}`);
        console.log(`  attachments: ${JSON.stringify(Object.keys(r.attachments || {}))}`);
        Object.entries(r.attachments || {}).forEach(([pos, atts]) => {
          atts.forEach((att, ai) => {
            console.log(`    attachment[${pos}][${ai}]: type=${att.type}, smiles=${att.smiles}`);
          });
        });
        console.log(`  substitutions: ${JSON.stringify(r.substitutions)}`);
        console.log(`  bonds: ${JSON.stringify(r.bonds)}`);
      });

      // eslint-disable-next-line no-underscore-dangle
      if (fusedRing._sequentialRings?.length > 0) {
        console.log('');
        console.log('=== Sequential Rings ===');
        // eslint-disable-next-line no-underscore-dangle
        fusedRing._sequentialRings.forEach((r, i) => {
          // eslint-disable-next-line no-underscore-dangle
          console.log(`SeqRing ${i} - number: ${r.ringNumber}, size: ${r.size}, positions: ${JSON.stringify(r._positions)}`);
        });
      }
    }

    // This test always passes - it's just for logging
    expect(true).toBe(true);
  });

  test('logs atom list for debugging', () => {
    const tokens = tokenize(OXYCODONE_SMILES);
    const { atoms, ringBoundaries } = buildAtomList(tokens);

    console.log('=== Ring Boundaries ===');
    ringBoundaries.forEach((rb, i) => {
      console.log(`${i} Ring ${rb.ringNumber} start: ${rb.start} end: ${rb.end} depth: ${rb.branchDepth} positions: ${JSON.stringify(rb.positions)}`);
    });

    console.log('');
    console.log('=== Atoms (focusing on ring 5 area) ===');
    [12, 13, 14, 15, 16, 17, 18, 19, 20, 21].forEach((i) => {
      const a = atoms[i];
      console.log(`${i} ${a.value} bond: ${a.bond} depth: ${a.branchDepth} rings: ${JSON.stringify(a.rings)} parent: ${a.parentIndex}`);
    });

    expect(true).toBe(true);
  });
});
