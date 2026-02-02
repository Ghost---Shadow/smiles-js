import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const CELECOXIB_SMILES = 'CC1=CC=CC=C1C2=CC=NN2C(F)(F)F';
const MELOXICAM_SMILES = 'CC1=CN=CS1C';
const PIROXICAM_SMILES = 'CN1C=CC=CC=CC=CS=O1C(=O)NC3=CC=CC=N3';
const ETODOLAC_SMILES = 'CCC1=CC2=C(C=C1CC(=O)O)NC3=C2CCOC3(CC)CC';
const KETOROLAC_SMILES = 'OC(=O)C1CCN2C1=CC=C2C(=O)C3=CC=CC=C3';
const ROFECOXIB_SMILES = 'CS(=O)(=O)C1=CC=CC=C1C2=CC(=O)OC2C3=CC=CC=C3';
const ETORICOXIB_SMILES = 'CC1=NC=CC=C1C2=CC=CC=C2S(=O)(=O)C3=CC=CC=C3';
const NABUMETONE_SMILES = 'COC1=CC2=CC(CC=C2C=C1)CCC(=O)C';
const OXAPROZIN_SMILES = 'OC(=O)CCC1=NC=CO1C3=CC=CC=C3';

const CELECOXIB_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v3 = Ring({ atoms: 'C', size: 5, ringNumber: 2, bonds: ['=', null, '=', null, null] });
export const v4 = v3.substitute(4, 'N');
export const v5 = v4.substitute(5, 'N');
export const v6 = Linear(['C', 'F']);
export const v7 = Linear(['F']);
export const v8 = v6.attach(v7, 1);
export const v9 = Linear(['F']);
export const v10 = v8.attach(v9, 1);
export const v11 = Molecule([v1, v2, v5, v10]);`;

const MELOXICAM_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(3, 'N');
export const v4 = v3.substitute(5, 'S');
export const v5 = Linear(['C']);
export const v6 = Molecule([v1, v4, v5]);`;

const PIROXICAM_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 11, bonds: [null, '=', null, '=', null, '=', null, '=', null, '=', null] });
export const v3 = v2.substitute(1, 'N');
export const v4 = v3.substitute(10, 'S');
export const v5 = v4.substitute(11, 'O');
export const v6 = Linear(['C', 'N']);
export const v7 = Linear(['O'], ['=']);
export const v8 = v6.attach(v7, 1);
export const v9 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v10 = v9.substitute(6, 'N');
export const v11 = Molecule([v1, v5, v8, v10]);`;

const ETODOLAC_CODE = `export const v1 = Linear(['C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 0, 0, 1, 1] });
export const v3 = Ring({ atoms: 'C', size: 5, ringNumber: 2, offset: 2, bonds: ['=', null, null, '=', null] });
export const v4 = v3.substitute(3, 'N');
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, null, null, null, null] });
export const v6 = v5.substitute(5, 'O');
export const v7 = Linear(['C', 'C']);
export const v8 = v6.attach(v7, 6);
export const v9 = FusedRing([v2, v4, v8]);
export const v10 = Linear(['C', 'C']);
export const v11 = Molecule([v1, v9, v10]);`;

const KETOROLAC_CODE = `export const v1 = Linear(['O', 'C']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'C', size: 5 });
export const v5 = v4.substitute(4, 'N');
export const v6 = Ring({ atoms: 'C', size: 5, ringNumber: 2, offset: 3, bonds: [null, '=', null, '=', null] });
export const v7 = v6.substitute(1, 'N');
export const v8 = v5.fuse(v7, 3);
export const v9 = Linear(['C']);
export const v10 = Linear(['O'], ['=']);
export const v11 = v9.attach(v10, 1);
export const v12 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v13 = Molecule([v3, v8, v11, v12]);`;

const ROFECOXIB_CODE = `export const v1 = Linear(['C', 'S']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 2);
export const v6 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v7 = Ring({ atoms: 'C', size: 5, ringNumber: 2, bonds: ['=', null, null, null, null] });
export const v8 = v7.substitute(4, 'O');
export const v9 = Linear(['O'], ['=']);
export const v10 = v8.attach(v9, 3);
export const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v12 = Molecule([v5, v6, v10, v11]);`;

const ETORICOXIB_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v5 = Linear(['S']);
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 1);
export const v8 = Linear(['O'], ['=']);
export const v9 = v7.attach(v8, 1);
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v11 = Molecule([v1, v3, v4, v9, v10]);`;

const NABUMETONE_CODE = `export const v1 = Linear(['C', 'O']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 0, 1, 1, 1] });
export const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, null, null, '=', null], branchDepths: [0, 0, 0, 1, 1, 1] });
export const v4 = v2.fuse(v3, 2);
export const v5 = Linear(['C', 'C', 'C', 'C']);
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 3);
export const v8 = Molecule([v1, v4, v7]);`;

const OXAPROZIN_CODE = `export const v1 = Linear(['O', 'C', 'C', 'C']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v5 = v4.substitute(2, 'N');
export const v6 = v5.substitute(5, 'O');
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v8 = Molecule([v3, v6, v7]);`;

describe('Celecoxib Integration Test', () => {
  test('parses celecoxib', () => {
    const ast = parse(CELECOXIB_SMILES);
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
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 5,
          ringNumber: 2,
          offset: 0,
          substitutions: { 4: 'N', 5: 'N' },
          attachments: {},
          bonds: ['=', null, '=', null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'F'],
          bonds: [null],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['F'],
                bonds: [null],
                attachments: {},
              },
              {
                type: 'linear',
                atoms: ['F'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
        },
      ],
    });
    expect(ast.smiles).toBe(CELECOXIB_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CELECOXIB_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(CELECOXIB_SMILES);
  });
});

describe('Meloxicam Integration Test', () => {
  test('parses meloxicam', () => {
    const ast = parse(MELOXICAM_SMILES);
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
          size: 5,
          ringNumber: 1,
          offset: 0,
          substitutions: { 3: 'N', 5: 'S' },
          attachments: {},
          bonds: ['=', null, '=', null, null],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(MELOXICAM_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(MELOXICAM_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(MELOXICAM_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(MELOXICAM_SMILES);
  });
});

describe('Piroxicam Integration Test', () => {
  test('parses piroxicam', () => {
    const ast = parse(PIROXICAM_SMILES);
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
          size: 11,
          ringNumber: 1,
          offset: 0,
          substitutions: { 1: 'N', 10: 'S', 11: 'O' },
          attachments: {},
          bonds: [null, '=', null, '=', null, '=', null, '=', null, '=', null],
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
          ringNumber: 3,
          offset: 0,
          substitutions: { 6: 'N' },
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(PIROXICAM_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PIROXICAM_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PIROXICAM_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(PIROXICAM_SMILES);
  });
});

describe('Etodolac Integration Test', () => {
  test('parses etodolac', () => {
    const ast = parse(ETODOLAC_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C'],
          bonds: [null],
          attachments: {},
        },
        {
          type: 'fused_ring',
          rings: [
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
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 2,
              substitutions: { 3: 'N' },
              attachments: {},
              bonds: ['=', null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 0,
              substitutions: { 5: 'O' },
              attachments: {
                6: [
                  {
                    type: 'linear',
                    atoms: ['C', 'C'],
                    bonds: [null, null],
                    attachments: {},
                  },
                ],
              },
              bonds: ['=', null, null, null, null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C'],
          bonds: [null],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(ETODOLAC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ETODOLAC_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ETODOLAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ETODOLAC_SMILES);
  });
});

describe('Ketorolac Integration Test', () => {
  test('parses ketorolac', () => {
    const ast = parse(KETOROLAC_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['O', 'C'],
          bonds: [null],
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
          type: 'fused_ring',
          rings: [
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 1,
              offset: 0,
              substitutions: { 4: 'N' },
              attachments: {},
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 3,
              substitutions: { 1: 'N' },
              attachments: {},
              bonds: [null, '=', null, '=', null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
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
          ringNumber: 3,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(KETOROLAC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(KETOROLAC_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(KETOROLAC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces different ordering
    expect(reconstructed.smiles).toBe(KETOROLAC_SMILES);
  });
});

describe('Rofecoxib Integration Test', () => {
  test('parses rofecoxib', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'S'],
          bonds: [null],
          attachments: {
            2: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
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
          type: 'ring',
          atoms: 'C',
          size: 5,
          ringNumber: 2,
          offset: 0,
          substitutions: { 4: 'O' },
          attachments: {
            3: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, null, null, null],
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 3,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(ROFECOXIB_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ROFECOXIB_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ROFECOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ROFECOXIB_SMILES);
  });
});

describe('Etoricoxib Integration Test', () => {
  test('parses etoricoxib', () => {
    const ast = parse(ETORICOXIB_SMILES);
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
          substitutions: { 2: 'N' },
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['S'],
          bonds: [],
          attachments: {
            1: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: ['='],
                attachments: {},
              },
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
          ringNumber: 3,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(ETORICOXIB_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ETORICOXIB_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(ETORICOXIB_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ETORICOXIB_SMILES);
  });
});

describe('Nabumetone Integration Test', () => {
  test('parses nabumetone', () => {
    const ast = parse(NABUMETONE_SMILES);
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
              atoms: 'C',
              size: 6,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, null, null, '=', null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'C'],
          bonds: [null, null, null],
          attachments: {
            3: [
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
    expect(ast.smiles).toBe(NABUMETONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(NABUMETONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces different ordering
    expect(reconstructed.smiles).toBe(NABUMETONE_SMILES);
  });
});

describe('Oxaprozin Integration Test', () => {
  test('parses oxaprozin', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['O', 'C', 'C', 'C'],
          bonds: [null, null, null],
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
          atoms: 'C',
          size: 5,
          ringNumber: 1,
          offset: 0,
          substitutions: { 2: 'N', 5: 'O' },
          attachments: {},
          bonds: ['=', null, '=', null, null],
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 3,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(OXAPROZIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(OXAPROZIN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(OXAPROZIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(OXAPROZIN_SMILES);
  });
});
