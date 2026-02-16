import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const ACETAMINOPHEN_SMILES = 'CC(=O)Nc1ccc(O)cc1';
const PHENACETIN_SMILES = 'CC(=O)Nc1ccc(OCC)cc1';

describe('Acetaminophen Integration Test', () => {
  test('parses acetaminophen', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ACETAMINOPHEN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ACETAMINOPHEN_SMILES);
  });
});

describe('Phenacetin Integration Test', () => {
  test('parses phenacetin', () => {
    const ast = parse(PHENACETIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(PHENACETIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PHENACETIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(PHENACETIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PHENACETIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(PHENACETIN_SMILES);
  });
});
