/**
 * Unit tests for branch-crossing-ring.js
 */

import { describe, it, expect } from 'bun:test';
import { buildBranchCrossingRingSMILES } from './branch-crossing-ring.js';

describe('Branch Crossing Ring Builder', () => {
  describe('buildBranchCrossingRingSMILES', () => {
    it('should build simple branch-crossing ring', () => {
      const ring = {
        atoms: 'C',
        size: 6,
        ringNumber: 1,
        substitutions: {},
        attachments: {},
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1, 1, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('1');
    });

    it('should normalize branch depths to start from 0', () => {
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 2,
        substitutions: {},
        attachments: {},
        bonds: [],
        metaBranchDepths: [5, 5, 6, 5],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(');
      expect(result).toContain(')');
    });

    it('should handle ring with substitutions', () => {
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: { 2: 'N' },
        attachments: {},
        bonds: [],
        metaBranchDepths: [0, 0, 0, 0, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
      expect(result).toContain('C');
    });

    it('should handle ring with bonds', () => {
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: {},
        bonds: ['=', '', ''],
        metaBranchDepths: [0, 0, 0, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('=');
    });

    it('should handle ring with closure bond', () => {
      const ring = {
        atoms: 'C',
        size: 6,
        ringNumber: 1,
        substitutions: {},
        attachments: {},
        bonds: ['', '', '', '', '='],
        metaBranchDepths: [0, 0, 0, 0, 0, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('=');
      expect(result).toContain('1');
    });

    it('should handle attachments without inline branches', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring = {
        atoms: 'C',
        size: 3,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachmentNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 0],
      };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should delay attachments when inline branch follows', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachmentNode] },
        bonds: [],
        metaBranchDepths: [0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      // Attachment should exist and be after branch opens
      expect(result).toContain('O');
      expect(result).toContain('(');
    });

    it('should handle multiple depth levels', () => {
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: {},
        bonds: [],
        metaBranchDepths: [0, 1, 2, 1, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      const openCount = (result.match(/\(/g) || []).length;
      const closeCount = (result.match(/\)/g) || []).length;
      expect(openCount).toBe(closeCount);
      expect(openCount).toBe(2);
    });

    it('should handle sibling vs non-sibling attachments', () => {
      const siblingNode = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const inlineNode = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 3,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [siblingNode, inlineNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
      expect(result).toContain('N');
      expect(result).not.toContain('(N)');
    });
  });
});
