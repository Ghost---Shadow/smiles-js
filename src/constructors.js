/**
 * Programmatic molecule construction API
 * Factory functions for building molecules from scratch
 */

import {
  validateAtoms,
  validateSize,
  isRingNode,
} from './ast.js';

import {
  createRingNode,
  createLinearNode,
  createFusedRingNode,
  createMoleculeNode,
} from './node-creators.js';

// Re-export clone utilities
export {
  cloneAttachments,
  cloneSubstitutions,
  cloneComponents,
  deepCloneRing,
  deepCloneLinear,
  deepCloneFusedRing,
  deepCloneMolecule,
} from './clone-utils.js';

// Re-export method attachers
export {
  getSmiles,
  attachSmilesGetter,
  attachRingMethods,
  attachLinearMethods,
  attachMoleculeMethods,
  attachFusedRingMethods,
} from './method-attachers.js';

// Re-export node creators
export {
  createRingNode,
  createLinearNode,
  createFusedRingNode,
  createMoleculeNode,
} from './node-creators.js';

/**
 * Public constructor functions
 */

/**
 * Create a Ring node
 * @param {Object} options - Ring options
 * @param {string} options.atoms - Base atom type (e.g., 'c', 'C', 'N')
 * @param {number} options.size - Ring size (number of atoms)
 * @param {number} [options.ringNumber=1] - Ring number for SMILES notation
 * @param {number} [options.offset=0] - Offset for fused rings
 * @param {Object} [options.substitutions={}] - Position -> atom substitutions
 * @param {Object} [options.attachments={}] - Position -> attachment list
 * @param {Array} [options.bonds=[]] - Bond types between atoms (size-1 or size for closure)
 * @returns {Object} Ring AST node
 */
export function Ring(options) {
  const {
    atoms,
    size,
    ringNumber = 1,
    offset = 0,
    substitutions = {},
    attachments = {},
    bonds = [],
    branchDepths = null,
    leadingBond = null,
  } = options;

  validateAtoms(atoms);
  validateSize(size);

  const node = createRingNode(
    atoms,
    size,
    ringNumber,
    offset,
    substitutions,
    attachments,
    bonds,
    branchDepths,
  );

  // Preserve leading bond metadata if provided
  if (leadingBond) {
    node.metaLeadingBond = leadingBond;
  }

  return node;
}

/**
 * Create a Linear chain node
 * @param {Array<string>} atoms - Array of atom symbols
 * @param {Array<string>} [bonds=[]] - Array of bond types
 * @param {Object} [attachments={}] - Position -> attachment list
 * @returns {Object} Linear AST node
 */
export function Linear(atoms, bonds = [], attachments = {}) {
  if (!Array.isArray(atoms)) {
    throw new Error('Linear atoms must be an array');
  }
  validateAtoms(atoms);

  return createLinearNode(atoms, bonds, attachments);
}

/**
 * Create a FusedRing node
 * @param {Array<Object>} rings - Array of Ring nodes
 * @returns {Object} FusedRing AST node
 */
export function FusedRing(rings, options = {}) {
  if (!Array.isArray(rings)) {
    throw new Error('FusedRing requires an array of rings');
  }
  if (rings.length < 2) {
    throw new Error('FusedRing requires at least 2 rings');
  }
  if (!rings.every((r) => isRingNode(r))) {
    throw new Error('All elements must be Ring nodes');
  }

  return createFusedRingNode(rings, options);
}

/**
 * Create a Molecule node
 * @param {Array<Object>} [components=[]] - Array of AST nodes
 * @returns {Object} Molecule AST node
 */
export function Molecule(components = []) {
  if (!Array.isArray(components)) {
    throw new Error('Molecule components must be an array');
  }

  return createMoleculeNode(components);
}

/**
 * Create a RawFragment node that stores and echoes back raw SMILES.
 *
 * WARNING: This is for DEBUGGING and TESTING purposes ONLY.
 * DO NOT use RawFragment in production code or generated code.
 * Instead, use the proper Ring, Linear, FusedRing, and Molecule constructors
 * with the appropriate options (e.g., { sibling: true } for attach()).
 *
 * RawFragment bypasses the SMILES generation logic and simply returns
 * the stored string, which means it won't benefit from any future
 * improvements to the codegen.
 *
 * @param {string} smilesString - Raw SMILES string to store
 * @returns {Object} RawFragment node
 * @deprecated Use proper constructors instead
 */
export function RawFragment(smilesString) {
  if (typeof smilesString !== 'string') {
    throw new Error('RawFragment requires a SMILES string');
  }

  return {
    type: 'raw_fragment',
    smiles: smilesString,
    toObject() {
      return {
        type: 'raw_fragment',
        smiles: smilesString,
      };
    },
    toCode(varName = 'raw') {
      return `export const ${varName}1 = RawFragment(${JSON.stringify(smilesString)});`;
    },
    clone() {
      return RawFragment(smilesString);
    },
  };
}
