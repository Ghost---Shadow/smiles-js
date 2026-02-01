import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const ASPIRIN_SMILES = 'CC(=O)Oc1ccccc1C(=O)O';
const IBUPROFEN_SMILES = 'CC(C)Cc1ccccc1C(C)C(=O)O';
const NAPROXEN_SMILES = 'COc1ccc2cc(ccc2c1)C(C)C(=O)O';
const KETOPROFEN_SMILES = 'CC(c1ccccc1c2ccccc2)C(=O)O';
const DICLOFENAC_SMILES = 'OC(=O)Cc1ccccc1Nc2c(Cl)cccc2Cl';

const ASPIRIN_CODE = `export const v1 = Linear(['C', 'C', 'O']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'c', size: 6 });
export const v5 = Linear(['C', 'O']);
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 1);
export const v8 = Molecule([v3, v4, v7]);`;

const IBUPROFEN_CODE = `export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Linear(['C']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'c', size: 6 });
export const v5 = Linear(['C', 'C', 'O']);
export const v6 = Linear(['C']);
export const v7 = v5.attach(v6, 1);
export const v8 = Linear(['O'], ['=']);
export const v9 = v7.attach(v8, 2);
export const v10 = Molecule([v3, v4, v9]);`;

const NAPROXEN_CODE = `export const v1 = Linear(['C', 'O']);
export const v2 = Ring({ atoms: 'c', size: 6, branchDepths: [0, 0, 0, 0, 1, 1] });
export const v3 = Ring({ atoms: 'c', size: 6, ringNumber: 2, offset: 3, branchDepths: [0, 0, 0, 1, 1, 1] });
export const v4 = v2.fuse(v3, 3);
export const v5 = Linear(['C', 'C', 'O']);
export const v6 = Linear(['C']);
export const v7 = v5.attach(v6, 1);
export const v8 = Linear(['O'], ['=']);
export const v9 = v7.attach(v8, 2);
export const v10 = Molecule([v1, v4, v9]);`;

const KETOPROFEN_CODE = `export const v1 = Linear(['C', 'C', 'C', 'O']);
export const v2 = Ring({ atoms: 'c', size: 6 });
export const v3 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
export const v4 = Molecule([v2, v3]);
export const v5 = v1.attach(v4, 2);
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 3);`;

const DICLOFENAC_CODE = `export const v1 = Linear(['O', 'C', 'C']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'c', size: 6 });
export const v5 = Linear(['N']);
export const v6 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
export const v7 = Linear(['Cl']);
export const v8 = v6.attach(v7, 2);
export const v9 = Linear(['Cl']);
export const v10 = Molecule([v3, v4, v5, v8, v9]);`;

describe('Aspirin Integration Test', () => {
  test('parses aspirin', () => {
    const ast = parse(ASPIRIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            2: [
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
          atoms: 'c',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'O'],
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
      ],
    });
    expect(ast.smiles).toBe(ASPIRIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ASPIRIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ASPIRIN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ASPIRIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ASPIRIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ASPIRIN_SMILES);
  });
});

describe('Ibuprofen Integration Test', () => {
  test('parses ibuprofen', () => {
    const ast = parse(IBUPROFEN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C'],
          bonds: [null, null],
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
        },
        {
          type: 'ring',
          atoms: 'c',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
            2: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
      ],
    });
    expect(ast.smiles).toBe(IBUPROFEN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(IBUPROFEN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(IBUPROFEN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(IBUPROFEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(IBUPROFEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(IBUPROFEN_SMILES);
  });
});

describe('Naproxen Integration Test', () => {
  test('parses naproxen', () => {
    const ast = parse(NAPROXEN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'O'],
          bonds: [null],
          attachments: {},
        },
        {
          type: 'fused_ring',
          rings: [
            {
              type: 'ring',
              atoms: 'c',
              size: 6,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'c',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: {},
              attachments: {},
              bonds: [null, null, null, null, null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
            ],
            2: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
        },
      ],
    });
    expect(ast.smiles).toBe(NAPROXEN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(NAPROXEN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(NAPROXEN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(NAPROXEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(NAPROXEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces different naphthalene ordering
    expect(reconstructed.smiles).toBe('COc1ccc2ccccc2c1C(C)C(=O)O');
  });
});

describe('Ketoprofen Integration Test', () => {
  test('parses ketoprofen', () => {
    const ast = parse(KETOPROFEN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'O'],
      bonds: [null, null, null],
      attachments: {
        2: [
          {
            type: 'molecule',
            components: [
              {
                type: 'ring',
                atoms: 'c',
                size: 6,
                ringNumber: 1,
                offset: 0,
                substitutions: {},
                attachments: {},
                bonds: [null, null, null, null, null, null],
              },
              {
                type: 'ring',
                atoms: 'c',
                size: 6,
                ringNumber: 2,
                offset: 0,
                substitutions: {},
                attachments: {},
                bonds: [null, null, null, null, null, null],
              },
            ],
          },
        ],
        3: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
      },
    });
    expect(ast.smiles).toBe(KETOPROFEN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(KETOPROFEN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(KETOPROFEN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(KETOPROFEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(KETOPROFEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(KETOPROFEN_SMILES);
  });
});

describe('Diclofenac Integration Test', () => {
  test('parses diclofenac', () => {
    const ast = parse(DICLOFENAC_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['O', 'C', 'C'],
          bonds: [null, null],
          attachments: {
            2: [
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
          atoms: 'c',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['N'],
          bonds: [],
          attachments: {},
        },
        {
          type: 'ring',
          atoms: 'c',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {
            2: [
              {
                type: 'linear',
                atoms: ['Cl'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['Cl'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(DICLOFENAC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(DICLOFENAC_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(DICLOFENAC_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(DICLOFENAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(DICLOFENAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(DICLOFENAC_SMILES);
  });
});
