import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const OMEPRAZOLE_SMILES = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';

describe('Omeprazole - Real Structure', () => {
  test('parses without error', () => {
    expect(() => parse(OMEPRAZOLE_SMILES)).not.toThrow();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(OMEPRAZOLE_SMILES);
    expect(ast.smiles).toBe(OMEPRAZOLE_SMILES);
  });

  test('Codegen round-trips correctly', () => {
    const reconstructed = codegenRoundTrip(OMEPRAZOLE_SMILES);
    expect(reconstructed.smiles).toBe(OMEPRAZOLE_SMILES);
  });
});

describe('Omeprazole - Component Structures (divide and conquer)', () => {
  // Level 1: Simple aromatic rings
  test('AST: simple benzene', () => {
    const ast = parse('c1ccccc1');
    expect(ast.smiles).toBe('c1ccccc1');
  });

  test('Codegen: simple benzene', () => {
    const reconstructed = codegenRoundTrip('c1ccccc1');
    expect(reconstructed.smiles).toBe('c1ccccc1');
  });

  test('AST: simple pyrrole', () => {
    const ast = parse('c1cc[nH]c1');
    expect(ast.smiles).toBe('c1cc[nH]c1');
  });

  test('Codegen: simple pyrrole', () => {
    const reconstructed = codegenRoundTrip('c1cc[nH]c1');
    expect(reconstructed.smiles).toBe('c1cc[nH]c1');
  });

  // Level 2: Fused rings (benzimidazole core)
  test('AST: benzimidazole', () => {
    const ast = parse('c1ccc2[nH]cnc2c1');
    expect(ast.smiles).toBe('c1ccc2[nH]cnc2c1');
  });

  test('Codegen: benzimidazole', () => {
    const reconstructed = codegenRoundTrip('c1ccc2[nH]cnc2c1');
    expect(reconstructed.smiles).toBe('c1ccc2[nH]cnc2c1');
  });

  test('AST: benzimidazole with methoxy', () => {
    const ast = parse('COc1ccc2[nH]cnc2c1');
    expect(ast.smiles).toBe('COc1ccc2[nH]cnc2c1');
  });

  test('Codegen: benzimidazole with methoxy', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2[nH]cnc2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2[nH]cnc2c1');
  });

  // Level 3: Sulfoxide group S(=O)
  test('AST: simple sulfoxide', () => {
    const ast = parse('CS(=O)C');
    expect(ast.smiles).toBe('CS(=O)C');
  });

  test('Codegen: simple sulfoxide', () => {
    const reconstructed = codegenRoundTrip('CS(=O)C');
    expect(reconstructed.smiles).toBe('CS(=O)C');
  });

  test('AST: sulfoxide with methyl groups', () => {
    const ast = parse('CS(=O)CC');
    expect(ast.smiles).toBe('CS(=O)CC');
  });

  test('Codegen: sulfoxide with methyl groups', () => {
    const reconstructed = codegenRoundTrip('CS(=O)CC');
    expect(reconstructed.smiles).toBe('CS(=O)CC');
  });

  // Level 4: Pyridine ring (ring 3 in omeprazole)
  test('AST: simple pyridine', () => {
    const ast = parse('c1cnccc1');
    expect(ast.smiles).toBe('c1cnccc1');
  });

  test('Codegen: simple pyridine', () => {
    const reconstructed = codegenRoundTrip('c1cnccc1');
    expect(reconstructed.smiles).toBe('c1cnccc1');
  });

  test('AST: pyridine with methyl', () => {
    const ast = parse('Cc1cnccc1');
    expect(ast.smiles).toBe('Cc1cnccc1');
  });

  test('Codegen: pyridine with methyl', () => {
    const reconstructed = codegenRoundTrip('Cc1cnccc1');
    expect(reconstructed.smiles).toBe('Cc1cnccc1');
  });

  test('AST: pyridine with two methyls', () => {
    const ast = parse('Cc1cncc(C)c1');
    expect(ast.smiles).toBe('Cc1cncc(C)c1');
  });

  test('Codegen: pyridine with two methyls', () => {
    const reconstructed = codegenRoundTrip('Cc1cncc(C)c1');
    expect(reconstructed.smiles).toBe('Cc1cncc(C)c1');
  });

  test('AST: pyridine with methyl and methoxy', () => {
    const ast = parse('COc1cncc(C)c1');
    expect(ast.smiles).toBe('COc1cncc(C)c1');
  });

  test('Codegen: pyridine with methyl and methoxy', () => {
    const reconstructed = codegenRoundTrip('COc1cncc(C)c1');
    expect(reconstructed.smiles).toBe('COc1cncc(C)c1');
  });

  test('AST: pyridine fully substituted (ring 3)', () => {
    const ast = parse('Cc1ncc(C)c(OC)c1C');
    expect(ast.smiles).toBe('Cc1ncc(C)c(OC)c1C');
  });

  test('Codegen: pyridine fully substituted (ring 3)', () => {
    const reconstructed = codegenRoundTrip('Cc1ncc(C)c(OC)c1C');
    expect(reconstructed.smiles).toBe('Cc1ncc(C)c(OC)c1C');
  });

  // Level 5: Sulfoxide attached to ring
  test('AST: sulfoxide with ring attachment', () => {
    const ast = parse('CS(=O)Cc1ccccc1');
    expect(ast.smiles).toBe('CS(=O)Cc1ccccc1');
  });

  test('Codegen: sulfoxide with ring attachment', () => {
    const reconstructed = codegenRoundTrip('CS(=O)Cc1ccccc1');
    expect(reconstructed.smiles).toBe('CS(=O)Cc1ccccc1');
  });

  test('AST: sulfoxide with pyridine attachment', () => {
    const ast = parse('CS(=O)Cc1cnccc1');
    expect(ast.smiles).toBe('CS(=O)Cc1cnccc1');
  });

  test('Codegen: sulfoxide with pyridine attachment', () => {
    const reconstructed = codegenRoundTrip('CS(=O)Cc1cnccc1');
    expect(reconstructed.smiles).toBe('CS(=O)Cc1cnccc1');
  });

  test('AST: sulfoxide with substituted pyridine', () => {
    const ast = parse('CS(=O)Cc1ncc(C)c(OC)c1C');
    expect(ast.smiles).toBe('CS(=O)Cc1ncc(C)c(OC)c1C');
  });

  test('Codegen: sulfoxide with substituted pyridine', () => {
    const reconstructed = codegenRoundTrip('CS(=O)Cc1ncc(C)c(OC)c1C');
    expect(reconstructed.smiles).toBe('CS(=O)Cc1ncc(C)c(OC)c1C');
  });

  // Level 6: Benzimidazole with branch at position 2
  test('AST: benzimidazole with simple branch', () => {
    const ast = parse('c1ccc2nc(C)[nH]c2c1');
    expect(ast.smiles).toBe('c1ccc2nc(C)[nH]c2c1');
  });

  test('Codegen: benzimidazole with simple branch', () => {
    const reconstructed = codegenRoundTrip('c1ccc2nc(C)[nH]c2c1');
    expect(reconstructed.smiles).toBe('c1ccc2nc(C)[nH]c2c1');
  });

  test('AST: benzimidazole with sulfoxide branch', () => {
    const ast = parse('c1ccc2nc(S(=O)C)[nH]c2c1');
    expect(ast.smiles).toBe('c1ccc2nc(S(=O)C)[nH]c2c1');
  });

  test('Codegen: benzimidazole with sulfoxide branch', () => {
    const reconstructed = codegenRoundTrip('c1ccc2nc(S(=O)C)[nH]c2c1');
    expect(reconstructed.smiles).toBe('c1ccc2nc(S(=O)C)[nH]c2c1');
  });

  test('AST: benzimidazole with sulfoxide-methyl branch', () => {
    const ast = parse('c1ccc2nc(S(=O)CC)[nH]c2c1');
    expect(ast.smiles).toBe('c1ccc2nc(S(=O)CC)[nH]c2c1');
  });

  test('Codegen: benzimidazole with sulfoxide-methyl branch', () => {
    const reconstructed = codegenRoundTrip('c1ccc2nc(S(=O)CC)[nH]c2c1');
    expect(reconstructed.smiles).toBe('c1ccc2nc(S(=O)CC)[nH]c2c1');
  });

  test('AST: benzimidazole with sulfoxide-ring branch', () => {
    const ast = parse('c1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
    expect(ast.smiles).toBe('c1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
  });

  test('Codegen: benzimidazole with sulfoxide-ring branch', () => {
    const reconstructed = codegenRoundTrip('c1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
    expect(reconstructed.smiles).toBe('c1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
  });

  // Level 7: Combining methoxy benzimidazole with sulfoxide branches
  test('AST: methoxy benzimidazole with sulfoxide branch', () => {
    const ast = parse('COc1ccc2nc(S(=O)C)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)C)[nH]c2c1');
  });

  test('Codegen: methoxy benzimidazole with sulfoxide branch', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)C)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)C)[nH]c2c1');
  });

  test('AST: methoxy benzimidazole with sulfoxide-methyl branch', () => {
    const ast = parse('COc1ccc2nc(S(=O)CC)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)CC)[nH]c2c1');
  });

  test('Codegen: methoxy benzimidazole with sulfoxide-methyl branch', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)CC)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)CC)[nH]c2c1');
  });

  test('AST: methoxy benzimidazole with sulfoxide-ring branch', () => {
    const ast = parse('COc1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
  });

  test('Codegen: methoxy benzimidazole with sulfoxide-ring branch', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)Cc3ccccc3)[nH]c2c1');
  });

  // Level 8: Building up to full omeprazole
  test('AST: methoxy benzimidazole with sulfoxide-pyridine', () => {
    const ast = parse('COc1ccc2nc(S(=O)Cc3cnccc3)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)Cc3cnccc3)[nH]c2c1');
  });

  test('Codegen: methoxy benzimidazole with sulfoxide-pyridine', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)Cc3cnccc3)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)Cc3cnccc3)[nH]c2c1');
  });

  test('AST: methoxy benzimidazole with sulfoxide-methylpyridine', () => {
    const ast = parse('COc1ccc2nc(S(=O)Cc3ncc(C)cc3)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)Cc3ncc(C)cc3)[nH]c2c1');
  });

  test('Codegen: methoxy benzimidazole with sulfoxide-methylpyridine', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)Cc3ncc(C)cc3)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)Cc3ncc(C)cc3)[nH]c2c1');
  });

  test('AST: methoxy benzimidazole with sulfoxide-dimethylpyridine', () => {
    const ast = parse('COc1ccc2nc(S(=O)Cc3ncc(C)c(C)c3)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)Cc3ncc(C)c(C)c3)[nH]c2c1');
  });

  test('Codegen: methoxy benzimidazole with sulfoxide-dimethylpyridine', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)Cc3ncc(C)c(C)c3)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)Cc3ncc(C)c(C)c3)[nH]c2c1');
  });

  test('AST: adding methoxy to pyridine ring', () => {
    const ast = parse('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3)[nH]c2c1');
    expect(ast.smiles).toBe('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3)[nH]c2c1');
  });

  test('Codegen: adding methoxy to pyridine ring', () => {
    const reconstructed = codegenRoundTrip('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3)[nH]c2c1');
    expect(reconstructed.smiles).toBe('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3)[nH]c2c1');
  });

  // Level 9: Final step - full omeprazole
  test('AST: full omeprazole structure', () => {
    const ast = parse(OMEPRAZOLE_SMILES);
    expect(ast.smiles).toBe(OMEPRAZOLE_SMILES);
  });

  test('Codegen: full omeprazole structure', () => {
    const reconstructed = codegenRoundTrip(OMEPRAZOLE_SMILES);
    expect(reconstructed.smiles).toBe(OMEPRAZOLE_SMILES);
  });
});

describe('Omeprazole - Critical Edge Cases', () => {
  // [nH] handling
  test('AST: [nH] in simple context', () => {
    const ast = parse('c1[nH]ccc1');
    expect(ast.smiles).toBe('c1[nH]ccc1');
  });

  test('Codegen: [nH] in simple context', () => {
    const reconstructed = codegenRoundTrip('c1[nH]ccc1');
    expect(reconstructed.smiles).toBe('c1[nH]ccc1');
  });

  test('AST: [nH] in fused ring', () => {
    const ast = parse('c1ccc2[nH]ccc2c1');
    expect(ast.smiles).toBe('c1ccc2[nH]ccc2c1');
  });

  test('Codegen: [nH] in fused ring', () => {
    const reconstructed = codegenRoundTrip('c1ccc2[nH]ccc2c1');
    expect(reconstructed.smiles).toBe('c1ccc2[nH]ccc2c1');
  });

  test('AST: [nH] in fused ring with branch', () => {
    const ast = parse('c1ccc2[nH]c(C)cc2c1');
    expect(ast.smiles).toBe('c1ccc2[nH]c(C)cc2c1');
  });

  test('Codegen: [nH] in fused ring with branch', () => {
    const reconstructed = codegenRoundTrip('c1ccc2[nH]c(C)cc2c1');
    expect(reconstructed.smiles).toBe('c1ccc2[nH]c(C)cc2c1');
  });

  // S(=O) handling in branches
  test('AST: sulfoxide in deep branch', () => {
    const ast = parse('C(S(=O)C)');
    expect(ast.smiles).toBe('C(S(=O)C)');
  });

  test('Codegen: sulfoxide in deep branch', () => {
    const reconstructed = codegenRoundTrip('C(S(=O)C)');
    expect(reconstructed.smiles).toBe('C(S(=O)C)');
  });

  test('AST: sulfoxide with ring in branch', () => {
    const ast = parse('C(S(=O)Cc1ccccc1)');
    expect(ast.smiles).toBe('C(S(=O)Cc1ccccc1)');
  });

  test('Codegen: sulfoxide with ring in branch', () => {
    const reconstructed = codegenRoundTrip('C(S(=O)Cc1ccccc1)');
    expect(reconstructed.smiles).toBe('C(S(=O)Cc1ccccc1)');
  });

  // Multiple rings with different numbering
  test('AST: three separate rings', () => {
    const ast = parse('c1ccccc1Cc2ccccc2Cc3ccccc3');
    expect(ast.smiles).toBe('c1ccccc1Cc2ccccc2Cc3ccccc3');
  });

  test('Codegen: three separate rings', () => {
    const reconstructed = codegenRoundTrip('c1ccccc1Cc2ccccc2Cc3ccccc3');
    expect(reconstructed.smiles).toBe('c1ccccc1Cc2ccccc2Cc3ccccc3');
  });
});
