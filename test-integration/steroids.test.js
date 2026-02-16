import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import {
  stripExports, createFunction, executeCode,
} from './utils.js';

const CORTISONE_SMILES = 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12';
const HYDROCORTISONE_SMILES = 'CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12O';
const PREDNISONE_SMILES = 'CC12CC(=O)C=CC1=CC(O)C1C2CCC2(C)C(C(=O)CO)CCC12';
const PREDNISOLONE_SMILES = 'CC12CC(=O)C=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12';
const METHYLPREDNISOLONE_SMILES = 'CC12CC(=O)C(C)=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12';
const DEXAMETHASONE_SMILES = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO';
const TRIAMCINOLONE_SMILES = 'CC12CC(O)C3C(CCC4=CC(=O)C=CC34C)C1(F)C(O)CC2(C)C(=O)CO';
const BUDESONIDE_SMILES = 'CCCC1OC2CC3C4CCC5=CC(=O)C=CC5(C)C4(F)C(O)CC3(C)C2(O1)C(=O)CO';
const FLUTICASONE_SMILES = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=S)OCF';
const BECLOMETHASONE_SMILES = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(Cl)C(O)CC2(C)C1(O)C(=O)CO';
const FLUDROCORTISONE_SMILES = 'CC12CCC(=O)C=C1CCC1C2(F)C(O)CC2(C)C(C(=O)CO)CCC12';
const MOMETASONE_SMILES = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(Cl)C(O)CC2(C)C1(O)C(=O)CCl';

// Aliases - cortisol = hydrocortisone, betamethasone = dexamethasone (same SMILES)
const CORTISOL_SMILES = HYDROCORTISONE_SMILES;
const BETAMETHASONE_SMILES = DEXAMETHASONE_SMILES;

describe('Cortisone Integration Test', () => {
  test('parses cortisone', () => {
    const ast = parse(CORTISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(CORTISONE_SMILES);
    expect(ast.smiles).toBe(CORTISONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CORTISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(CORTISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CORTISONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CORTISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(CORTISONE_SMILES);
  });
});

describe('Hydrocortisone Integration Test', () => {
  test('parses hydrocortisone', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    expect(ast.smiles).toBe(HYDROCORTISONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(HYDROCORTISONE_SMILES);
  });
});

describe('Prednisone Integration Test', () => {
  test('parses prednisone', () => {
    const ast = parse(PREDNISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(PREDNISONE_SMILES);
    expect(ast.smiles).toBe(PREDNISONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PREDNISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(PREDNISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PREDNISONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PREDNISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(PREDNISONE_SMILES);
  });
});

describe('Prednisolone Integration Test', () => {
  test('parses prednisolone', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    expect(ast.smiles).toBe(PREDNISOLONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(PREDNISOLONE_SMILES);
  });
});

describe('Methylprednisolone Integration Test', () => {
  test('parses methylprednisolone', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    expect(ast.smiles).toBe(METHYLPREDNISOLONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(METHYLPREDNISOLONE_SMILES);
  });
});

describe('Dexamethasone Integration Test', () => {
  test('parses dexamethasone', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    expect(ast.smiles).toBe(DEXAMETHASONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(DEXAMETHASONE_SMILES);
  });
});

describe('Triamcinolone Integration Test', () => {
  test('parses triamcinolone', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    expect(ast.smiles).toBe(TRIAMCINOLONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(TRIAMCINOLONE_SMILES);
  });
});

describe('Budesonide Integration Test', () => {
  test('parses budesonide', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(BUDESONIDE_SMILES);
    expect(ast.smiles).toBe(BUDESONIDE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(BUDESONIDE_SMILES);
  });
});

describe('Fluticasone Integration Test', () => {
  test('parses fluticasone', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(FLUTICASONE_SMILES);
    expect(ast.smiles).toBe(FLUTICASONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(FLUTICASONE_SMILES);
  });
});

describe('Beclomethasone Integration Test', () => {
  test('parses beclomethasone', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    expect(ast.smiles).toBe(BECLOMETHASONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(BECLOMETHASONE_SMILES);
  });
});

describe('Fludrocortisone Integration Test', () => {
  test('parses fludrocortisone', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    expect(ast.smiles).toBe(FLUDROCORTISONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(FLUDROCORTISONE_SMILES);
  });
});

describe('Mometasone Integration Test', () => {
  test('parses mometasone', () => {
    const ast = parse(MOMETASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(MOMETASONE_SMILES);
    expect(ast.smiles).toBe(MOMETASONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MOMETASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(MOMETASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(MOMETASONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(MOMETASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(MOMETASONE_SMILES);
  });
});

describe('Cortisol Integration Test', () => {
  test('parses cortisol (alias for hydrocortisone)', () => {
    const ast = parse(CORTISOL_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(CORTISOL_SMILES);
    expect(ast.smiles).toBe(CORTISOL_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CORTISOL_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(CORTISOL_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CORTISOL_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CORTISOL_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(CORTISOL_SMILES);
  });
});

describe('Betamethasone Integration Test', () => {
  test('parses betamethasone (same SMILES as dexamethasone)', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    expect(ast.smiles).toBe(BETAMETHASONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(BETAMETHASONE_SMILES);
  });
});
