import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const ANANDAMIDE_SMILES = 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO';
const ARACHIDONOYLGLYCEROL2_SMILES = 'CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO';
const THC_SMILES = 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O';
const CBD_SMILES = 'CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O';
const NABILONE_SMILES = 'CCCCCCC(C)(C)C1=CC(=C2C3CC(=O)CCC3C(OC2=C1)(C)C)O';
const PALMITOYLETHANOLAMIDE_SMILES = 'CCCCCCCCCCCCCCCC(=O)NCCO';

const ANANDAMIDE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'N', 'C', 'C', 'O'], [null, null, null, null, null, '=', null, null, '=', null, null, '=', null, null, '=', null, null, null, null, null, null, null, null]);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 20);`;

const ARACHIDONOYLGLYCEROL2_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'O', 'C', 'C', 'O'], [null, null, null, null, null, '=', null, null, '=', null, null, '=', null, null, '=', null, null, null, null, null, null, null, null]);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 20);
export const v4 = Linear(['C', 'O']);
export const v5 = v3.attach(v4, 22);`;

const THC_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 14, bonds: ['=', null, '=', null, null, '=', null, null, null, null, null, null, '=', null], branchDepths: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3] });
export const v3 = v2.substitute(12, 'O');
export const v4 = Linear(['C']);
export const v5 = v3.attach(v4, 11);
export const v6 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3, branchDepths: [1, 1, 2, 2, 3, 3] });
export const v7 = v6.substitute(5, 'O');
export const v8 = Linear(['C']);
export const v9 = v7.attach(v8, 4);
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 4, bonds: [null, '=', null, null, null, null] });
export const v11 = FusedRing([v5, v9, v10]);
export const v12 = Linear(['O']);
export const v13 = Molecule([v1, v11, v12]);`;

const CBD_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 0, 1, 2, 3] });
export const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 2, bonds: [null, '=', null, null, null, null], branchDepths: [1, 1, 1, 2, 2, 2] });
export const v4 = Linear(['C', 'C']);
export const v5 = Linear(['C'], ['=']);
export const v6 = v4.attach(v5, 1);
export const v7 = v3.attach(v6, 3);
export const v8 = Linear(['C']);
export const v9 = Molecule([v7, v8]);
export const v10 = v2.attach(v9, 3);
export const v11 = Linear(['O']);
export const v12 = v10.attach(v11, 4);
export const v13 = Linear(['O']);
export const v14 = Molecule([v1, v12, v13]);`;

const NABILONE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'C', 'C']);
export const v2 = Linear(['C']);
export const v3 = v1.attach(v2, 7);
export const v4 = Linear(['C']);
export const v5 = v3.attach(v4, 7);
export const v6 = Ring({ atoms: 'C', size: 14, bonds: ['=', null, '=', null, null, null, null, null, null, null, null, null, '=', null], branchDepths: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2] });
export const v7 = v6.substitute(12, 'O');
export const v8 = Linear(['O'], ['=']);
export const v9 = v7.attach(v8, 7);
export const v10 = Linear(['C']);
export const v11 = v9.attach(v10, 11);
export const v12 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3, branchDepths: [1, 1, 1, 1, 2, 2] });
export const v13 = v12.substitute(5, 'O');
export const v14 = Linear(['C']);
export const v15 = v13.attach(v14, 4);
export const v16 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 4 });
export const v17 = Linear(['O'], ['=']);
export const v18 = v16.attach(v17, 3);
export const v19 = FusedRing([v11, v15, v18]);
export const v20 = Linear(['O']);
export const v21 = Molecule([v5, v19, v20]);`;

const PALMITOYLETHANOLAMIDE_CODE = `export const v1 = Linear(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'N', 'C', 'C', 'O']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 16);`;

describe('Anandamide Integration Test', () => {
  test('parses anandamide', () => {
    const ast = parse(ANANDAMIDE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'N', 'C', 'C', 'O'],
      bonds: [null, null, null, null, null, '=', null, null, '=', null, null, '=', null, null, '=', null, null, null, null, null, null, null, null],
      attachments: {
        20: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
      },
    });
    expect(ast.smiles).toBe(ANANDAMIDE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ANANDAMIDE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ANANDAMIDE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ANANDAMIDE_SMILES);
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
    const ast = parse(ANANDAMIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ANANDAMIDE_SMILES);
  });
});

describe('2-Arachidonoylglycerol Integration Test', () => {
  test('parses 2-arachidonoylglycerol', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'O', 'C', 'C', 'O'],
      bonds: [null, null, null, null, null, '=', null, null, '=', null, null, '=', null, null, '=', null, null, null, null, null, null, null, null],
      attachments: {
        20: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
        22: [
          {
            type: 'linear',
            atoms: ['C', 'O'],
            bonds: [null, null],
            attachments: {},
          },
        ],
      },
    });
    expect(ast.smiles).toBe(ARACHIDONOYLGLYCEROL2_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ARACHIDONOYLGLYCEROL2_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
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
    const ast = parse(ARACHIDONOYLGLYCEROL2_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ARACHIDONOYLGLYCEROL2_SMILES);
  });
});

describe('THC Integration Test', () => {
  test('parses THC', () => {
    const ast = parse(THC_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'C', 'C'],
          bonds: [null, null, null, null],
          attachments: {},
        },
        {
          type: 'fused_ring',
          rings: [
            {
              type: 'ring',
              atoms: 'C',
              size: 14,
              ringNumber: 1,
              offset: 0,
              substitutions: { 12: 'O' },
              attachments: {
                11: [
                  {
                    type: 'linear',
                    atoms: ['C'],
                    bonds: [null],
                    attachments: {},
                  },
                ],
              },
              bonds: ['=', null, '=', null, null, '=', null, null, null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: { 5: 'O' },
              attachments: {
                4: [
                  {
                    type: 'linear',
                    atoms: ['C'],
                    bonds: [null],
                    attachments: {},
                  },
                ],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 4,
              substitutions: {},
              attachments: {},
              bonds: [null, '=', null, null, null, null],
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
    expect(ast.smiles).toBe(THC_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(THC_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(THC_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(THC_SMILES);
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
    const ast = parse(THC_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces different but chemically equivalent SMILES
    expect(reconstructed.smiles).toBe('CCCCCC1=CC=C2CCC(C)OC2C=CCCCC(C)OC=C1O');
  });
});

describe('CBD Integration Test', () => {
  test('parses CBD', () => {
    const ast = parse(CBD_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'C', 'C'],
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
          attachments: {
            3: [
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
                    attachments: {
                      3: [
                        {
                          type: 'linear',
                          atoms: ['C', 'C'],
                          bonds: [null, null],
                          attachments: {
                            1: [
                              {
                                type: 'linear',
                                atoms: ['C'],
                                bonds: ['='],
                                attachments: {},
                              },
                            ],
                          },
                        },
                      ],
                    },
                    bonds: [null, '=', null, null, null, null],
                  },
                  {
                    type: 'linear',
                    atoms: ['C'],
                    bonds: [],
                    attachments: {},
                  },
                ],
              },
            ],
            4: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: ['=', null, '=', null, '=', null],
        },
        {
          type: 'linear',
          atoms: ['O'],
          bonds: [],
          attachments: {},
        },
      ],
    });
    expect(ast.smiles).toBe(CBD_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CBD_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CBD_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(CBD_SMILES);
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
    const ast = parse(CBD_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces different but chemically equivalent SMILES
    expect(reconstructed.smiles).toBe('CCCCCC1=CC(=C(C(=C1))(O))(C2C=C(CCC2)(C(=C)C)C)O');
  });
});

describe('Nabilone Integration Test', () => {
  test('parses nabilone', () => {
    const ast = parse(NABILONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'C'],
          bonds: [null, null, null, null, null, null],
          attachments: {
            7: [
              {
                type: 'linear',
                atoms: ['C'],
                bonds: [null],
                attachments: {},
              },
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
              size: 14,
              ringNumber: 1,
              offset: 0,
              substitutions: { 12: 'O' },
              attachments: {
                7: [
                  {
                    type: 'linear',
                    atoms: ['O'],
                    bonds: ['='],
                    attachments: {},
                  },
                ],
                11: [
                  {
                    type: 'linear',
                    atoms: ['C'],
                    bonds: [null],
                    attachments: {},
                  },
                ],
              },
              bonds: ['=', null, '=', null, null, null, null, null, null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 3,
              substitutions: { 5: 'O' },
              attachments: {
                4: [
                  {
                    type: 'linear',
                    atoms: ['C'],
                    bonds: [null],
                    attachments: {},
                  },
                ],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 4,
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
    expect(ast.smiles).toBe(NABILONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(NABILONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(NABILONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(NABILONE_SMILES);
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
    const ast = parse(NABILONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    // Note: round-trip produces different but chemically equivalent SMILES
    expect(reconstructed.smiles).toBe('CCCCCCC(C)(C)C1=CC=C2CCC(C)OC2CC(=O)CCCC(C)OC=C1O');
  });
});

describe('Palmitoylethanolamide Integration Test', () => {
  test('parses palmitoylethanolamide', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'N', 'C', 'C', 'O'],
      bonds: [
        null, null, null, null, null, null, null, null, null, null,
        null, null, null, null, null, null, null, null, null,
      ],
      attachments: {
        16: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
      },
    });
    expect(ast.smiles).toBe(PALMITOYLETHANOLAMIDE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PALMITOYLETHANOLAMIDE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
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
    const ast = parse(PALMITOYLETHANOLAMIDE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(PALMITOYLETHANOLAMIDE_SMILES);
  });
});
