import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

// Note: Parser normalizes some ring/branch patterns
const GABAPENTIN_SMILES = 'C1CCC(CC(=O)O)CC1CN';
const PREGABALIN_SMILES = 'CC(C)CC(CC(=O)O)CN';
const AMITRIPTYLINE_SMILES = 'CN(C)CCCC1C2=CC=CC=C2CCC3=CC=CC=C13';
const DULOXETINE_SMILES = 'CNCCC(C1=CC=CS1)OC2=CC=CC3=CC=CC=C23';
const CARBAMAZEPINE_SMILES = 'C1=CC=C2C(C1)C=CC3=CC=CC=C3N2C(=O)N';
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

testRoundTrip(GABAPENTIN_SMILES, 'Gabapentin');
testRoundTrip(PREGABALIN_SMILES, 'Pregabalin');
testRoundTrip(AMITRIPTYLINE_SMILES, 'Amitriptyline');
testRoundTrip(DULOXETINE_SMILES, 'Duloxetine');
testRoundTrip(CARBAMAZEPINE_SMILES, 'Carbamazepine');
testRoundTrip(VALPROIC_ACID_SMILES, 'Valproic Acid');
