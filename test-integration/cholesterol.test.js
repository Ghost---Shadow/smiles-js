import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { codegenRoundTrip } from './utils.js';

const CHOLESTEROL_SMILES = 'C[C@H](CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CC=C4[C@@]3(CC[C@@H](C4)O)C)C';

describe('Cholesterol - Divide and Conquer', () => {
  // Cholesterol SMILES:
  // C[C@H](CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CC=C4[C@@]3(CC[C@@H](C4)O)C)C
  //
  // The failure: ring 4 is being dropped
  // Expected: ...CC=C4[C@@]3(CC[C@@H](C4)O)C)C
  // Received: ...CC=C[C@@]3(CC[C@@H](C)O)C)C

  // Level 1: Simple ring closures
  test('simple ring', () => {
    const s = 'C1CCCCC1';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 2: Two fused rings (decalin-like)
  test('two fused rings', () => {
    const s = 'C1CCC2CCCCC2C1';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 3: Ring closure inside a branch - the core pattern
  test('ring closure in branch: C1CCC(C1)C', () => {
    const s = 'C1CCC(C1)C';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 4: Two ring numbers, one closing in a branch
  test('two rings, one closing in branch: C1CC2CCC(C2)C1', () => {
    const s = 'C1CC2CCC(C2)C1';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 5: Ring opening and closing with different numbers in nested context
  test('ring 4 opens and closes in branch: C4CCC(C4)', () => {
    const s = 'C4CCC(C4)';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 6: The specific pattern from cholesterol - ring opens, then closes inside a parenthesized branch
  test('ring open at atom, close inside branch argument: CC=C4C(CC(C4)O)', () => {
    const s = 'CC=C4C(CC(C4)O)';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 7: Closer to cholesterol D-ring pattern
  test('cholesterol D-ring pattern: CC=C4C(CCC(C4)O)C', () => {
    const s = 'CC=C4C(CCC(C4)O)C';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 8: Add ring 3 fused with ring 4
  test('fused rings 3+4: C3CC=C4C3(CCC(C4)O)C', () => {
    const s = 'C3CC=C4C3(CCC(C4)O)C';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 9: The C/D ring system from cholesterol (without stereo)
  test('C/D ring system: C2CC=C4C(CC2)(CCC(C4)O)C', () => {
    const s = 'C2CC=C4C(CC2)(CCC(C4)O)C';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 10: Three fused rings (A/B/C ring without stereo)
  test('three fused rings: C1CCC2C1CCC3CC=C4C3(CCC(C4)O)C', () => {
    const s = 'C1CCC2C1CCC3C2CC=C4C3(CCC(C4)O)C';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 11: Isolate multiple branches on same atom with ring closures
  test('two branches with ring closures: C1C(C1)(C2)CC2', () => {
    const s = 'C1C(C1)(C2)CC2';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 12: Minimal failing pattern - ring closure in second branch
  test('ring close in second branch: C4CC(C)(C4)', () => {
    const s = 'C4CC(C)(C4)';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 13: Full cholesterol (no stereo) to isolate stereo vs ring issue
  test('cholesterol without stereochemistry', () => {
    const s = 'CC(CCCC(C)C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C';
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });

  // Level 14: Full cholesterol with stereochemistry
  test('full cholesterol', () => {
    const s = CHOLESTEROL_SMILES;
    expect(parse(s).smiles).toBe(s);
    expect(codegenRoundTrip(s).smiles).toBe(s);
  });
});
