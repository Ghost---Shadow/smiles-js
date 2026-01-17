import initRDKitModule from '@rdkit/rdkit';

let RDKitModule = null;

/**
 * Initialize RDKit module
 */
async function initRDKit() {
  if (!RDKitModule) {
    RDKitModule = await initRDKitModule();
  }
  return RDKitModule;
}

/**
 * Check if SMILES is valid using RDKit
 * @param {string} smiles - SMILES string
 * @returns {Promise<boolean>}
 */
export async function isValidSMILES(smiles) {
  const rdkit = await initRDKit();

  let mol = null;
  try {
    mol = rdkit.get_mol(smiles);
    if (!mol) return false;
    return mol.is_valid();
  } catch {
    return false;
  } finally {
    if (mol) {
      mol.delete();
    }
  }
}
