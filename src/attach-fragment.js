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
 * Attach a fragment at a specific position by manipulating the meta JSON
 * @param {Fragment} baseFragment - Base fragment to attach to
 * @param {number} position - Atom position to attach at
 * @param {Fragment} fragmentToAttach - Fragment to attach
 * @param {Object} options - Options for attachment
 * @param {Function} options.FragmentConstructor - Fragment constructor function
 * @returns {Promise<Fragment>}
 */
export async function attachFragmentAt(baseFragment, position, fragmentToAttach, options = {}) {
  const { FragmentConstructor, ...otherOptions } = options;
  // Validate position
  if (typeof position !== 'number' || position < 0 || position >= baseFragment.atoms) {
    throw new Error(`Invalid position: ${position}. Must be between 0 and ${baseFragment.atoms - 1}`);
  }

  // Get the attachment position on the fragment to attach
  const attachmentPosition = otherOptions.attachmentPosition ?? 0;

  // Clone the meta objects
  const newMeta = JSON.parse(JSON.stringify(baseFragment.meta));
  const attachMeta = fragmentToAttach.meta;

  // Get the molecule data
  const baseMol = newMeta.molecules[0];
  const attachMol = attachMeta.molecules[0];

  // Calculate offset for attached fragment's atom indices
  const atomOffset = baseMol.atoms.length;

  // Add atoms from the fragment to attach
  baseMol.atoms.push(...attachMol.atoms);

  // Add bonds from the fragment to attach (with offset indices)
  const offsetBonds = attachMol.bonds.map((bond) => ({
    ...bond,
    atoms: bond.atoms.map((atomIdx) => atomIdx + atomOffset),
  }));
  baseMol.bonds.push(...offsetBonds);

  // Add the connecting bond between base and attached fragment
  // Decrease implicit H count on both connected atoms
  if (baseMol.atoms[position].impHs !== undefined) {
    baseMol.atoms[position].impHs = Math.max(0, baseMol.atoms[position].impHs - 1);
  } else {
    const defaultImpHs = newMeta.defaults.atom.impHs;
    baseMol.atoms[position].impHs = Math.max(0, defaultImpHs - 1);
  }

  const attachAtomIdx = atomOffset + attachmentPosition;
  if (baseMol.atoms[attachAtomIdx].impHs !== undefined) {
    baseMol.atoms[attachAtomIdx].impHs = Math.max(0, baseMol.atoms[attachAtomIdx].impHs - 1);
  } else {
    const defaultImpHs = newMeta.defaults.atom.impHs;
    baseMol.atoms[attachAtomIdx].impHs = Math.max(0, defaultImpHs - 1);
  }

  // Add the new bond
  baseMol.bonds.push({
    atoms: [position, attachAtomIdx],
  });

  // Merge extensions (rings, aromatic atoms, etc.)
  if (attachMol.extensions && attachMol.extensions.length > 0) {
    const attachExt = attachMol.extensions[0];
    const baseExt = baseMol.extensions[0];

    // Offset aromatic atoms
    if (attachExt.aromaticAtoms) {
      const offsetAromaticAtoms = attachExt.aromaticAtoms.map((idx) => idx + atomOffset);
      baseExt.aromaticAtoms = [...(baseExt.aromaticAtoms || []), ...offsetAromaticAtoms];
    }

    // Offset aromatic bonds
    if (attachExt.aromaticBonds) {
      const bondOffset = baseMol.bonds.length - offsetBonds.length - 1;
      const offsetAromaticBonds = attachExt.aromaticBonds.map((idx) => idx + bondOffset);
      baseExt.aromaticBonds = [...(baseExt.aromaticBonds || []), ...offsetAromaticBonds];
    }

    // Offset atom rings
    if (attachExt.atomRings) {
      const offsetAtomRings = attachExt.atomRings.map((ring) => (
        ring.map((idx) => idx + atomOffset)
      ));
      baseExt.atomRings = [...(baseExt.atomRings || []), ...offsetAtomRings];
    }
  }

  // Convert modified meta back to SMILES and validate
  return validateAndConvertMeta(newMeta, FragmentConstructor);
}
