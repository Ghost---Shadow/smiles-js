import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

// TODO: the bonds parameter for rings is missing in codegen

const GABAPENTIN_SMILES = 'C1CCC(CC1)(CC(=O)O)CN';
const PREGABALIN_SMILES = 'CC(C)CC(CC(=O)O)CN';
const AMITRIPTYLINE_SMILES = 'CN(C)CCC=C1C2=CC=CC=C2CCC3=CC=CC=C31';
const DULOXETINE_SMILES = 'CNCCC(C1=CC=CS1)OC2=CC=CC3=CC=CC=C32';
const CARBAMAZEPINE_SMILES = 'C1=CC=C2C(=C1)C=CC3=CC=CC=C3N2C(=O)N';
const VALPROIC_ACID_SMILES = 'CCCC(CCC)C(=O)O';

// All adjuvant analgesics now round-trip correctly to original SMILES

// Gabapentin uses branchDepths to represent its branch-crossing ring structure
const GABAPENTIN_CODE = `export const v1 = Ring({ atoms: 'C', size: 6, branchDepths: [0, 0, 0, 0, 1, 1] });
export const v2 = Linear(['C', 'C', 'O']);
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 2);
export const v5 = v1.attach(v4, 4);
export const v6 = Linear(['C', 'N']);
export const v7 = Molecule([v5, v6]);`;

const PREGABALIN_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'N']);
export const v2 = Linear(['C']);
export const v3 = v1.attach(v2, 2);
export const v4 = Linear(['C', 'C', 'O']);
export const v5 = Linear(['O'], ['=']);
export const v6 = v4.attach(v5, 2);
export const v7 = v3.attach(v6, 4);`;

const AMITRIPTYLINE_CODE = `export const v1 = Linear(['C', 'N', 'C', 'C', 'C']);
export const v2 = Linear(['C']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'C', size: 11, bonds: [null, '=', null, null, null, '=', null, '=', null, '=', null] });
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1, bonds: ['=', null, '=', null, '=', null] });
export const v6 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 5, bonds: ['=', null, '=', null, '=', null] });
export const v7 = FusedRing([v4, v5, v6], { leadingBond: '=' });
export const v8 = Molecule([v3, v7]);`;

const DULOXETINE_CODE = `export const v1 = Linear(['C', 'N', 'C', 'C', 'C', 'O']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(5, 'S');
export const v4 = v1.attach(v3, 5);
export const v5 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: ['=', null, '=', null, '=', null, '=', null, '=', null] });
export const v6 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 4, bonds: ['=', null, '=', null, '=', null] });
export const v7 = v5.fuse(v6, 4);
export const v8 = Molecule([v4, v7]);`;

const CARBAMAZEPINE_CODE = `export const v1 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 0, 0, 0, 1] });
export const v2 = Ring({ atoms: 'C', size: 7, ringNumber: 2, offset: 3, bonds: [null, null, '=', null, '=', null, null] });
export const v3 = v2.substitute(7, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v5 = FusedRing([v1, v3, v4]);
export const v6 = Linear(['C', 'N']);
export const v7 = Linear(['O'], ['=']);
export const v8 = v6.attach(v7, 1);
export const v9 = Molecule([v5, v8]);`;

const VALPROIC_ACID_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'O']);
export const v2 = Linear(['C', 'C', 'C']);
export const v3 = v1.attach(v2, 4);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 5);`;

describe('Gabapentin Integration Test', () => {
  test('parses gabapentin', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {
            4: [
              {
                type: 'linear',
                atoms: ['C', 'C', 'O'],
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
            ],
          },
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['C', 'N'],
          bonds: [null],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(GABAPENTIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(GABAPENTIN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(GABAPENTIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // branchDepths preserves the exact SMILES for branch-crossing rings
    expect(reconstructed.smiles).toBe(GABAPENTIN_SMILES);
  });
});

describe('Pregabalin Integration Test', () => {
  test('parses pregabalin', () => {
    const ast = parse(PREGABALIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C', 'N'],
      bonds: [null, null, null, null, null],
      attachments: {
        2: [
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
            attachments: {},
          },
        ],
        4: [
          {
            type: 'linear',
            atoms: ['C', 'C', 'O'],
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
        ],
      },
    });
    expect(ast.smiles).toBe(PREGABALIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PREGABALIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PREGABALIN_CODE);
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PREGABALIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(PREGABALIN_SMILES);
  });
});

describe('Amitriptyline Integration Test', () => {
  test('parses amitriptyline', () => {
    const ast = parse(AMITRIPTYLINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'N', 'C', 'C', 'C'],
          bonds: [null, null, null, null],
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
          type: 'fused_ring',
          rings: [
            {
              type: 'ring',
              atoms: 'C',
              size: 11,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: [null, '=', null, null, null, '=', null, '=', null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 1,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 5,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
      ],
    });
    expect(ast.smiles).toBe(AMITRIPTYLINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(AMITRIPTYLINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(AMITRIPTYLINE_CODE);
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(AMITRIPTYLINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Round-trips to original SMILES
    expect(reconstructed.smiles).toBe(AMITRIPTYLINE_SMILES);
  });
});

describe('Duloxetine Integration Test', () => {
  test('parses duloxetine', () => {
    const ast = parse(DULOXETINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'N', 'C', 'C', 'C', 'O'],
          bonds: [null, null, null, null, null],
          attachments: {
            5: [
              {
                type: 'ring',
                atoms: 'C',
                size: 5,
                ringNumber: 1,
                offset: 0,
                substitutions: {
                  5: 'S',
                },
                attachments: {},
                bonds: ['=', null, '=', null, null],
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
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null, '=', null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 4,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
      ],
    });
    expect(ast.smiles).toBe(DULOXETINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(DULOXETINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(DULOXETINE_CODE);
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(DULOXETINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Round-trips to original SMILES
    expect(reconstructed.smiles).toBe(DULOXETINE_SMILES);
  });
});

describe('Carbamazepine Integration Test', () => {
  test('parses carbamazepine', () => {
    const ast = parse(CARBAMAZEPINE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
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
              size: 7,
              ringNumber: 2,
              offset: 3,
              substitutions: {
                7: 'N',
              },
              attachments: {},
              bonds: [null, null, '=', null, '=', null, null],
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
      ],
    });
    expect(ast.smiles).toBe(CARBAMAZEPINE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CARBAMAZEPINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CARBAMAZEPINE_CODE);
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(CARBAMAZEPINE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Round-trip produces the same SMILES as input
    expect(reconstructed.smiles).toBe(CARBAMAZEPINE_SMILES);
  });
});

describe('Valproic Acid Integration Test', () => {
  test('parses valproic acid', () => {
    const ast = parse(VALPROIC_ACID_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C', 'O'],
      bonds: [null, null, null, null, null],
      attachments: {
        4: [
          {
            type: 'linear',
            atoms: ['C', 'C', 'C'],
            bonds: [null, null, null],
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
    });
    expect(ast.smiles).toBe(VALPROIC_ACID_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(VALPROIC_ACID_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(VALPROIC_ACID_CODE);
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(VALPROIC_ACID_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(VALPROIC_ACID_SMILES);
  });
});
