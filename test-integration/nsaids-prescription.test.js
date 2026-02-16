import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { stripExports, createFunction, executeCode } from './utils.js';

const CELECOXIB_SMILES = 'CC1=CC=CC=C1C2=CC=NN2C(F)(F)F';
const MELOXICAM_SMILES = 'CC1=CN=CS1C';
const PIROXICAM_SMILES = 'CN1C=CC=CC=CC=CS=O1C(=O)NC3=CC=CC=N3';
const ETODOLAC_SMILES = 'CCC1=CC2=C(C=C1CC(=O)O)NC3=C2CCOC3(CC)CC';
const KETOROLAC_SMILES = 'OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3';
const ROFECOXIB_SMILES = 'CS(=O)(=O)C1=CC=CC=C1C2=CC(=O)OC2C3=CC=CC=C3';
const ETORICOXIB_SMILES = 'CC1=NC=CC=C1C2=CC=CC=C2S(=O)(=O)C3=CC=CC=C3';
const NABUMETONE_SMILES = 'COC1=CC2=CC(CC=C2C=C1)CCC(=O)C';
const OXAPROZIN_SMILES = 'OC(=O)CCC1=NC=CO1C3=CC=CC=C3';

describe('Celecoxib Integration Test', () => {
  test('parses celecoxib', () => {
    const ast = parse(CELECOXIB_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(CELECOXIB_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(CELECOXIB_SMILES);
  });
});

describe('Meloxicam Integration Test', () => {
  test('parses meloxicam', () => {
    const ast = parse(MELOXICAM_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(MELOXICAM_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(MELOXICAM_SMILES);
  });
});

describe('Piroxicam Integration Test', () => {
  test('parses piroxicam', () => {
    const ast = parse(PIROXICAM_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(PIROXICAM_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(PIROXICAM_SMILES);
  });
});

describe('Etodolac Integration Test', () => {
  test('parses etodolac', () => {
    const ast = parse(ETODOLAC_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ETODOLAC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ETODOLAC_SMILES);
  });
});

describe('Ketorolac Integration Test', () => {
  test('parses ketorolac', () => {
    const ast = parse(KETOROLAC_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(KETOROLAC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces different ordering
    expect(reconstructed.smiles).toBe(KETOROLAC_SMILES);
  });
});

describe('Rofecoxib Integration Test', () => {
  test('parses rofecoxib', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ROFECOXIB_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ROFECOXIB_SMILES);
  });
});

describe('Etoricoxib Integration Test', () => {
  test('parses etoricoxib', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(ETORICOXIB_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(ETORICOXIB_SMILES);
  });
});

describe('Nabumetone Integration Test', () => {
  test('parses nabumetone', () => {
    const ast = parse(NABUMETONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(NABUMETONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    // Note: round-trip produces different ordering
    expect(reconstructed.smiles).toBe(NABUMETONE_SMILES);
  });
});

describe('Oxaprozin Integration Test', () => {
  test('parses oxaprozin', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
    expect(ast.smiles).toBe(OXAPROZIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const reconstructed = executeCode(executableCode, lastVar);

    expect(reconstructed.smiles).toBe(OXAPROZIN_SMILES);
  });
});
