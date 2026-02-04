/**
 * Unit tests for branch-utils.js
 */

import { describe, it, expect } from 'vitest';
import {
  findNextSeqAtom,
  atomStartsNewBranch,
  findDeepSeqContinuationRing,
  findSameDepthSeqAtoms,
  areSeqAtomsAttachmentsToEarlierPosition,
} from './branch-utils.js';

describe('Branch Utils', () => {
  describe('findNextSeqAtom', () => {
    it('should find next atom in sequence', () => {
      const atoms = [
        {
          prevAtomIndex: null, branchDepth: 0, branchId: null, afterBranchClose: false,
        },
        {
          prevAtomIndex: 0, branchDepth: 0, branchId: null, afterBranchClose: false,
        },
      ];
      const result = findNextSeqAtom(atoms, 0, 0, null);
      expect(result).toBe(atoms[1]);
    });

    it('should return undefined when no match', () => {
      const atoms = [
        {
          prevAtomIndex: null, branchDepth: 0, branchId: null, afterBranchClose: false,
        },
      ];
      const result = findNextSeqAtom(atoms, 0, 0, null);
      expect(result).toBeUndefined();
    });

    it('should exclude afterBranchClose atoms', () => {
      const atoms = [
        {
          prevAtomIndex: null, branchDepth: 0, branchId: null, afterBranchClose: false,
        },
        {
          prevAtomIndex: 0, branchDepth: 0, branchId: null, afterBranchClose: true,
        },
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
      const result = atomStartsNewBranch(
        atom,
        atoms,
        excludedPositions,
        fusedGroupPositions,
      );
      expect(result).toBe(false);
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
        {
          prevAtomIndex: 0, branchDepth: 1, branchId: 5, afterBranchClose: false, index: 1,
        },
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
        {
          prevAtomIndex: 0, branchDepth: 1, branchId: 5, afterBranchClose: false,
        },
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

  describe('collectBranchChain', () => {
    it('should collect single atom branch', () => {
      const branchAtom = {
        index: 1, branchDepth: 1, parentIndex: 0, branchId: 5,
      };
      const allAtoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        branchAtom,
      ];
      const processed = new Set();
      const { collectBranchChain } = require('./branch-utils.js');
      const result = collectBranchChain(branchAtom, allAtoms, processed);

      expect(result).toEqual([branchAtom]);
      expect(processed.has(1)).toBe(true);
    });

    it('should collect consecutive atoms in same branch', () => {
      const branchAtom = {
        index: 1, branchDepth: 1, parentIndex: 0, branchId: 5,
      };
      const allAtoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        branchAtom,
        {
          index: 2, branchDepth: 1, parentIndex: 0, branchId: 5,
        },
        {
          index: 3, branchDepth: 1, parentIndex: 0, branchId: 5,
        },
      ];
      const processed = new Set();
      const { collectBranchChain } = require('./branch-utils.js');
      const result = collectBranchChain(branchAtom, allAtoms, processed);

      expect(result).toHaveLength(3);
      expect(result[0].index).toBe(1);
      expect(result[1].index).toBe(2);
      expect(result[2].index).toBe(3);
    });

    it('should stop at different parent', () => {
      const branchAtom = {
        index: 1, branchDepth: 1, parentIndex: 0, branchId: 5,
      };
      const allAtoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        branchAtom,
        {
          index: 2, branchDepth: 1, parentIndex: 1, branchId: 6,
        },
      ];
      const processed = new Set();
      const { collectBranchChain } = require('./branch-utils.js');
      const result = collectBranchChain(branchAtom, allAtoms, processed);

      expect(result).toHaveLength(1);
    });

    it('should include deeper nested branches', () => {
      const branchAtom = {
        index: 1, branchDepth: 1, parentIndex: 0, branchId: 5,
      };
      const allAtoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        branchAtom,
        {
          index: 2, branchDepth: 2, parentIndex: 1, branchId: 10,
        },
        {
          index: 3, branchDepth: 1, parentIndex: 0, branchId: 5,
        },
      ];
      const processed = new Set();
      const { collectBranchChain } = require('./branch-utils.js');
      const result = collectBranchChain(branchAtom, allAtoms, processed);

      expect(result).toHaveLength(3);
    });

    it('should handle missing atoms in sequence', () => {
      const branchAtom = {
        index: 1, branchDepth: 1, parentIndex: 0, branchId: 5,
      };
      const allAtoms = [
        {
          index: 0, branchDepth: 0, parentIndex: null, branchId: null,
        },
        branchAtom,
      ];
      const processed = new Set();
      const { collectBranchChain } = require('./branch-utils.js');
      const result = collectBranchChain(branchAtom, allAtoms, processed);

      expect(result).toHaveLength(1);
    });
  });

  describe('buildExcludedPositions', () => {
    it('should return fusedGroupPositions when provided', () => {
      const fusedGroupPositions = new Set([1, 2, 3]);
      const { buildExcludedPositions } = require('./branch-utils.js');
      const result = buildExcludedPositions(fusedGroupPositions, [], []);

      expect(result).toBe(fusedGroupPositions);
    });

    it('should build excluded positions from ring boundaries', () => {
      const ringAtoms = [{ branchDepth: 0 }];
      const ringBoundaries = [
        { branchDepth: 0, positions: [0, 1, 2] },
        { branchDepth: 0, positions: [3, 4, 5] },
        { branchDepth: 1, positions: [6, 7] },
      ];
      const { buildExcludedPositions } = require('./branch-utils.js');
      const result = buildExcludedPositions(null, ringAtoms, ringBoundaries);

      expect(result.has(0)).toBe(true);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
      expect(result.has(6)).toBe(false);
    });

    it('should handle empty ringAtoms', () => {
      const { buildExcludedPositions } = require('./branch-utils.js');
      const result = buildExcludedPositions(null, [], []);

      expect(result.size).toBe(0);
    });
  });
});
