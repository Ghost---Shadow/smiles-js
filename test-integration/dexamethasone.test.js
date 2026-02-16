import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import {
  stripExports, createFunction, executeCode, codegenRoundTrip,
} from './utils.js';

const DEXAMETHASONE_SMILES = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO';

describe('Dexamethasone Integration Test', () => {
  test('parses dexamethasone', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const obj = ast.toObject();
    expect(obj).toMatchSnapshot();
  });

  test('AST round-trips correctly', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    expect(ast.smiles).toBe(DEXAMETHASONE_SMILES);
  });

  test('generates valid code via toCode()', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toMatchSnapshot();
  });

  test('generates valid verbose code via toCode()', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    expect(code).toMatchSnapshot();
  });

  test('generated code is valid JavaScript', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v');
    const executableCode = stripExports(code);

    let factory;
    expect(() => {
      factory = createFunction('Ring', 'Linear', 'FusedRing', 'Molecule', 'RawFragment', 'Fragment', executableCode);
    }).not.toThrow();
    expect(typeof factory).toBe('function');
  });

  test('codegen round-trip: generated code produces valid SMILES', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    const code = ast.toCode('v', { verbose: true });
    const executableCode = stripExports(code);
    const varMatch = code.match(/export const (v\d+) = /g);
    const lastVar = varMatch[varMatch.length - 1].match(/export const (v\d+)/)[1];
    const reconstructed = executeCode(executableCode, lastVar);
    expect(reconstructed.smiles).toBe(DEXAMETHASONE_SMILES);
  });
});

describe('Dexamethasone - Divide and Conquer', () => {
  // Level 1: Simple linear chains
  test('AST: linear chain C-C', () => {
    const smiles = 'CC';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: linear chain C-C', () => {
    const smiles = 'CC';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: linear chain C-C-C', () => {
    const smiles = 'CCC';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: linear chain C-C-C', () => {
    const smiles = 'CCC';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 2: Simple rings
  test('AST: 6-membered ring', () => {
    const smiles = 'C1CCCCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: 6-membered ring', () => {
    const smiles = 'C1CCCCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: 6-membered ring with double bonds', () => {
    const smiles = 'C1=CC=CC=C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: 6-membered ring with double bonds', () => {
    const smiles = 'C1=CC=CC=C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 3: Rings with branches
  test('AST: ring with simple branch', () => {
    const smiles = 'CC1CCCCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with simple branch', () => {
    const smiles = 'CC1CCCCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: ring with branch in parentheses', () => {
    const smiles = 'C1CC(C)CCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with branch in parentheses', () => {
    const smiles = 'C1CC(C)CCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 4: Multiple rings (fused)
  test('AST: two fused rings', () => {
    const smiles = 'C1CCC2CCCCC2C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: two fused rings', () => {
    const smiles = 'C1CCC2CCCCC2C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: three fused rings', () => {
    const smiles = 'C1CCC2C(C1)CCC3CCCCC23';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: three fused rings', () => {
    const smiles = 'C1CCC2C(C1)CCC3CCCCC23';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 5: Ketone groups (C=O)
  test('AST: simple ketone', () => {
    const smiles = 'CC(=O)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: simple ketone', () => {
    const smiles = 'CC(=O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: ring with ketone', () => {
    const smiles = 'C1CCC(=O)CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with ketone', () => {
    const smiles = 'C1CCC(=O)CC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: ring with ketone and double bond', () => {
    const smiles = 'C1CC(=O)C=CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with ketone and double bond', () => {
    const smiles = 'C1CC(=O)C=CC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 6: Hydroxyl groups (O)
  test('AST: simple hydroxyl', () => {
    const smiles = 'CC(O)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: simple hydroxyl', () => {
    const smiles = 'CC(O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: ring with hydroxyl', () => {
    const smiles = 'C1CC(O)CCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with hydroxyl', () => {
    const smiles = 'C1CC(O)CCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 7: Fluorine atoms
  test('AST: simple fluorine', () => {
    const smiles = 'CC(F)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: simple fluorine', () => {
    const smiles = 'CC(F)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: ring with fluorine', () => {
    const smiles = 'C1CC(F)CCC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with fluorine', () => {
    const smiles = 'C1CC(F)CCC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 8: Combined functional groups
  test('AST: ring with ketone, double bond, and hydroxyl', () => {
    const smiles = 'C1=CC(=O)C=CC1O';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with ketone, double bond, and hydroxyl', () => {
    const smiles = 'C1=CC(=O)C=CC1O';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 9: Four fused rings (steroid core)
  test('AST: four fused rings', () => {
    const smiles = 'C1CCC2C(C1)CCC3C2CCC4CCCCC34';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: four fused rings', () => {
    const smiles = 'C1CCC2C(C1)CCC3C2CCC4CCCCC34';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 10: Steroid core with methyl branches
  test('AST: steroid core with methyl', () => {
    const smiles = 'CC1CCC2C(C1)CCC3C2CCC4(C)CCCCC34';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: steroid core with methyl', () => {
    const smiles = 'CC1CCC2C(C1)CCC3C2CCC4(C)CCCCC34';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 11: Steroid core with ketone (THIS IS WHERE IT BREAKS)
  test('AST: steroid core with ketone', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3CCC2(C)C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: steroid core with ketone', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3CCC2(C)C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 12: Steroid core with fluorine
  test('AST: steroid core with fluorine', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)CCC2(C)C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: steroid core with fluorine', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)CCC2(C)C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 13: Steroid core with hydroxyl
  test('AST: steroid core with hydroxyl', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: steroid core with hydroxyl', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 14: Adding side chain with hydroxyl
  test('AST: steroid with side chain hydroxyl', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)CO';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: steroid with side chain hydroxyl', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)CO';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 15: Adding ketone to side chain
  test('AST: steroid with side chain ketone', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: steroid with side chain ketone', () => {
    const smiles = 'CC1CCC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Level 16: Full dexamethasone (side chain with C(=O)CO)
  test('AST: full dexamethasone', () => {
    const ast = parse(DEXAMETHASONE_SMILES);
    expect(ast.smiles).toBe(DEXAMETHASONE_SMILES);
  });

  test('codegen: full dexamethasone', () => {
    const reconstructed = codegenRoundTrip(DEXAMETHASONE_SMILES);
    expect(reconstructed.smiles).toBe(DEXAMETHASONE_SMILES);
  });

  // Edge cases: different starting positions
  test('AST: dexamethasone starting from different ring', () => {
    const smiles = 'C1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: dexamethasone starting from different ring', () => {
    const smiles = 'C1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Complex branch structures
  test('AST: branch with nested ketone and hydroxyl', () => {
    const smiles = 'C(O)C(=O)CO';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: branch with nested ketone and hydroxyl', () => {
    const smiles = 'C(O)C(=O)CO';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: ring with complex side chain', () => {
    const smiles = 'C1CCC(C(=O)CO)CC1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: ring with complex side chain', () => {
    const smiles = 'C1CCC(C(=O)CO)CC1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  // Simplified dexamethasone fragments
  test('AST: dexamethasone without fluorine', () => {
    const smiles = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3C(O)CC2(C)C1(O)C(=O)CO';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: dexamethasone without fluorine', () => {
    const smiles = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3C(O)CC2(C)C1(O)C(=O)CO';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('AST: dexamethasone without side chain', () => {
    const smiles = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('codegen: dexamethasone without side chain', () => {
    const smiles = 'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });
});
