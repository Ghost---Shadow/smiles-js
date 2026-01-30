import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const ACETAMINOPHEN_SMILES = 'CC(=O)Nc1ccc(O)cc1';
const PHENACETIN_SMILES = 'CC(=O)Nc1ccc(OCC)cc1';

const ACETAMINOPHEN_CODE = `export const v1 = Linear(['C', 'C', 'N']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'c', size: 6 });
export const v5 = Linear(['O']);
export const v6 = v4.attach(v5, 4);
export const v7 = Molecule([v3, v6]);`;

const PHENACETIN_CODE = `export const v1 = Linear(['C', 'C', 'N']);
export const v2 = Linear(['O'], ['=']);
export const v3 = v1.attach(v2, 2);
export const v4 = Ring({ atoms: 'c', size: 6 });
export const v5 = Linear(['O', 'C', 'C']);
export const v6 = v4.attach(v5, 4);
export const v7 = Molecule([v3, v6]);`;

describe('Acetaminophen Integration Test', () => {
  test('parses acetaminophen', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'N'],
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
          attachments: {
            4: [
              {
                type: 'linear',
                atoms: ['O'],
                bonds: [null],
                attachments: {},
              },
            ],
          },
          bonds: [null, null, null, null, null, null],
        },
      ],
    });
    expect(ast.smiles).toBe(ACETAMINOPHEN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(ACETAMINOPHEN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(ACETAMINOPHEN_SMILES);
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
    const ast = parse(ACETAMINOPHEN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ACETAMINOPHEN_SMILES);
  });
});

describe('Phenacetin Integration Test', () => {
  test('parses phenacetin', () => {
    const ast = parse(PHENACETIN_SMILES);
    const obj = ast.toObject();
    expect(obj).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear',
          atoms: ['C', 'C', 'N'],
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
          attachments: {
            4: [
              {
                type: 'linear',
                atoms: ['O', 'C', 'C'],
                bonds: [null, null, null],
                attachments: {},
              },
            ],
          },
          bonds: [null, null, null, null, null, null],
        },
      ],
    });
    expect(ast.smiles).toBe(PHENACETIN_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(PHENACETIN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(PHENACETIN_CODE);
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(PHENACETIN_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch ? varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1] : 'v1';

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(PHENACETIN_SMILES);
  });
});
