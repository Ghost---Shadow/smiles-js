import initRDKitModule from '@rdkit/rdkit';
import { attachFragmentAt } from './attach-fragment.js';
import { fuseFragmentsAtEdge } from './fuse-fragments.js';
import { getElementSymbol } from './utils.js';

// Cache RDKit instance
let rdkitPromise = null;

/**
 * Get or initialize RDKit module
 * @returns {Promise<RDKit>}
 */
async function getRDKit() {
  if (!rdkitPromise) {
    rdkitPromise = initRDKitModule();
  }
  return rdkitPromise;
}

/**
 * Calculate molecular formula from RDKit meta
 * @param {Object} meta - RDKit JSON AST
 * @returns {string} Molecular formula in Hill notation
 */
function calculateFormulaFromMeta(meta) {
  const defaults = meta.defaults.atom;
  const { atoms } = meta.molecules[0];

  const elementCounts = {};

  atoms.forEach((atom) => {
    const atomicNumber = atom.z !== undefined ? atom.z : defaults.z;
    const implicitH = atom.impHs !== undefined ? atom.impHs : defaults.impHs;

    // Map atomic number to element symbol
    const element = getElementSymbol(atomicNumber);
    elementCounts[element] = (elementCounts[element] || 0) + 1;

    // Add implicit hydrogens
    if (implicitH > 0) {
      elementCounts.H = (elementCounts.H || 0) + implicitH;
    }
  });

  // Sort in Hill order (C, H, then alphabetical)
  const elements = Object.keys(elementCounts).sort((a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return -1;
    if (b === 'H') return 1;
    return a.localeCompare(b);
  });

  return elements.map((e) => {
    const count = elementCounts[e];
    return count === 1 ? e : `${e}${count}`;
  }).join('');
}

/**
 * Fragment - Async SMILES parser using RDKit
 *
 * Creates a fragment from a SMILES string with full molecular structure analysis.
 * The meta property contains the complete RDKit JSON AST.
 *
 * @param {string} smiles - SMILES string
 * @returns {Promise<FragmentInstance>}
 *
 * @example
 * const benzene = await Fragment('c1ccccc1');
 * console.log(benzene.smiles); // 'c1ccccc1'
 * console.log(benzene.meta); // RDKit JSON AST
 * console.log(benzene.atoms); // 6
 */
export async function Fragment(smiles) {
  const rdkit = await getRDKit();
  const mol = rdkit.get_mol(smiles);

  if (!mol || !mol.is_valid()) {
    mol?.delete();
    throw new Error(`Invalid SMILES: ${smiles}`);
  }

  // Get RDKit JSON AST - this is the meta
  const jsonStr = mol.get_json();
  const meta = JSON.parse(jsonStr);

  // Get canonical SMILES (normalized form)
  const canonicalSmiles = mol.get_smiles();

  // Calculate properties
  const atoms = meta.molecules[0]?.atoms?.length || 0;
  const rings = meta.molecules[0]?.extensions?.[0]?.atomRings?.length || 0;

  // Get descriptors for molecular weight and formula
  const descriptorsJson = mol.get_descriptors();
  const descriptors = JSON.parse(descriptorsJson);
  const molecularWeight = Math.round(descriptors.amw * 100) / 100;

  // Calculate formula from meta
  const formula = calculateFormulaFromMeta(meta);

  mol.delete();

  // Create the fragment instance
  const fragment = {
    smiles: canonicalSmiles,
    originalSmiles: smiles,
    meta,
    atoms,
    rings,
    formula,
    molecularWeight,

    toString() {
      return this.smiles;
    },

    [Symbol.toPrimitive]() {
      return this.smiles;
    },

    /**
     * Attach another fragment at a specific position
     * @param {number|number[]} position - Atom position(s) to attach at
     * @param {Fragment} fragment - Fragment to attach
     * @param {Object} options - Options for attachment
     * @param {number} options.attachmentPosition - Position on the fragment to attach from
     * @returns {Promise<Fragment>}
     */
    async attachAt(position, fragmentToAttach, options = {}) {
      if (Array.isArray(position)) {
        return fuseFragmentsAtEdge(this, position, fragmentToAttach, Fragment);
      }
      return attachFragmentAt(
        this,
        position,
        fragmentToAttach,
        { ...options, FragmentConstructor: Fragment },
      );
    },
  };

  return fragment;
}

/**
 * Convert RDKit JSON AST back to SMILES
 *
 * @param {Object} meta - RDKit JSON AST
 * @returns {Promise<string>} SMILES string
 *
 * @example
 * const smiles = await Fragment.fromMeta(meta);
 */
Fragment.fromMeta = async function fromMeta(meta) {
  // RDKit doesn't directly support JSON -> SMILES conversion
  // But we can reconstruct using mol format
  const rdkit = await getRDKit();

  // Convert JSON to mol format first
  const jsonStr = JSON.stringify(meta);

  // RDKit's get_mol can parse from JSON
  try {
    const mol = rdkit.get_mol_from_json(jsonStr);
    if (!mol || !mol.is_valid()) {
      mol?.delete();
      throw new Error('Invalid meta structure');
    }

    const smiles = mol.get_smiles();
    mol.delete();
    return smiles;
  } catch (error) {
    throw new Error(`Cannot convert meta to SMILES: ${error.message}`);
  }
};

/**
 * Validate SMILES string
 *
 * @param {string} smiles - SMILES string
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
Fragment.validate = async function validate(smiles) {
  try {
    const rdkit = await getRDKit();
    const mol = rdkit.get_mol(smiles);
    const valid = mol && mol.is_valid();
    mol?.delete();

    return valid
      ? { valid: true }
      : { valid: false, error: 'Invalid SMILES structure' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};
