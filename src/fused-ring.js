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

  // Track used ring numbers in meta
  const usedRingNumbers = [];
  for (let i = 1; i < nextRingNum; i += 1) {
    usedRingNumbers.push(i);
  }

  fragment.meta = {
    rings,
    usedRingNumbers,
  };

  // Override fuse method for rings with metadata
  fragment.fuse = function fuseFunction(other) {
    // eslint-disable-next-line no-use-before-define
    return fuseRings(fragment, other);
  };

  return fragment;
}

/**
 * Fuse two ring fragments together
 * @param {Fragment} fragment1 - First ring fragment with meta
 * @param {Fragment} fragment2 - Second ring fragment with meta
 * @returns {Fragment} Fused ring fragment
 */
export function fuseRings(fragment1, fragment2) {
  const fragment2Obj = typeof fragment2 === 'function' ? fragment2 : Fragment(String(fragment2));

  // Get ring descriptors from meta
  const rings1 = fragment1.meta?.rings || [];
  const rings2 = fragment2Obj.meta?.rings || [];

  if (rings1.length === 0 || rings2.length === 0) {
    throw new Error('Both fragments must have ring meta information to fuse');
  }

  // Combine the ring descriptors
  const combinedRings = [...rings1, ...rings2];

  return FusedRing(combinedRings);
}
