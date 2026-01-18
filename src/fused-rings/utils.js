import { findUsedRingNumbers, getNextRingNumber } from '../utils.js';

/**
 * Validates that a position is in the correct format [ringIndex, atomIndex]
 * @param {*} position - The position to validate
 * @throws {Error} If position is not an array with exactly 2 elements
 */
export function validatePosition(position) {
  if (!Array.isArray(position) || position.length !== 2) {
    throw new Error('Position must be [ringIndex, atomIndex]');
  }
}

/**
 * Validates that a ring index is within valid range
 * @param {number} ringIndex - The ring index to validate
 * @param {Array<number>} sizes - Array of ring sizes
 * @throws {Error} If ring index is out of range
 */
export function validateRingIndex(ringIndex, sizes) {
  if (ringIndex < 0 || ringIndex >= sizes.length) {
    throw new Error(`Ring index ${ringIndex} is out of range`);
  }
}

/**
 * Finds the global atom position given a ring index and atom index
 * @param {number} ringIndex - Index of the ring (0 or 1)
 * @param {number} atomIndex - Index of the atom within the ring
 * @param {Array} atomPositions - Array of atom position metadata
 * @param {Array<number>} sizes - Array of ring sizes
 * @returns {number} Global position of the atom, or -1 if not found
 */
export function findGlobalPosition(ringIndex, atomIndex, atomPositions, sizes) {
  let globalPosition = -1;

  const positionsLength = atomPositions.length;
  let i = 0;
  while (i < positionsLength) {
    const pos = atomPositions[i];
    if (pos.ring === ringIndex && pos.index === atomIndex) {
      globalPosition = i;
      break;
    }
    // Check for shared atoms (they belong to both rings)
    if (
      pos.shared
      && ringIndex === 1
      && atomIndex === 0
      && pos.ring === 0
      && pos.index === sizes[0] - 3
    ) {
      globalPosition = i;
      break;
    }
    i += 1;
  }

  return globalPosition;
}

/**
 * Extracts SMILES string from a substituent (string, Fragment, or FusedRings)
 * @param {string|Object} substituent - The substituent to extract SMILES from
 * @returns {string} The SMILES string
 */
export function extractSubstituentSmiles(substituent) {
  if (typeof substituent === 'string') {
    return substituent;
  }
  if (substituent.smiles) {
    return substituent.smiles;
  }
  return String(substituent);
}

/**
 * Remaps ring numbers in a substituent SMILES to avoid conflicts
 * @param {string} currentSmiles - The current SMILES being built
 * @param {string} subSmiles - The substituent SMILES to remap
 * @returns {string} The remapped substituent SMILES
 */
export function remapRingNumbers(currentSmiles, subSmiles) {
  // FusedRings always uses ring markers 1 and 2, so always include them as reserved
  const usedInCurrent = findUsedRingNumbers(currentSmiles);
  usedInCurrent.add('1');
  usedInCurrent.add('2');
  const usedInSubstituent = findUsedRingNumbers(subSmiles);

  let remapped = subSmiles;
  usedInSubstituent.forEach((ringNum) => {
    if (usedInCurrent.has(ringNum)) {
      const newNum = getNextRingNumber(`${currentSmiles + remapped}12`);
      if (ringNum.length > 1) {
        remapped = remapped.replaceAll(`%${ringNum}`, newNum);
      } else {
        remapped = remapped.replaceAll(ringNum, newNum.replace('%', ''));
      }
    }
  });
  return remapped;
}

/**
 * Gets the appropriate atom string with heteroatom substitution if needed
 * @param {number} atomPos - The current atom position
 * @param {Object} heteroAtoms - Map of positions to heteroatom strings
 * @param {string} defaultAtom - The default atom type
 * @returns {string} The atom string
 */
export function getAtomString(atomPos, heteroAtoms, defaultAtom) {
  return heteroAtoms[atomPos] !== undefined ? heteroAtoms[atomPos] : defaultAtom;
}

/**
 * Builds an atom with optional substituent in parentheses
 * @param {string} atomString - The atom string
 * @param {string|null} substituent - The substituent SMILES (or null)
 * @param {string} marker - Ring marker to append (e.g., '1', '2', or '')
 * @param {boolean} markerBefore - If true, marker goes before substituent
 * @returns {string} The complete atom string with substituent and marker
 */
export function buildAtomWithSubstituent(atomString, substituent, marker, markerBefore) {
  if (substituent) {
    if (markerBefore) {
      return `${atomString}${marker}(${substituent})`;
    }
    return `${atomString}(${substituent})${marker}`;
  }
  return `${atomString}${marker}`;
}
