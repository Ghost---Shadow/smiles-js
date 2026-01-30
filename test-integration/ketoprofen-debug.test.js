import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

const KETOPROFEN_CODE = `export const v1 = Linear(['C', 'C', 'C', 'O']);
export const v2 = Ring({ atoms: 'c', size: 6 });
export const v3 = Linear(['C']);
export const v4 = Linear(['O'], ['=']);
export const v5 = v3.attach(v4, 1);
export const v6 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
export const v7 = Molecule([v2, v5, v6]);
export const v8 = v1.attach(v7, 2);
export const v9 = Linear(['O'], ['=']);
export const v10 = v8.attach(v9, 3);`;

const BIPHENYL_CODE = `export const v1 = Linear(['C', 'C', 'C', 'O']);
export const v2 = Ring({ atoms: 'c', size: 6 });
export const v3 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
export const v4 = Molecule([v2, v3]);
export const v5 = v1.attach(v4, 2);
export const v6 = Linear(['O'], ['=']);
export const v7 = v5.attach(v6, 3);`;

describe('Ketoprofen Debug', () => {
  test('analyze structure', () => {
    const smiles = 'CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('biphenyl variant', () => {
    const smiles = 'CC(c1ccccc1c2ccccc2)C(=O)O';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });
});

describe('Ketoprofen Code Round-Trip', () => {
  test('ketoprofen generates expected code', () => {
    const smiles = 'CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O';
    const ast = parse(smiles);
    const code = ast.toCode('v');
    expect(code).toBe(KETOPROFEN_CODE);
  });

  test('ketoprofen code produces expected AST', () => {
    const smiles = 'CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O';
    const ast = parse(smiles);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn v10;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('linear');
    expect(reconstructed.smiles).toBe('CC(c1ccccc1C(=O)c2ccccc2)C(=O)O');
  });

  test('biphenyl variant generates expected code', () => {
    const smiles = 'CC(c1ccccc1c2ccccc2)C(=O)O';
    const ast = parse(smiles);
    const code = ast.toCode('v');
    expect(code).toBe(BIPHENYL_CODE);
  });

  test('biphenyl variant code produces expected AST', () => {
    const smiles = 'CC(c1ccccc1c2ccccc2)C(=O)O';
    const ast = parse(smiles);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn v7;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('linear');
    expect(reconstructed.smiles).toBe('CC(c1ccccc1c2ccccc2)C(=O)O');
  });
});
