import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

// Note: Parser normalizes para-substituted benzene patterns

const MOLECULES = {
  Lidocaine: {
    smiles: 'CCN(CC)CC(=O)NC1=C(C)C=CC=C1C',
    expectedType: 'molecule',
    expectedSmiles: 'CCN(CC)CC(=O)NC1C(C)CCCC1C',
    lastVar: 'v10',
  },
  Bupivacaine: {
    smiles: 'CCCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C',
    expectedType: 'molecule',
    expectedSmiles: 'CCCCN1CCCCC1C(=O)NC2C(C)CCCC2C',
    lastVar: 'v11',
  },
  Ropivacaine: {
    smiles: 'CCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C',
    expectedType: 'molecule',
    expectedSmiles: 'CCCN1CCCCC1C(=O)NC2C(C)CCCC2C',
    lastVar: 'v11',
  },
  Mepivacaine: {
    smiles: 'CN1CCCCC1C(=O)NC2=C(C)C=CC=C2C',
    expectedType: 'molecule',
    expectedSmiles: 'CN1CCCCC1C(=O)NC2C(C)CCCC2C',
    lastVar: 'v11',
  },
  Prilocaine: {
    smiles: 'CCCNC(C)C(=O)NC1=CC=CC=C1C',
    expectedType: 'molecule',
    expectedSmiles: 'CCCNC(C)C(=O)NC1CCCCC1C',
    lastVar: 'v8',
  },
  Benzocaine: {
    smiles: 'CCOC(=O)C1=CC=CC=C1N',
    expectedType: 'molecule',
    expectedSmiles: 'CCOC(=O)C1CCCCC1N',
    lastVar: 'v6',
  },
  Tetracaine: {
    smiles: 'CCCCNC1=CC=CC=C1C(=O)OCCN(C)C',
    expectedType: 'molecule',
    expectedSmiles: 'CCCCNC1CCCCC1C(=O)OCCN(C)C',
    lastVar: 'v8',
  },
  Procaine: {
    smiles: 'CCN(CC)CCOC(=O)C1=CC=CC=C1N',
    expectedType: 'molecule',
    expectedSmiles: 'CCN(CC)CCOC(=O)C1CCCCC1N',
    lastVar: 'v8',
  },
};

describe('Local Anesthetics', () => {
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
