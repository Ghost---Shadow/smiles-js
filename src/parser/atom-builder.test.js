/**
 * Unit tests for atom-builder.js
 */

import { describe, it, expect } from 'vitest';
import { createAtom } from './atom-builder.js';

describe('Atom Builder', () => {
  describe('createAtom', () => {
    it('should create atom at depth 0', () => {
      const token = { atom: 'C', value: 'C' };
      const branchStack = [];
      const lastAtomAtDepth = new Map();
      const branchClosedSinceLastAtom = new Map();

      const result = createAtom(
        0,
        token,
        null,
        branchStack,
        lastAtomAtDepth,
        branchClosedSinceLastAtom,
      );

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

      const result = createAtom(
        2,
        token,
        '=',
        branchStack,
        lastAtomAtDepth,
        branchClosedSinceLastAtom,
      );

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

      const result = createAtom(
        5,
        token,
        null,
        branchStack,
        lastAtomAtDepth,
        branchClosedSinceLastAtom,
      );

      expect(result.afterBranchClose).toBe(true);
    });
  });
});
