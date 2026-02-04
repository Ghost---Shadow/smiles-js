/**
 * Unit tests for ring-utils.js
 */

import { describe, it, expect } from 'vitest';
import {
  isInSameBranchContext,
  findInnerFusedRings,
  traceRingPathBranchIds,
  shouldIncludeAtomInRing,
  ringsShareAtoms,
  groupFusedRings,
  calculateOffset,
  determineBaseAtom,
  calculateSubstitutions,
  extractRingBonds,
} from './ring-utils.js';

describe('Ring Utils', () => {
  describe('isInSameBranchContext', () => {
    it('should return true for atoms at depth 0', () => {
      const atom1 = { branchDepth: 0, branchId: null };
      const atom2 = { branchDepth: 0, branchId: null };
      expect(isInSameBranchContext(atom1, atom2, [])).toBe(true);
    });

    it('should return false for atoms at different depths', () => {
      const atom1 = { branchDepth: 0, branchId: null };
      const atom2 = { branchDepth: 1, branchId: 1 };
      expect(isInSameBranchContext(atom1, atom2, [])).toBe(false);
    });

    it('should return true for atoms with same branchId', () => {
      const atom1 = { branchDepth: 1, branchId: 5 };
      const atom2 = { branchDepth: 1, branchId: 5 };
      expect(isInSameBranchContext(atom1, atom2, [])).toBe(true);
    });

    it('should trace parent indices to find common ancestor', () => {
      const atoms = [
        { index: 0, branchDepth: 0, parentIndex: null },
        { index: 1, branchDepth: 1, parentIndex: 0 },
        { index: 2, branchDepth: 1, parentIndex: 0 },
      ];
      expect(isInSameBranchContext(atoms[1], atoms[2], atoms)).toBe(true);
    });
  });

  describe('findInnerFusedRings', () => {
    it('should return empty array when no inner rings', () => {
      const closedRings = [];
      const result = findInnerFusedRings(0, 5, [], 0, closedRings);
      expect(result).toEqual([]);
    });

    it('should find inner rings at same depth', () => {
      const atoms = [
        { branchDepth: 0 },
        { branchDepth: 0 },
        { branchDepth: 0 },
        { branchDepth: 0 },
        { branchDepth: 0 },
        { branchDepth: 0 },
      ];
      const closedRings = [
        { start: 1, end: 3, ringNumber: 2 },
      ];
      const result = findInnerFusedRings(0, 5, atoms, 0, closedRings);
      expect(result).toEqual([{ start: 1, end: 3, ringNumber: 2 }]);
    });

    it('should filter out rings at different depth', () => {
      const atoms = [
        { branchDepth: 0 },
        { branchDepth: 1 },
        { branchDepth: 1 },
        { branchDepth: 1 },
      ];
      const closedRings = [
        { start: 1, end: 3, ringNumber: 2 },
      ];
      const result = findInnerFusedRings(0, 3, atoms, 0, closedRings);
      expect(result).toEqual([]);
    });

    it('should sort rings by start position', () => {
      const atoms = Array(10).fill({ branchDepth: 0 });
      const closedRings = [
        { start: 5, end: 7, ringNumber: 3 },
        { start: 2, end: 4, ringNumber: 2 },
      ];
      const result = findInnerFusedRings(0, 9, atoms, 0, closedRings);
      expect(result[0].start).toBe(2);
      expect(result[1].start).toBe(5);
    });
  });

  describe('traceRingPathBranchIds', () => {
    it('should return empty set when atom is at target depth', () => {
      const endAtom = { branchDepth: 0, branchId: null };
      const result = traceRingPathBranchIds(endAtom, 0, []);
      expect(result.size).toBe(0);
    });

    it('should collect branch IDs from deeper to target depth', () => {
      const atoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        {
          index: 1, branchDepth: 1, parentIndex: 0, branchId: 5,
        },
        {
          index: 2, branchDepth: 2, parentIndex: 1, branchId: 10,
        },
      ];
      const result = traceRingPathBranchIds(atoms[2], 0, atoms);
      expect(result.has(5)).toBe(true);
      expect(result.has(10)).toBe(true);
    });

    it('should skip null branch IDs', () => {
      const atoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        {
          index: 1, branchDepth: 1, parentIndex: 0, branchId: null,
        },
      ];
      const result = traceRingPathBranchIds(atoms[1], 0, atoms);
      expect(result.size).toBe(0);
    });
  });

  describe('shouldIncludeAtomInRing', () => {
    it('should include atoms at original depth in context', () => {
      const atom = { branchDepth: 0, branchId: null };
      const startAtom = { branchDepth: 0, branchId: null };
      const result = shouldIncludeAtomInRing(
        atom,
        startAtom,
        0,
        null,
        new Set(),
        [],
      );
      expect(result).toBe(true);
    });

    it('should include atoms in ring path branch', () => {
      const atom = { branchDepth: 1, branchId: 5 };
      const startAtom = { branchDepth: 0, branchId: null };
      const ringPathBranchIds = new Set([5]);
      const result = shouldIncludeAtomInRing(
        atom,
        startAtom,
        0,
        null,
        ringPathBranchIds,
        [],
      );
      expect(result).toBe(true);
    });

    it('should exclude atoms not in context', () => {
      const atom = { branchDepth: 1, branchId: 10 };
      const startAtom = { branchDepth: 0, branchId: null };
      const result = shouldIncludeAtomInRing(
        atom,
        startAtom,
        0,
        null,
        new Set(),
        [],
      );
      expect(result).toBe(false);
    });
  });

  describe('ringsShareAtoms', () => {
    it('should return true when rings share atoms', () => {
      const ring1 = { positions: [0, 1, 2, 3] };
      const ring2 = { positions: [2, 3, 4, 5] };
      expect(ringsShareAtoms(ring1, ring2)).toBe(true);
    });

    it('should return false when rings do not share atoms', () => {
      const ring1 = { positions: [0, 1, 2] };
      const ring2 = { positions: [3, 4, 5] };
      expect(ringsShareAtoms(ring1, ring2)).toBe(false);
    });

    it('should handle empty position arrays', () => {
      const ring1 = { positions: [] };
      const ring2 = { positions: [1, 2, 3] };
      expect(ringsShareAtoms(ring1, ring2)).toBe(false);
    });
  });

  describe('groupFusedRings', () => {
    it('should return single group for non-overlapping rings', () => {
      const rings = [
        { positions: [0, 1, 2] },
        { positions: [3, 4, 5] },
      ];
      const result = groupFusedRings(rings);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual([rings[0]]);
      expect(result[1]).toEqual([rings[1]]);
    });

    it('should group overlapping rings together', () => {
      const rings = [
        { positions: [0, 1, 2, 3] },
        { positions: [2, 3, 4, 5] },
      ];
      const result = groupFusedRings(rings);
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(2);
    });

    it('should transitively group rings', () => {
      const rings = [
        { positions: [0, 1, 2] },
        { positions: [2, 3, 4] },
        { positions: [4, 5, 6] },
      ];
      const result = groupFusedRings(rings);
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(3);
    });
  });

  describe('calculateOffset', () => {
    it('should return 0 when no shared atoms', () => {
      const ring = { positions: [0, 1, 2] };
      const baseRing = { positions: [3, 4, 5] };
      expect(calculateOffset(ring, baseRing)).toBe(0);
    });

    it('should return correct offset for first shared atom', () => {
      const ring = { positions: [2, 3, 4] };
      const baseRing = { positions: [0, 1, 2, 3] };
      expect(calculateOffset(ring, baseRing)).toBe(2);
    });

    it('should handle multiple shared atoms', () => {
      const ring = { positions: [1, 2, 3] };
      const baseRing = { positions: [0, 1, 2, 3] };
      expect(calculateOffset(ring, baseRing)).toBe(1);
    });
  });

  describe('determineBaseAtom', () => {
    it('should return C for all carbon atoms', () => {
      const ringAtoms = [
        { rawValue: 'C' },
        { rawValue: 'C' },
        { rawValue: 'C' },
      ];
      expect(determineBaseAtom(ringAtoms)).toBe('C');
    });

    it('should return most common atom', () => {
      const ringAtoms = [
        { rawValue: 'C' },
        { rawValue: 'N' },
        { rawValue: 'N' },
      ];
      expect(determineBaseAtom(ringAtoms)).toBe('N');
    });

    it('should prefer later atom in tie', () => {
      const ringAtoms = [
        { rawValue: 'C' },
        { rawValue: 'N' },
      ];
      expect(determineBaseAtom(ringAtoms)).toBe('N');
    });
  });

  describe('calculateSubstitutions', () => {
    it('should return empty object when all atoms match base', () => {
      const ringAtoms = [
        { rawValue: 'C' },
        { rawValue: 'C' },
      ];
      expect(calculateSubstitutions(ringAtoms, 'C')).toEqual({});
    });

    it('should return 1-indexed substitutions', () => {
      const ringAtoms = [
        { rawValue: 'C' },
        { rawValue: 'N' },
        { rawValue: 'C' },
      ];
      const result = calculateSubstitutions(ringAtoms, 'C');
      expect(result).toEqual({ 2: 'N' });
    });

    it('should handle multiple substitutions', () => {
      const ringAtoms = [
        { rawValue: 'C' },
        { rawValue: 'N' },
        { rawValue: 'O' },
      ];
      const result = calculateSubstitutions(ringAtoms, 'C');
      expect(result).toEqual({ 2: 'N', 3: 'O' });
    });
  });

  describe('extractRingBonds', () => {
    it('should extract bonds starting from second atom', () => {
      const ringAtoms = [
        { bond: null },
        { bond: '=' },
        { bond: null },
      ];
      const result = extractRingBonds(ringAtoms);
      expect(result).toEqual(['=', null, null]);
    });

    it('should append null for ring closure bond', () => {
      const ringAtoms = [
        { bond: null },
        { bond: '=' },
      ];
      const result = extractRingBonds(ringAtoms);
      expect(result).toEqual(['=', null]);
    });
  });
});
