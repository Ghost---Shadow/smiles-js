/**
 * Manipulation methods for AST nodes
 * All methods are immutable - they return new nodes
 */

import {
  createRingNode,
  createLinearNode,
  createFusedRingNode,
  createMoleculeNode,
  cloneAttachments,
  cloneSubstitutions,
  cloneComponents,
  deepCloneRing,
} from './constructors.js';
import { validatePosition, isLinearNode, isMoleculeNode } from './ast.js';

/**
 * Ring manipulation methods
 */

export function ringAttach(ring, attachment, position, options = {}) {
  validatePosition(position, ring.size);

  const updatedAttachments = cloneAttachments(ring.attachments);

  if (!updatedAttachments[position]) {
    updatedAttachments[position] = [];
  }

  // Clone the attachment and set metaIsSibling if provided in options
  let attachmentToAdd = attachment;
  if (options.sibling !== undefined) {
    attachmentToAdd = { ...attachment, metaIsSibling: options.sibling };
  }

  updatedAttachments[position] = [...updatedAttachments[position], attachmentToAdd];

  return createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    ring.offset,
    ring.substitutions,
    updatedAttachments,
    ring.bonds || [],
    ring.metaBranchDepths || null,
  );
}

export function ringSubstitute(ring, position, newAtom) {
  validatePosition(position, ring.size);

  const updatedSubstitutions = cloneSubstitutions(ring.substitutions);
  const baseAtom = ring.atoms;

  if (newAtom === baseAtom) {
    delete updatedSubstitutions[position];
  } else {
    updatedSubstitutions[position] = newAtom;
  }

  return createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    ring.offset,
    updatedSubstitutions,
    ring.attachments,
    ring.bonds || [],
    ring.metaBranchDepths || null,
  );
}

export function ringSubstituteMultiple(ring, substitutionMap) {
  return Object.entries(substitutionMap).reduce(
    (result, [position, atom]) => ringSubstitute(result, Number(position), atom),
    ring,
  );
}

export function ringFuse(ring, otherRing, offset, options = {}) {
  const ring1 = createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    0,
    ring.substitutions,
    ring.attachments,
    ring.bonds || [],
    ring.metaBranchDepths || null,
  );

  const ring2 = createRingNode(
    otherRing.atoms,
    otherRing.size,
    otherRing.ringNumber || ring.ringNumber + 1,
    offset,
    otherRing.substitutions,
    otherRing.attachments,
    otherRing.bonds || [],
    otherRing.metaBranchDepths || null,
  );

  return createFusedRingNode([ring1, ring2], options);
}

export function ringConcat(ring, other) {
  return createMoleculeNode([ring, other]);
}

export function ringClone(ring) {
  return deepCloneRing(ring);
}

/**
 * Linear manipulation methods
 */

export function linearAttach(linear, attachment, position) {
  if (position < 1 || position > linear.atoms.length) {
    throw new Error(`Position must be an integer between 1 and ${linear.atoms.length}`);
  }

  const updatedAttachments = cloneAttachments(linear.attachments || {});

  if (!updatedAttachments[position]) {
    updatedAttachments[position] = [];
  }

  updatedAttachments[position] = [...updatedAttachments[position], attachment];

  return createLinearNode(linear.atoms, linear.bonds, updatedAttachments);
}

export function linearBranch(linear, branchPoint, ...branches) {
  if (branchPoint < 1 || branchPoint > linear.atoms.length) {
    throw new Error(`Branch point must be an integer between 1 and ${linear.atoms.length}`);
  }

  return branches.reduce(
    (result, branch) => linearAttach(result, branch, branchPoint),
    linear,
  );
}

export function linearBranchAt(linear, branchMap) {
  return Object.entries(branchMap).reduce(
    (result, [position, branches]) => {
      const pos = Number(position);
      const branchList = Array.isArray(branches) ? branches : [branches];
      return linearBranch(result, pos, ...branchList);
    },
    linear,
  );
}

export function linearConcat(linear, other) {
  if (isLinearNode(other)) {
    const newAtoms = [...linear.atoms, ...other.atoms];
    const newBonds = [...linear.bonds];

    if (other.bonds.length > 0) {
      newBonds.push(...other.bonds);
    }

    return createLinearNode(newAtoms, newBonds, {});
  }
  return createMoleculeNode([linear, other]);
}

/**
 * FusedRing manipulation methods
 */

export function fusedRingAddRing(fusedRing, ring, offset) {
  const newRings = fusedRing.rings.map((r) => ({ ...r }));
  const ringWithOffset = { ...ring, offset };
  newRings.push(ringWithOffset);
  return createFusedRingNode(newRings);
}

export function fusedRingGetRing(fusedRing, ringNumber) {
  return fusedRing.rings.find((r) => r.ringNumber === ringNumber);
}

/**
 * Helper to update a specific ring in a fused ring system
 * @param {Object} fusedRing - FusedRing node
 * @param {number} ringNumber - Ring number to update
 * @param {Function} updateFn - Function that takes the ring and returns updated ring
 * @returns {Object} New FusedRing node
 */
function updateRingInFused(fusedRing, ringNumber, updateFn) {
  const targetRing = fusedRingGetRing(fusedRing, ringNumber);
  if (!targetRing) {
    throw new Error(`Ring ${ringNumber} not found in fused ring system`);
  }

  const updatedRing = updateFn(targetRing);
  const newRings = fusedRing.rings.map(
    (r) => (r.ringNumber === ringNumber ? updatedRing : { ...r }),
  );

  return createFusedRingNode(newRings);
}

export function fusedRingSubstituteInRing(fusedRing, ringNumber, position, newAtom) {
  return updateRingInFused(
    fusedRing,
    ringNumber,
    (ring) => ringSubstitute(ring, position, newAtom),
  );
}

export function fusedRingAttachToRing(fusedRing, ringNumber, attachment, position) {
  return updateRingInFused(
    fusedRing,
    ringNumber,
    (ring) => ringAttach(ring, attachment, position),
  );
}

export function fusedRingRenumber(fusedRing, startNumber = 1) {
  const newRings = fusedRing.rings.map((r, idx) => ({
    ...r,
    ringNumber: startNumber + idx,
  }));
  return createFusedRingNode(newRings);
}

export function fusedRingConcat(fusedRing, other) {
  return createMoleculeNode([fusedRing, other]);
}

/**
 * Molecule manipulation methods
 */

export function moleculeAppend(molecule, component) {
  const newComponents = cloneComponents(molecule.components);
  newComponents.push(component);
  return createMoleculeNode(newComponents);
}

export function moleculePrepend(molecule, component) {
  const newComponents = cloneComponents(molecule.components);
  newComponents.unshift(component);
  return createMoleculeNode(newComponents);
}

export function moleculeConcat(molecule, other) {
  const newComponents = cloneComponents(molecule.components);
  if (isMoleculeNode(other)) {
    newComponents.push(...other.components);
  } else {
    newComponents.push(other);
  }
  return createMoleculeNode(newComponents);
}

export function moleculeGetComponent(molecule, index) {
  return molecule.components[index];
}

export function moleculeReplaceComponent(molecule, index, newComponent) {
  const newComponents = cloneComponents(molecule.components);
  newComponents[index] = newComponent;
  return createMoleculeNode(newComponents);
}
