/**
 * Unit tests for parser helper functions
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
import {
  findNextSeqAtom,
  atomStartsNewBranch,
  findDeepSeqContinuationRing,
  findSameDepthSeqAtoms,
  areSeqAtomsAttachmentsToEarlierPosition,
} from './branch-utils.js';
import { createAtom } from './atom-builder.js';

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
        { index: 0, branchDepth: 0, parentIndex: null, branchId: null },
        { index: 1, branchDepth: 1, parentIndex: 0, branchId: 5 },
        { index: 2, branchDepth: 2, parentIndex: 1, branchId: 10 },
      ];
      const result = traceRingPathBranchIds(atoms[2], 0, atoms);
      expect(result.has(5)).toBe(true);
      expect(result.has(10)).toBe(true);
    });

    it('should skip null branch IDs', () => {
      const atoms = [
        { index: 0, branchDepth: 0, parentIndex: null, branchId: null },
        { index: 1, branchDepth: 1, parentIndex: 0, branchId: null },
      ];
      const result = traceRingPathBranchIds(atoms[1], 0, atoms);
      expect(result.size).toBe(0);
    });
  });

  describe('shouldIncludeAtomInRing', () => {
    it('should include atoms at original depth in context', () => {
      const atom = { branchDepth: 0, branchId: null };
      const startAtom = { branchDepth: 0, branchId: null };
      const result = shouldIncludeAtomInRing(atom, startAtom, 0, null, new Set(), []);
      expect(result).toBe(true);
    });

    it('should include atoms in ring path branch', () => {
      const atom = { branchDepth: 1, branchId: 5 };
      const startAtom = { branchDepth: 0, branchId: null };
      const ringPathBranchIds = new Set([5]);
      const result = shouldIncludeAtomInRing(atom, startAtom, 0, null, ringPathBranchIds, []);
      expect(result).toBe(true);
    });

    it('should exclude atoms not in context', () => {
      const atom = { branchDepth: 1, branchId: 10 };
      const startAtom = { branchDepth: 0, branchId: null };
      const result = shouldIncludeAtomInRing(atom, startAtom, 0, null, new Set(), []);
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

describe('Branch Utils', () => {
  describe('findNextSeqAtom', () => {
    it('should find next atom in sequence', () => {
      const atoms = [
        { prevAtomIndex: null, branchDepth: 0, branchId: null, afterBranchClose: false },
        { prevAtomIndex: 0, branchDepth: 0, branchId: null, afterBranchClose: false },
      ];
      const result = findNextSeqAtom(atoms, 0, 0, null);
      expect(result).toBe(atoms[1]);
    });

    it('should return undefined when no match', () => {
      const atoms = [
        { prevAtomIndex: null, branchDepth: 0, branchId: null, afterBranchClose: false },
      ];
      const result = findNextSeqAtom(atoms, 0, 0, null);
      expect(result).toBeUndefined();
    });

    it('should exclude afterBranchClose atoms', () => {
      const atoms = [
        { prevAtomIndex: null, branchDepth: 0, branchId: null, afterBranchClose: false },
        { prevAtomIndex: 0, branchDepth: 0, branchId: null, afterBranchClose: true },
      ];
      const result = findNextSeqAtom(atoms, 0, 0, null);
      expect(result).toBeUndefined();
    });
  });

  describe('atomStartsNewBranch', () => {
    it('should return true when prevAtomIndex is null', () => {
      const atom = { prevAtomIndex: null };
      expect(atomStartsNewBranch(atom, [], new Set(), null)).toBe(true);
    });

    it('should return true when branchId differs', () => {
      const atom = { prevAtomIndex: 0, branchId: 5 };
      const atoms = [{ branchId: 10 }];
      expect(atomStartsNewBranch(atom, atoms, new Set(), null)).toBe(true);
    });

    it('should return true for standalone rings with excluded prev', () => {
      const atom = { prevAtomIndex: 0, branchId: 5 };
      const atoms = [{ branchId: 5 }];
      const excludedPositions = new Set([0]);
      expect(atomStartsNewBranch(atom, atoms, excludedPositions, null)).toBe(true);
    });

    it('should return false for fused rings with excluded prev', () => {
      const atom = { prevAtomIndex: 0, branchId: 5 };
      const atoms = [{ branchId: 5 }];
      const excludedPositions = new Set([0]);
      const fusedGroupPositions = new Set([0, 1, 2]);
      expect(atomStartsNewBranch(atom, atoms, excludedPositions, fusedGroupPositions)).toBe(false);
    });
  });

  describe('findDeepSeqContinuationRing', () => {
    it('should return null when no deep continuation', () => {
      const ring = { end: 0, branchDepth: 0 };
      const atoms = [{ branchDepth: 0, branchId: null }];
      const result = findDeepSeqContinuationRing(ring, atoms, [], [ring]);
      expect(result).toBeNull();
    });

    it('should find deep continuation ring', () => {
      const ring = { end: 0, branchDepth: 0, ringNumber: 1 };
      const atoms = [
        { branchDepth: 1, branchId: 5 },
        { prevAtomIndex: 0, branchDepth: 1, branchId: 5, afterBranchClose: false, index: 1 },
      ];
      const ringBoundaries = [
        { positions: [1], branchDepth: 1, ringNumber: 2 },
      ];
      const result = findDeepSeqContinuationRing(ring, atoms, ringBoundaries, [ring]);
      expect(result).toEqual(ringBoundaries[0]);
    });
  });

  describe('findSameDepthSeqAtoms', () => {
    it('should return empty array when endAtom is null', () => {
      const ring = { end: 0 };
      const result = findSameDepthSeqAtoms(ring, [], null);
      expect(result).toEqual([]);
    });

    it('should find sequential atoms at same depth', () => {
      const ring = { end: 0 };
      const endAtom = { branchDepth: 1, branchId: 5 };
      const atoms = [
        { prevAtomIndex: 0, branchDepth: 1, branchId: 5, afterBranchClose: false },
      ];
      const result = findSameDepthSeqAtoms(ring, atoms, endAtom);
      expect(result).toEqual([atoms[0]]);
    });
  });

  describe('areSeqAtomsAttachmentsToEarlierPosition', () => {
    it('should return false for empty seqAtoms', () => {
      const ring = { positions: [0, 1, 2], end: 2 };
      expect(areSeqAtomsAttachmentsToEarlierPosition([], ring)).toBe(false);
    });

    it('should return true when atom is attachment to earlier position', () => {
      const ring = { positions: [0, 1, 2], end: 2 };
      const seqAtoms = [{ parentIndex: 1 }];
      expect(areSeqAtomsAttachmentsToEarlierPosition(seqAtoms, ring)).toBe(true);
    });

    it('should return false when not attachment', () => {
      const ring = { positions: [0, 1, 2], end: 2 };
      const seqAtoms = [{ parentIndex: 5 }];
      expect(areSeqAtomsAttachmentsToEarlierPosition(seqAtoms, ring)).toBe(false);
    });
  });
});

describe('Atom Builder', () => {
  describe('createAtom', () => {
    it('should create atom at depth 0', () => {
      const token = { atom: 'C', value: 'C' };
      const branchStack = [];
      const lastAtomAtDepth = new Map();
      const branchClosedSinceLastAtom = new Map();

      const result = createAtom(0, token, null, branchStack, lastAtomAtDepth, branchClosedSinceLastAtom);

      expect(result).toEqual({
        index: 0,
        value: 'C',
        rawValue: 'C',
        bond: null,
        rings: [],
        branchDepth: 0,
        parentIndex: null,
        branchId: null,
        prevAtomIndex: null,
        afterBranchClose: false,
      });
    });

    it('should create atom in branch', () => {
      const token = { atom: 'N', value: 'N' };
      const branchStack = [{ parentIndex: 0, branchId: 5 }];
      const lastAtomAtDepth = new Map([[1, 1]]);
      const branchClosedSinceLastAtom = new Map([[1, false]]);

      const result = createAtom(2, token, '=', branchStack, lastAtomAtDepth, branchClosedSinceLastAtom);

      expect(result).toEqual({
        index: 2,
        value: 'N',
        rawValue: 'N',
        bond: '=',
        rings: [],
        branchDepth: 1,
        parentIndex: 0,
        branchId: 5,
        prevAtomIndex: 1,
        afterBranchClose: false,
      });
    });

    it('should track afterBranchClose flag', () => {
      const token = { atom: 'O', value: 'O' };
      const branchStack = [];
      const lastAtomAtDepth = new Map();
      const branchClosedSinceLastAtom = new Map([[0, true]]);

      const result = createAtom(5, token, null, branchStack, lastAtomAtDepth, branchClosedSinceLastAtom);

      expect(result.afterBranchClose).toBe(true);
    });
  });
});
