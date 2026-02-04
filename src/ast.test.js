import { describe, test, expect } from 'bun:test';
import { validateAtoms } from './ast.js';

describe('validateAtoms', () => {
  test('validates string atoms', () => {
    expect(validateAtoms('C')).toBe(true);
    expect(validateAtoms('CCC')).toBe(true);
  });

  test('throws for empty string', () => {
    expect(() => validateAtoms('')).toThrow('Atoms string cannot be empty');
  });

  test('validates array of string atoms', () => {
    expect(validateAtoms(['C', 'C', 'C'])).toBe(true);
  });

  test('throws for empty array', () => {
    expect(() => validateAtoms([])).toThrow('Atoms array cannot be empty');
  });

  test('throws for array with non-string elements', () => {
    expect(() => validateAtoms(['C', 123, 'C'])).toThrow('All atoms must be strings');
  });

  test('throws for non-string, non-array input', () => {
    expect(() => validateAtoms(123)).toThrow('Atoms must be a string or array of strings');
    expect(() => validateAtoms(null)).toThrow('Atoms must be a string or array of strings');
    expect(() => validateAtoms({})).toThrow('Atoms must be a string or array of strings');
  });
});
