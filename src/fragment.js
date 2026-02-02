/**
 * Fragment - Convenience API for creating molecules from SMILES strings
 * Wraps parse() to provide a simpler interface for common use cases
 */

import { parse } from './parser.js';

/**
 * Validate and parse a SMILES string into an AST
 * @param {string} smiles - SMILES notation string
 * @returns {Object} AST node with all manipulation methods attached
 * @throws {Error} If smiles is not a non-empty string
 */
function validateAndParse(smiles) {
  if (typeof smiles !== 'string') {
    throw new Error('Fragment requires a SMILES string');
  }
  if (smiles.length === 0) {
    throw new Error('Fragment requires a non-empty SMILES string');
  }
  return parse(smiles);
}

/**
 * Create a molecule fragment from a SMILES string
 * @param {string} smiles - SMILES notation string
 * @returns {Object} AST node with all manipulation methods attached
 */
export function Fragment(smiles) {
  return validateAndParse(smiles);
}

/**
 * Static method to create a fragment from SMILES
 * @param {string} smiles - SMILES notation string
 * @returns {Object} AST node with all manipulation methods attached
 */
Fragment.smiles = function smiles(smilesStr) {
  return validateAndParse(smilesStr);
};
