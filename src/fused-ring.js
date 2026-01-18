/**
 * Fused rings builder
 * @param {number[]} rings - Array of ring sizes
 * @param {string[]} bonds - Array of bond types between atoms
 * @returns {string} SMILES string
 */
export function FusedRing(rings, bonds) {
  if (rings.length === 1) {
    // Single ring case
    const size = rings[0];
    const bondType = bonds[0];

    // Build the ring: bondType + '1' + (bondType repeated size-1 times) + '1'
    return `${bondType}1${bondType.repeat(size - 1)}1`;
  }

  return '';
}
