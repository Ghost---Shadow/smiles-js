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
import { decompile } from './decompiler.js';
import {
  ringAttach,
  ringSubstitute,
  ringSubstituteMultiple,
  ringFuse,
  ringConcat,
  ringClone,
  linearAttach,
  linearBranch,
  linearBranchAt,
  linearConcat,
  fusedRingAddRing,
  fusedRingGetRing,
  fusedRingSubstituteInRing,
  fusedRingAttachToRing,
  fusedRingRenumber,
  fusedRingConcat,
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
    attachments: cloneAttachments(linear.attachments || {}),
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
    toObject() {
      const result = {
        type: this.type,
        atoms: this.atoms,
        size: this.size,
        ringNumber: this.ringNumber,
        offset: this.offset,
        substitutions: { ...this.substitutions },
        attachments: {},
      };
      Object.entries(this.attachments).forEach(([pos, attachmentList]) => {
        result.attachments[pos] = attachmentList.map((a) => (a.toObject ? a.toObject() : a));
      });
      return result;
    },
    toCode(varName = 'ring') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to Linear nodes
export function attachLinearMethods(node) {
  return Object.assign(node, {
    attach(attachment, position) {
      return linearAttach(this, attachment, position);
    },
    branch(branchPoint, ...branches) {
      return linearBranch(this, branchPoint, ...branches);
    },
    branchAt(branchMap) {
      return linearBranchAt(this, branchMap);
    },
    concat(other) {
      return linearConcat(this, other);
    },
    clone() {
      return deepCloneLinear(this);
    },
    toObject() {
      const result = {
        type: this.type,
        atoms: [...this.atoms],
        bonds: [...this.bonds],
        attachments: {},
      };
      Object.entries(this.attachments).forEach(([pos, attachmentList]) => {
        result.attachments[pos] = attachmentList.map((a) => (a.toObject ? a.toObject() : a));
      });
      return result;
    },
    toCode(varName = 'linear') {
      return decompile(this, { varName });
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
    toObject() {
      return {
        type: this.type,
        components: this.components.map((c) => (c.toObject ? c.toObject() : c)),
      };
    },
    toCode(varName = 'molecule') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to FusedRing nodes
export function attachFusedRingMethods(node) {
  return Object.assign(node, {
    addRing(ring, offset) {
      return fusedRingAddRing(this, ring, offset);
    },
    getRing(ringNumber) {
      return fusedRingGetRing(this, ringNumber);
    },
    substituteInRing(ringNumber, position, newAtom) {
      return fusedRingSubstituteInRing(this, ringNumber, position, newAtom);
    },
    attachToRing(ringNumber, attachment, position) {
      return fusedRingAttachToRing(this, ringNumber, attachment, position);
    },
    renumber(startNumber = 1) {
      return fusedRingRenumber(this, startNumber);
    },
    concat(other) {
      return fusedRingConcat(this, other);
    },
    clone() {
      return deepCloneFusedRing(this);
    },
    toObject() {
      return {
        type: this.type,
        rings: this.rings.map((r) => ({ ...r })),
      };
    },
    toCode(varName = 'fusedRing') {
      return decompile(this, { varName });
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

export function createLinearNode(atoms, bonds, attachments = {}) {
  const node = {
    type: ASTNodeType.LINEAR,
    atoms: [...atoms],
    bonds: [...bonds],
    attachments: { ...attachments },
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
