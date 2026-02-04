/**
 * Unit tests for atom-builder.js
 */

import { describe, it, expect } from 'vitest';
import {
  createAtom, handleRingMarker, buildAtomList,
} from './atom-builder.js';
import { TokenType } from '../tokenizer.js';

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

  describe('handleRingMarker', () => {
    it('should open a ring when ringNumber is new', () => {
      const token = { type: TokenType.RING_MARKER, ringNumber: 1 };
      const atoms = [{ index: 0, rings: [] }];
      const ringStacks = new Map();
      const closedRings = [];
      const ringBoundaries = [];
      const branchStack = [];

      handleRingMarker(token, 0, ringStacks, atoms, closedRings, ringBoundaries, branchStack);

      expect(ringStacks.has(1)).toBe(true);
      expect(ringStacks.get(1)).toEqual({
        startIndex: 0,
        branchDepth: 0,
        branchId: null,
      });
      expect(atoms[0].rings).toEqual([1]);
    });

    it('should close a ring when ringNumber exists', () => {
      const token = { type: TokenType.RING_MARKER, ringNumber: 1 };
      const atoms = [
        { index: 0, rings: [] },
        { index: 1, rings: [] },
        { index: 2, rings: [] },
      ];
      const ringStacks = new Map([[1, { startIndex: 0, branchDepth: 0, branchId: null }]]);
      const closedRings = [];
      const ringBoundaries = [];
      const branchStack = [];

      handleRingMarker(token, 2, ringStacks, atoms, closedRings, ringBoundaries, branchStack);

      expect(ringStacks.has(1)).toBe(false);
      expect(closedRings).toHaveLength(1);
      expect(closedRings[0]).toEqual({
        ringNumber: 1,
        start: 0,
        end: 2,
      });
      expect(ringBoundaries).toHaveLength(1);
    });

    it('should handle ring markers in branch', () => {
      const token = { type: TokenType.RING_MARKER, ringNumber: 2 };
      const atoms = [{ index: 0, rings: [] }];
      const ringStacks = new Map();
      const closedRings = [];
      const ringBoundaries = [];
      const branchStack = [{ parentIndex: 0, branchId: 10, depth: 1 }];

      handleRingMarker(token, 0, ringStacks, atoms, closedRings, ringBoundaries, branchStack);

      expect(ringStacks.get(2)).toEqual({
        startIndex: 0,
        branchDepth: 1,
        branchId: 10,
      });
    });
  });

  describe('buildAtomList', () => {
    it('should build atom list from simple linear chain', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
      ];

      const result = buildAtomList(tokens);

      expect(result.atoms).toHaveLength(3);
      expect(result.atoms[0].value).toBe('C');
      expect(result.atoms[1].prevAtomIndex).toBe(0);
      expect(result.atoms[2].prevAtomIndex).toBe(1);
    });

    it('should track bonds between atoms', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.BOND, value: '=' },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
      ];

      const result = buildAtomList(tokens);

      expect(result.atoms[1].bond).toBe('=');
    });

    it('should handle ring markers', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.RING_MARKER, ringNumber: 1 },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.RING_MARKER, ringNumber: 1 },
      ];

      const result = buildAtomList(tokens);

      expect(result.ringBoundaries).toHaveLength(1);
      expect(result.ringBoundaries[0].start).toBe(0);
      expect(result.ringBoundaries[0].end).toBe(2);
    });

    it('should handle branches', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.BRANCH_OPEN },
        { type: TokenType.ATOM, atom: 'N', value: 'N' },
        { type: TokenType.BRANCH_CLOSE },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
      ];

      const result = buildAtomList(tokens);

      expect(result.atoms).toHaveLength(3);
      expect(result.atoms[1].branchDepth).toBe(1);
      expect(result.atoms[1].parentIndex).toBe(0);
      expect(result.atoms[2].afterBranchClose).toBe(true);
    });

    it('should throw error for unclosed rings', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.RING_MARKER, ringNumber: 1 },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
      ];

      expect(() => buildAtomList(tokens)).toThrow('Unclosed rings: 1');
    });

    it('should handle multiple unclosed rings', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.RING_MARKER, ringNumber: 1 },
        { type: TokenType.RING_MARKER, ringNumber: 2 },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
      ];

      expect(() => buildAtomList(tokens)).toThrow(/Unclosed rings: (1, 2|2, 1)/);
    });

    it('should handle nested branches', () => {
      const tokens = [
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.BRANCH_OPEN },
        { type: TokenType.ATOM, atom: 'C', value: 'C' },
        { type: TokenType.BRANCH_OPEN },
        { type: TokenType.ATOM, atom: 'N', value: 'N' },
        { type: TokenType.BRANCH_CLOSE },
        { type: TokenType.BRANCH_CLOSE },
      ];

      const result = buildAtomList(tokens);

      expect(result.atoms[2].branchDepth).toBe(2);
      expect(result.atoms[2].parentIndex).toBe(1);
    });
  });
});
