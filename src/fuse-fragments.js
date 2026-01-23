import { buildMolBlockFromMeta } from './mol-block-builder.js';

/**
 * Get or initialize RDKit module
 * @returns {Promise<RDKit>}
 */
let rdkitPromise = null;
async function getRDKit() {
  const initRDKitModule = (await import('@rdkit/rdkit')).default;
  if (!rdkitPromise) {
    rdkitPromise = initRDKitModule();
  }
  return rdkitPromise;
}

/**
 * Validate meta JSON and convert back to Fragment
 * @param {Object} meta - Modified RDKit JSON meta
 * @param {Function} FragmentConstructor - Fragment constructor function
 * @returns {Promise<Fragment>}
 */
async function validateAndConvertMeta(meta, FragmentConstructor) {
  const rdkit = await getRDKit();

  try {
    // Convert meta JSON to MOL block format
    const molBlock = buildMolBlockFromMeta(meta);

    // Validate by parsing MOL block with RDKit
    const mol = rdkit.get_mol(molBlock);

    if (!mol || !mol.is_valid()) {
      mol?.delete();
      throw new Error('Generated molecule is invalid');
    }

    const canonicalSmiles = mol.get_smiles();
    mol.delete();

    // Create new Fragment from the validated SMILES
    return FragmentConstructor(canonicalSmiles);
  } catch (error) {
    throw new Error(`Failed to create valid molecule: ${error.message}`);
  }
}

/**
 * Fuse two fragments at a shared edge by manipulating meta JSON
 * @param {Fragment} baseFragment - Base fragment
 * @param {number[]} edge - Two positions defining the edge [pos1, pos2]
 * @param {Fragment} fragmentToAttach - Fragment to fuse
 * @param {Function} FragmentConstructor - Fragment constructor function
 * @returns {Promise<Fragment>}
 */
export async function fuseFragmentsAtEdge(
  baseFragment,
  edge,
  fragmentToAttach,
  FragmentConstructor,
) {
  // Validate edge
  if (!Array.isArray(edge) || edge.length !== 2) {
    throw new Error('Edge fusion requires exactly 2 positions');
  }

  edge.forEach((pos) => {
    if (pos < 0 || pos >= baseFragment.atoms) {
      const msg = `Invalid position: ${pos}. Must be between 0 and ${baseFragment.atoms - 1}`;
      throw new Error(msg);
    }
  });

  // Clone the meta objects
  const newMeta = JSON.parse(JSON.stringify(baseFragment.meta));
  const attachMeta = fragmentToAttach.meta;

  const baseMol = newMeta.molecules[0];
  const attachMol = attachMeta.molecules[0];

  // For fusion, we merge two atoms from each fragment
  // The edge atoms [edge[0], edge[1]] from base will be merged with [0, 1] from attach

  // Calculate which atoms to keep from attached fragment (all except the fused edge)
  const atomsToRemove = [0, 1]; // Assuming we fuse at [0,1] of attached fragment
  const atomOffset = baseMol.atoms.length; // Offset for new atoms from attached fragment

  // Add atoms from attached fragment (excluding fused atoms)
  const attachAtoms = attachMol.atoms.filter((_, idx) => !atomsToRemove.includes(idx));
  baseMol.atoms.push(...attachAtoms);

  // Remap bonds from attached fragment
  const atomIndexMap = {};
  let newIdx = atomOffset;
  attachMol.atoms.forEach((_, i) => {
    if (!atomsToRemove.includes(i)) {
      atomIndexMap[i] = newIdx;
      newIdx += 1;
    } else {
      // Map removed atoms to the edge atoms in base
      atomIndexMap[i] = edge[atomsToRemove.indexOf(i)];
    }
  });

  // Add bonds with remapped indices
  // Skip bonds that connect two fused atoms (would create duplicates)
  attachMol.bonds.forEach((bond) => {
    const atom1 = bond.atoms[0];
    const atom2 = bond.atoms[1];

    // Skip if both atoms are being fused (both in atomsToRemove)
    if (atomsToRemove.includes(atom1) && atomsToRemove.includes(atom2)) {
      return; // Skip this bond
    }

    const remappedBond = {
      ...bond,
      atoms: bond.atoms.map((idx) => atomIndexMap[idx]),
    };
    baseMol.bonds.push(remappedBond);
  });

  // Merge extensions
  if (attachMol.extensions && attachMol.extensions.length > 0) {
    const attachExt = attachMol.extensions[0];
    const baseExt = baseMol.extensions[0];

    // Remap aromatic atoms
    if (attachExt.aromaticAtoms) {
      const remappedAromaticAtoms = attachExt.aromaticAtoms
        .filter((idx) => !atomsToRemove.includes(idx))
        .map((idx) => atomIndexMap[idx]);
      baseExt.aromaticAtoms = [...(baseExt.aromaticAtoms || []), ...remappedAromaticAtoms];
    }

    // Remap atom rings
    if (attachExt.atomRings) {
      const remappedRings = attachExt.atomRings.map((ring) => ring.map((idx) => atomIndexMap[idx]));
      baseExt.atomRings = [...(baseExt.atomRings || []), ...remappedRings];
    }
  }

  // Convert modified meta back to SMILES and validate
  return validateAndConvertMeta(newMeta, FragmentConstructor);
}
