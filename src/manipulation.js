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
  );
}

export function ringSubstituteMultiple(ring, substitutionMap) {
  return Object.entries(substitutionMap).reduce(
    (result, [position, atom]) => ringSubstitute(result, Number(position), atom),
    ring,
  );
}

export function ringFuse(ring, otherRing, offset) {
  const ring1 = createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    0,
    ring.substitutions,
    ring.attachments,
  );

  const ring2 = createRingNode(
    otherRing.atoms,
    otherRing.size,
    otherRing.ringNumber || ring.ringNumber + 1,
    offset,
    otherRing.substitutions,
    otherRing.attachments,
  );

  return createFusedRingNode([ring1, ring2]);
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

export function linearAttach() {
  // For now, store attachments in a similar way to rings
  // This requires adding an attachments field to linear nodes
  throw new Error('linearAttach not yet implemented');
}

export function linearConcat(linear, other) {
  if (isLinearNode(other)) {
    const newAtoms = [...linear.atoms, ...other.atoms];
    const newBonds = [...linear.bonds];

    if (other.bonds.length > 0) {
      newBonds.push(...other.bonds);
    }

    return createLinearNode(newAtoms, newBonds);
  }
  return createMoleculeNode([linear, other]);
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
