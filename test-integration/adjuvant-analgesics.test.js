import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

// Note: Parser normalizes some ring/branch patterns

const MOLECULES = {
  Gabapentin: {
    smiles: 'C1CCC(CC(=O)O)CC1CN',
    expectedType: 'molecule',
    expectedSmiles: 'C1CCC(CC(=O)O)CC1CN',
    lastVar: 'v7',
  },
  Pregabalin: {
    smiles: 'CC(C)CC(CC(=O)O)CN',
    expectedType: 'linear',
    expectedSmiles: 'CC(C)CC(CC(=O)O)CN',
    lastVar: 'v7',
  },
  Amitriptyline: {
    smiles: 'CN(C)CCCC1C2=CC=CC=C2CCC3=CC=CC=C13',
    expectedType: 'molecule',
    expectedSmiles: 'CN(C)CCCC1C2CCCC3C2CCCC13',
    lastVar: 'v8',
  },
  Duloxetine: {
    smiles: 'CNCCC(C1=CC=CS1)OC2=CC=CC3=CC=CC=C23',
    expectedType: 'molecule',
    expectedSmiles: 'CNCCC(C1CCCS1)OC2CCCC3CCCCC3CCCC2',
    lastVar: 'v8',
  },
  Carbamazepine: {
    smiles: 'C1=CC=C2C(C1)C=CC3=CC=CC=C3N2C(=O)N',
    expectedType: 'molecule',
    expectedSmiles: 'C13CCC2CC13CCCN2C(=O)N',
    lastVar: 'v9',
  },
  'Valproic Acid': {
    smiles: 'CCCC(CCC)C(=O)O',
    expectedType: 'linear',
    expectedSmiles: 'CCCC(CCC)C(=O)O',
    lastVar: 'v5',
  },
};

describe('Adjuvant Analgesics', () => {
  Object.entries(MOLECULES).forEach(([name, data]) => {
    describe(`${name} Integration Test`, () => {
      test(`parses ${name}`, () => {
        const ast = parse(data.smiles);
        expect(ast.smiles).toBe(data.smiles);
      });

      test('generated code is valid JavaScript', () => {
        const ast = parse(data.smiles);
        const code = ast.toCode('v');

        expect(() => {
          // eslint-disable-next-line no-new-func
          new Function('Ring', 'Linear', 'FusedRing', 'Molecule', code);
        }).not.toThrow();
      });

      test('codegen round-trip produces expected output', () => {
        const ast = parse(data.smiles);
        const code = ast.toCode('v');

        // eslint-disable-next-line no-new-func
        const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn ${data.lastVar};`);
        const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

        expect(reconstructed.type).toBe(data.expectedType);
        expect(reconstructed.smiles).toBe(data.expectedSmiles);
      });
    });
  });
});
