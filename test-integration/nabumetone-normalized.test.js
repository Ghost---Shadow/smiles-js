import { describe, test, expect } from 'bun:test';
import { Fragment } from '../src/fragment.js';
import { parse } from '../src/parser.js';
import {
  Ring, Linear, Molecule,
} from '../src/constructors.js';
import { stripExports } from './utils.js';

/**
 * Test case for Nabumetone that demonstrates full closed-loop round-trip:
 * SMILES -> parse -> toCode() -> execute code -> SMILES (same as input)
 */
describe('Nabumetone Normalized', () => {
  const NABUMETONE_SMILES = 'c1cc2ccc(OC)cc2cc1CCC(=O)C';

  const EXPECTED_CODE = `export const v1 = Ring({ atoms: 'c', size: 6 });
export const v2 = Ring({ atoms: 'c', size: 6, ringNumber: 2, offset: 2 });
export const v3 = Linear(['O', 'C']);
export const v4 = v2.attach(v3, 4);
export const v5 = v1.fuse(v4, 2);
export const v6 = Linear(['C', 'C', 'C', 'C']);
export const v7 = Linear(['O'], ['=']);
export const v8 = v6.attach(v7, 3);
export const v9 = Molecule([v5, v8]);`;

  test('Fragment parses normalized nabumetone SMILES', () => {
    const nabumetone = Fragment(NABUMETONE_SMILES);
    expect(nabumetone.smiles).toBe(NABUMETONE_SMILES);
  });

  test('toCode generates expected code', () => {
    const ast = parse(NABUMETONE_SMILES);
    const code = ast.toCode('v');
    expect(code).toBe(EXPECTED_CODE);
  });

  test('CLOSED LOOP: SMILES -> toCode() -> execute -> same SMILES', () => {
    // Parse the SMILES
    const ast = parse(NABUMETONE_SMILES);

    // Generate code
    const code = ast.toCode('v');

    // Execute the generated code
    const executableCode = stripExports(code);
    // eslint-disable-next-line no-new-func
    const factory = new Function('Ring', 'Linear', 'Molecule', `${executableCode}\nreturn v9;`);
    const reconstructed = factory(Ring, Linear, Molecule);

    // Verify we get back the original SMILES
    expect(reconstructed.smiles).toBe(NABUMETONE_SMILES);
  });
});
