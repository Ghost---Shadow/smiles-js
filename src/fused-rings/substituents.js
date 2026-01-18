import { getAtomString, buildAtomWithSubstituent, remapRingNumbers } from './utils.js';

/**
 * Builds the first atom with optional substituent and ring marker 1
 * @param {number} atomPos - Current atom position
 * @param {Object} substituents - Map of substituents by position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {string} currentSmiles - Current SMILES being built (for ring number remapping)
 * @returns {string} The atom string with optional substituent and ring marker
 */
export function buildFirstAtomWithSub(
  atomPos,
  substituents,
  heteroAtoms,
  defaultAtom,
  currentSmiles,
) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const sub = substituents[atomPos];
  const remappedSub = sub ? remapRingNumbers(currentSmiles, sub) : null;
  return buildAtomWithSubstituent(atomString, remappedSub, '1', true);
}

/**
 * Builds middle atoms for the first ring with optional substituents
 * @param {number} atomPos - Starting atom position
 * @param {number} count - Number of atoms to build
 * @param {Object} substituents - Map of substituents by position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {string} currentSmiles - Current SMILES being built (for ring number remapping)
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildFirstRingMiddleAtomsWithSub(
  atomPos,
  count,
  substituents,
  heteroAtoms,
  defaultAtom,
  currentSmiles,
) {
  let smiles = '';
  let currentPos = atomPos;
  let i = 0;
  while (i < count) {
    const atomString = getAtomString(currentPos, heteroAtoms, defaultAtom);
    const sub = substituents[currentPos];
    const remappedSub = sub ? remapRingNumbers(currentSmiles + smiles, sub) : null;
    smiles += buildAtomWithSubstituent(atomString, remappedSub, '', false);
    currentPos += 1;
    i += 1;
  }
  return { smiles, nextAtomPos: currentPos };
}

/**
 * Builds the first bridge atom with optional substituent and ring marker 2
 * @param {number} atomPos - Current atom position
 * @param {Object} substituents - Map of substituents by position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {string} currentSmiles - Current SMILES being built (for ring number remapping)
 * @returns {string} The atom string with optional substituent and ring marker
 */
export function buildFirstBridgeAtomWithSub(
  atomPos,
  substituents,
  heteroAtoms,
  defaultAtom,
  currentSmiles,
) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const sub = substituents[atomPos];
  const remappedSub = sub ? remapRingNumbers(currentSmiles, sub) : null;
  return buildAtomWithSubstituent(atomString, remappedSub, '2', true);
}

/**
 * Builds middle atoms for the second ring with optional substituents
 * @param {number} atomPos - Starting atom position
 * @param {number} count - Number of atoms to build
 * @param {Object} substituents - Map of substituents by position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {string} currentSmiles - Current SMILES being built (for ring number remapping)
 * @returns {Object} Object with smiles and nextAtomPos
 */
export function buildSecondRingMiddleAtomsWithSub(
  atomPos,
  count,
  substituents,
  heteroAtoms,
  defaultAtom,
  currentSmiles,
) {
  let smiles = '';
  let currentPos = atomPos;
  let i = 0;
  while (i < count) {
    const atomString = getAtomString(currentPos, heteroAtoms, defaultAtom);
    const sub = substituents[currentPos];
    const remappedSub = sub ? remapRingNumbers(currentSmiles + smiles, sub) : null;
    smiles += buildAtomWithSubstituent(atomString, remappedSub, '', false);
    currentPos += 1;
    i += 1;
  }
  return { smiles, nextAtomPos: currentPos };
}

/**
 * Builds the second bridge atom with optional substituent and ring marker 2
 * @param {number} atomPos - Current atom position
 * @param {Object} substituents - Map of substituents by position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {string} currentSmiles - Current SMILES being built (for ring number remapping)
 * @returns {string} The atom string with optional substituent and ring marker
 */
export function buildSecondBridgeAtomWithSub(
  atomPos,
  substituents,
  heteroAtoms,
  defaultAtom,
  currentSmiles,
) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const sub = substituents[atomPos];
  const remappedSub = sub ? remapRingNumbers(currentSmiles, sub) : null;
  return buildAtomWithSubstituent(atomString, remappedSub, '2', false);
}

/**
 * Builds the last atom with optional substituent and ring marker 1
 * @param {number} atomPos - Current atom position
 * @param {Object} substituents - Map of substituents by position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @param {string} currentSmiles - Current SMILES being built (for ring number remapping)
 * @returns {string} The atom string with optional substituent and ring marker
 */
export function buildLastAtomWithSub(
  atomPos,
  substituents,
  heteroAtoms,
  defaultAtom,
  currentSmiles,
) {
  const atomString = getAtomString(atomPos, heteroAtoms, defaultAtom);
  const sub = substituents[atomPos];
  const remappedSub = sub ? remapRingNumbers(currentSmiles, sub) : null;
  return buildAtomWithSubstituent(atomString, remappedSub, '1', false);
}

/**
 * Builds the complete SMILES string with substituents
 * @param {Array<number>} sizes - Array of ring sizes
 * @param {Object} substituents - Map of substituents by global position
 * @param {Object} heteroAtoms - Map of heteroatom replacements
 * @param {string} defaultAtom - Default atom type
 * @returns {string} The complete SMILES string
 */
export function buildSmilesWithSubstituents(sizes, substituents, heteroAtoms, defaultAtom) {
  let result = '';
  let atomPos = 0;

  // First atom with ring marker 1
  result += buildFirstAtomWithSub(atomPos, substituents, heteroAtoms, defaultAtom, result);
  atomPos += 1;

  // First ring middle atoms
  const firstRingMiddleAtoms = sizes[0] - 4;
  const firstMiddle = buildFirstRingMiddleAtomsWithSub(
    atomPos,
    firstRingMiddleAtoms,
    substituents,
    heteroAtoms,
    defaultAtom,
    result,
  );
  result += firstMiddle.smiles;
  atomPos = firstMiddle.nextAtomPos;

  // First bridge atom with ring marker 2
  result += buildFirstBridgeAtomWithSub(atomPos, substituents, heteroAtoms, defaultAtom, result);
  atomPos += 1;

  // Second ring middle atoms
  const ringSize = sizes[1];
  const middleAtoms = ringSize - 2;
  const secondMiddle = buildSecondRingMiddleAtomsWithSub(
    atomPos,
    middleAtoms,
    substituents,
    heteroAtoms,
    defaultAtom,
    result,
  );
  result += secondMiddle.smiles;
  atomPos = secondMiddle.nextAtomPos;

  // Second bridge atom with ring marker 2
  result += buildSecondBridgeAtomWithSub(atomPos, substituents, heteroAtoms, defaultAtom, result);
  atomPos += 1;

  // Last atom with ring marker 1
  result += buildLastAtomWithSub(atomPos, substituents, heteroAtoms, defaultAtom, result);

  return result;
}
