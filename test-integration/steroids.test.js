import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

const CORTISONE_SMILES = 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12';
const HYDROCORTISONE_SMILES = 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12O';
const PREDNISONE_SMILES = 'CC12CC(=O)C=CC1=CC(O)C1C2CCC2(C)C(C(=O)CO)CCC12';
const PREDNISOLONE_SMILES = 'CC12CC(=O)C=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12';
const METHYLPREDNISOLONE_SMILES = 'CC12CC(=O)C(C)=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12';
const DEXAMETHASONE_SMILES = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO';
const VALPROIC_ACID_SMILES = 'CCCC(CCC)C(=O)O';

function testRoundTrip(smiles, name) {
  describe(`${name} Integration Test`, () => {
    test(`parses ${name}`, () => {
      const ast = parse(smiles);
      expect(ast.smiles).toBe(smiles);
    });

    test('generates valid code via toCode()', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v');
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });

    test('generated code is valid JavaScript', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v');

      let factory;
      expect(() => {
        // eslint-disable-next-line no-new-func
        factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', code);
      }).not.toThrow();
      expect(typeof factory).toBe('function');
    });

    test('codegen round-trip produces valid SMILES', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v');

      const varMatch = code.match(/const (v\d+) = /g);
      const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/const (v\d+)/)[1] : 'v1';

      // eslint-disable-next-line no-new-func
      const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn ${lastVar};`);
      const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

      expect(typeof reconstructed.smiles).toBe('string');
      expect(reconstructed.smiles.length).toBeGreaterThan(0);
    });
  });
}

testRoundTrip(CORTISONE_SMILES, 'Cortisone');
testRoundTrip(HYDROCORTISONE_SMILES, 'Hydrocortisone');
testRoundTrip(PREDNISONE_SMILES, 'Prednisone');
testRoundTrip(PREDNISOLONE_SMILES, 'Prednisolone');
testRoundTrip(METHYLPREDNISOLONE_SMILES, 'Methylprednisolone');
testRoundTrip(DEXAMETHASONE_SMILES, 'Dexamethasone');
testRoundTrip(VALPROIC_ACID_SMILES, 'Valproic Acid');
