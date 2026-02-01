import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';
import {
  telmisartan,
  losartan,
  valsartan,
  irbesartan,
} from './hypertension-medication.smiles.js';

const TELMISARTAN_SMILES = telmisartan;
const LOSARTAN_SMILES = losartan;
const VALSARTAN_SMILES = valsartan;
const IRBESARTAN_SMILES = irbesartan;

const LOSARTAN_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Linear(['Cl']);
export const v6 = v4.attach(v5, 3);
export const v7 = Linear(['C', 'O']);
export const v8 = v6.attach(v7, 4);
export const v9 = Linear(['C']);
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v12 = Ring({ atoms: 'N', size: 5, ringNumber: 4, bonds: ['=', null, null, '=', null] });
export const v13 = v12.substitute(1, 'C');
export const v14 = Molecule([v1, v8, v9, v10, v11, v13]);`;

const VALSARTAN_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'N', 'C', 'C', 'O']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 5);
export const v4 = Linear(['C']);
export const v5 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null] });
export const v6 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null] });
export const v7 = Ring({ atoms: 'N', size: 5, ringNumber: 3, bonds: ['=', null, null, '=', null] });
export const v8 = v7.substitute(1, 'C');
export const v9 = Molecule([v4, v5, v6, v8]);
export const v10 = v3.attach(v9, 6);
export const v11 = Linear(['C', 'C']);
export const v12 = Linear(['C']);
export const v13 = v11.attach(v12, 1);
export const v14 = v10.attach(v13, 7);
export const v15 = Linear(['O'], ['=']);
export const v16 = v14.attach(v15, 8);`;

const TELMISARTAN_CODE = `export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null] });
export const v6 = Linear(['C', 'C'], ['=']);
export const v7 = Linear(['C', 'C', 'N', 'C'], ['=']);
export const v8 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v9 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, '=', null, '=', null] });
export const v10 = Linear(['C', 'O']);
export const v11 = Linear(['O'], ['=']);
export const v12 = v10.attach(v11, 1);
export const v13 = v8.attach(v9, 4);
export const v14 = v13.attach(v12, 6);
export const v15 = Molecule([v7, v14]);
export const v16 = v6.attach(v15, 2);
export const v17 = Ring({ atoms: 'C', size: 5, ringNumber: 5, bonds: ['=', null, '=', null, null] });
export const v18 = v17.substitute(2, 'N');
export const v19 = v18.substitute(5, 'N');
export const v20 = Ring({ atoms: 'C', size: 6, ringNumber: 6, bonds: ['=', null, '=', null, '=', null] });
export const v21 = v19.fuse(v20, 2);
export const v22 = Linear(['C']);
export const v23 = Molecule([v16, v21, v22]);
export const v24 = v5.attach(v23, 2);
export const v25 = v4.fuse(v24, 2);
export const v26 = Linear(['C']);
export const v27 = Molecule([v1, v25, v26]);`;

const IRBESARTAN_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, null, null, null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Linear(['O'], ['=']);
export const v6 = v4.attach(v5, 4);
export const v7 = Ring({ atoms: 'C', size: 5, ringNumber: 2, offset: 2 });
export const v8 = v6.fuse(v7, 2);
export const v9 = Linear(['C']);
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null] });
export const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, '=', null, '=', null] });
export const v12 = Ring({ atoms: 'N', size: 5, ringNumber: 5, bonds: ['=', null, null, '=', null] });
export const v13 = v12.substitute(1, 'C');
export const v14 = Molecule([v1, v8, v9, v10, v11, v13]);`;

describe('Telmisartan Integration Test', () => {
  test('parses telmisartan', () => {
    const ast = parse(TELMISARTAN_SMILES);
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
          type: 'fused_ring',
          rings: [
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 1,
              offset: 0,
              substitutions: { 2: 'N', 5: 'N' },
              attachments: {},
              bonds: ['=', null, '=', null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {},
              bonds: ['=', null, '=', null, '=', null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(TELMISARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(TELMISARTAN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TELMISARTAN_SMILES);
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
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(TELMISARTAN_SMILES);
  });
});

describe('Losartan Integration Test', () => {
  test('parses losartan', () => {
    const ast = parse(LOSARTAN_SMILES);
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
          size: 5,
          ringNumber: 1,
          offset: 0,
          substitutions: { 2: 'N', 5: 'N' },
          attachments: {
            3: [
              {
                type: 'linear',
                atoms: ['Cl'],
                bonds: [null],
                attachments: {},
              },
            ],
            4: [
              {
                type: 'linear',
                atoms: ['C', 'O'],
                bonds: [null, null],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, '=', null, null],
        },
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
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
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
        {
          type: 'ring',
          atoms: 'N',
          size: 5,
          ringNumber: 4,
          offset: 0,
          substitutions: { 1: 'C' },
          attachments: {},
          bonds: ['=', null, null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(LOSARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(LOSARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(LOSARTAN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(LOSARTAN_SMILES);
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
    const ast = parse(LOSARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(LOSARTAN_SMILES);
  });
});

describe('Valsartan Integration Test', () => {
  test('parses valsartan', () => {
    const ast = parse(VALSARTAN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C', 'N', 'C', 'C', 'O'],
      bonds: [null, null, null, null, null, null, null, null],
      attachments: {
        5: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
        6: [
          {
            type: 'molecule',
            components: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
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
                size: 6,
                ringNumber: 2,
                offset: 0,
                substitutions: {},
                attachments: {},
                bonds: ['=', null, '=', null, '=', null],
              },
              {
                type: 'ring',
                atoms: 'N',
                size: 5,
                ringNumber: 3,
                offset: 0,
                substitutions: { 1: 'C' },
                attachments: {},
                bonds: ['=', null, null, '=', null],
              },
            ],
          },
        ],
        7: [
          {
            type: 'linear',
            atoms: ['C', 'C'],
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
            },
          },
        ],
        8: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
      },
    });
    expect(ast.smiles).toBe(VALSARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(VALSARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(VALSARTAN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(VALSARTAN_SMILES);
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
    const ast = parse(VALSARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(VALSARTAN_SMILES);
  });
});

describe('Irbesartan Integration Test', () => {
  test('parses irbesartan', () => {
    const ast = parse(IRBESARTAN_SMILES);
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
          type: 'fused_ring',
          rings: [
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 1,
              offset: 0,
              substitutions: { 2: 'N', 5: 'N' },
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
              bonds: ['=', null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {},
              bonds: [null, null, null, null, null],
            },
          ],
        },
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
          ringNumber: 3,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'ring',
          atoms: 'C',
          size: 6,
          ringNumber: 4,
          offset: 0,
          substitutions: {},
          attachments: {},
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'ring',
          atoms: 'N',
          size: 5,
          ringNumber: 5,
          offset: 0,
          substitutions: { 1: 'C' },
          attachments: {},
          bonds: ['=', null, null, '=', null],
        },
      ],
    });
    expect(ast.smiles).toBe(IRBESARTAN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(IRBESARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(IRBESARTAN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(IRBESARTAN_SMILES);
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
    const ast = parse(IRBESARTAN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces slightly different spiro notation
    expect(reconstructed.smiles).toBe(IRBESARTAN_SMILES);
  });
});
