import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

// Telmisartan is tested separately in telmisartan.test.js
// Note: Parser normalizes para-substituted benzene patterns

const MOLECULES = {
  Losartan: {
    smiles: 'CCCCC1=NC(Cl)=C(CO)N1CC2=CC=CC=C2C3=CC=CC=C3C4=NNN=N4',
    expectedType: 'molecule',
    expectedSmiles: 'CCCCC1NC(Cl)C(CO)N1CC2CCCCC2C3CCCCC3C4NNNN4',
    lastVar: 'v14',
  },
  Valsartan: {
    smiles: 'CCCCC(=O)N(CC1=CC=CC=C1C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C(=O)O',
    expectedType: 'linear',
    expectedSmiles: 'CCCCC(=O)N(CC1CCCCC1C2CCCCC2C3NNNN3)C(C(C)C)C(=O)O',
    lastVar: 'v16',
  },
  Irbesartan: {
    smiles: 'CCCCC1=NC2(CCCC2)C(=O)N1CC3=CC=CC=C3C4=CC=CC=C4C5=NNN=N5',
    expectedType: 'molecule',
    expectedSmiles: 'CCCCC1NC2CCCC2(=O)N1CC3CCCCC3C4CCCCC4C5NNNN5',
    lastVar: 'v14',
  },
};

describe('Hypertension Medications', () => {
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
