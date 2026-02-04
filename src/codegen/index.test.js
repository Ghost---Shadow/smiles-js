/**
 * Unit tests for codegen/index.js
 */

import { describe, it, expect } from 'bun:test';
import { buildSMILES } from './index.js';
import { Ring, Linear, Molecule } from '../constructors.js';

describe('Codegen Index', () => {
  it('should export buildSMILES function', () => {
    expect(typeof buildSMILES).toBe('function');
  });

  it('should build SMILES for Linear', () => {
    const linear = Linear(['C', 'C', 'C']);
    const smiles = buildSMILES(linear);
    expect(smiles).toBe('CCC');
  });

  it('should build SMILES for Ring', () => {
    const ring = Ring({ atoms: 'c', size: 6 });
    const smiles = buildSMILES(ring);
    expect(smiles).toBe('c1ccccc1');
  });

  it('should build SMILES for Molecule', () => {
    const mol = Molecule([Linear(['C']), Linear(['N'])]);
    const smiles = buildSMILES(mol);
    expect(smiles).toBe('CN');
  });

  it('should build SMILES for FusedRing', () => {
    const ring1 = Ring({ atoms: 'c', size: 6 });
    const ring2 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    const smiles = buildSMILES(fused);
    expect(smiles).toBeTruthy();
  });
});
