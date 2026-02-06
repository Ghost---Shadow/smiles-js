import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const ETODOLAC_SMILES = 'CCC1=CC2=C(C=C1CC(=O)O)NC3=C2CCOC3(CC)CC';

describe('Etodolac - Real Structure', () => {
  test('parses without error', () => {
    expect(() => parse(ETODOLAC_SMILES)).not.toThrow();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(ETODOLAC_SMILES);
    expect(ast.smiles).toBe(ETODOLAC_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(ETODOLAC_SMILES);
    expect(reconstructed.smiles).toBe(ETODOLAC_SMILES);
  });
});

describe('Etodolac - Component Structures', () => {
  // Level 1: Simple fused ring
  test('AST: simple fused ring C1=CC2=CCCCC2=C1', () => {
    expect(parse('C1=CC2=CCCCC2=C1').smiles).toBe('C1=CC2=CCCCC2=C1');
  });
  test('codegen: simple fused ring C1=CC2=CCCCC2=C1', () => {
    expect(codegenRoundTrip('C1=CC2=CCCCC2=C1').smiles).toBe('C1=CC2=CCCCC2=C1');
  });

  // Level 2: Carboxylic acid
  test('AST: acetic acid CC(=O)O', () => {
    expect(parse('CC(=O)O').smiles).toBe('CC(=O)O');
  });
  test('codegen: acetic acid CC(=O)O', () => {
    expect(codegenRoundTrip('CC(=O)O').smiles).toBe('CC(=O)O');
  });

  // Level 3: Ethyl group on ring
  test('AST: ethylbenzene CCC1=CC=CC=C1', () => {
    expect(parse('CCC1=CC=CC=C1').smiles).toBe('CCC1=CC=CC=C1');
  });
  test('codegen: ethylbenzene CCC1=CC=CC=C1', () => {
    expect(codegenRoundTrip('CCC1=CC=CC=C1').smiles).toBe('CCC1=CC=CC=C1');
  });

  // Level 4: Indole-like NH fused ring
  test('AST: indole C1=CC2=CC=CC=C2N1', () => {
    expect(parse('C1=CC2=CC=CC=C2N1').smiles).toBe('C1=CC2=CC=CC=C2N1');
  });
  test('codegen: indole C1=CC2=CC=CC=C2N1', () => {
    expect(codegenRoundTrip('C1=CC2=CC=CC=C2N1').smiles).toBe('C1=CC2=CC=CC=C2N1');
  });

  // Level 5: Tetrahydropyran ring (CCOC with ring)
  test('AST: tetrahydropyran C1CCOC1', () => {
    expect(parse('C1CCOC1').smiles).toBe('C1CCOC1');
  });
  test('codegen: tetrahydropyran C1CCOC1', () => {
    expect(codegenRoundTrip('C1CCOC1').smiles).toBe('C1CCOC1');
  });

  // Level 6: Gem-diethyl
  test('AST: gem-diethyl C(CC)(CC)C', () => {
    expect(parse('C(CC)(CC)C').smiles).toBe('C(CC)(CC)C');
  });
  test('codegen: gem-diethyl C(CC)(CC)C', () => {
    expect(codegenRoundTrip('C(CC)(CC)C').smiles).toBe('C(CC)(CC)C');
  });
});

describe('Etodolac - Indole Core', () => {
  // Level 1: Basic indole with sequential ring attachment
  test('AST: C1=CC2=C(C=C1)NC3=C2CCC3', () => {
    expect(parse('C1=CC2=C(C=C1)NC3=C2CCC3').smiles).toBe('C1=CC2=C(C=C1)NC3=C2CCC3');
  });
  test('codegen: C1=CC2=C(C=C1)NC3=C2CCC3', () => {
    expect(codegenRoundTrip('C1=CC2=C(C=C1)NC3=C2CCC3').smiles).toBe('C1=CC2=C(C=C1)NC3=C2CCC3');
  });

  // Level 2: Indole fused with pyran ring
  test('AST: C1=CC2=C(C=C1)NC3=C2CCOC3', () => {
    expect(parse('C1=CC2=C(C=C1)NC3=C2CCOC3').smiles).toBe('C1=CC2=C(C=C1)NC3=C2CCOC3');
  });
  test('codegen: C1=CC2=C(C=C1)NC3=C2CCOC3', () => {
    expect(codegenRoundTrip('C1=CC2=C(C=C1)NC3=C2CCOC3').smiles).toBe('C1=CC2=C(C=C1)NC3=C2CCOC3');
  });

  // Level 3: Pyran ring with gem-diethyl
  test('AST: C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC', () => {
    expect(parse('C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC').smiles).toBe('C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC');
  });
  test('codegen: C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC', () => {
    expect(codegenRoundTrip('C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC').smiles).toBe('C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC');
  });
});

describe('Etodolac - Sequential Atom Attachments', () => {
  // The key issue: seq atom attachments (branches on non-ring atoms)
  // In etodolac: CC(=O)O on the sequential atom chain

  // Level 1: Simple chain with branch
  test('AST: CC(=O)O', () => {
    expect(parse('CC(=O)O').smiles).toBe('CC(=O)O');
  });
  test('codegen: CC(=O)O', () => {
    expect(codegenRoundTrip('CC(=O)O').smiles).toBe('CC(=O)O');
  });

  // Level 2: Ring with trailing CC(=O)O
  test('AST: C1=CC=CC=C1CC(=O)O', () => {
    expect(parse('C1=CC=CC=C1CC(=O)O').smiles).toBe('C1=CC=CC=C1CC(=O)O');
  });
  test('codegen: C1=CC=CC=C1CC(=O)O', () => {
    expect(codegenRoundTrip('C1=CC=CC=C1CC(=O)O').smiles).toBe('C1=CC=CC=C1CC(=O)O');
  });

  // Level 3: Ring with branch closure + seq atom CC(=O)O
  test('AST: C1=CC2=C(C=C1CC(=O)O)C=C2', () => {
    expect(parse('C1=CC2=C(C=C1CC(=O)O)C=C2').smiles).toBe('C1=CC2=C(C=C1CC(=O)O)C=C2');
  });
  test('codegen: C1=CC2=C(C=C1CC(=O)O)C=C2', () => {
    expect(codegenRoundTrip('C1=CC2=C(C=C1CC(=O)O)C=C2').smiles).toBe('C1=CC2=C(C=C1CC(=O)O)C=C2');
  });
});

describe('Etodolac - Full Assembly (Divide and Conquer)', () => {
  // Step 1: Bare fused ring (rings 1+2 without substituents)
  test('AST: C1=CC2=C(C=C1)NC3=C2CCOC3', () => {
    const s = 'C1=CC2=C(C=C1)NC3=C2CCOC3';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: C1=CC2=C(C=C1)NC3=C2CCOC3', () => {
    const s = 'C1=CC2=C(C=C1)NC3=C2CCOC3';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 2: Add gem-diethyl to ring 3
  test('AST: fused + gem-diethyl', () => {
    const s = 'C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: fused + gem-diethyl', () => {
    const s = 'C1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 3: Add ethyl on ring 1
  test('AST: ethyl + fused + gem-diethyl', () => {
    const s = 'CCC1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: ethyl + fused + gem-diethyl', () => {
    const s = 'CCC1=CC2=C(C=C1)NC3=C2CCOC3(CC)CC';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 4: Add acetic acid side chain (CC(=O)O) - the crucial step
  test('AST: ethyl + fused + CC(=O)O + gem-diethyl', () => {
    const s = 'CCC1=CC2=C(C=C1CC(=O)O)NC3=C2CCOC3(CC)CC';
    expect(parse(s).smiles).toBe(s);
  });
  test('codegen: ethyl + fused + CC(=O)O + gem-diethyl', () => {
    const s = 'CCC1=CC2=C(C=C1CC(=O)O)NC3=C2CCOC3(CC)CC';
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Step 5: Full etodolac
  test('AST: full etodolac', () => {
    expect(parse(ETODOLAC_SMILES).smiles).toBe(ETODOLAC_SMILES);
  });
  test('codegen: full etodolac', () => {
    expect(codegenRoundTrip(ETODOLAC_SMILES).smiles).toBe(ETODOLAC_SMILES);
  });
});
