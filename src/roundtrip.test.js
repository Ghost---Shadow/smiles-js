import { test, expect } from 'bun:test';
import {
  validateRoundTrip,
  parseWithValidation,
  isValidRoundTrip,
  normalize,
  stabilizes,
} from './roundtrip.js';

// Perfect round-trip examples
const PERFECT_MOLECULES = [
  'c1ccccc1', // Benzene
  'CCC', // Propane
  'CCCc1ccccc1', // Propylbenzene
  'C1=CC=CC=C1', // Benzene (explicit bonds)
  'c1cccnc1', // Pyridine
  'CC(C)C', // Isobutane
  'C1CCC1', // Cyclobutane
];

test('validateRoundTrip - perfect molecules', () => {
  PERFECT_MOLECULES.forEach((smiles) => {
    const result = validateRoundTrip(smiles);

    expect(result.perfect).toBe(true);
    expect(result.stabilizes).toBe(true);
    expect(result.status).toBe('perfect');
    expect(result.original).toBe(smiles);
    expect(result.firstRoundTrip).toBe(smiles);
    expect(result.secondRoundTrip).toBe(smiles);
    expect(result.recommendation).toContain('perfect');
  });
});

test('validateRoundTrip - returns AST', () => {
  const result = validateRoundTrip('c1ccccc1');

  expect(result.ast).toBeDefined();
  expect(result.ast.type).toBe('ring');
  expect(result.ast.smiles).toBe('c1ccccc1');
});

test('validateRoundTrip - omeprazole (previously imperfect, now perfect)', () => {
  // This molecule used to require stabilization but is now perfect after fixes
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
  const result = validateRoundTrip(input);

  expect(result.perfect).toBe(true);
  expect(result.stabilizes).toBe(true);
  expect(result.status).toBe('perfect');
  expect(result.original).toBe(input);
  expect(result.firstRoundTrip).toBe(input);
  expect(result.secondRoundTrip).toBe(result.firstRoundTrip);
});

test('isValidRoundTrip - perfect molecules', () => {
  expect(isValidRoundTrip('c1ccccc1')).toBe(true);
  expect(isValidRoundTrip('CCC')).toBe(true);
  expect(isValidRoundTrip('CCCc1ccccc1')).toBe(true);
});

test('isValidRoundTrip - omeprazole now perfect', () => {
  // This molecule is now perfect after round-trip fixes
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
  expect(isValidRoundTrip(input)).toBe(true);
});

test('normalize - returns original for perfect molecules', () => {
  expect(normalize('c1ccccc1')).toBe('c1ccccc1');
  expect(normalize('CCC')).toBe('CCC');
});

test('normalize - returns original for now-perfect molecules', () => {
  // This molecule is now perfect, so normalize returns the original
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
  const normalized = normalize(input);

  expect(normalized).toBe(input);

  // Should be stable
  const secondNormalize = normalize(normalized);
  expect(secondNormalize).toBe(normalized);
});

test('stabilizes - true for perfect molecules', () => {
  expect(stabilizes('c1ccccc1')).toBe(true);
  expect(stabilizes('CCC')).toBe(true);
});

test('stabilizes - true for stabilizing molecules', () => {
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
  expect(stabilizes(input)).toBe(true);
});

test('parseWithValidation - silent mode suppresses warnings', () => {
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';

  // Should not throw
  const ast = parseWithValidation(input, { silent: true });
  expect(ast).toBeDefined();
  expect(ast.smiles).toBeDefined();
});

test('parseWithValidation - strict mode allows now-perfect molecules', () => {
  // This molecule is now perfect, so strict mode should not throw
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';

  expect(() => {
    parseWithValidation(input, { strict: true });
  }).not.toThrow();
});

test('parseWithValidation - strict mode allows perfect molecules', () => {
  expect(() => {
    parseWithValidation('c1ccccc1', { strict: true });
  }).not.toThrow();
});

test('parseWithValidation - returns AST', () => {
  const ast = parseWithValidation('c1ccccc1', { silent: true });

  expect(ast.type).toBe('ring');
  expect(ast.smiles).toBe('c1ccccc1');
});

test('validateRoundTrip - complex pharmaceutical molecules', () => {
  // Atorvastatin - should be perfect
  const atorvastatin = 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O';
  const result1 = validateRoundTrip(atorvastatin);
  expect(result1.perfect).toBe(true);

  // Sildenafil - should be perfect
  const sildenafil = 'CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC';
  const result2 = validateRoundTrip(sildenafil);
  expect(result2.perfect).toBe(true);
});

test('normalize - idempotent (calling twice returns same result)', () => {
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
  const normalized1 = normalize(input);
  const normalized2 = normalize(normalized1);
  const normalized3 = normalize(normalized2);

  expect(normalized2).toBe(normalized1);
  expect(normalized3).toBe(normalized1);
});

test('validateRoundTrip - result fields are consistent', () => {
  const result = validateRoundTrip('c1ccccc1');

  // All three should be identical for perfect round-trip
  expect(result.original).toBe(result.firstRoundTrip);
  expect(result.firstRoundTrip).toBe(result.secondRoundTrip);

  // Status and flags should match
  expect(result.status).toBe('perfect');
  expect(result.perfect).toBe(true);
  expect(result.stabilizes).toBe(true);
});

test('validateRoundTrip - now-perfect result fields are consistent', () => {
  // This molecule is now perfect after round-trip fixes
  const input = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
  const result = validateRoundTrip(input);

  // All should match (perfect)
  expect(result.firstRoundTrip).toBe(result.secondRoundTrip);
  expect(result.original).toBe(result.firstRoundTrip);

  // Status and flags should match
  expect(result.status).toBe('perfect');
  expect(result.perfect).toBe(true);
  expect(result.stabilizes).toBe(true);
});
