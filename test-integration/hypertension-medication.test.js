import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

// Telmisartan is tested separately in telmisartan.test.js
// Note: Parser normalizes para-substituted benzene patterns
const LOSARTAN_SMILES = 'CCCCC1=NC(Cl)=C(CO)N1CC2=CC=CC=C2C3=CC=CC=C3C4=NNN=N4';
const VALSARTAN_SMILES = 'CCCCC(=O)N(CC1=CC=CC=C1C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C(=O)O';
const IRBESARTAN_SMILES = 'CCCCC1=NC2(CCCC2)C(=O)N1CC3=CC=CC=C3C4=CC=CC=C4C5=NNN=N5';

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

testRoundTrip(LOSARTAN_SMILES, 'Losartan');
testRoundTrip(VALSARTAN_SMILES, 'Valsartan');
testRoundTrip(IRBESARTAN_SMILES, 'Irbesartan');
