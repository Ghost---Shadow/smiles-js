import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

const SIMPLE_SULFONAMIDE_CODE = `const v1 = Ring({ atoms: 'C', size: 6 });
const v2 = Linear(['S', 'N']);
const v3 = Linear(['O'], ['=']);
const v4 = v2.attach(v3, 1);
const v5 = Linear(['O'], ['=']);
const v6 = v4.attach(v5, 1);
const v7 = Molecule([v1, v6]);`;

const PYRAZOLE_SULFONAMIDE_CODE = `const v1 = Ring({ atoms: 'C', size: 5 });
const v2 = v1.substitute(4, 'N');
const v3 = v2.substitute(5, 'N');
const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const v5 = v3.fuse(v4, 0);
const v6 = Linear(['C', 'F']);
const v7 = Linear(['F']);
const v8 = v6.attach(v7, 1);
const v9 = Linear(['F']);
const v10 = v8.attach(v9, 1);
const v11 = Molecule([v5, v10]);`;

describe('Sulfonamide Debug', () => {
  test('simple sulfonamide', () => {
    const smiles = 'C1=CC=C(C=C1)S(=O)(=O)N';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('pyrazole + N-phenyl-sulfonamide', () => {
    const smiles = 'C1=CC(=NN1C2=CC=C(C=C2)S(=O)(=O)N)C(F)(F)F';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });
});

describe('Sulfonamide Code Round-Trip', () => {
  test('simple sulfonamide generates expected code', () => {
    const smiles = 'C1=CC=C(C=C1)S(=O)(=O)N';
    const ast = parse(smiles);
    const code = ast.toCode('v');
    expect(code).toBe(SIMPLE_SULFONAMIDE_CODE);
  });

  test('simple sulfonamide code produces expected AST', () => {
    const smiles = 'C1=CC=C(C=C1)S(=O)(=O)N';
    const ast = parse(smiles);
    const code = ast.toCode('v');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v7;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.smiles).toBe('C1CCCCC1S(=O)(=O)N');
  });

  test('pyrazole + N-phenyl-sulfonamide generates expected code', () => {
    const smiles = 'C1=CC(=NN1C2=CC=C(C=C2)S(=O)(=O)N)C(F)(F)F';
    const ast = parse(smiles);
    const code = ast.toCode('v');
    expect(code).toBe(PYRAZOLE_SULFONAMIDE_CODE);
  });

  test('pyrazole + N-phenyl-sulfonamide code produces expected AST', () => {
    const smiles = 'C1=CC(=NN1C2=CC=C(C=C2)S(=O)(=O)N)C(F)(F)F';
    const ast = parse(smiles);
    const code = ast.toCode('v');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v11;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.smiles).toBe('C12CCCCC2CNN1C(F)(F)F');
  });
});
