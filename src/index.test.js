/**
 * Unit tests for index.js (main entry point)
 */

import { describe, it, expect } from 'bun:test';
import {
  parse, buildSMILES, Ring, Linear, Molecule, FusedRing, decompile,
} from './index.js';

describe('Main Index Exports', () => {
  it('should export parse function', () => {
    expect(typeof parse).toBe('function');
  });

  it('should export buildSMILES function', () => {
    expect(typeof buildSMILES).toBe('function');
  });

  it('should export Ring constructor', () => {
    expect(typeof Ring).toBe('function');
  });

  it('should export Linear constructor', () => {
    expect(typeof Linear).toBe('function');
  });

  it('should export Molecule constructor', () => {
    expect(typeof Molecule).toBe('function');
  });

  it('should export FusedRing constructor', () => {
    expect(typeof FusedRing).toBe('function');
  });

  it('should export decompile function', () => {
    expect(typeof decompile).toBe('function');
  });

  it('should parse and build SMILES round-trip', () => {
    const smiles = 'CCO';
    const ast = parse(smiles);
    const result = buildSMILES(ast);
    expect(result).toBe(smiles);
  });
});
