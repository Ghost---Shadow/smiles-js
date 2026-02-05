import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { buildSMILES } from '../src/codegen/index.js';
import { codegenRoundTrip } from './utils.js';

const THC_SMILES = 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O';

describe('THC - SMILES Functionality', () => {
  test('full THC structure parses correctly', () => {
    const ast = parse(THC_SMILES);
    expect(ast.smiles).toBe(THC_SMILES);
  });

  test('full THC structure codegen works', () => {
    const ast = parse(THC_SMILES);
    const smiles = buildSMILES(ast);
    expect(smiles).toBe(THC_SMILES);
  });

  test('THC core structure', () => {
    const smiles = 'C1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O';
    const ast = parse(smiles);
    expect(buildSMILES(ast)).toBe(smiles);
  });

  test('THC variants - different methylation', () => {
    const variants = [
      'C1=CC(=C2C3CCCC3C(OC2=C1))O', // No methyl groups
      'C1=CC(=C2C3CCCC3C(OC2=C1)(C))O', // One methyl
      'C1=CC(=C2C3CCCC3C(OC2=C1)(C)C)O', // Two methyls, no double bond
      'C1=CC(=C2C3C=CCCC3C(OC2=C1)(C)C)O', // Double bond, no methyl on ring3
    ];

    variants.forEach((smiles) => {
      const ast = parse(smiles);
      expect(buildSMILES(ast)).toBe(smiles);
    });
  });
});

describe('THC - Component Building Blocks', () => {
  test('simple rings', () => {
    const patterns = [
      'C1CCCCC1', // 6-membered ring
      'C1CCCOC1', // Pyran ring
      'c1ccccc1', // Aromatic ring
    ];

    patterns.forEach((smiles) => {
      const ast = parse(smiles);
      expect(ast.smiles).toBe(smiles);
      expect(buildSMILES(ast)).toBe(smiles);
    });
  });

  test('rings with branches', () => {
    const patterns = [
      'C1CCCC(C)C1', // Simple branch
      'C1CCCC(C)(C)C1', // Quaternary carbon
      'C1CCCC(C=C)C1', // Branch with double bond
      'C1CCCC(C=C(C))C1', // Branch with substituted double bond
    ];

    patterns.forEach((smiles) => {
      const ast = parse(smiles);
      expect(buildSMILES(ast)).toBe(smiles);
    });
  });

  test('rings with oxygen bridges', () => {
    const patterns = [
      'C1CCCC(OC)C1', // Oxygen in branch
      'C1CCCC(OC1)C', // Oxygen bridge to ring closure
      'C1CCCC(OC1)(C)C', // Oxygen bridge with quaternary carbon
    ];

    patterns.forEach((smiles) => {
      const ast = parse(smiles);
      expect(buildSMILES(ast)).toBe(smiles);
    });
  });

  test('simple fused rings', () => {
    const patterns = [
      'C1=CC2CCCCC2C1', // Basic fusion
      'C1=CC2CCCCC2(C)C1', // Fused with branch
      'C1=CC2CCCCC2(C)(C)C1', // Fused with quaternary
    ];

    patterns.forEach((smiles) => {
      const ast = parse(smiles);
      expect(buildSMILES(ast)).toBe(smiles);
    });
  });
});

describe('THC - Interleaved Fused Rings (SMILES works, toCode() has limitation)', () => {
  // These test the CORE functionality: parsing and SMILES generation
  // Note: codegenRoundTrip (which uses toCode()) doesn't work for these patterns
  // This is a known limitation in the decompiler, NOT a bug in SMILES functionality

  test('ring3 interleaved into ring2 with oxygen bridge', () => {
    const smiles = 'C2C3CCCC3C(OC2)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    expect(buildSMILES(ast)).toBe(smiles);
  });

  test('interleaved with quaternary carbon', () => {
    const smiles = 'C2C3CCCC(OC2)(C)C3';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    expect(buildSMILES(ast)).toBe(smiles);
  });

  test('THC core minimal (interleaved pattern)', () => {
    const smiles = 'C1=CC(=C2C3CCCC3C(OC2=C1))O';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    expect(buildSMILES(ast)).toBe(smiles);
  });

  test('THC core with methyls (interleaved pattern)', () => {
    const smiles = 'C1=CC(=C2C3CCCC3C(OC2=C1)(C)C)O';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
    expect(buildSMILES(ast)).toBe(smiles);
  });
});

describe('THC - toCode() Round-trips (where supported)', () => {
  // These test toCode() functionality for patterns it supports
  // Interleaved fused rings are not yet supported by toCode()

  test('simple structures work with toCode()', () => {
    const patterns = [
      'C1CCCCC1',
      'C1CCCC(C)C1',
      'C1CCCC(C=C)C1',
      'C1CCCC(C)(C)C1',
      'C1CCCC(OC1)C',
      'C1CCCC(OC1)(C)C',
    ];

    patterns.forEach((smiles) => {
      const reconstructed = codegenRoundTrip(smiles);
      expect(reconstructed.smiles).toBe(smiles);
    });
  });

  test('simple fused rings work with toCode()', () => {
    const patterns = [
      'C1=CC2CCCCC2C1',
      'C1=CC2CCCCC2(C)C1',
      'C1=CC2CCCCC2(C)(C)C1',
    ];

    patterns.forEach((smiles) => {
      const reconstructed = codegenRoundTrip(smiles);
      expect(reconstructed.smiles).toBe(smiles);
    });
  });
});

describe('THC - toCode() Round-trips (interleaved patterns)', () => {
  test('interleaved 2-ring fused rings work with toCode()', () => {
    const patterns = [
      'C2C3CCCC3C(OC2)C',
      'C2C3CCCC(OC2)(C)C3',
    ];

    patterns.forEach((smiles) => {
      const reconstructed = codegenRoundTrip(smiles);
      expect(reconstructed.smiles).toBe(smiles);
    });
  });

  test('interleaved 3-ring fused rings work with toCode()', () => {
    const patterns = [
      'C1=CC(=C2C3CCCC3C(OC2=C1))O',
      'C1=CC(=C2C3CCCC3C(OC2=C1)(C)C)O',
      'C1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O',
      'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O',
    ];

    patterns.forEach((smiles) => {
      const reconstructed = codegenRoundTrip(smiles);
      expect(reconstructed.smiles).toBe(smiles);
    });
  });
});

describe('THC - Known Issues', () => {
  test('parser loses double bond before ring in branch', () => {
    // Pattern: C(=C2C(C)C2) - double bond before ring in branch
    const ast = parse('C(=C2C(C)C2)');
    expect(ast.smiles).toBe('C(=C2C(C)C2)');
  });
});

describe('THC - Summary', () => {
  test('THC structure is fully supported', () => {
    // Parse THC
    const ast = parse(THC_SMILES);
    expect(ast).toBeTruthy();
    expect(ast.type).toBe('molecule');

    // Generate SMILES from AST
    const generated = buildSMILES(ast);
    expect(generated).toBe(THC_SMILES);

    // Parse generated SMILES
    const reparsed = parse(generated);
    expect(reparsed.smiles).toBe(THC_SMILES);

    // Full round-trip works
    expect(buildSMILES(reparsed)).toBe(THC_SMILES);
  });
});
