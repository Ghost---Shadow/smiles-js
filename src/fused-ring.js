import { Fragment } from './fragment.js';

/**
 * Fused rings builder
 * @param {Array<Object>} rings - Array of ring descriptors
 * @returns {Fragment} Fragment object with SMILES string
 */
export function FusedRing(rings) {
  if (rings.length === 1) {
    // Single ring case
    const { type, size, substitutions = {} } = rings[0];

    // Build the ring with substitutions
    let smiles = '';
    for (let i = 1; i <= size; i += 1) {
      const atom = substitutions[i] || type;
      if (i === 1) {
        smiles += `${atom}1`;
      } else if (i === size) {
        smiles += `${atom}1`;
      } else {
        smiles += atom;
      }
    }

    return Fragment(smiles);
  }

  return Fragment('');
}
