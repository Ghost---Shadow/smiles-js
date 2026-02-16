import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const MORPHINE_SMILES = 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O';
const CODEINE_SMILES = 'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(C=C4)O';
const OXYCODONE_SMILES = 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O';
const HYDROCODONE_SMILES = 'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(=O)CC4';
const FENTANYL_SMILES = 'CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3';
const TRAMADOL_SMILES = 'CN(C)CC1CCCCC1(C2=CC(=CC=C2)OC)O';
const METHADONE_SMILES = 'CCC(=O)C(CC(C)N(C)C)(C1=CC=CC=C1)C2=CC=CC=C2';

describe('Morphine Integration Test', () => {
  test('parses morphine', () => {
    const ast = parse(MORPHINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MORPHINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(MORPHINE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(MORPHINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(MORPHINE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces simplified structure
    expect(reconstructed.smiles).toBe(MORPHINE_SMILES);
  });
});

describe('Codeine Integration Test', () => {
  test('parses codeine', () => {
    const ast = parse(CODEINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CODEINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(CODEINE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CODEINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CODEINE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(CODEINE_SMILES);
  });
});

describe('Oxycodone Integration Test', () => {
  test('parses oxycodone', () => {
    const ast = parse(OXYCODONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(OXYCODONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(OXYCODONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(OXYCODONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(OXYCODONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(OXYCODONE_SMILES);
  });
});

describe('Hydrocodone Integration Test', () => {
  test('parses hydrocodone', () => {
    const ast = parse(HYDROCODONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(HYDROCODONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(HYDROCODONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(HYDROCODONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(HYDROCODONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces simplified structure
    expect(reconstructed.smiles).toBe(HYDROCODONE_SMILES);
  });
});

describe('Fentanyl Integration Test', () => {
  test('parses fentanyl', () => {
    const ast = parse(FENTANYL_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(FENTANYL_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(FENTANYL_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(FENTANYL_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(FENTANYL_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces slightly different ring numbering
    expect(reconstructed.smiles).toBe(FENTANYL_SMILES);
  });
});

describe('Tramadol Integration Test', () => {
  test('parses tramadol', () => {
    const ast = parse(TRAMADOL_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TRAMADOL_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(TRAMADOL_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TRAMADOL_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(TRAMADOL_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces slightly different structure with branch notation
    expect(reconstructed.smiles).toBe(TRAMADOL_SMILES);
  });
});

describe('Methadone Integration Test', () => {
  test('parses methadone', () => {
    const ast = parse(METHADONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(METHADONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(METHADONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(METHADONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(METHADONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(METHADONE_SMILES);
  });
});
