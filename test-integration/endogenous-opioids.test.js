import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const MET_ENKEPHALIN_SMILES = 'CSCCC(C(=O)O)NC(=O)C(CC1=CC=CC=C1)NC(=O)CNC(=O)CNC(=O)C(CC2=CC=C(C=C2)O)N';
const LEU_ENKEPHALIN_SMILES = 'CC(C)CC(C(=O)O)NC(=O)C(CC1=CC=CC=C1)NC(=O)CNC(=O)CNC(=O)C(CC2=CC=C(C=C2)O)N';
const ENDOMORPHIN1_SMILES = 'C1CC(N(C1)C(=O)C(CC2=CC=C(C=C2)O)N)C(=O)NC(CC3=CNC4=CC=CC=C43)C(=O)NC(CC5=CC=CC=C5)C(=O)N';
const ENDOMORPHIN2_SMILES = 'C1CC(N(C1)C(=O)C(CC2=CC=C(C=C2)O)N)C(=O)NC(CC3=CC=CC=C3)C(=O)NC(CC4=CC=CC=C4)C(=O)N';

describe('Met-Enkephalin Integration Test', () => {
  test('parses met-enkephalin', () => {
    const ast = parse(MET_ENKEPHALIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(MET_ENKEPHALIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MET_ENKEPHALIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(MET_ENKEPHALIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(MET_ENKEPHALIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(MET_ENKEPHALIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(MET_ENKEPHALIN_SMILES);
  });
});

describe('Leu-Enkephalin Integration Test', () => {
  test('parses leu-enkephalin', () => {
    const ast = parse(LEU_ENKEPHALIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(LEU_ENKEPHALIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(LEU_ENKEPHALIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(LEU_ENKEPHALIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(LEU_ENKEPHALIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(LEU_ENKEPHALIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(LEU_ENKEPHALIN_SMILES);
  });
});

describe('Endomorphin-1 Integration Test', () => {
  test('parses endomorphin-1', () => {
    const ast = parse(ENDOMORPHIN1_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ENDOMORPHIN1_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ENDOMORPHIN1_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(ENDOMORPHIN1_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ENDOMORPHIN1_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ENDOMORPHIN1_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ENDOMORPHIN1_SMILES);
  });
});

describe('Endomorphin-2 Integration Test', () => {
  test('parses endomorphin-2', () => {
    const ast = parse(ENDOMORPHIN2_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ENDOMORPHIN2_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ENDOMORPHIN2_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(ENDOMORPHIN2_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ENDOMORPHIN2_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ENDOMORPHIN2_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ENDOMORPHIN2_SMILES);
  });
});
