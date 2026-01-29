import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

const CELECOXIB_SMILES = 'CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C(F)(F)F';

const CELECOXIB_CODE = `const v1 = Linear(['C']);
const v2 = Ring({ atoms: 'C', size: 6 });
const v3 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
const v4 = v3.substitute(4, 'N');
const v5 = v4.substitute(5, 'N');
const v6 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
const v7 = v5.fuse(v6, 0);
const v8 = Linear(['C', 'F']);
const v9 = Linear(['F']);
const v10 = v8.attach(v9, 1);
const v11 = Linear(['F']);
const v12 = v10.attach(v11, 1);
const v13 = Molecule([v1, v2, v7, v12]);`;

const PYRAZOLE_PHENYL_CODE = `const v1 = Ring({ atoms: 'C', size: 5 });
const v2 = v1.substitute(4, 'N');
const v3 = v2.substitute(5, 'N');
const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const v5 = v3.fuse(v4, 0);
const v6 = Linear(['C']);
const v7 = Molecule([v5, v6]);`;

const MINIMAL_SEQUENTIAL_CODE = `const v1 = Ring({ atoms: 'C', size: 4 });
const v2 = Ring({ atoms: 'C', size: 4, ringNumber: 2 });
const v3 = v1.fuse(v2, 0);
const v4 = Linear(['C']);
const v5 = Molecule([v3, v4]);`;

describe('Celecoxib Investigation', () => {
  test('full molecule parse', () => {
    const smiles = CELECOXIB_SMILES;
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('simpler nested ring case', () => {
    const smiles = 'C1=CC(=NN1C2=CC=CC=C2)C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('even simpler - ring on N of ring', () => {
    const smiles = 'C1=CN(C=N1)C2=CC=CC=C2';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('ring attached in branch of another ring', () => {
    const smiles = 'C1=CC=C(C=C1)C2=CC=CC=C2';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('ring on N with substitution', () => {
    const smiles = 'CC1=NN(C=C1)C2=CC=CC=C2';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('pyrazole core only', () => {
    const smiles = 'CC1=CC(=NN1)C(F)(F)F';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('pyrazole with one phenyl', () => {
    const smiles = 'CC1=CC=C(C=C1)C2=CC(=NN2)C(F)(F)F';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('pyrazole with N-phenyl only', () => {
    const smiles = 'C1=CC(=NN1C2=CC=CC=C2)C(F)(F)F';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('pyrazole with N-phenyl-sulfonamide', () => {
    const smiles = 'C1=CC(=NN1C2=CC=C(C=C2)S(=O)(=O)N)C(F)(F)F';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('minimal failing case - =NN1C2', () => {
    const smiles = 'C1=CC=NN1C2=CC=CC=C2';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('compare with working NN(C=C1)C2', () => {
    const smiles = 'C1=CC=NN(C=C1)C2=CC=CC=C2';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('ring closure at same position as ring attachment - minimal', () => {
    const smiles = 'C1=NN1C2=CC=CC=C2';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('diazole with N-attachment', () => {
    const smiles = 'C1=NN1C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('CRITICAL: ring2 opens in branch containing ring1 closure', () => {
    const smiles = 'C1=CC(=NN1C2=CC=CC=C2)C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('even simpler - ring opens in branch after ring closure', () => {
    const smiles = 'C1CC(C1C2CCC2)C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('minimal with ring number reuse', () => {
    const smiles = 'C1CC(C1C2CCC2)C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);

    const smiles2 = 'C1=CC(=NN1C3=CC=CC=C3)C';
    const result2 = parse(smiles2);
    expect(result2.smiles).toBe(smiles2);
  });

  test('debug AST for failing case', () => {
    const smiles = 'C1=CC(=NN1C2=CC=CC=C2)C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });

  test('minimal failing: C1CC(C1C2CCC2)C', () => {
    const smiles = 'C1CC(C1C2CCC2)C';
    const result = parse(smiles);
    expect(result.smiles).toBe(smiles);
  });
});

describe('Celecoxib Code Round-Trip', () => {
  test('generates expected code via toCode()', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(CELECOXIB_CODE);
  });

  test('generated code produces expected AST when executed', () => {
    const ast = parse(CELECOXIB_SMILES);
    const code = ast.toCode('v');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v13;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.smiles).toBe('CC1CCCCC1C23CCCCC3CNN2C(F)(F)F');
  });

  test('simple pyrazole-phenyl codegen round-trip', () => {
    const smiles = 'C1=CC(=NN1C2=CC=CC=C2)C';
    const ast = parse(smiles);
    const code = ast.toCode('v');

    expect(code).toBe(PYRAZOLE_PHENYL_CODE);

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v7;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.smiles).toBe('C12CCCCC2CNN1C');
  });

  test('minimal sequential ring pattern codegen round-trip', () => {
    const smiles = 'C1CC(C1C2CCC2)C';
    const ast = parse(smiles);
    const code = ast.toCode('v');

    expect(code).toBe(MINIMAL_SEQUENTIAL_CODE);

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v5;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.smiles).toBe('C12CCC2CC1C');
  });
});
