/**
 * AST (Abstract Syntax Tree) node types for SMILES molecules
 */

export const ASTNodeType = {
  MOLECULE: 'molecule', // Root node containing multiple components
  LINEAR: 'linear', // Linear chain of atoms
  RING: 'ring', // Single ring structure
  FUSED_RING: 'fused_ring', // Multiple rings sharing atoms
  ATOM: 'atom', // Single atom (not currently used as separate node)
};

/**
 * Type-checking utilities for AST nodes
 */

export function isASTNode(value) {
  return value != null && typeof value === 'object' && 'type' in value;
}

export function isMoleculeNode(value) {
  return isASTNode(value) && value.type === ASTNodeType.MOLECULE;
}

export function isLinearNode(value) {
  return isASTNode(value) && value.type === ASTNodeType.LINEAR;
}

export function isRingNode(value) {
  return isASTNode(value) && value.type === ASTNodeType.RING;
}

export function isFusedRingNode(value) {
  return isASTNode(value) && value.type === ASTNodeType.FUSED_RING;
}

/**
 * Validation utilities
 */

export function validateAtoms(atoms) {
  if (typeof atoms === 'string') {
    if (atoms.length === 0) {
      throw new Error('Atoms string cannot be empty');
    }
    return true;
  }
  if (Array.isArray(atoms)) {
    if (atoms.length === 0) {
      throw new Error('Atoms array cannot be empty');
    }
    if (!atoms.every((a) => typeof a === 'string')) {
      throw new Error('All atoms must be strings');
    }
    return true;
  }
  throw new Error('Atoms must be a string or array of strings');
}

export function validateSize(size) {
  if (typeof size !== 'number' || size < 3 || !Number.isInteger(size)) {
    throw new Error('Ring size must be an integer >= 3');
  }
  return true;
}

export function validatePosition(position, size) {
  const pos = Number(position);
  if (!Number.isInteger(pos) || pos < 1 || pos > size) {
    throw new Error(`Position must be an integer between 1 and ${size}`);
  }
  return true;
}
