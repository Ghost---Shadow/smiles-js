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
        bonds: ['', '', '', '', '', '='],
        metaBranchDepths: [0, 0, 0, 0, 0, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('=');
      expect(result).toContain('1');
    });

    it('should handle pending attachments at depth 0 after branch close', () => {
      const attachment = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment] },
        bonds: [],
        metaBranchDepths: [0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('O');
    });

    it('should handle non-sibling pending attachments at depth 0', () => {
      const attachment = { type: 'Linear', atoms: ['O'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment] },
        bonds: [],
        metaBranchDepths: [0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('O');
      expect(result).not.toContain('(O)');
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

    it('should handle delayed non-sibling attachments in branches', () => {
      const inlineNode = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: { 2: [inlineNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('should handle delayed sibling attachments after branch closes', () => {
      const siblingNode = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: { 2: [siblingNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should handle remaining branches closure with non-siblings', () => {
      const inlineNode = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 2: [inlineNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('should handle remaining branches closure with siblings', () => {
      const siblingNode = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 2: [siblingNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should handle depth 0 remaining attachments with siblings', () => {
      const siblingNode = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [siblingNode] },
        bonds: [],
        metaBranchDepths: [0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should handle depth 0 remaining attachments with non-siblings', () => {
      const inlineNode = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [inlineNode] },
        bonds: [],
        metaBranchDepths: [0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('should infer metaIsSibling as false when undefined and inline branch follows', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: { 2: [attachmentNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('O');
    });

    it('should preserve metaIsSibling when already set', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: { 2: [attachmentNode] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should handle closure bond at first position', () => {
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 2,
        substitutions: {},
        attachments: {},
        bonds: ['', '', '', '#'],
        metaBranchDepths: [0, 1, 1, 1, 0],
      };
      const mockBuildSMILES = () => 'C';
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('#');
      expect(result).toContain('2');
    });

    it('should output remaining depth 0 sibling attachments after all branches close', () => {
      const attachment1 = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 7,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment1] },
        bonds: [],
        metaBranchDepths: [0, 1, 2, 3, 2, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should output remaining depth 0 non-sibling attachments after all branches close', () => {
      const attachment1 = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 7,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment1] },
        bonds: [],
        metaBranchDepths: [0, 1, 2, 3, 2, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('should handle flat depth with delayed sibling attachments', () => {
      const attachment = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should handle flat depth with delayed non-sibling attachments', () => {
      const attachment = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 4,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment] },
        bonds: [],
        metaBranchDepths: [0, 0, 1, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('covers lines 208-220 with pending attachments at depth 0 after full branch closure', () => {
      const attachment1 = { type: 'Linear', atoms: ['O'] };
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment1] },
        bonds: [],
        metaBranchDepths: [0, 2, 3, 2, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('O');
    });

    it('covers lines 208-220 final non-sibling output', () => {
      const attachment1 = { type: 'Linear', atoms: ['N'], metaIsSibling: false };
      const ring = {
        atoms: 'C',
        size: 5,
        ringNumber: 1,
        substitutions: {},
        attachments: { 1: [attachment1] },
        bonds: [],
        metaBranchDepths: [0, 2, 3, 2, 0],
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildBranchCrossingRingSMILES(ring, mockBuildSMILES);
      expect(result).toContain('N');
      expect(result).not.toContain('(N)');
    });
  });
});
