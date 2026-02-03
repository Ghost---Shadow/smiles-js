import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const ANANDAMIDE_SMILES = 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO';
const ARACHIDONOYLGLYCEROL2_SMILES = 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO';
const THC_SMILES = 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O';
const CBD_SMILES = 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';
const NABILONE_SMILES = 'CCCCCCC(C)(C)C1=CC(=C2C3CC(=O)CCC3C(OC2=C1)(C)C)O';
const PALMITOYLETHANOLAMIDE_SMILES = 'CCCCCCCCCCCCCCCC(=O)NCCO';

describe('Anandamide Integration Test', () => {
  test('parses anandamide', () => {
    const ast = parse(ANANDAMIDE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ANANDAMIDE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ANANDAMIDE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ANANDAMIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ANANDAMIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ANANDAMIDE_SMILES);
  });
});

describe('2-Arachidonoylglycerol Integration Test', () => {
  test('parses 2-arachidonoylglycerol', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ARACHIDONOYLGLYCEROL2_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ARACHIDONOYLGLYCEROL2_SMILES);
  });
});

describe('THC Integration Test', () => {
  test('parses THC', () => {
    const ast = parse(THC_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(THC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(THC_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(THC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(THC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(THC_SMILES);
  });
});

describe('CBD Integration Test', () => {
  test('parses CBD', () => {
    const ast = parse(CBD_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(CBD_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CBD_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CBD_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CBD_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(CBD_SMILES);
  });
});

describe('Nabilone Integration Test', () => {
  test('parses nabilone', () => {
    const ast = parse(NABILONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(NABILONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(NABILONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(NABILONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(NABILONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(NABILONE_SMILES);
  });
});

describe('Palmitoylethanolamide Integration Test', () => {
  test('parses palmitoylethanolamide', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(PALMITOYLETHANOLAMIDE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(PALMITOYLETHANOLAMIDE_SMILES);
  });
});
