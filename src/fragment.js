/**
 * Fragment - Convenience API for creating molecules from SMILES strings
 * Wraps parse() to provide a simpler interface for common use cases
 */

import { parse } from './parser.js';

function createFragment(smiles) {
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
  return createFragment(smiles);
}

/**
 * Static method to create a fragment from SMILES
 * @param {string} smiles - SMILES notation string
 * @returns {Object} AST node with all manipulation methods attached
 */
Fragment.smiles = function smiles(smilesStr) {
  return createFragment(smilesStr);
};
