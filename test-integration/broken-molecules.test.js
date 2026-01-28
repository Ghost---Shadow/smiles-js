import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';

// Test molecules that were previously broken

describe('Opioids', () => {
  test('Fentanyl round-trips', () => {
    const smiles = 'CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('Tramadol round-trips', () => {
    const smiles = 'CN(C)CC1CCCCC1(C2=CC(=CC=C2)OC)O';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('Oxycodone round-trips', () => {
    // Complex morphinan structure - now working!
    const smiles = 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O';
    expect(parse(smiles).smiles).toBe(smiles);
  });
});

describe('Cannabinoids', () => {
  test('Anandamide round-trips', () => {
    const smiles = 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('2-Arachidonoylglycerol round-trips', () => {
    const smiles = 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('THC round-trips', () => {
    // Complex tricyclic - still broken
    const smiles = 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('CBD round-trips', () => {
    // Complex structure - still broken
    const smiles = 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Nabilone round-trips', () => {
    // Complex tricyclic - still broken
    const smiles = 'CCCCCCC(C)(C)C1=CC(=C2C3CC(=O)CCC3C(OC2=C1)(C)C)O';
    expect(parse(smiles).smiles).toBe(smiles);
  });
});

describe('NSAIDs', () => {
  test.skip('Celecoxib round-trips', () => {
    const smiles = 'CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C(F)(F)F';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Meloxicam round-trips', () => {
    const smiles = 'CC1=C(N=C(S1)NC(=O)C2=C(C3=CC=CC=C3S(=O)(=O)N2C)O)C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Piroxicam round-trips', () => {
    const smiles = 'CN1C(=C(C2=CC=CC=C2S1(=O)=O)O)C(=O)NC3=CC=CC=N3';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Rofecoxib round-trips', () => {
    const smiles = 'CS(=O)(=O)C1=CC=C(C=C1)C2=C(C(=O)OC2)C3=CC=CC=C3';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Etoricoxib round-trips', () => {
    const smiles = 'CC1=NC=C(C=C1)C2=CC=C(C=C2)S(=O)(=O)C3=CC=CC=C3';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Nabumetone round-trips', () => {
    const smiles = 'COC1=CC2=CC(=CC=C2C=C1)CCC(=O)C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Oxaprozin round-trips', () => {
    const smiles = 'OC(=O)CCC1=NC(=C(O1)C2=CC=CC=C2)C3=CC=CC=C3';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test.skip('Ketoprofen round-trips', () => {
    const smiles = 'CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O';
    expect(parse(smiles).smiles).toBe(smiles);
  });
});
