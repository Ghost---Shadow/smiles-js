/**
 * Unit tests for interleaved-fused-ring.js
 */

import { describe, it, expect } from 'bun:test';
import { buildInterleavedFusedRingSMILES } from './interleaved-fused-ring.js';
import { parse } from '../parser/index.js';
import { buildSMILES } from './smiles-codegen-core.js';

describe('Interleaved Fused Ring Builder', () => {
  describe('buildInterleavedFusedRingSMILES', () => {
    it('should build simple two-ring fused structure', () => {
      const ring1 = {
        ringNumber: 1,
        size: 6,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2, 3, 4, 5],
        metaStart: 0,
        metaEnd: 5,
      };
      const ring2 = {
        ringNumber: 2,
        size: 6,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [2, 3, 6, 7, 8, 9],
        metaStart: 2,
        metaEnd: 9,
      };
      const fusedRing = {
        rings: [ring1, ring2],
        metaAllPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        metaBranchDepthMap: new Map([
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
          [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
        ]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('1');
      expect(result).toContain('2');
    });

    it('should normalize branch depths', () => {
      const ring1 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2],
        metaBranchDepthMap: new Map([[0, 5], [1, 6], [2, 5]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('(');
      expect(result).toContain(')');
    });

    it('should handle ring with substitutions', () => {
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: { 2: 'N' },
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('should handle ring with bonds', () => {
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: ['=', '', ''],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('=');
    });

    it('should handle ring with closure bond', () => {
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: ['', '', '='],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('=');
      expect(result).toContain('1');
    });

    it('should avoid duplicate attachments for shared positions', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 2: [attachmentNode] },
        bonds: [],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const ring2 = {
        ringNumber: 2,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 1: [attachmentNode] },
        bonds: [],
        metaPositions: [1, 2, 4, 5],
        metaStart: 1,
        metaEnd: 5,
      };
      const fusedRing = {
        rings: [ring1, ring2],
        metaAllPositions: [0, 1, 2, 3, 4, 5],
        metaBranchDepthMap: new Map([
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        ]),
      };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      const oCount = (result.match(/O/g) || []).length;
      expect(oCount).toBe(1);
    });

    it('should handle sequential continuation rings', () => {
      const ring1 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const seqRing = {
        ringNumber: 2,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [3, 4, 5],
        metaStart: 3,
        metaEnd: 5,
      };
      const fusedRing = {
        rings: [ring1],
        metaSequentialRings: [seqRing],
        metaAllPositions: [0, 1, 2, 3, 4, 5],
        metaBranchDepthMap: new Map([
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        ]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('1');
      expect(result).toContain('2');
    });

    it('should handle sequential continuation atoms', () => {
      const ring1 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
        metaAtomValueMap: new Map([[3, 'N']]),
        metaSeqAtomAttachments: new Map(),
        metaBondMap: new Map(),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('N');
    });

    it('should sort ring markers correctly', () => {
      const ring1 = {
        ringNumber: 2,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const ring2 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1, ring2],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
        metaRingOrderMap: new Map([[0, [2, 1]]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      const firstRingMarker = result.indexOf('2');
      const secondRingMarker = result.indexOf('1');
      expect(firstRingMarker).toBeLessThan(secondRingMarker);
    });

    it('should handle inline branches with pending attachments', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 1: [attachmentNode] },
        bonds: [],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 1], [2, 1], [3, 0]]),
      };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result.indexOf('O')).toBeGreaterThan(result.indexOf(')'));
    });

    it('should handle inline vs sibling attachments', () => {
      const inlineNode = { type: 'Linear', atoms: ['O'], metaIsSibling: false };
      const siblingNode = { type: 'Linear', atoms: ['N'], metaIsSibling: true };
      const ring1 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: { 1: [inlineNode, siblingNode] },
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0]]),
      };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('O');
      expect(result).toContain('(N)');
      expect(result).not.toContain('(O)');
    });

    it('should handle sequential atom with bond', () => {
      const ring1 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
        metaAtomValueMap: new Map([[3, 'N']]),
        metaSeqAtomAttachments: new Map(),
        metaBondMap: new Map([[3, '=']]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('=');
      expect(result).toContain('N');
    });

    it('should handle ring markers with same type using fallback ordering', () => {
      const ring1 = {
        ringNumber: 3,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const ring2 = {
        ringNumber: 2,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1, ring2],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should handle different marker types prioritizing opens', () => {
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const ring2 = {
        ringNumber: 2,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [1, 2, 4, 5],
        metaStart: 1,
        metaEnd: 5,
      };
      const fusedRing = {
        rings: [ring1, ring2],
        metaAllPositions: [0, 1, 2, 3, 4, 5],
        metaBranchDepthMap: new Map([
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
        ]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('1');
      expect(result).toContain('2');
    });

    it('should handle closure bond with ring opening', () => {
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: ['', '', '#'],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('#');
    });

    it('should close remaining branches with pending inline attachments', () => {
      const inlineNode = { type: 'Linear', atoms: ['O'], metaIsSibling: false };
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 1: [inlineNode] },
        bonds: [],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 1], [2, 1], [3, 1]]),
      };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('O');
    });

    it('should close remaining branches with pending sibling attachments', () => {
      const siblingNode = { type: 'Linear', atoms: ['N'], metaIsSibling: true };
      const ring1 = {
        ringNumber: 1,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 1: [siblingNode] },
        bonds: [],
        metaPositions: [0, 1, 2, 3],
        metaStart: 0,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 1], [2, 1], [3, 1]]),
      };
      const mockBuildSMILES = (node) => (node.atoms ? 'N' : 'C');
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('(N)');
    });

    it('should sort close markers after open markers', () => {
      const ring1 = {
        ringNumber: 1,
        size: 5,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2, 3, 4],
        metaStart: 0,
        metaEnd: 4,
      };
      const ring2 = {
        ringNumber: 2,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [1, 2, 5, 6],
        metaStart: 1,
        metaEnd: 6,
      };
      const ring3 = {
        ringNumber: 3,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [2, 3, 7, 8],
        metaStart: 2,
        metaEnd: 8,
      };
      const fusedRing = {
        rings: [ring1, ring2, ring3],
        metaAllPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        metaBranchDepthMap: new Map([
          [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
          [5, 0], [6, 0], [7, 0], [8, 0],
        ]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should handle marker sorting when not in original order', () => {
      const ring1 = {
        ringNumber: 2,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [0, 1, 2],
        metaStart: 0,
        metaEnd: 2,
      };
      const ring2 = {
        ringNumber: 1,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        bonds: [],
        metaPositions: [1, 2, 3],
        metaStart: 1,
        metaEnd: 3,
      };
      const fusedRing = {
        rings: [ring1, ring2],
        metaAllPositions: [0, 1, 2, 3],
        metaBranchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0]]),
      };
      const mockBuildSMILES = () => 'C';
      const result = buildInterleavedFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('1');
      expect(result).toContain('2');
    });
  });
});
