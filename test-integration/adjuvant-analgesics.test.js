import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const GABAPENTIN_SMILES = 'C1CCC(CC1)(CC(=O)O)CN';
const PREGABALIN_SMILES = 'CC(C)CC(CC(=O)O)CN';
const AMITRIPTYLINE_SMILES = 'CN(C)CCC=C1C2=CC=CC=C2CCC3=CC=CC=C31';
const DULOXETINE_SMILES = 'CNCCC(C1=CC=CS1)OC2=CC=CC3=CC=CC=C32';
const CARBAMAZEPINE_SMILES = 'C1=CC=C2C(=C1)C=CC3=CC=CC=C3N2C(=O)N';
const VALPROIC_ACID_SMILES = 'CCCC(CCC)C(=O)O';

describe('Gabapentin Integration Test', () => {
  test('parses gabapentin', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(GABAPENTIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // branchDepths preserves the exact SMILES for branch-crossing rings
    expect(reconstructed.smiles).toBe(GABAPENTIN_SMILES);
  });
});

describe('Pregabalin Integration Test', () => {
  test('parses pregabalin', () => {
    const ast = parse(PREGABALIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(PREGABALIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PREGABALIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PREGABALIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(PREGABALIN_SMILES);
  });
});

describe('Amitriptyline Integration Test', () => {
  test('parses amitriptyline', () => {
    const ast = parse(AMITRIPTYLINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(AMITRIPTYLINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(AMITRIPTYLINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(AMITRIPTYLINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // Round-trips to original SMILES
    expect(reconstructed.smiles).toBe(AMITRIPTYLINE_SMILES);
  });
});

describe('Duloxetine Integration Test', () => {
  test('parses duloxetine', () => {
    const ast = parse(DULOXETINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(DULOXETINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(DULOXETINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(DULOXETINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // Round-trips to original SMILES
    expect(reconstructed.smiles).toBe(DULOXETINE_SMILES);
  });
});

describe('Carbamazepine Integration Test', () => {
  test('parses carbamazepine', () => {
    const ast = parse(CARBAMAZEPINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(CARBAMAZEPINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CARBAMAZEPINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CARBAMAZEPINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // Round-trip produces the same SMILES as input
    expect(reconstructed.smiles).toBe(CARBAMAZEPINE_SMILES);
  });
});

describe('Valproic Acid Integration Test', () => {
  test('parses valproic acid', () => {
    const ast = parse(VALPROIC_ACID_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(VALPROIC_ACID_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(VALPROIC_ACID_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(VALPROIC_ACID_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(VALPROIC_ACID_SMILES);
  });
});
