import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';

describe('Linear Chain Double Bonds', () => {
  const testCases = [
    ['C=CC', 'propene'],
    ['CC=CC', 'butene'],
    ['C=CCC=C', 'pentadiene'],
    ['CC=CCC=CC', 'heptadiene'],
    ['CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO', 'Anandamide'],
    ['CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO', '2-Arachidonoylglycerol'],
  ];

  testCases.forEach(([smiles, name]) => {
    test(`${name} round-trips correctly`, () => {
      const ast = parse(smiles);
      expect(ast.smiles).toBe(smiles);
    });
  });
});
