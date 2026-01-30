import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const MOLECULES = {
  Cortisone: {
    smiles: 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12',
    expectedType: 'molecule',
    expectedSmiles: 'CC1212(C)C(C(=O)CO)C(O)C(=O)(=O)C2(C)C1(C(=O)CO)CCC1C2',
    lastVar: 'v25',
  },
  Hydrocortisone: {
    smiles: 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12O',
    expectedType: 'molecule',
    expectedSmiles: 'CC1212(C)C(C(=O)CO)C(O)C(=O)(=O)C2(C)C1(C(=O)CO)CCC1C2O',
    lastVar: 'v26',
  },
  Prednisone: {
    smiles: 'CC12CC(=O)C=CC1=CC(O)C1C2CCC2(C)C(C(=O)CO)CCC12',
    expectedType: 'molecule',
    expectedSmiles: 'CC1212(C)C(C(=O)CO)C(=O)(=O)CC2(C)C1(C(=O)CO)CC(O)C1C2',
    lastVar: 'v25',
  },
  Prednisolone: {
    smiles: 'CC12CC(=O)C=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12',
    expectedType: 'molecule',
    expectedSmiles: 'CC1212(C)C(C(=O)CO)C(=O)(=O)(O)CC2(C)C1(C(=O)CO)CC(O)C1C2',
    lastVar: 'v27',
  },
  Methylprednisolone: {
    smiles: 'CC12CC(=O)C(C)=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12',
    expectedType: 'molecule',
    expectedSmiles: 'CC1212(C)C(C(=O)CO)C(=O)(=O)(O)C(C)(C)C2(C)C1(C(=O)CO)CC(O)C1C2',
    lastVar: 'v31',
  },
  Dexamethasone: {
    smiles: 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO',
    expectedType: 'molecule',
    expectedSmiles: 'CC134CC2(=O)C(C)C1(O)(C)(F)C34(F)(C)(O)CC2(C)C(=O)CO',
    lastVar: 'v28',
  },
  'Valproic Acid': {
    smiles: 'CCCC(CCC)C(=O)O',
    expectedType: 'linear',
    expectedSmiles: 'CCCC(CCC)C(=O)O',
    lastVar: 'v5',
  },
};

describe('Steroids', () => {
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
