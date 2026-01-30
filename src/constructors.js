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
    bonds: [...(ring.bonds || [])],
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
        bonds: [...(this.bonds || [])],
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
        rings: this.rings.map((r) => (r.toObject ? r.toObject() : {
          type: r.type,
          atoms: r.atoms,
          size: r.size,
          ringNumber: r.ringNumber,
          offset: r.offset,
          substitutions: { ...r.substitutions },
          attachments: {},
        })),
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

export function createRingNode(atoms, size, ringNumber, offset, subs, attachments, bonds = []) {
  const node = {
    type: ASTNodeType.RING,
    atoms,
    size,
    ringNumber,
    offset,
    substitutions: { ...subs },
    attachments: { ...attachments },
    bonds: [...bonds],
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

/**
 * Compute position metadata for fused rings
 * This enables proper interleaved SMILES generation
 *
 * For benzimidazole-like fused rings (5+6 with offset 2):
 * - Ring 1 (5 atoms): positions [0, 1, 2, 7, 8]
 * - Ring 2 (6 atoms): positions [2, 3, 4, 5, 6, 7]
 * - Shared: positions 2 and 7 (2 atoms)
 * - Total: 5 + 6 - 2 = 9 atoms
 */
function computeFusedRingPositions(fusedRingNode) {
  const { rings } = fusedRingNode;

  // Sort rings by offset
  const sortedRings = [...rings].sort((a, b) => a.offset - b.offset);

  // For two-ring fused systems (most common case)
  if (sortedRings.length === 2) {
    const ring1 = sortedRings[0]; // Base ring (offset 0)
    const ring2 = sortedRings[1]; // Second ring (offset > 0)

    const { offset } = ring2;
    // Number of shared atoms between rings (typically 2 for benzene-like fusion)
    const sharedAtoms = 2;

    // Total atoms in the fused system
    const totalAtoms = ring1.size + ring2.size - sharedAtoms;

    // Compute positions for ring 1 (interleaved pattern)
    // First part: atoms 0 through offset (inclusive) → offset + 1 atoms
    // Remaining atoms: ring1.size - (offset + 1) atoms at the end
    const ring1FirstPartCount = offset + 1;
    const ring1SecondPartCount = ring1.size - ring1FirstPartCount;

    const ring1Positions = [];
    // First part: [0, 1, ..., offset]
    for (let i = 0; i < ring1FirstPartCount; i += 1) {
      ring1Positions.push(i);
    }
    // Second part: last ring1SecondPartCount positions
    const secondPartStart = totalAtoms - ring1SecondPartCount;
    for (let i = secondPartStart; i < totalAtoms; i += 1) {
      ring1Positions.push(i);
    }

    // Compute positions for ring 2
    // Ring 2 spans from offset to offset + ring2.size - 1
    // But we need to account for the interleaving
    // Ring 2 ends at position (offset + ring2.size - 1) but that overlaps with ring 1's second part
    // Actually ring 2 positions are: offset to (totalAtoms - ring1SecondPartCount - 1 + 1)
    // Let me think... ring 2 has 6 atoms starting at offset 2
    // They go at positions: 2, 3, 4, 5, 6, 7 (6 positions)
    // Ring 1's second part starts at 7, so ring 2 ends at 7 (shared)
    const ring2Positions = [];
    for (let i = 0; i < ring2.size; i += 1) {
      ring2Positions.push(offset + i);
    }

    // Store position metadata
    /* eslint-disable no-underscore-dangle, no-param-reassign */
    ring1._positions = ring1Positions;
    ring1._start = 0;
    ring1._end = totalAtoms - 1;

    ring2._positions = ring2Positions;
    ring2._start = offset;
    ring2._end = offset + ring2.size - 1;

    fusedRingNode._allPositions = Array.from({ length: totalAtoms }, (_, i) => i);
    fusedRingNode._totalAtoms = totalAtoms;
    /* eslint-enable no-underscore-dangle, no-param-reassign */
  }
  // For more complex fused systems, fall back to simple offset model
  // (position metadata won't be set, triggering buildSimpleFusedRingSMILES)
}

export function createFusedRingNode(rings) {
  // Create base node
  const node = {
    type: ASTNodeType.FUSED_RING,
    rings: rings.map((r) => ({ ...r })),
  };

  // Only compute position metadata if not already present from parser
  // Parser-generated rings have _positions, API-created rings don't
  /* eslint-disable no-underscore-dangle */
  const hasParserPositions = rings.some((r) => r._positions);
  /* eslint-enable no-underscore-dangle */

  if (!hasParserPositions) {
    // Compute interleaved position metadata for proper SMILES generation
    // This is needed when rings are created via API (not parser)
    computeFusedRingPositions(node);
  }

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
  } = options;

  validateAtoms(atoms);
  validateSize(size);

  return createRingNode(atoms, size, ringNumber, offset, substitutions, attachments, bonds);
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

/**
 * Create a RawFragment node that stores and echoes back raw SMILES
 * Useful for visual comparison with RDKit output
 * @param {string} smilesString - Raw SMILES string to store
 * @returns {Object} RawFragment node
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
