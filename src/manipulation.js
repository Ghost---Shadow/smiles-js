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
import { validatePosition } from './ast.js';
import { isLinearNode, isMoleculeNode } from './ast.js';

/**
 * Ring manipulation methods
 */

export function ringAttach(ring, attachment, position) {
  validatePosition(position, ring.size);

  const updatedAttachments = cloneAttachments(ring.attachments);

  if (!updatedAttachments[position]) {
    updatedAttachments[position] = [];
  }

  updatedAttachments[position] = [...updatedAttachments[position], attachment];

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

export function fusedRingSubstituteInRing(fusedRing, ringNumber, position, newAtom) {
  const targetRing = fusedRingGetRing(fusedRing, ringNumber);
  if (!targetRing) {
    throw new Error(`Ring ${ringNumber} not found in fused ring system`);
  }

  const updatedRing = ringSubstitute(targetRing, position, newAtom);
  const newRings = fusedRing.rings.map((r) => {
    if (r.ringNumber === ringNumber) {
      return updatedRing;
    }
    return { ...r };
  });

  return createFusedRingNode(newRings);
}

export function fusedRingAttachToRing(fusedRing, ringNumber, attachment, position) {
  const targetRing = fusedRingGetRing(fusedRing, ringNumber);
  if (!targetRing) {
    throw new Error(`Ring ${ringNumber} not found in fused ring system`);
  }

  const updatedRing = ringAttach(targetRing, attachment, position);
  const newRings = fusedRing.rings.map((r) => {
    if (r.ringNumber === ringNumber) {
      return updatedRing;
    }
    return { ...r };
  });

  return createFusedRingNode(newRings);
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
