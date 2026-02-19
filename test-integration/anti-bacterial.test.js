import {
  describe, test, expect, beforeAll,
} from 'bun:test';
import initRDKitModule from '@rdkit/rdkit';
import { parse } from '../src/parser/index.js';
import {
  stripExports, createFunction, executeCode,
} from './utils.js';

let RDKit;
beforeAll(async () => {
  RDKit = await initRDKitModule();
});

const PENICILLIN_G_SMILES = 'CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O';
const AMOXICILLIN_SMILES = 'CC1(C)SC2C(NC(=O)C(N)c3ccc(O)cc3)C(=O)N2C1C(=O)O';
const AMPICILLIN_SMILES = 'CC1(C)SC2C(NC(=O)C(N)c3ccccc3)C(=O)N2C1C(=O)O';
const CEPHALEXIN_SMILES = 'CC1=C(N2C(C(C2=O)NC(=O)C(C3=CC=CC=C3)N)SC1)C(=O)O';
const CEFTRIAXONE_SMILES = 'CON=C(C(=O)NC1C(=O)N2C(C(=O)O)=C(CSc3nc(=O)c(=O)[nH]n3C)CSC12)c1csc(N)n1';
const CIPROFLOXACIN_SMILES = 'O=C(O)c1cn(C2CC2)c2cc(N3CCNCC3)c(F)cc2c1=O';
const LEVOFLOXACIN_SMILES = 'CC1COc2c(N3CCN(C)CC3)c(F)cc3c(=O)c(C(=O)O)cn1c23';
const TETRACYCLINE_SMILES = 'CC1(C2CC3C(C(=O)C(=C(C3(C(=O)C2=C(C4=C1C=CC=C4O)O)O)O)C(=O)N)N(C)C)O';
const DOXYCYCLINE_SMILES = 'CN(C)C1C2CC3C(=C(O)c4c(O)cccc43)C(=O)C2(O)C(=O)C1O';
const MINOCYCLINE_SMILES = 'CN(C)C1C2CC3CC4=C(C=CC(=C4C(=C3C(=O)C2(C(=C(C1=O)C(=O)N)O)O)O)O)N(C)C';
const ERYTHROMYCIN_SMILES = 'CCC1C(C(C(C(=O)C(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)O)(C)O';
const AZITHROMYCIN_SMILES = 'CCC1C(C(C(N(CC(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)C)O)(C)O';
const CLARITHROMYCIN_SMILES = 'CCC1C(C(C(C(=O)C(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)O)(C)OC';
const TRIMETHOPRIM_SMILES = 'COc1cc(Cc2cnc(N)nc2N)cc(OC)c1OC';
const SULFAMETHOXAZOLE_SMILES = 'Cc1cc(NS(=O)(=O)c2ccc(N)cc2)no1';
const METRONIDAZOLE_SMILES = 'Cc1ncc([N+](=O)[O-])n1CCO';
const VANCOMYCIN_SMILES = 'O=C(O)C1NC(=O)C(Cc2cc(Cl)c(Oc3cc4cc(Cl)c(O)c(C(=O)NC(CC(N)=O)C(=O)O)c4cc3O)cc2)NC(=O)C(NC(=O)c2ccc(O)c(c2)-c2cc(CC(NC(=O)C(N)Cc3ccc(O)cc3)C(=O)N1)ccc2O)Cc2ccc(O)cc2';
const LINEZOLID_SMILES = 'CC(=O)NCC1CN(C(=O)O1)C2=CC(=C(C=C2)N3CCOCC3)F';
const CLINDAMYCIN_SMILES = 'CCCC1CC(N(C1)C)C(=O)NC(C2C(C(C(C(O2)SC)O)O)O)C(C)Cl';
const RIFAMPICIN_SMILES = 'COC1=C2NC(=O)C3=CC(=O)C(OC)=CC3=C2C=C(C)C(O)=C1OC(=O)C=CC=CC=CC=CC(C)C(O)C(C)C(O)C1(C)OCC(=O)N1';
const ISONIAZID_SMILES = 'NNC(=O)c1ccncc1';
const NITROFURANTOIN_SMILES = 'OC1CN=NC1=Cc1ccc([N+](=O)[O-])o1';
const MEROPENEM_SMILES = 'CC1C2CC(SC3CN4CCCC4C3NC(=O)C(=C)N)C(=O)N2C(=C1)C(=O)O';
const DAPTOMYCIN_SMILES = 'CCCCCCCCCC(=O)NC(CC(N)=O)C(=O)NC(CC(O)=O)C(=O)NC(Cc1ccccc1)C(=O)NC(CC(N)=O)C(=O)NC(CC(O)=O)C(=O)NC(CO)C(=O)O';

// Aliases
const RIFAMPIN_SMILES = RIFAMPICIN_SMILES;

function makeTests(name, smiles) {
  describe(`${name} Integration Test`, () => {
    test(`parses ${name.toLowerCase()}`, () => {
      const ast = parse(smiles);
      const obj = ast.toObject();
      expect(obj).toMatchSnapshot();
    });

    test('AST round-trips correctly', () => {
      const ast = parse(smiles);
      expect(ast.smiles).toBe(smiles);
    });

    test('generates valid code via toCode()', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v');
      expect(code).toMatchSnapshot();
    });

    test('generates valid verbose code via toCode()', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v', { verbose: true });
      expect(code).toMatchSnapshot();
    });

    test('generated code is valid JavaScript', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v');
      const executableCode = stripExports(code);

      let factory;
      expect(() => {
        factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
      }).not.toThrow();
      expect(typeof factory).toBe('function');
    });

    test('codegen round-trip: generated code produces valid SMILES', () => {
      const ast = parse(smiles);
      const code = ast.toCode('v', { verbose: true });
      const executableCode = stripExports(code);
      const varMatch = code.match(/export const (v\d+) = /g);
      const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
      const reconstructed = executeCode(executableCode, lastVar);
      expect(reconstructed.smiles).toBe(smiles);
    });

    test('RDKit validates SMILES', () => {
      const mol = RDKit.get_mol(smiles);
      expect(mol).not.toBeNull();
    });
  });
}

makeTests('Penicillin G', PENICILLIN_G_SMILES);
makeTests('Amoxicillin', AMOXICILLIN_SMILES);
makeTests('Ampicillin', AMPICILLIN_SMILES);
makeTests('Cephalexin', CEPHALEXIN_SMILES);
makeTests('Ceftriaxone', CEFTRIAXONE_SMILES);
makeTests('Ciprofloxacin', CIPROFLOXACIN_SMILES);
makeTests('Levofloxacin', LEVOFLOXACIN_SMILES);
makeTests('Tetracycline', TETRACYCLINE_SMILES);
makeTests('Doxycycline', DOXYCYCLINE_SMILES);
makeTests('Minocycline', MINOCYCLINE_SMILES);
makeTests('Erythromycin', ERYTHROMYCIN_SMILES);
makeTests('Azithromycin', AZITHROMYCIN_SMILES);
makeTests('Clarithromycin', CLARITHROMYCIN_SMILES);
makeTests('Trimethoprim', TRIMETHOPRIM_SMILES);
makeTests('Sulfamethoxazole', SULFAMETHOXAZOLE_SMILES);
makeTests('Metronidazole', METRONIDAZOLE_SMILES);
makeTests('Vancomycin', VANCOMYCIN_SMILES);
makeTests('Linezolid', LINEZOLID_SMILES);
makeTests('Clindamycin', CLINDAMYCIN_SMILES);
makeTests('Rifampicin', RIFAMPICIN_SMILES);
makeTests('Isoniazid', ISONIAZID_SMILES);
makeTests('Nitrofurantoin', NITROFURANTOIN_SMILES);
makeTests('Meropenem', MEROPENEM_SMILES);
makeTests('Daptomycin', DAPTOMYCIN_SMILES);

// Alias test
describe('Rifampin Integration Test', () => {
  test('parses rifampin (alias for rifampicin)', () => {
    const ast = parse(RIFAMPIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(RIFAMPIN_SMILES);
    expect(ast.smiles).toBe(RIFAMPIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(RIFAMPIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(RIFAMPIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(RIFAMPIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(RIFAMPIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(RIFAMPIN_SMILES);
  });

  test('RDKit validates SMILES', () => {
    const mol = RDKit.get_mol(RIFAMPIN_SMILES);
    expect(mol).not.toBeNull();
  });
});
