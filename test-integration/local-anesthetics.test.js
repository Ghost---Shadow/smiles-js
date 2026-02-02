import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const LIDOCAINE_SMILES = 'CCN(CC)CC(=O)NC1=C(C)C=CC=C1C';
const BUPIVACAINE_SMILES = 'CCCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C';
const ROPIVACAINE_SMILES = 'CCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C';
const MEPIVACAINE_SMILES = 'CN1CCCCC1C(=O)NC2=C(C)C=CC=C2C';
const PRILOCAINE_SMILES = 'CCCNC(C)C(=O)NC1=CC=CC=C1C';
const BENZOCAINE_SMILES = 'CCOC(=O)C1=CC=CC=C1N';
const TETRACAINE_SMILES = 'CCCCNC1=CC=CC=C1C(=O)OCCN(C)C';
const PROCAINE_SMILES = 'CCN(CC)CCOC(=O)C1=CC=CC=C1N';

const LIDOCAINE_CODE = `export const v1 = Linear(['C', 'C', 'N', 'C', 'C', 'N']);
export const v2 = Linear(['C', 'C']);
export const v3 = v1.attach(v2, 3);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 5);
export const v6 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v7 = Linear(['C']);
export const v8 = v6.attach(v7, 2);
export const v9 = Linear(['C']);
export const v10 = Molecule([v5, v8, v9]);`;

const BUPIVACAINE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Linear(['C', 'N']);
export const v5 = Linear(['O'], ['=']);
export const v6 = v4.attach(v5, 1);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v8 = Linear(['C']);
export const v9 = v7.attach(v8, 2);
export const v10 = Linear(['C']);
export const v11 = Molecule([v1, v3, v6, v9, v10]);`;

const ROPIVACAINE_CODE = `export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Linear(['C', 'N']);
export const v5 = Linear(['O'], ['=']);
export const v6 = v4.attach(v5, 1);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v8 = Linear(['C']);
export const v9 = v7.attach(v8, 2);
export const v10 = Linear(['C']);
export const v11 = Molecule([v1, v3, v6, v9, v10]);`;

const MEPIVACAINE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Linear(['C', 'N']);
export const v5 = Linear(['O'], ['=']);
export const v6 = v4.attach(v5, 1);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v8 = Linear(['C']);
export const v9 = v7.attach(v8, 2);
export const v10 = Linear(['C']);
export const v11 = Molecule([v1, v3, v6, v9, v10]);`;

const PRILOCAINE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'N', 'C', 'C', 'N']);
export const v2 = Linear(['C']);
export const v3 = v1.attach(v2, 5);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 6);
export const v6 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v7 = Linear(['C']);
export const v8 = Molecule([v5, v6, v7]);`;

const BENZOCAINE_CODE = `export const v1 = Linear(['C', 'C', 'O', 'C']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 4);
export const v4 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v5 = Linear(['N']);
export const v6 = Molecule([v3, v4, v5]);`;

const TETRACAINE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'N']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v3 = Linear(['C', 'O', 'C', 'C', 'N', 'C']);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 1);
export const v6 = Linear(['C']);
export const v7 = v5.attach(v6, 5);
export const v8 = Molecule([v1, v2, v7]);`;

const PROCAINE_CODE = `export const v1 = Linear(['C', 'C', 'N', 'C', 'C', 'O', 'C']);
export const v2 = Linear(['C', 'C']);
export const v3 = v1.attach(v2, 3);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 7);
export const v6 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v7 = Linear(['N']);
export const v8 = Molecule([v5, v6, v7]);`;

describe('Lidocaine Integration Test', () => {
  test('parses lidocaine', () => {
    const ast = parse(LIDOCAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'N', 'C', 'C', 'N'],
          bonds: [null, null, null, null, null],
          attachments: {
            3: [
              {
                type: 'linear',
                atoms: ['C', 'C'],
                bonds: [null, null],
                attachments: {},
              },
            ],
            5: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {
            2: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(LIDOCAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(LIDOCAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(LIDOCAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(LIDOCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(LIDOCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(LIDOCAINE_SMILES);
  });
});

describe('Bupivacaine Integration Test', () => {
  test('parses bupivacaine', () => {
    const ast = parse(BUPIVACAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'C'],
          bonds: [null, null, null],
          attachments: {},
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: { 1: 'N' },
          attachments: {},
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'N'],
          bonds: [null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {
            2: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(BUPIVACAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BUPIVACAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(BUPIVACAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(BUPIVACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(BUPIVACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(BUPIVACAINE_SMILES);
  });
});

describe('Ropivacaine Integration Test', () => {
  test('parses ropivacaine', () => {
    const ast = parse(ROPIVACAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C'],
          bonds: [null, null],
          attachments: {},
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: { 1: 'N' },
          attachments: {},
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'N'],
          bonds: [null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {
            2: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(ROPIVACAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ROPIVACAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ROPIVACAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ROPIVACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ROPIVACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ROPIVACAINE_SMILES);
  });
});

describe('Mepivacaine Integration Test', () => {
  test('parses mepivacaine', () => {
    const ast = parse(MEPIVACAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: { 1: 'N' },
          attachments: {},
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'N'],
          bonds: [null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {
            2: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(MEPIVACAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MEPIVACAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(MEPIVACAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(MEPIVACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(MEPIVACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(MEPIVACAINE_SMILES);
  });
});

describe('Prilocaine Integration Test', () => {
  test('parses prilocaine', () => {
    const ast = parse(PRILOCAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'N', 'C', 'C', 'N'],
          bonds: [null, null, null, null, null, null],
          attachments: {
            5: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
            6: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(PRILOCAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PRILOCAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PRILOCAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PRILOCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PRILOCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(PRILOCAINE_SMILES);
  });
});

describe('Benzocaine Integration Test', () => {
  test('parses benzocaine', () => {
    const ast = parse(BENZOCAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'O', 'C'],
          bonds: [null, null, null],
          attachments: {
            4: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['N'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(BENZOCAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BENZOCAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(BENZOCAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(BENZOCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(BENZOCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(BENZOCAINE_SMILES);
  });
});

describe('Tetracaine Integration Test', () => {
  test('parses tetracaine', () => {
    const ast = parse(TETRACAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'C', 'N'],
          bonds: [null, null, null, null],
          attachments: {},
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['C', 'O', 'C', 'C', 'N', 'C'],
          bonds: [null, null, null, null, null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
            5: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
        },
      ],
    });
    expect(ast.smiles).toBe(TETRACAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TETRACAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(TETRACAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TETRACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(TETRACAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(TETRACAINE_SMILES);
  });
});

describe('Procaine Integration Test', () => {
  test('parses procaine', () => {
    const ast = parse(PROCAINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'N', 'C', 'C', 'O', 'C'],
          bonds: [null, null, null, null, null, null],
          attachments: {
            3: [
              {
                type: 'linear',
                atoms: ['C', 'C'],
                bonds: [null, null],
                attachments: {},
              },
            ],
            7: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['N'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(PROCAINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PROCAINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PROCAINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PROCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PROCAINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(PROCAINE_SMILES);
  });
});
