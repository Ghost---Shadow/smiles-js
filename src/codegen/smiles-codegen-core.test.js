/**
 * Unit tests for smiles-codegen-core.js
 */

import { describe, it, expect } from 'bun:test';
import {
  buildSMILES,
  buildMoleculeSMILES,
  buildLinearSMILES,
  buildRingSMILES,
  buildFusedRingSMILES,
} from './smiles-codegen-core.js';
import {
  Ring, Linear, Molecule,
} from '../constructors.js';

describe('SMILES Codegen Core', () => {
  describe('buildLinearSMILES', () => {
    it('should handle single-atom branch with explicit bond', () => {
      const branch = Linear(['N'], ['=']);
      const smiles = buildLinearSMILES(branch);
      expect(smiles).toBe('=N');
    });

    it('should handle linear with bonds between atoms', () => {
      const chain = Linear(['C', 'C', 'C'], ['=', '#']);
      const smiles = buildLinearSMILES(chain);
      expect(smiles).toBe('C=C#C');
    });

    it('should handle linear with attachments', () => {
      const chain = Linear(['C', 'C']);
      const branch = Linear(['N']);
      chain.attachments = { 1: [branch] };
      const smiles = buildLinearSMILES(chain);
      expect(smiles).toBe('C(N)C');
    });
  });

  describe('buildRingSMILES', () => {
    it('should handle ring with closure bond', () => {
      const ring = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, null, null, '='] });
      const smiles = buildRingSMILES(ring);
      expect(smiles).toContain('=1');
    });

    it('should handle ring without closure bond', () => {
      const ring = Ring({ atoms: 'C', size: 6 });
      const smiles = buildRingSMILES(ring);
      expect(smiles).not.toContain('=1');
    });

    it('should handle ring with sequential rings metadata', () => {
      const ring = Ring({ atoms: 'C', size: 6 });
      const seqRing = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
      ring.metaSequentialRings = [seqRing];
      ring.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      ring.metaBranchDepthMap = new Map();
      ring.metaAtomValueMap = new Map();
      ring.metaBondMap = new Map();
      ring.metaSeqAtomAttachments = new Map();
      ring.metaRingOrderMap = new Map();
      const smiles = buildRingSMILES(ring);
      expect(smiles).toBeTruthy();
    });

    it('should handle ring with branchDepths crossing branches', () => {
      const ring = Ring({ atoms: 'C', size: 6 });
      ring.metaBranchDepths = [0, 0, 0, 1, 1, 1];
      const smiles = buildRingSMILES(ring);
      expect(smiles).toBeTruthy();
    });
  });

  describe('buildFusedRingSMILES', () => {
    it('should handle fused ring with position data', () => {
      const ring1 = Ring({ atoms: 'C', size: 6 });
      const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
      ring1.metaPositions = [0, 1, 2, 3, 4, 5];
      const fused = ring1.fuse(1, ring2);
      fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const smiles = buildFusedRingSMILES(fused);
      expect(smiles).toBeTruthy();
    });

    it('should fall back to simple approach without position data', () => {
      const ring1 = Ring({ atoms: 'C', size: 6 });
      const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
      const fused = ring1.fuse(1, ring2);
      const smiles = buildFusedRingSMILES(fused);
      expect(smiles).toBeTruthy();
    });
  });

  describe('buildMoleculeSMILES', () => {
    it('should handle component with leadingBond', () => {
      const comp1 = Linear(['C', 'C']);
      const comp2 = Linear(['N', 'N']);
      comp2.metaLeadingBond = '=';
      const mol = Molecule([comp1, comp2]);
      const smiles = buildMoleculeSMILES(mol);
      expect(smiles).toContain('=');
    });

    it('should handle component without leadingBond', () => {
      const comp1 = Linear(['C', 'C']);
      const comp2 = Linear(['N', 'N']);
      const mol = Molecule([comp1, comp2]);
      const smiles = buildMoleculeSMILES(mol);
      expect(smiles).toBe('CCNN');
    });
  });

  describe('buildSMILES', () => {
    it('should throw error for unknown node type', () => {
      const unknownNode = { type: 'UnknownType' };
      expect(() => buildSMILES(unknownNode)).toThrow('Unknown AST node type');
    });

    it('should handle null node', () => {
      expect(() => buildSMILES(null)).toThrow('Unknown AST node type');
    });

    it('should dispatch to correct handler for Molecule', () => {
      const mol = Molecule([Linear(['C'])]);
      const smiles = buildSMILES(mol);
      expect(smiles).toBe('C');
    });

    it('should dispatch to correct handler for FusedRing', () => {
      const ring1 = Ring({ atoms: 'C', size: 6 });
      const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
      const fused = ring1.fuse(1, ring2);
      const smiles = buildSMILES(fused);
      expect(smiles).toBeTruthy();
    });

    it('should dispatch to correct handler for Ring', () => {
      const ring = Ring({ atoms: 'C', size: 6 });
      const smiles = buildSMILES(ring);
      expect(smiles).toBeTruthy();
    });

    it('should dispatch to correct handler for Linear', () => {
      const linear = Linear(['C', 'C', 'C']);
      const smiles = buildSMILES(linear);
      expect(smiles).toBe('CCC');
    });
  });
});
