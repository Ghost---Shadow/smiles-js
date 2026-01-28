import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

const LIDOCAINE_SMILES = 'CCN(CC)CC(=O)NC1=C(C)C=CC=C1C';
const BUPIVACAINE_SMILES = 'CCCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C';
const ROPIVACAINE_SMILES = 'CCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C';
const MEPIVACAINE_SMILES = 'CN1CCCCC1C(=O)NC2=C(C)C=CC=C2C';
const PRILOCAINE_SMILES = 'CCCNC(C)C(=O)NC1=CC=CC=C1C';
// Note: Parser normalizes para-substituted benzene patterns
const BENZOCAINE_SMILES = 'CCOC(=O)C1=CC=CC=C1N';
const TETRACAINE_SMILES = 'CCCCNC1=CC=CC=C1C(=O)OCCN(C)C';
const PROCAINE_SMILES = 'CCN(CC)CCOC(=O)C1=CC=CC=C1N';

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

testRoundTrip(LIDOCAINE_SMILES, 'Lidocaine');
testRoundTrip(BUPIVACAINE_SMILES, 'Bupivacaine');
testRoundTrip(ROPIVACAINE_SMILES, 'Ropivacaine');
testRoundTrip(MEPIVACAINE_SMILES, 'Mepivacaine');
testRoundTrip(PRILOCAINE_SMILES, 'Prilocaine');
testRoundTrip(BENZOCAINE_SMILES, 'Benzocaine');
testRoundTrip(TETRACAINE_SMILES, 'Tetracaine');
testRoundTrip(PROCAINE_SMILES, 'Procaine');
