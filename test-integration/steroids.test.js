import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

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

const CORTISONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, null, '=', null] });
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 4);
export const v5 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: [null, null, null, null, '=', null, null, null, null, null] });
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 4);
export const v8 = Ring({ atoms: 'C', size: 9 });
export const v9 = Linear(['O']);
export const v10 = v8.attach(v9, 3);
export const v11 = Linear(['C']);
export const v12 = v10.attach(v11, 5);
export const v13 = Linear(['C', 'C', 'O']);
export const v14 = Linear(['O'], ['=']);
export const v15 = v13.attach(v14, 1);
export const v16 = v12.attach(v15, 6);
export const v17 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v18 = Linear(['C']);
export const v19 = v17.attach(v18, 1);
export const v20 = Linear(['C', 'C', 'O']);
export const v21 = Linear(['O'], ['=']);
export const v22 = v20.attach(v21, 1);
export const v23 = v19.attach(v22, 2);
export const v24 = FusedRing([v4, v7, v16, v23]);
export const v25 = Molecule([v1, v24]);`;

const HYDROCORTISONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, null, '=', null] });
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 4);
export const v5 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: [null, null, null, null, '=', null, null, null, null, null] });
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 4);
export const v8 = Ring({ atoms: 'C', size: 9 });
export const v9 = Linear(['O']);
export const v10 = v8.attach(v9, 3);
export const v11 = Linear(['C']);
export const v12 = v10.attach(v11, 5);
export const v13 = Linear(['C', 'C', 'O']);
export const v14 = Linear(['O'], ['=']);
export const v15 = v13.attach(v14, 1);
export const v16 = v12.attach(v15, 6);
export const v17 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v18 = Linear(['C']);
export const v19 = v17.attach(v18, 1);
export const v20 = Linear(['C', 'C', 'O']);
export const v21 = Linear(['O'], ['=']);
export const v22 = v20.attach(v21, 1);
export const v23 = v19.attach(v22, 2);
export const v24 = FusedRing([v4, v7, v16, v23]);
export const v25 = Linear(['O']);
export const v26 = Molecule([v1, v24, v25]);`;

const PREDNISONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, '=', null, null] });
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 3);
export const v5 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: [null, null, null, '=', null, '=', null, null, null, null] });
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 3);
export const v8 = Linear(['O']);
export const v9 = v7.attach(v8, 8);
export const v10 = Ring({ atoms: 'C', size: 9 });
export const v11 = Linear(['C']);
export const v12 = v10.attach(v11, 5);
export const v13 = Linear(['C', 'C', 'O']);
export const v14 = Linear(['O'], ['=']);
export const v15 = v13.attach(v14, 1);
export const v16 = v12.attach(v15, 6);
export const v17 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v18 = Linear(['C']);
export const v19 = v17.attach(v18, 1);
export const v20 = Linear(['C', 'C', 'O']);
export const v21 = Linear(['O'], ['=']);
export const v22 = v20.attach(v21, 1);
export const v23 = v19.attach(v22, 2);
export const v24 = FusedRing([v4, v9, v16, v23]);
export const v25 = Molecule([v1, v24]);`;

const PREDNISOLONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, '=', null, null] });
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 3);
export const v5 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: [null, null, null, '=', null, '=', null, null, null, null] });
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 3);
export const v8 = Linear(['O']);
export const v9 = v7.attach(v8, 8);
export const v10 = Ring({ atoms: 'C', size: 9 });
export const v11 = Linear(['O']);
export const v12 = v10.attach(v11, 3);
export const v13 = Linear(['C']);
export const v14 = v12.attach(v13, 5);
export const v15 = Linear(['C', 'C', 'O']);
export const v16 = Linear(['O'], ['=']);
export const v17 = v15.attach(v16, 1);
export const v18 = v14.attach(v17, 6);
export const v19 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v20 = Linear(['C']);
export const v21 = v19.attach(v20, 1);
export const v22 = Linear(['C', 'C', 'O']);
export const v23 = Linear(['O'], ['=']);
export const v24 = v22.attach(v23, 1);
export const v25 = v21.attach(v24, 2);
export const v26 = FusedRing([v4, v9, v18, v25]);
export const v27 = Molecule([v1, v26]);`;

const METHYLPREDNISOLONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, '=', null, null] });
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 3);
export const v5 = Linear(['C']);
export const v6 = v4.attach(v5, 4);
export const v7 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: [null, null, null, '=', null, '=', null, null, null, null] });
export const v8 = Linear(['O'], ['=']);
export const v9 = v7.attach(v8, 3);
export const v10 = Linear(['C']);
export const v11 = v9.attach(v10, 4);
export const v12 = Linear(['O']);
export const v13 = v11.attach(v12, 8);
export const v14 = Ring({ atoms: 'C', size: 9 });
export const v15 = Linear(['O']);
export const v16 = v14.attach(v15, 3);
export const v17 = Linear(['C']);
export const v18 = v16.attach(v17, 5);
export const v19 = Linear(['C', 'C', 'O']);
export const v20 = Linear(['O'], ['=']);
export const v21 = v19.attach(v20, 1);
export const v22 = v18.attach(v21, 6);
export const v23 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v24 = Linear(['C']);
export const v25 = v23.attach(v24, 1);
export const v26 = Linear(['C', 'C', 'O']);
export const v27 = Linear(['O'], ['=']);
export const v28 = v26.attach(v27, 1);
export const v29 = v25.attach(v28, 2);
export const v30 = FusedRing([v6, v13, v22, v29]);
export const v31 = Molecule([v1, v30]);`;

const DEXAMETHASONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 5 });
export const v3 = Linear(['C']);
export const v4 = v2.attach(v3, 4);
export const v5 = Linear(['O']);
export const v6 = v4.attach(v5, 5);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v8 = Linear(['F']);
export const v9 = v7.attach(v8, 3);
export const v10 = Linear(['O']);
export const v11 = v9.attach(v10, 4);
export const v12 = Linear(['C']);
export const v13 = v11.attach(v12, 6);
export const v14 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
export const v15 = Linear(['C']);
export const v16 = v14.attach(v15, 5);
export const v17 = Linear(['F']);
export const v18 = v16.attach(v17, 6);
export const v19 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, null, '=', null, null] });
export const v20 = Linear(['O'], ['=']);
export const v21 = v19.attach(v20, 3);
export const v22 = Linear(['C']);
export const v23 = v21.attach(v22, 6);
export const v24 = FusedRing([v6, v13, v18, v23]);
export const v25 = Linear(['C', 'C', 'O']);
export const v26 = Linear(['O'], ['=']);
export const v27 = v25.attach(v26, 1);
export const v28 = Molecule([v1, v24, v27]);`;

const TRIAMCINOLONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 5 });
export const v3 = Linear(['O']);
export const v4 = v2.attach(v3, 3);
export const v5 = Linear(['F']);
export const v6 = v4.attach(v5, 5);
export const v7 = Ring({ atoms: 'C', size: 8, ringNumber: 2 });
export const v8 = Linear(['O']);
export const v9 = v7.attach(v8, 3);
export const v10 = Linear(['F']);
export const v11 = v9.attach(v10, 5);
export const v12 = Linear(['O']);
export const v13 = v11.attach(v12, 6);
export const v14 = Linear(['C']);
export const v15 = v13.attach(v14, 8);
export const v16 = Ring({ atoms: 'C', size: 10, ringNumber: 3, offset: 3, bonds: [null, null, null, null, '=', null, null, '=', null, null], branchDepths: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1] });
export const v17 = Linear(['O'], ['=']);
export const v18 = v16.attach(v17, 7);
export const v19 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, null, '=', null, null] });
export const v20 = Linear(['O'], ['=']);
export const v21 = v19.attach(v20, 3);
export const v22 = FusedRing([v6, v15, v18, v21]);
export const v23 = Linear(['C', 'C', 'O']);
export const v24 = Linear(['O'], ['=']);
export const v25 = v23.attach(v24, 1);
export const v26 = Molecule([v1, v22, v25]);`;

const BUDESONIDE_CODE = `export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5 });
export const v3 = v2.substitute(2, 'O');
export const v4 = v3.substitute(5, 'O');
export const v5 = Ring({ atoms: 'C', size: 5, ringNumber: 2, offset: 2 });
export const v6 = Linear(['C']);
export const v7 = v5.attach(v6, 4);
export const v8 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
export const v9 = Linear(['F']);
export const v10 = v8.attach(v9, 3);
export const v11 = Linear(['O']);
export const v12 = v10.attach(v11, 4);
export const v13 = Linear(['C']);
export const v14 = v12.attach(v13, 6);
export const v15 = Ring({ atoms: 'C', size: 6, ringNumber: 4 });
export const v16 = Linear(['C']);
export const v17 = v15.attach(v16, 5);
export const v18 = Linear(['F']);
export const v19 = v17.attach(v18, 6);
export const v20 = Ring({ atoms: 'C', size: 6, ringNumber: 5, bonds: ['=', null, null, '=', null, null] });
export const v21 = Linear(['O'], ['=']);
export const v22 = v20.attach(v21, 3);
export const v23 = Linear(['C']);
export const v24 = v22.attach(v23, 6);
export const v25 = FusedRing([v4, v7, v14, v19, v24]);
export const v26 = Linear(['C', 'C', 'O']);
export const v27 = Linear(['O'], ['=']);
export const v28 = v26.attach(v27, 1);
export const v29 = Molecule([v1, v25, v28]);`;

const FLUTICASONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 5 });
export const v3 = Linear(['C']);
export const v4 = v2.attach(v3, 4);
export const v5 = Linear(['O']);
export const v6 = v4.attach(v5, 5);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v8 = Linear(['F']);
export const v9 = v7.attach(v8, 3);
export const v10 = Linear(['O']);
export const v11 = v9.attach(v10, 4);
export const v12 = Linear(['C']);
export const v13 = v11.attach(v12, 6);
export const v14 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
export const v15 = Linear(['C']);
export const v16 = v14.attach(v15, 5);
export const v17 = Linear(['F']);
export const v18 = v16.attach(v17, 6);
export const v19 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, null, '=', null, null] });
export const v20 = Linear(['O'], ['=']);
export const v21 = v19.attach(v20, 3);
export const v22 = Linear(['C']);
export const v23 = v21.attach(v22, 6);
export const v24 = FusedRing([v6, v13, v18, v23]);
export const v25 = Linear(['C', 'O', 'C', 'F']);
export const v26 = Linear(['S'], ['=']);
export const v27 = v25.attach(v26, 1);
export const v28 = Molecule([v1, v24, v27]);`;

const BECLOMETHASONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 5 });
export const v3 = Linear(['C']);
export const v4 = v2.attach(v3, 4);
export const v5 = Linear(['O']);
export const v6 = v4.attach(v5, 5);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v8 = Linear(['Cl']);
export const v9 = v7.attach(v8, 3);
export const v10 = Linear(['O']);
export const v11 = v9.attach(v10, 4);
export const v12 = Linear(['C']);
export const v13 = v11.attach(v12, 6);
export const v14 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
export const v15 = Linear(['C']);
export const v16 = v14.attach(v15, 5);
export const v17 = Linear(['Cl']);
export const v18 = v16.attach(v17, 6);
export const v19 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, null, '=', null, null] });
export const v20 = Linear(['O'], ['=']);
export const v21 = v19.attach(v20, 3);
export const v22 = Linear(['C']);
export const v23 = v21.attach(v22, 6);
export const v24 = FusedRing([v6, v13, v18, v23]);
export const v25 = Linear(['C', 'C', 'O']);
export const v26 = Linear(['O'], ['=']);
export const v27 = v25.attach(v26, 1);
export const v28 = Molecule([v1, v24, v27]);`;

const FLUDROCORTISONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, bonds: [null, null, null, null, '=', null] });
export const v3 = Linear(['O'], ['=']);
export const v4 = v2.attach(v3, 4);
export const v5 = Ring({ atoms: 'C', size: 10, ringNumber: 2, bonds: [null, null, null, null, '=', null, null, null, null, null] });
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 4);
export const v8 = Linear(['F']);
export const v9 = v7.attach(v8, 10);
export const v10 = Ring({ atoms: 'C', size: 9 });
export const v11 = Linear(['F']);
export const v12 = v10.attach(v11, 2);
export const v13 = Linear(['O']);
export const v14 = v12.attach(v13, 3);
export const v15 = Linear(['C']);
export const v16 = v14.attach(v15, 5);
export const v17 = Linear(['C', 'C', 'O']);
export const v18 = Linear(['O'], ['=']);
export const v19 = v17.attach(v18, 1);
export const v20 = v16.attach(v19, 6);
export const v21 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v22 = Linear(['C']);
export const v23 = v21.attach(v22, 1);
export const v24 = Linear(['C', 'C', 'O']);
export const v25 = Linear(['O'], ['=']);
export const v26 = v24.attach(v25, 1);
export const v27 = v23.attach(v26, 2);
export const v28 = FusedRing([v4, v9, v20, v27]);
export const v29 = Molecule([v1, v28]);`;

const MOMETASONE_CODE = `export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 5 });
export const v3 = Linear(['C']);
export const v4 = v2.attach(v3, 4);
export const v5 = Linear(['O']);
export const v6 = v4.attach(v5, 5);
export const v7 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v8 = Linear(['Cl']);
export const v9 = v7.attach(v8, 3);
export const v10 = Linear(['O']);
export const v11 = v9.attach(v10, 4);
export const v12 = Linear(['C']);
export const v13 = v11.attach(v12, 6);
export const v14 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
export const v15 = Linear(['C']);
export const v16 = v14.attach(v15, 5);
export const v17 = Linear(['Cl']);
export const v18 = v16.attach(v17, 6);
export const v19 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, null, '=', null, null] });
export const v20 = Linear(['O'], ['=']);
export const v21 = v19.attach(v20, 3);
export const v22 = Linear(['C']);
export const v23 = v21.attach(v22, 6);
export const v24 = FusedRing([v6, v13, v18, v23]);
export const v25 = Linear(['C', 'C', 'Cl']);
export const v26 = Linear(['O'], ['=']);
export const v27 = v25.attach(v26, 1);
export const v28 = Molecule([v1, v24, v27]);`;

// Alias CODE constants
const CORTISOL_CODE = HYDROCORTISONE_CODE;
const BETAMETHASONE_CODE = DEXAMETHASONE_CODE;

describe('Cortisone Integration Test', () => {
  test('parses cortisone', () => {
    const ast = parse(CORTISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              attachments: {
                4: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                1: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                2: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null],
            },
          ],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CORTISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CORTISONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(CORTISONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = CORTISONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CCC(=O)C=C1');
  });
});

describe('Hydrocortisone Integration Test', () => {
  test('parses hydrocortisone', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              attachments: {
                4: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                1: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                2: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null],
            },
          ],
        },
        {
          type: 'linear', atoms: ['O'], bonds: [], attachments: {},
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(HYDROCORTISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(HYDROCORTISONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(HYDROCORTISONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = HYDROCORTISONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CCC(=O)C=C1O');
  });
});

describe('Prednisone Integration Test', () => {
  test('parses prednisone', () => {
    const ast = parse(PREDNISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, '=', null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                8: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, '=', null, '=', null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                1: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                2: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null],
            },
          ],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PREDNISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PREDNISONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(PREDNISONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = PREDNISONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC(=O)C=CC1');
  });
});

describe('Prednisolone Integration Test', () => {
  test('parses prednisolone', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, '=', null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                8: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, '=', null, '=', null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                1: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                2: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null],
            },
          ],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PREDNISOLONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PREDNISOLONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(PREDNISOLONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = PREDNISOLONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC(=O)C=CC1');
  });
});

describe('Methylprednisolone Integration Test', () => {
  test('parses methylprednisolone', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, '=', null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                8: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, '=', null, '=', null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                1: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                2: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null],
            },
          ],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(METHYLPREDNISOLONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(METHYLPREDNISOLONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(METHYLPREDNISOLONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = METHYLPREDNISOLONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC(=O)C(C)=CC1');
  });
});

describe('Dexamethasone Integration Test', () => {
  test('parses dexamethasone', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 0,
              substitutions: {},
              attachments: {
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 4,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: ['=', null, null, '=', null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
            }],
          },
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(DEXAMETHASONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(DEXAMETHASONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = DEXAMETHASONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC2C(C1(O))(C)C(F)C4(O)=CC(=O)C=CC4(C)C2(C)C(=O)CO');
  });
});

describe('Triamcinolone Integration Test', () => {
  test('parses triamcinolone', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 8,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                8: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 3,
              offset: 3,
              substitutions: {},
              attachments: {
                7: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null, null, '=', null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 4,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: ['=', null, null, '=', null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
            }],
          },
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(TRIAMCINOLONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(TRIAMCINOLONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(TRIAMCINOLONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = TRIAMCINOLONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC(O)C3C1(F)CCC=CC(=O)C4=CC(=O)C=C=C4C3C(=O)CO');
  });
});

describe('Budesonide Integration Test', () => {
  test('parses budesonide', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C', 'C', 'C'], bonds: [null, null], attachments: {},
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
              substitutions: { 2: 'O', 5: 'O' },
              attachments: {},
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 4,
              offset: 0,
              substitutions: {},
              attachments: {
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 5,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: ['=', null, null, '=', null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
            }],
          },
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BUDESONIDE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(BUDESONIDE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(BUDESONIDE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = BUDESONIDE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CCCC1OC2C(O1)C5=CC(=O)C=CC5(C)C2C(=O)CO');
  });
});

describe('Fluticasone Integration Test', () => {
  test('parses fluticasone', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 0,
              substitutions: {},
              attachments: {
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 4,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: ['=', null, null, '=', null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'O', 'C', 'F'],
          bonds: [null, null, null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['S'], bonds: ['='], attachments: {},
            }],
          },
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(FLUTICASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(FLUTICASONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(FLUTICASONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = FLUTICASONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC2C(C1(O))(C)C(F)C4(O)=CC(=O)C=CC4(C)C2(C)C(=S)OCF');
  });
});

describe('Beclomethasone Integration Test', () => {
  test('parses beclomethasone', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['Cl'], bonds: [null], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 0,
              substitutions: {},
              attachments: {
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['Cl'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 4,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: ['=', null, null, '=', null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'O'],
          bonds: [null, null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
            }],
          },
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BECLOMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(BECLOMETHASONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(BECLOMETHASONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = BECLOMETHASONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC2C(C1(O))(C)C(Cl)C4(O)=CC(=O)C=CC4(C)C2(C)C(=O)CO');
  });
});

describe('Fludrocortisone Integration Test', () => {
  test('parses fludrocortisone', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              attachments: {
                4: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 10,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                10: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, '=', null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 9,
              ringNumber: 1,
              offset: 0,
              substitutions: {},
              attachments: {
                2: [{
                  type: 'linear', atoms: ['F'], bonds: [null], attachments: {},
                }],
                3: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 5,
              ringNumber: 2,
              offset: 0,
              substitutions: {},
              attachments: {
                1: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                2: [{
                  type: 'linear',
                  atoms: ['C', 'C', 'O'],
                  bonds: [null, null, null],
                  attachments: {
                    1: [{
                      type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                    }],
                  },
                }],
              },
              bonds: [null, null, null, null, null],
            },
          ],
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(FLUDROCORTISONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(FLUDROCORTISONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(FLUDROCORTISONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = FLUDROCORTISONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CCC(=O)C=C1');
  });
});

describe('Mometasone Integration Test', () => {
  test('parses mometasone', () => {
    const ast = parse(MOMETASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
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
              substitutions: {},
              attachments: {
                4: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                5: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 2,
              offset: 2,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['Cl'], bonds: [null], attachments: {},
                }],
                4: [{
                  type: 'linear', atoms: ['O'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 3,
              offset: 0,
              substitutions: {},
              attachments: {
                5: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['Cl'], bonds: [null], attachments: {},
                }],
              },
              bonds: [null, null, null, null, null, null],
            },
            {
              type: 'ring',
              atoms: 'C',
              size: 6,
              ringNumber: 4,
              offset: 0,
              substitutions: {},
              attachments: {
                3: [{
                  type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
                }],
                6: [{
                  type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
                }],
              },
              bonds: ['=', null, null, '=', null, null],
            },
          ],
        },
        {
          type: 'linear',
          atoms: ['C', 'C', 'Cl'],
          bonds: [null, null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['O'], bonds: ['='], attachments: {},
            }],
          },
        },
      ],
    });
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(MOMETASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(MOMETASONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(MOMETASONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = MOMETASONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC2C(C1(O))(C)C(Cl)C4(O)=CC(=O)C=CC4(C)C2(C)C(=O)CCl');
  });
});

describe('Cortisol Integration Test', () => {
  test('parses cortisol (alias for hydrocortisone)', () => {
    const ast = parse(CORTISOL_SMILES);
    const obj = ast.toObject();
    // Same as hydrocortisone
    expect(obj.type).toBe('molecule');
    expect(obj.components.length).toBe(3);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(CORTISOL_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CORTISOL_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(CORTISOL_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = CORTISOL_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CCC(=O)C=C1O');
  });
});

describe('Betamethasone Integration Test', () => {
  test('parses betamethasone (same SMILES as dexamethasone)', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const obj = ast.toObject();
    // Same structure as dexamethasone
    expect(obj.type).toBe('molecule');
    expect(obj.components.length).toBe(3);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(BETAMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(BETAMETHASONE_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const executableCode = stripExports(BETAMETHASONE_CODE);
    expect(() => {
      // eslint-disable-next-line no-new-func, no-new
      new Function('Ring', 'Linear', 'FusedRing', 'Molecule', executableCode);
    }).not.toThrow();
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const code = BETAMETHASONE_CODE;
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);
    expect(reconstructed.smiles).toBe('CC1CC2C(C1(O))(C)C(F)C4(O)=CC(=O)C=CC4(C)C2(C)C(=O)CO');
  });
});
