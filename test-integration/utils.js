import { parse } from '../src/parser.js';
import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/constructors.js';

/**
 * Strip 'export ' from code for execution in new Function()
 * (new Function doesn't support ES module syntax)
 */
export function stripExports(code) {
  return code.replace(/^export /gm, '');
}

/**
 * Perform a codegen round-trip: SMILES -> AST -> CODE -> AST
 * Returns the reconstructed AST node
 * @param {string} smiles - The SMILES string to round-trip
 * @returns {Object} The reconstructed AST node
 */
export function codegenRoundTrip(smiles) {
  const ast = parse(smiles);
  const code = ast.toCode('v');

  // Find the last variable name in the generated code
  const varMatches = code.match(/export const (v\d+)/g);
  if (!varMatches) {
    throw new Error('No variables found in generated code');
  }
  const lastVar = varMatches[varMatches.length - 1].replace('export const ', '');

  // Strip 'export ' for evaluation in new Function (not supported in non-module context)
  const executableCode = code.replace(/^export /gm, '');

  // Execute the code to reconstruct the AST
  const factory = new Function('Ring', 'Linear', 'FusedRing', 'Molecule', `${executableCode}\nreturn ${lastVar};`);
  return factory(Ring, Linear, FusedRing, Molecule);
}

/**
 * Test both round-trips for a molecule
 * @param {Object} expect - The test expect function
 * @param {string} smiles - The input SMILES
 * @param {string} [expectedCodegenSmiles] - Expected SMILES after codegen (defaults to smiles)
 */
export function testBothRoundTrips(expect, smiles, expectedCodegenSmiles = smiles) {
  // SMILES -> AST -> SMILES
  expect(parse(smiles).smiles).toBe(smiles);

  // SMILES -> AST -> CODE -> AST -> SMILES
  const reconstructed = codegenRoundTrip(smiles);
  expect(reconstructed.smiles).toBe(expectedCodegenSmiles);
}
