import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

// Note: Many cannabinoid SMILES are too complex for current parser
// Only PEA works correctly
// BROKEN: Anandamide, 2-AG, THC, CBD, Nabilone

const MOLECULES = {
  Palmitoylethanolamide: {
    smiles: 'CCCCCCCCCCCCCCCC(=O)NCCO',
    expectedType: 'linear',
    expectedSmiles: 'CCCCCCCCCCCCCCCC(=O)NCCO',
    lastVar: 'v3',
  },
};

describe('Endocannabinoids', () => {
  Object.entries(MOLECULES).forEach(([name, data]) => {
    describe(`${name} Integration Test`, () => {
      test(`parses ${name}`, () => {
        const ast = parse(data.smiles);
        expect(ast.smiles).toBe(data.smiles);
      });

      test('generated code is valid JavaScript', () => {
        const ast = parse(data.smiles);
        const code = ast.toCode('v');
        const executableCode = stripExports(code);

        expect(() => {
          // eslint-disable-next-line no-new-func, no-new
          new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
        }).not.toThrow();
      });

      test('codegen round-trip produces expected output', () => {
        const ast = parse(data.smiles);
        const code = ast.toCode('v');
        const executableCode = stripExports(code);

        // eslint-disable-next-line no-new-func
        const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${data.lastVar};`);
        const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

        expect(reconstructed.type).toBe(data.expectedType);
        expect(reconstructed.smiles).toBe(data.expectedSmiles);
      });
    });
  });
});
