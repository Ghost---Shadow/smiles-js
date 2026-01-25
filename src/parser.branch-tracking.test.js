import { describe, test, expect } from 'bun:test';
import { tokenize } from './tokenizer.js';

/**
 * Minimal version of buildAtomList to test branch tracking logic
 */
function testBuildAtomList(tokens) {
  const atoms = [];
  const branchStack = [];
  const lastAtomAtDepth = new Map();

  let currentAtomIndex = -1;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.type === 'atom') {
      currentAtomIndex += 1;

      const parentIndex = branchStack.length > 0
        ? branchStack[branchStack.length - 1].parentIndex
        : null;

      const branchId = branchStack.length > 0
        ? branchStack[branchStack.length - 1].branchId
        : null;

      const atom = {
        index: currentAtomIndex,
        value: token.atom,
        branchDepth: branchStack.length,
        parentIndex,
        branchId,
      };

      atoms.push(atom);

      // Track last atom at this depth level
      lastAtomAtDepth.set(branchStack.length, currentAtomIndex);
    }

    if (token.type === 'branch_open') {
      // Parent is the last atom at the CURRENT depth level
      const currentDepth = branchStack.length;
      const parentIdx = lastAtomAtDepth.get(currentDepth);

      branchStack.push({
        parentIndex: parentIdx !== undefined ? parentIdx : -1,
        depth: currentDepth,
        branchId: i,
      });
    }

    if (token.type === 'branch_close') {
      branchStack.pop();
    }
  }

  return atoms;
}

describe('Branch Tracking Logic', () => {
  test('CC(C)(C)C - multiple branches at same position', () => {
    const tokens = tokenize('CC(C)(C)C');
    const atoms = testBuildAtomList(tokens);

    // Should have 5 atoms total
    expect(atoms).toHaveLength(5);

    // Atom 0: C (depth 0)
    expect(atoms[0]).toEqual({
      index: 0,
      value: 'C',
      branchDepth: 0,
      parentIndex: null,
      branchId: null,
    });

    // Atom 1: C (depth 0)
    expect(atoms[1]).toEqual({
      index: 1,
      value: 'C',
      branchDepth: 0,
      parentIndex: null,
      branchId: null,
    });

    // Atom 2: C (depth 1, parent 1, branchId 2)
    expect(atoms[2]).toEqual({
      index: 2,
      value: 'C',
      branchDepth: 1,
      parentIndex: 1,
      branchId: 2,
    });

    // Atom 3: C (depth 1, parent 1, branchId 5) - DIFFERENT branchId
    expect(atoms[3]).toEqual({
      index: 3,
      value: 'C',
      branchDepth: 1,
      parentIndex: 1,
      branchId: 5,
    });

    // Atom 4: C (depth 0)
    expect(atoms[4]).toEqual({
      index: 4,
      value: 'C',
      branchDepth: 0,
      parentIndex: null,
      branchId: null,
    });
  });

  test('CC(C(C))C - nested branches', () => {
    const tokens = tokenize('CC(C(C))C');
    const atoms = testBuildAtomList(tokens);

    // Should have 5 atoms total
    expect(atoms).toHaveLength(5);

    // Atom 0: C (depth 0)
    expect(atoms[0].branchDepth).toBe(0);

    // Atom 1: C (depth 0)
    expect(atoms[1].branchDepth).toBe(0);

    // Atom 2: C (depth 1, parent 1)
    expect(atoms[2]).toEqual({
      index: 2,
      value: 'C',
      branchDepth: 1,
      parentIndex: 1,
      branchId: 2,
    });

    // Atom 3: C (depth 2, parent 2) - nested inside first branch
    expect(atoms[3]).toEqual({
      index: 3,
      value: 'C',
      branchDepth: 2,
      parentIndex: 2,
      branchId: 4,
    });

    // Atom 4: C (depth 0)
    expect(atoms[4].branchDepth).toBe(0);
  });

  test('C(C)(C)(C)C - triple branches at same position', () => {
    const tokens = tokenize('C(C)(C)(C)C');
    const atoms = testBuildAtomList(tokens);

    // Should have 5 atoms total
    expect(atoms).toHaveLength(5);

    // Atom 0: C (depth 0, parent null)
    expect(atoms[0].parentIndex).toBe(null);

    // Atoms 1, 2, 3 should all be at depth 1 with parent 0
    expect(atoms[1]).toEqual({
      index: 1,
      value: 'C',
      branchDepth: 1,
      parentIndex: 0,
      branchId: 1,
    });

    expect(atoms[2]).toEqual({
      index: 2,
      value: 'C',
      branchDepth: 1,
      parentIndex: 0,
      branchId: 4,
    });

    expect(atoms[3]).toEqual({
      index: 3,
      value: 'C',
      branchDepth: 1,
      parentIndex: 0,
      branchId: 7,
    });

    // Atom 4: C (depth 0)
    expect(atoms[4].branchDepth).toBe(0);
  });
});
