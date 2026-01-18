import { Fragment } from './fragment.js';

/**
 * Build a single ring as an array of atom strings
 * @param {Object} ringDesc - Ring descriptor with type, size, and optional substitutions
 * @param {number} ringNumber - The ring closure number to use
 * @returns {Array<string>} Array of atom strings
 */
export function buildRing(ringDesc, ringNumber) {
  const { type, size, substitutions = {} } = ringDesc;
  const atoms = [];

  for (let i = 1; i <= size; i += 1) {
    const atom = substitutions[i] || type;
    if (i === 1) {
      atoms.push(`${atom}${ringNumber}`);
    } else if (i === size) {
      atoms.push(`${atom}${ringNumber}`);
    } else {
      atoms.push(atom);
    }
  }

  return atoms;
}

/**
 * Fused rings builder
 * @param {Array<Object>} rings - Array of ring descriptors
 * @returns {Fragment} Fragment object with SMILES string
 */
export function FusedRing(rings) {
  if (rings.length === 0) {
    throw new Error('FusedRing requires at least one ring');
  }

  // Sort rings from largest to smallest
  const sortedRings = [...rings].sort((a, b) => b.size - a.size);

  // Start with the largest ring
  let atoms = buildRing(sortedRings[0], 1);
  let nextRingNum = 2;

  // Wrap each subsequent ring around the previous structure
  for (let ringIdx = 1; ringIdx < sortedRings.length; ringIdx += 1) {
    const ring = sortedRings[ringIdx];
    const { offset } = ring;

    // Build the new ring
    const newRingAtoms = buildRing(ring, nextRingNum);

    // Split the outer ring structure, removing the two atoms that will be shared
    const beforeFusion = atoms.slice(0, offset);
    const afterFusion = atoms.slice(offset + 2);

    // Reconstruct: outer ring before fusion + complete inner ring + outer ring after fusion
    atoms = [
      ...beforeFusion,
      ...newRingAtoms,
      ...afterFusion,
    ];

    nextRingNum += 1;
  }

  const fragment = Fragment(atoms.join(''));
  fragment.meta = rings;
  return fragment;
}
