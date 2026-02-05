import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const KETOROLAC_SMILES = 'OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3';

describe('Ketorolac - Real Structure', () => {
  test('parses without error', () => {
    expect(() => parse(KETOROLAC_SMILES)).not.toThrow();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(KETOROLAC_SMILES);
    expect(ast.smiles).toBe(KETOROLAC_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(KETOROLAC_SMILES);
    expect(reconstructed.smiles).toBe(KETOROLAC_SMILES);
  });
});

describe('Ketorolac - Component Structures', () => {
  test('simple carboxylic acid parses', () => {
    const ast = parse('OC(=O)C');
    expect(ast.smiles).toBe('OC(=O)C');
  });

  test('simple carboxylic acid codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C');
    expect(reconstructed.smiles).toBe('OC(=O)C');
  });

  test('carboxylic acid attached to ring parses', () => {
    const ast = parse('OC(=O)C1CCCC1');
    expect(ast.smiles).toBe('OC(=O)C1CCCC1');
  });

  test('carboxylic acid attached to ring codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C1CCCC1');
    expect(reconstructed.smiles).toBe('OC(=O)C1CCCC1');
  });

  test('simple fused ring parses', () => {
    const ast = parse('C1CCN2C1CCCC2');
    expect(ast.smiles).toBe('C1CCN2C1CCCC2');
  });

  test('simple fused ring codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2C1CCCC2');
    expect(reconstructed.smiles).toBe('C1CCN2C1CCCC2');
  });

  test('fused ring with double bonds parses', () => {
    const ast = parse('C1CCN2C1=CC=C2');
    expect(ast.smiles).toBe('C1CCN2C1=CC=C2');
  });

  test('fused ring with double bonds codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2C1=CC=C2');
    expect(reconstructed.smiles).toBe('C1CCN2C1=CC=C2');
  });

  test('carbonyl group C(=O)C parses', () => {
    const ast = parse('CC(=O)C');
    expect(ast.smiles).toBe('CC(=O)C');
  });

  test('carbonyl group C(=O)C codegen', () => {
    const reconstructed = codegenRoundTrip('CC(=O)C');
    expect(reconstructed.smiles).toBe('CC(=O)C');
  });

  test('benzene ring parses', () => {
    const ast = parse('C3=CC=CC=C3');
    expect(ast.smiles).toBe('C3=CC=CC=C3');
  });

  test('benzene ring codegen', () => {
    const reconstructed = codegenRoundTrip('C3=CC=CC=C3');
    expect(reconstructed.smiles).toBe('C3=CC=CC=C3');
  });

  test('carbonyl with benzene C(=O)C3=CC=CC=C3 parses', () => {
    const ast = parse('CC(=O)C3=CC=CC=C3');
    expect(ast.smiles).toBe('CC(=O)C3=CC=CC=C3');
  });

  test('carbonyl with benzene C(=O)C3=CC=CC=C3 codegen', () => {
    const reconstructed = codegenRoundTrip('CC(=O)C3=CC=CC=C3');
    expect(reconstructed.smiles).toBe('CC(=O)C3=CC=CC=C3');
  });
});

describe('Ketorolac - Build Up Complexity', () => {
  test('fused ring core (rings 1+2) parses', () => {
    const ast = parse('C1CCN2C1=CC=C2');
    expect(ast.smiles).toBe('C1CCN2C1=CC=C2');
  });

  test('fused ring core (rings 1+2) codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2C1=CC=C2');
    expect(reconstructed.smiles).toBe('C1CCN2C1=CC=C2');
  });

  test('fused ring with carbonyl attachment parses', () => {
    const ast = parse('C1CCN2C1=CC=C2C(=O)C');
    expect(ast.smiles).toBe('C1CCN2C1=CC=C2C(=O)C');
  });

  test('fused ring with carbonyl attachment codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2C1=CC=C2C(=O)C');
    expect(reconstructed.smiles).toBe('C1CCN2C1=CC=C2C(=O)C');
  });

  test('fused ring with carbonyl and benzene parses', () => {
    const ast = parse('C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
    expect(ast.smiles).toBe('C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
  });

  test('fused ring with carbonyl and benzene codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
    expect(reconstructed.smiles).toBe('C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
  });

  test('carboxylic acid + fused ring parses', () => {
    const ast = parse('OC(=O)C1CCN2C1=CC=C2');
    expect(ast.smiles).toBe('OC(=O)C1CCN2C1=CC=C2');
  });

  test('carboxylic acid + fused ring codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C1CCN2C1=CC=C2');
    expect(reconstructed.smiles).toBe('OC(=O)C1CCN2C1=CC=C2');
  });

  test('carboxylic acid + fused ring + carbonyl parses', () => {
    const ast = parse('OC(=O)C1CCN2C1=CC=C2C(=O)C');
    expect(ast.smiles).toBe('OC(=O)C1CCN2C1=CC=C2C(=O)C');
  });

  test('carboxylic acid + fused ring + carbonyl codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C1CCN2C1=CC=C2C(=O)C');
    expect(reconstructed.smiles).toBe('OC(=O)C1CCN2C1=CC=C2C(=O)C');
  });

  test('full ketorolac parses', () => {
    const ast = parse('OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
    expect(ast.smiles).toBe('OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
  });

  test('full ketorolac codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
    expect(reconstructed.smiles).toBe('OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3');
  });
});

describe('Ketorolac - Edge Cases', () => {
  test('fused ring with attachment at different positions parses', () => {
    const ast = parse('CC1CCN2C1=CC=C2C');
    expect(ast.smiles).toBe('CC1CCN2C1=CC=C2C');
  });

  test('fused ring with attachment at different positions codegen', () => {
    const reconstructed = codegenRoundTrip('CC1CCN2C1=CC=C2C');
    expect(reconstructed.smiles).toBe('CC1CCN2C1=CC=C2C');
  });

  test('ring with carbonyl in branch parses', () => {
    const ast = parse('C1CCCC1C(=O)C');
    expect(ast.smiles).toBe('C1CCCC1C(=O)C');
  });

  test('ring with carbonyl in branch codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCCC1C(=O)C');
    expect(reconstructed.smiles).toBe('C1CCCC1C(=O)C');
  });

  test('ring closure after carbonyl parses', () => {
    const ast = parse('C1CC(C(=O)C)N2C1=CC=C2');
    expect(ast.smiles).toBe('C1CC(C(=O)C)N2C1=CC=C2');
  });

  test('ring closure after carbonyl codegen', () => {
    const reconstructed = codegenRoundTrip('C1CC(C(=O)C)N2C1=CC=C2');
    expect(reconstructed.smiles).toBe('C1CC(C(=O)C)N2C1=CC=C2');
  });

  test('multiple carbonyl groups parses', () => {
    const ast = parse('C(=O)C1CCN2C1=CC=C2C(=O)C');
    expect(ast.smiles).toBe('C(=O)C1CCN2C1=CC=C2C(=O)C');
  });

  test('multiple carbonyl groups codegen', () => {
    const reconstructed = codegenRoundTrip('C(=O)C1CCN2C1=CC=C2C(=O)C');
    expect(reconstructed.smiles).toBe('C(=O)C1CCN2C1=CC=C2C(=O)C');
  });
});

describe('Ketorolac - Isolated Problem Areas', () => {
  test('OC(=O)C prefix parses', () => {
    const ast = parse('OC(=O)C');
    expect(ast.smiles).toBe('OC(=O)C');
  });

  test('OC(=O)C prefix codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C');
    expect(reconstructed.smiles).toBe('OC(=O)C');
  });

  test('ring with OC(=O)C prefix parses', () => {
    const ast = parse('OC(=O)C1CCCCC1');
    expect(ast.smiles).toBe('OC(=O)C1CCCCC1');
  });

  test('ring with OC(=O)C prefix codegen', () => {
    const reconstructed = codegenRoundTrip('OC(=O)C1CCCCC1');
    expect(reconstructed.smiles).toBe('OC(=O)C1CCCCC1');
  });

  test('C(=O)C suffix parses', () => {
    const ast = parse('CC(=O)C');
    expect(ast.smiles).toBe('CC(=O)C');
  });

  test('C(=O)C suffix codegen', () => {
    const reconstructed = codegenRoundTrip('CC(=O)C');
    expect(reconstructed.smiles).toBe('CC(=O)C');
  });

  test('ring with C(=O)C suffix parses', () => {
    const ast = parse('C1CCCCC1C(=O)C');
    expect(ast.smiles).toBe('C1CCCCC1C(=O)C');
  });

  test('ring with C(=O)C suffix codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCCCC1C(=O)C');
    expect(reconstructed.smiles).toBe('C1CCCCC1C(=O)C');
  });

  test('fused ring 1+2 isolation parses', () => {
    const ast = parse('C1CCN2CCCC2C1');
    expect(ast.smiles).toBe('C1CCN2CCCC2C1');
  });

  test('fused ring 1+2 isolation codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2CCCC2C1');
    expect(reconstructed.smiles).toBe('C1CCN2CCCC2C1');
  });

  test('fused ring with = bonds parses', () => {
    const ast = parse('C1=CN2C=CC=C2C1');
    expect(ast.smiles).toBe('C1=CN2C=CC=C2C1');
  });

  test('fused ring with = bonds codegen', () => {
    const reconstructed = codegenRoundTrip('C1=CN2C=CC=C2C1');
    expect(reconstructed.smiles).toBe('C1=CN2C=CC=C2C1');
  });

  test('ring 3 in branch of fused ring parses', () => {
    const ast = parse('C1CCN2C1=CC=C2C3=CC=CC=C3');
    expect(ast.smiles).toBe('C1CCN2C1=CC=C2C3=CC=CC=C3');
  });

  test('ring 3 in branch of fused ring codegen', () => {
    const reconstructed = codegenRoundTrip('C1CCN2C1=CC=C2C3=CC=CC=C3');
    expect(reconstructed.smiles).toBe('C1CCN2C1=CC=C2C3=CC=CC=C3');
  });
});
