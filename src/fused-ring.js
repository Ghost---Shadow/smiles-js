/**
 * Fused rings builder
 * @param {Array<{type: string, size: number}>} rings - Array of ring descriptors
 * @returns {string} SMILES string
 */
export function FusedRing(rings) {
  if (rings.length === 1) {
    // Single ring case
    const { type, size } = rings[0];

    // Build the ring: type + '1' + (type repeated size-1 times) + '1'
    return `${type}1${type.repeat(size - 1)}1`;
  }

  return '';
}
