/**
 * Programmatic molecule construction API
 * Factory functions for building molecules from scratch
 */

import {
  ASTNodeType,
  validateAtoms,
  validateSize,
  isRingNode,
} from './ast.js';

import { buildSMILES } from './codegen.js';
import {
  ringAttach,
  ringSubstitute,
  ringSubstituteMultiple,
  ringFuse,
  ringConcat,
  ringClone,
  linearConcat,
  moleculeAppend,
  moleculePrepend,
  moleculeConcat,
  moleculeGetComponent,
  moleculeReplaceComponent,
} from './manipulation.js';

/**
 * Helper functions for immutable updates
 */

export function cloneAttachments(attachments) {
  const cloned = {};
  Object.entries(attachments).forEach(([pos, list]) => {
    cloned[pos] = [...list];
  });
  return cloned;
}

export function cloneSubstitutions(substitutions) {
  return { ...substitutions };
}

export function cloneComponents(components) {
  return [...components];
}

export function deepCloneRing(ring) {
  return {
    ...ring,
    substitutions: cloneSubstitutions(ring.substitutions),
    attachments: cloneAttachments(ring.attachments),
  };
}

export function deepCloneLinear(linear) {
  return {
    ...linear,
    atoms: [...linear.atoms],
    bonds: [...linear.bonds],
  };
}

export function deepCloneFusedRing(fusedRing) {
  return {
    ...fusedRing,
    rings: fusedRing.rings.map((r) => deepCloneRing(r)),
  };
}

export function deepCloneMolecule(molecule) {
  return {
    ...molecule,
    components: cloneComponents(molecule.components),
  };
}

/**
 * SMILES getter function
 */

export function getSmiles() {
  return buildSMILES(this);
}

/**
 * Method attachment functions
 */

// Attach smiles getter to all node types
export function attachSmilesGetter(node) {
  Object.defineProperty(node, 'smiles', {
    get: getSmiles,
    enumerable: true,
    configurable: true,
  });
  return node;
}

// Attach manipulation methods to Ring nodes
export function attachRingMethods(node) {
  return Object.assign(node, {
    attach(attachment, position) {
      return ringAttach(this, attachment, position);
    },
    substitute(position, newAtom) {
      return ringSubstitute(this, position, newAtom);
    },
    substituteMultiple(substitutionMap) {
      return ringSubstituteMultiple(this, substitutionMap);
    },
    fuse(otherRing, offset) {
      return ringFuse(this, otherRing, offset);
    },
    concat(other) {
      return ringConcat(this, other);
    },
    clone() {
      return ringClone(this);
    },
  });
}

// Attach manipulation methods to Linear nodes
export function attachLinearMethods(node) {
  return Object.assign(node, {
    concat(other) {
      return linearConcat(this, other);
    },
    clone() {
      return deepCloneLinear(this);
    },
  });
}

// Attach manipulation methods to Molecule nodes
export function attachMoleculeMethods(node) {
  return Object.assign(node, {
    append(component) {
      return moleculeAppend(this, component);
    },
    prepend(component) {
      return moleculePrepend(this, component);
    },
    concat(other) {
      return moleculeConcat(this, other);
    },
    getComponent(index) {
      return moleculeGetComponent(this, index);
    },
    replaceComponent(index, newComponent) {
      return moleculeReplaceComponent(this, index, newComponent);
    },
    clone() {
      return deepCloneMolecule(this);
    },
  });
}

// Attach manipulation methods to FusedRing nodes
export function attachFusedRingMethods(node) {
  return Object.assign(node, {
    concat(other) {
      return ringConcat(this, other);
    },
    clone() {
      return deepCloneFusedRing(this);
    },
  });
}

/**
 * Internal factory functions
 */

export function createRingNode(atoms, size, ringNumber, offset, substitutions, attachments) {
  const node = {
    type: ASTNodeType.RING,
    atoms,
    size,
    ringNumber,
    offset,
    substitutions: { ...substitutions },
    attachments: { ...attachments },
  };
  attachSmilesGetter(node);
  attachRingMethods(node);
  return node;
}

export function createLinearNode(atoms, bonds) {
  const node = {
    type: ASTNodeType.LINEAR,
    atoms: [...atoms],
    bonds: [...bonds],
  };
  attachSmilesGetter(node);
  attachLinearMethods(node);
  return node;
}

export function createFusedRingNode(rings) {
  const node = {
    type: ASTNodeType.FUSED_RING,
    rings: rings.map((r) => ({ ...r })),
  };
  attachSmilesGetter(node);
  attachFusedRingMethods(node);
  return node;
}

export function createMoleculeNode(components) {
  const node = {
    type: ASTNodeType.MOLECULE,
    components: [...components],
  };
  attachSmilesGetter(node);
  attachMoleculeMethods(node);
  return node;
}

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
  } = options;

  validateAtoms(atoms);
  validateSize(size);

  return createRingNode(atoms, size, ringNumber, offset, substitutions, attachments);
}

/**
 * Create a Linear chain node
 * @param {Array<string>} atoms - Array of atom symbols
 * @param {Array<string>} [bonds=[]] - Array of bond types
 * @returns {Object} Linear AST node
 */
export function Linear(atoms, bonds = []) {
  if (!Array.isArray(atoms)) {
    throw new Error('Linear atoms must be an array');
  }
  validateAtoms(atoms);

  return createLinearNode(atoms, bonds);
}

/**
 * Create a FusedRing node
 * @param {Array<Object>} rings - Array of Ring nodes
 * @returns {Object} FusedRing AST node
 */
export function FusedRing(rings) {
  if (!Array.isArray(rings)) {
    throw new Error('FusedRing requires an array of rings');
  }
  if (rings.length < 2) {
    throw new Error('FusedRing requires at least 2 rings');
  }
  if (!rings.every((r) => isRingNode(r))) {
    throw new Error('All elements must be Ring nodes');
  }

  return createFusedRingNode(rings);
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
