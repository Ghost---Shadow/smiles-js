import { getAtomString } from './utils.js';

/**
 * Builds the first atom with ring marker 1
 * @param {number} atomPos - Current atom position (passed by reference via return)
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {Array} atomPositions - Array to store atom position metadata
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildFirstAtom(atomPos, heteroAtoms, defaultAtom, atomPositions) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const smiles = `${atomString}1`;
  atomPositions.push({ ring: 0, index: 0, smilesIndex: 0 });
  return { smiles, nextAtomPos: atomPos + 1 };
}

/**
 * Builds the middle atoms of the first ring (between first atom and first bridge)
 * @param {number} atomPos - Current atom position
 * @param {number} count - Number of middle atoms to build
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {Array} atomPositions - Array to store atom position metadata
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildFirstRingMiddleAtoms(atomPos, count, heteroAtoms, defaultAtom, atomPositions) {
  let smiles = '';
  let currentPos = atomPos;
  let i = 0;
  while (i < count) {
    atomPositions.push({ ring: 0, index: i + 1, smilesIndex: smiles.length });
    smiles += getAtomString(currentPos, heteroAtoms, defaultAtom);
    currentPos += 1;
    i += 1;
  }
  return { smiles, nextAtomPos: currentPos };
}

/**
 * Builds the first bridge atom (shared between both rings) with ring marker 2
 * @param {number} atomPos - Current atom position
 * @param {number} firstRingSize - Size of the first ring
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {Array} atomPositions - Array to store atom position metadata
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildFirstBridgeAtom(
  atomPos,
  firstRingSize,
  heteroAtoms,
  defaultAtom,
  atomPositions,
) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const smiles = `${atomString}2`;
  atomPositions.push({
    ring: 0,
    index: firstRingSize - 3,
    smilesIndex: 0,
    shared: true,
  });
  return { smiles, nextAtomPos: atomPos + 1 };
}

/**
 * Builds the middle atoms of the second ring
 * @param {number} atomPos - Current atom position
 * @param {number} count - Number of middle atoms to build
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {Array} atomPositions - Array to store atom position metadata
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildSecondRingMiddleAtoms(
  atomPos,
  count,
  heteroAtoms,
  defaultAtom,
  atomPositions,
) {
  let smiles = '';
  let currentPos = atomPos;
  let i = 0;
  while (i < count) {
    atomPositions.push({ ring: 1, index: i + 1, smilesIndex: 0 });
    smiles += getAtomString(currentPos, heteroAtoms, defaultAtom);
    currentPos += 1;
    i += 1;
  }
  return { smiles, nextAtomPos: currentPos };
}

/**
 * Builds the second bridge atom with ring marker 2
 * @param {number} atomPos - Current atom position
 * @param {number} secondRingSize - Size of the second ring
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {Array} atomPositions - Array to store atom position metadata
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildSecondBridgeAtom(
  atomPos,
  secondRingSize,
  heteroAtoms,
  defaultAtom,
  atomPositions,
) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const smiles = `${atomString}2`;
  atomPositions.push({
    ring: 1,
    index: secondRingSize - 1,
    smilesIndex: 0,
    shared: true,
  });
  return { smiles, nextAtomPos: atomPos + 1 };
}

/**
 * Builds the last atom with ring marker 1
 * @param {number} atomPos - Current atom position
 * @param {number} firstRingSize - Size of the first ring
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {Array} atomPositions - Array to store atom position metadata
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildLastAtom(atomPos, firstRingSize, heteroAtoms, defaultAtom, atomPositions) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const smiles = `${atomString}1`;
  atomPositions.push({ ring: 0, index: firstRingSize - 1, smilesIndex: 0 });
  return { smiles, nextAtomPos: atomPos + 1 };
}

/**
 * Builds the base SMILES string for a fused ring system without substituents
 * @param {Array<number>} sizes - Array of ring sizes [size1, size2]
 * @param {Object} heteroAtoms - Map of position to heteroatom string
 * @param {string} defaultAtom - Default atom type
 * @returns {Object} Object with smiles, atomPositions, and totalAtoms
 */
export function buildBaseSmiles(sizes, heteroAtoms, defaultAtom) {
  const atomPositions = [];
  let fullSmiles = '';
  let atomPosition = 0;

  // First atom with ring marker 1
  const first = buildFirstAtom(
    atomPosition,
    heteroAtoms,
    defaultAtom,
    atomPositions,
  );
  fullSmiles += first.smiles;
  atomPosition = first.nextAtomPos;

  // First ring middle atoms
  const firstRingMiddleAtoms = sizes[0] - 4;
  const firstMiddle = buildFirstRingMiddleAtoms(
    atomPosition,
    firstRingMiddleAtoms,
    heteroAtoms,
    defaultAtom,
    atomPositions,
  );
  fullSmiles += firstMiddle.smiles;
  atomPosition = firstMiddle.nextAtomPos;

  // First bridge atom with ring marker 2
  const bridge1 = buildFirstBridgeAtom(
    atomPosition,
    sizes[0],
    heteroAtoms,
    defaultAtom,
    atomPositions,
  );
  fullSmiles += bridge1.smiles;
  atomPosition = bridge1.nextAtomPos;

  // Second ring middle atoms
  const ringSize = sizes[1];
  const middleAtoms = ringSize - 2;
  const secondMiddle = buildSecondRingMiddleAtoms(
    atomPosition,
    middleAtoms,
    heteroAtoms,
    defaultAtom,
    atomPositions,
  );
  fullSmiles += secondMiddle.smiles;
  atomPosition = secondMiddle.nextAtomPos;

  // Second bridge atom with ring marker 2
  const bridge2 = buildSecondBridgeAtom(
    atomPosition,
    ringSize,
    heteroAtoms,
    defaultAtom,
    atomPositions,
  );
  fullSmiles += bridge2.smiles;
  atomPosition = bridge2.nextAtomPos;

  // Last atom with ring marker 1
  const last = buildLastAtom(atomPosition, sizes[0], heteroAtoms, defaultAtom, atomPositions);
  fullSmiles += last.smiles;
  atomPosition = last.nextAtomPos;

  return { smiles: fullSmiles, atomPositions, totalAtoms: atomPosition };
}
