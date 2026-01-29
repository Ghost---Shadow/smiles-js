import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import { codegenRoundTrip } from './utils.js';

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
    describe(name, () => {
      test('SMILES -> AST -> SMILES', () => {
        const ast = parse(smiles);
        expect(ast.smiles).toBe(smiles);
      });

      test('SMILES -> AST -> CODE -> AST -> SMILES', () => {
        const reconstructed = codegenRoundTrip(smiles);
        // Linear chains preserve double bonds in codegen
        expect(reconstructed.smiles).toBe(smiles);
      });
    });
  });
});
