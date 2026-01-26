import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

const TELMISARTAN_SMILES = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
const TELMISARTAN_OUTPUT = 'CCCC1NC2C(C=C(C=CNCC3CCC(C=C)CC3C4CCCCC4C(=O)O)C5NC6CCCCC6N5C)CCCC2N1C';
const BENZIMIDAZOLE_SMILES = 'c1nc2ccccc2n1';

const TELMISARTAN_CODE = `const telmisartanComp1 = Linear(['C', 'C', 'C']);
const telmisartanComp2Ring1 = Ring({ atoms: 'C', size: 5 });
const telmisartanComp2Ring1Sub2 = telmisartanComp2Ring1.substitute(2, 'N');
const telmisartanComp2Ring1Sub2Sub5 = telmisartanComp2Ring1Sub2.substitute(5, 'N');
const telmisartanComp2Ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
const telmisartanComp2Ring2Attach2_0Comp1 = Linear(['C', 'C'], ['=']);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp1 = Linear(['C', 'C', 'N', 'C'], ['=']);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp2 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp2Attach4_0 = Linear(['C', 'C'], ['=']);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp2WithAttach4_0 = telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp2.attach(telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp2Attach4_0, 4);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp3 = Ring({ atoms: 'C', size: 6, ringNumber: 4 });
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp4 = Linear(['C', 'O']);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp4Attach1_0 = Linear(['O'], ['=']);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp4WithAttach1_0 = telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp4.attach(telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp4Attach1_0, 1);
const telmisartanComp2Ring2Attach2_0Comp1Attach2_0 = Molecule([telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp1, telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp2WithAttach4_0, telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp3, telmisartanComp2Ring2Attach2_0Comp1Attach2_0Comp4WithAttach1_0]);
const telmisartanComp2Ring2Attach2_0Comp1WithAttach2_0 = telmisartanComp2Ring2Attach2_0Comp1.attach(telmisartanComp2Ring2Attach2_0Comp1Attach2_0, 2);
const telmisartanComp2Ring2Attach2_0Comp2Ring1 = Ring({ atoms: 'C', size: 5, ringNumber: 5 });
const telmisartanComp2Ring2Attach2_0Comp2Ring1Sub2 = telmisartanComp2Ring2Attach2_0Comp2Ring1.substitute(2, 'N');
const telmisartanComp2Ring2Attach2_0Comp2Ring1Sub2Sub5 = telmisartanComp2Ring2Attach2_0Comp2Ring1Sub2.substitute(5, 'N');
const telmisartanComp2Ring2Attach2_0Comp2Ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 6, offset: 2 });
const telmisartanComp2Ring2Attach2_0Comp2 = telmisartanComp2Ring2Attach2_0Comp2Ring1Sub2Sub5.fuse(telmisartanComp2Ring2Attach2_0Comp2Ring2, 2);
const telmisartanComp2Ring2Attach2_0Comp3 = Linear(['C']);
const telmisartanComp2Ring2Attach2_0 = Molecule([telmisartanComp2Ring2Attach2_0Comp1WithAttach2_0, telmisartanComp2Ring2Attach2_0Comp2, telmisartanComp2Ring2Attach2_0Comp3]);
const telmisartanComp2Ring2WithAttach2_0 = telmisartanComp2Ring2.attach(telmisartanComp2Ring2Attach2_0, 2);
const telmisartanComp2 = telmisartanComp2Ring1Sub2Sub5.fuse(telmisartanComp2Ring2WithAttach2_0, 2);
const telmisartanComp3 = Linear(['C']);
const telmisartan = Molecule([telmisartanComp1, telmisartanComp2, telmisartanComp3]);`;

const BENZIMIDAZOLE_CODE = `const benzimidazoleRing1 = Ring({ atoms: 'c', size: 5 });
const benzimidazoleRing1Sub2 = benzimidazoleRing1.substitute(2, 'n');
const benzimidazoleRing1Sub2Sub5 = benzimidazoleRing1Sub2.substitute(5, 'n');
const benzimidazoleRing2 = Ring({ atoms: 'c', size: 6, ringNumber: 2, offset: 2 });
const benzimidazole = benzimidazoleRing1Sub2Sub5.fuse(benzimidazoleRing2, 2);`;

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
    const code = ast.toCode('telmisartan');
    expect(code).toBe(TELMISARTAN_CODE);
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('telmisartan');

    let factory;
    expect(() => {
      // eslint-disable-next-line no-new-func
      factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', code);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('generated code produces valid AST when executed', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('telmisartan');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn telmisartan;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.type).toBe('molecule');
    expect(reconstructed.components.length).toBe(3);
    expect(reconstructed.smiles).toBe(TELMISARTAN_OUTPUT);
  });

  test('codegen round-trip: generated code produces same SMILES', () => {
    const ast = parse(TELMISARTAN_SMILES);
    const code = ast.toCode('telmisartan');

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn telmisartan;`);
    const reconstructed = factory(Ring, Linear, FusedRing, Molecule);

    expect(reconstructed.smiles).toBe(ast.smiles);
  });

  test('simple benzimidazole codegen round-trip', () => {
    const ast = parse(BENZIMIDAZOLE_SMILES);
    const code = ast.toCode('benzimidazole');

    expect(code).toBe(BENZIMIDAZOLE_CODE);

    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${code}\nreturn benzimidazole;`);
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
