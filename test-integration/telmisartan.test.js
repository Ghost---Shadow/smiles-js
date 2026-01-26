import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

const TELMISARTAN_SMILES = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
const TELMISARTAN_OUTPUT = 'CCCC1NC2C(C=C(C=CNCC3CCC(C=C)CC3C4CCCCC4C(=O)O)C5NC6CCCCC6N5C)CCCC2N1C';
const BENZIMIDAZOLE_SMILES = 'c1nc2ccccc2n1';

const TELMISARTAN_CODE = `const v1 = Linear(['C', 'C', 'C']);
const v2 = Ring({ atoms: 'C', size: 5 });
const v3 = v2.substitute(2, 'N');
const v4 = v3.substitute(5, 'N');
const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
const v6 = Linear(['C', 'C'], ['=']);
const v7 = Linear(['C', 'C', 'N', 'C'], ['=']);
const v8 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
const v9 = Linear(['C', 'C'], ['=']);
const v10 = v8.attach(v9, 4);
const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 4 });
const v12 = Linear(['C', 'O']);
const v13 = Linear(['O'], ['=']);
const v14 = v12.attach(v13, 1);
const v15 = Molecule([v7, v10, v11, v14]);
const v16 = v6.attach(v15, 2);
const v17 = Ring({ atoms: 'C', size: 5, ringNumber: 5 });
const v18 = v17.substitute(2, 'N');
const v19 = v18.substitute(5, 'N');
const v20 = Ring({ atoms: 'C', size: 6, ringNumber: 6, offset: 2 });
const v21 = v19.fuse(v20, 2);
const v22 = Linear(['C']);
const v23 = Molecule([v16, v21, v22]);
const v24 = v5.attach(v23, 2);
const v25 = v4.fuse(v24, 2);
const v26 = Linear(['C']);
const v27 = Molecule([v1, v25, v26]);`;

const BENZIMIDAZOLE_CODE = `const v1 = Ring({ atoms: 'c', size: 5 });
const v2 = v1.substitute(2, 'n');
const v3 = v2.substitute(5, 'n');
const v4 = Ring({ atoms: 'c', size: 6, ringNumber: 2, offset: 2 });
const v5 = v3.fuse(v4, 2);`;

describe('Telmisartan Integration Test', () => {
  test('parses telmisartan', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const obj = ast.toObject();
    expect(obj.type).toBe('molecule');
    expect(obj.components.length).toBe(3);
    expect(obj.components[0]).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C'],
      bonds: [],
      attachments: {},
    });
    expect(obj.components[1].type).toBe('fused_ring');
    expect(obj.components[1].rings.length).toBe(2);
    expect(obj.components[2]).toEqual({
      type: 'linear',
      atoms: ['C'],
      bonds: [],
      attachments: {},
    });
    expect(ast.smiles).toBe(TELMISARTAN_OUTPUT);
  });

  test('generates code via toCode()', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(TELMISARTAN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', code);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('generated code produces valid AST when executed', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v27;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.components.length).toBe(3);
    expect(reconstructed.smiles).toBe(TELMISARTAN_OUTPUT);
  });

  test('codegen round-trip: generated code produces same SMILES', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('v');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v27;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ast.smiles);
  });

  test('simple benzimidazole codegen round-trip', () => {
    const ast = parse(BENZIMIDAZOLE_SMILES);
    const code = ast.toCode('v');

    expect(code).toBe(BENZIMIDAZOLE_CODE);

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn v5;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(ast.smiles).toBe(BENZIMIDAZOLE_SMILES);
    expect(reconstructed.smiles).toBe(BENZIMIDAZOLE_SMILES);
  });

  test('benzimidazole fused ring structure', () => {
    const ast = parse(BENZIMIDAZOLE_SMILES);
    const obj = ast.toObject();

    expect(obj).toEqual({
      type: 'fused_ring',
      rings: [
        {
          type: 'ring',
          atoms: 'c',
          size: 5,
          ringNumber: 1,
          offset: 0,
          substitutions: { 2: 'n', 5: 'n' },
          attachments: {},
        },
        {
          type: 'ring',
          atoms: 'c',
          size: 6,
          ringNumber: 2,
          offset: 2,
          substitutions: {},
          attachments: {},
        },
      ],
    });
  });
});
