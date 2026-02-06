/**
 * Helper functions for immutable updates / deep cloning AST nodes
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
