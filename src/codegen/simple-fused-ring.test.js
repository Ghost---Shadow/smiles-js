/**
 * Unit tests for simple-fused-ring.js
 */

import { describe, it, expect } from 'bun:test';
import { buildSimpleFusedRingSMILES } from './simple-fused-ring.js';

describe('Simple Fused Ring Builder', () => {
  describe('buildSimpleFusedRingSMILES', () => {
    it('should build single ring with offset 0', () => {
      const ring = {
        offset: 0,
        size: 6,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('C');
      expect(result).toContain('1');
    });

    it('should sort rings by offset', () => {
      const ring1 = {
        offset: 5,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 2,
        bonds: [],
      };
      const ring2 = {
        offset: 0,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring1, ring2] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      const firstMarker = result.indexOf('1');
      const secondMarker = result.indexOf('2');
      expect(firstMarker).toBeLessThan(secondMarker);
    });

    it('should handle overlapping rings', () => {
      const ring1 = {
        offset: 0,
        size: 6,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 1,
        bonds: [],
      };
      const ring2 = {
        offset: 2,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 2,
        bonds: [],
      };
      const fusedRing = { rings: [ring1, ring2] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('1');
      expect(result).toContain('2');
      const atomCount = (result.match(/C/g) || []).length;
      expect(atomCount).toBeLessThanOrEqual(8);
    });

    it('should handle ring with substitutions', () => {
      const ring = {
        offset: 0,
        size: 5,
        atoms: 'C',
        substitutions: { 2: 'N', 4: 'O' },
        attachments: {},
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('N');
      expect(result).toContain('O');
    });

    it('should handle ring with bonds', () => {
      const ring = {
        offset: 0,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 1,
        bonds: ['=', '', ''],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('=');
    });

    it('should handle ring with closure bond', () => {
      const ring = {
        offset: 0,
        size: 6,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 1,
        bonds: ['', '', '', '', '='],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('=');
      expect(result).toContain('1');
    });

    it('should handle ring with attachments', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring = {
        offset: 0,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 2: [attachmentNode] },
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should handle multiple attachments at same position', () => {
      const attachment1 = { type: 'Linear', atoms: ['O'] };
      const attachment2 = { type: 'Linear', atoms: ['N'] };
      const ring = {
        offset: 0,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: { 1: [attachment1, attachment2] },
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = (node) => {
        if (node.atoms?.[0] === 'O') return 'O';
        if (node.atoms?.[0] === 'N') return 'N';
        return 'C';
      };
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('O');
      expect(result).toContain('N');
    });

    it('should add attachments even if atom was set by another ring', () => {
      const attachmentNode = { type: 'Linear', atoms: ['O'] };
      const ring1 = {
        offset: 0,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: { 3: [attachmentNode] },
        ringNumber: 1,
        bonds: [],
      };
      const ring2 = {
        offset: 2,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 2,
        bonds: [],
      };
      const fusedRing = { rings: [ring1, ring2] };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('O');
    });

    it('should handle inline attachments without parentheses', () => {
      const inlineNode = { type: 'Linear', atoms: ['O'], metaIsSibling: false };
      const ring = {
        offset: 0,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: { 2: [inlineNode] },
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('O');
      expect(result).not.toContain('(O)');
    });

    it('should handle sibling attachments with parentheses', () => {
      const siblingNode = { type: 'Linear', atoms: ['O'], metaIsSibling: true };
      const ring = {
        offset: 0,
        size: 3,
        atoms: 'C',
        substitutions: {},
        attachments: { 2: [siblingNode] },
        ringNumber: 1,
        bonds: [],
      };
      const fusedRing = { rings: [ring] };
      const mockBuildSMILES = (node) => (node.atoms ? 'O' : 'C');
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      expect(result).toContain('(O)');
    });

    it('should place markers at correct positions', () => {
      const ring1 = {
        offset: 0,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 1,
        bonds: [],
      };
      const ring2 = {
        offset: 2,
        size: 4,
        atoms: 'C',
        substitutions: {},
        attachments: {},
        ringNumber: 2,
        bonds: [],
      };
      const fusedRing = { rings: [ring1, ring2] };
      const mockBuildSMILES = () => 'C';
      const result = buildSimpleFusedRingSMILES(fusedRing, mockBuildSMILES);
      const marker1Open = result.indexOf('1');
      const marker1Close = result.lastIndexOf('1');
      const marker2Open = result.indexOf('2');
      const marker2Close = result.lastIndexOf('2');
      expect(marker1Open).not.toBe(marker1Close);
      expect(marker2Open).not.toBe(marker2Close);
      expect(marker1Open).toBeLessThan(marker2Open);
    });
  });
});
