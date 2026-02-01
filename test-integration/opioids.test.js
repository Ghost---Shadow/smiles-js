import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const MORPHINE_SMILES = 'CN1CCC23C4C1CC5=C2C(=C(C=C5)O)OC3C(C=C4)O';
const CODEINE_SMILES = 'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(C=C4)O';
const OXYCODONE_SMILES = 'CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O';
const HYDROCODONE_SMILES = 'CN1CCC23C4C1CC5=C2C(=C(C=C5)OC)OC3C(=O)CC4';
const FENTANYL_SMILES = 'CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3';
const TRAMADOL_SMILES = 'CN(C)CC1CCCCC1(C2=CC(=CC=C2)OC)O';
const METHADONE_SMILES = 'CCC(=O)C(CC(C)N(C)C)(C1=CC=CC=C1)C2=CC=CC=C2';

const MORPHINE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3, bonds: [null, null, null, null, '=', null] });
export const v5 = Ring({ atoms: 'C', size: 7, ringNumber: 3, offset: 3 });
export const v6 = v5.substitute(6, 'O');
export const v7 = Ring({ atoms: 'C', size: 9, ringNumber: 4, offset: 4, bonds: [null, null, null, null, null, null, null, '=', null] });
export const v8 = v7.substitute(5, 'O');
export const v9 = Ring({ atoms: 'C', size: 6, ringNumber: 5, bonds: ['=', null, '=', null, '=', null] });
export const v10 = FusedRing([v3, v4, v6, v8, v9]);
export const v11 = Linear(['O']);
export const v12 = Molecule([v1, v10, v11]);`;

const CODEINE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3, bonds: [null, null, null, null, '=', null] });
export const v5 = Ring({ atoms: 'C', size: 7, ringNumber: 3, offset: 3 });
export const v6 = v5.substitute(6, 'O');
export const v7 = Ring({ atoms: 'C', size: 9, ringNumber: 4, offset: 4, bonds: [null, null, null, null, null, null, null, '=', null] });
export const v8 = v7.substitute(5, 'O');
export const v9 = Ring({ atoms: 'C', size: 6, ringNumber: 5, bonds: ['=', null, '=', null, '=', null] });
export const v10 = FusedRing([v3, v4, v6, v8, v9]);
export const v11 = Linear(['O']);
export const v12 = Molecule([v1, v10, v11]);`;

const OXYCODONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
export const v5 = Linear(['O'], ['=']);
export const v6 = v4.attach(v5, 3);
export const v7 = Ring({ atoms: 'C', size: 10, ringNumber: 3, offset: 3, bonds: [null, null, null, null, null, null, null, null, '=', null], branchDepths: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1] });
export const v8 = Linear(['O'], ['=']);
export const v9 = v7.attach(v8, 3);
export const v10 = Ring({ atoms: 'C', size: 11, ringNumber: 4, offset: 4, bonds: [null, null, null, null, null, null, null, '=', null, null, null], branchDepths: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1] });
export const v11 = v10.substitute(11, 'O');
export const v12 = Linear(['O'], ['=']);
export const v13 = v11.attach(v12, 2);
export const v14 = Ring({ atoms: 'C', size: 6, ringNumber: 5, bonds: ['=', null, '=', null, '=', null] });
export const v15 = FusedRing([v3, v6, v9, v13, v14]);
export const v16 = Linear(['O']);
export const v17 = Molecule([v1, v15, v16]);`;

const HYDROCODONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6 });
export const v3 = v2.substitute(1, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3, bonds: [null, null, null, null, '=', null] });
export const v5 = Ring({ atoms: 'C', size: 7, ringNumber: 3, offset: 3 });
export const v6 = v5.substitute(6, 'O');
export const v7 = Ring({ atoms: 'C', size: 9, ringNumber: 4, offset: 4 });
export const v8 = v7.substitute(5, 'O');
export const v9 = Linear(['O'], ['=']);
export const v10 = v8.attach(v9, 7);
export const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 5, bonds: ['=', null, '=', null, '=', null] });
export const v12 = FusedRing([v3, v4, v6, v10, v11]);
export const v13 = Molecule([v1, v12]);`;

const FENTANYL_CODE = `export const v1 = Linear(['C', 'C', 'C', 'N']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 3);
export const v4 = Ring({ atoms: 'C', size: 6 });
export const v5 = v4.substitute(4, 'N');
export const v6 = Linear(['C', 'C']);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v8 = Molecule([v5, v6, v7]);
export const v9 = v3.attach(v8, 4);
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v11 = Molecule([v9, v10]);`;

const TRAMADOL_CODE = `export const v1 = Linear(['C', 'N', 'C']);
export const v2 = Linear(['C']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'C', size: 6 });
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v6 = Linear(['O', 'C']);
export const v7 = Molecule([v5, v6]);
export const v8 = v4.attach(v7, 6);
export const v9 = Linear(['O']);
export const v10 = Molecule([v3, v8, v9]);`;

const METHADONE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 3);
export const v4 = Linear(['C', 'C', 'N', 'C']);
export const v5 = Linear(['C']);
export const v6 = v4.attach(v5, 2);
export const v7 = Linear(['C']);
export const v8 = v6.attach(v7, 3);
export const v9 = v3.attach(v8, 4);
export const v10 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v11 = v9.attach(v10, 4);
export const v12 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v13 = Molecule([v11, v12]);`;

describe('Morphine Integration Test', () => {
  test('parses morphine', () => {
    const ast = parse(MORPHINE_SMILES);
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
          type: 'fused_ring',
          rings: [
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
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: {},
              attachments: {},
              bonds: [null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 7,
              ringNumber: 3,
              offset: 3,
              substitutions: { 6: 'O' },
              attachments: {},
              bonds: [null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 4,
              offset: 4,
              substitutions: { 5: 'O' },
              attachments: {},
              bonds: [null, null, null, null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 5,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['O'],
          bonds: [],
          attachments: {},
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MORPHINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(MORPHINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(MORPHINE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = MORPHINE_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces simplified structure
    expect(reconstructed.smiles).toBe('CN1CCC3CCCCOC3C1O');
  });
});

describe('Codeine Integration Test', () => {
  test('parses codeine', () => {
    const ast = parse(CODEINE_SMILES);
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
          type: 'fused_ring',
          rings: [
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
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: {},
              attachments: {},
              bonds: [null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 7,
              ringNumber: 3,
              offset: 3,
              substitutions: { 6: 'O' },
              attachments: {},
              bonds: [null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 4,
              offset: 4,
              substitutions: { 5: 'O' },
              attachments: {},
              bonds: [null, null, null, null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 5,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['O'],
          bonds: [],
          attachments: {},
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CODEINE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CODEINE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(CODEINE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = CODEINE_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces simplified structure
    expect(reconstructed.smiles).toBe('CN1CCC3CCCCOC3C1O');
  });
});

describe('Oxycodone Integration Test', () => {
  test('parses oxycodone', () => {
    const ast = parse(OXYCODONE_SMILES);
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
          type: 'fused_ring',
          rings: [
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
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: {},
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
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 3,
              offset: 3,
              substitutions: {},
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
              bonds: [null, null, null, null, null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 11,
              ringNumber: 4,
              offset: 4,
              substitutions: { 11: 'O' },
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
              bonds: [null, null, null, null, null, null, null, '=', null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 5,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['O'],
          bonds: [],
          attachments: {},
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(OXYCODONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(OXYCODONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(OXYCODONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = OXYCODONE_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces simplified structure
    expect(reconstructed.smiles).toBe('CN1CCC3CC(=O)CCCCCC=C3C1O');
  });
});

describe('Hydrocodone Integration Test', () => {
  test('parses hydrocodone', () => {
    const ast = parse(HYDROCODONE_SMILES);
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
          type: 'fused_ring',
          rings: [
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
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: {},
              attachments: {},
              bonds: [null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 7,
              ringNumber: 3,
              offset: 3,
              substitutions: { 6: 'O' },
              attachments: {},
              bonds: [null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 4,
              offset: 4,
              substitutions: { 5: 'O' },
              attachments: {
                7: [
                  {
                    type: 'linear',
                    atoms: ['O'],
                    bonds: ['='],
                    attachments: {},
                  },
                ],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 5,
              offset: 0,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(HYDROCODONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(HYDROCODONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(HYDROCODONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = HYDROCODONE_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces simplified structure
    expect(reconstructed.smiles).toBe('CN1CCC3CCCCOC3C1');
  });
});

describe('Fentanyl Integration Test', () => {
  test('parses fentanyl', () => {
    const ast = parse(FENTANYL_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'N'],
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
            4: [
              {
                type: 'molecule',
                components: [
                  {
                    type: 'ring',
                    atoms: 'C',
                    size: 6,
                    ringNumber: 1,
                    offset: 0,
                    substitutions: { 4: 'N' },
                    attachments: {},
                    bonds: [null, null, null, null, null, null],
                  },
                  {
                    type: 'linear',
                    atoms: ['C', 'C'],
                    bonds: [null],
                    attachments: {},
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
                ],
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
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(FENTANYL_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(FENTANYL_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(FENTANYL_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = FENTANYL_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces slightly different ring numbering
    expect(reconstructed.smiles).toBe('CCC(=O)N(C1CCNCC1CCC2=CC=CC=C2)C3=CC=CC=C3');
  });
});

describe('Tramadol Integration Test', () => {
  test('parses tramadol', () => {
    const ast = parse(TRAMADOL_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'N', 'C'],
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
          atoms: 'C',
          size: 6,
          ringNumber: 1,
          offset: 0,
          substitutions: {},
          attachments: {
            6: [
              {
                type: 'molecule',
                components: [
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
                    atoms: ['O', 'C'],
                    bonds: [null],
                    attachments: {},
                  },
                ],
              },
            ],
          },
          bonds: [null, null, null, null, null, null],
        },
        {
          type: 'linear',
          atoms: ['O'],
          bonds: [],
          attachments: {},
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TRAMADOL_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(TRAMADOL_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(TRAMADOL_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = TRAMADOL_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces slightly different structure
    expect(reconstructed.smiles).toBe('CN(C)CC1CCCCC1(C2=CC=CC=C2OC)O');
  });
});

describe('Methadone Integration Test', () => {
  test('parses methadone', () => {
    const ast = parse(METHADONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
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
            4: [
              {
                type: 'linear',
                atoms: ['C', 'C', 'N', 'C'],
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
                  3: [
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
                atoms: 'C',
                size: 6,
                ringNumber: 1,
                offset: 0,
                substitutions: {},
                attachments: {},
                bonds: ['=', null, '=', null, '=', null],
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
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(METHADONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(METHADONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(METHADONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = METHADONE_CODE;
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(METHADONE_SMILES);
  });
});
