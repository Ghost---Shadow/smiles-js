import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const TELMISARTAN_SMILES = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
const LOSARTAN_SMILES = 'CCCCC1=NC(Cl)=C(CO)N1CC2=CC=C(C=C2)C3=CC=CC=C3C4=NNN=N4';
const VALSARTAN_SMILES = 'CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C(=O)O';
const IRBESARTAN_SMILES = 'CCCCC1=NC2(CCCC2)C(=O)N1CC3=CC=C(C=C3)C4=CC=CC=C4C5=NNN=N5';

describe('Telmisartan Integration Test', () => {
  test('parses telmisartan', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(TELMISARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(TELMISARTAN_SMILES);
  });
});

describe('Losartan Integration Test', () => {
  test('parses losartan', () => {
    const ast = parse(LOSARTAN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(LOSARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(LOSARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(LOSARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(LOSARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(LOSARTAN_SMILES);
  });
});

describe('Valsartan Integration Test', () => {
  test('parses valsartan', () => {
    const ast = parse(VALSARTAN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(VALSARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(VALSARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(VALSARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(VALSARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(VALSARTAN_SMILES);
  });
});

describe('Irbesartan Integration Test', () => {
  test('parses irbesartan', () => {
    const ast = parse(IRBESARTAN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(IRBESARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(IRBESARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(IRBESARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(IRBESARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces slightly different spiro notation
    expect(reconstructed.smiles).toBe(IRBESARTAN_SMILES);
  });
});
