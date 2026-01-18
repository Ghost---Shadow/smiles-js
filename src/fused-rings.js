import { Fragment } from './fragment.js';
import { findUsedRingNumbers, getNextRingNumber } from './utils.js';

export function FusedRings(sizes, atom, options = {}) {
  const { hetero = {} } = options;

  if (sizes.length !== 2) {
    throw new Error('FusedRings currently only supports 2 rings');
  }

  // Build the base SMILES and track atom positions
  const buildBaseSmiles = (heteroAtoms) => {
    let smiles = '';
    let atomPosition = 0;
    const atomPositions = [];

    smiles += `${heteroAtoms[atomPosition] !== undefined ? heteroAtoms[atomPosition] : atom}1`;
    atomPositions.push({ ring: 0, index: 0, smilesIndex: 0 });
    atomPosition += 1;

    const firstRingMiddleAtoms = sizes[0] - 4;
    for (let i = 0; i < firstRingMiddleAtoms; i += 1) {
      atomPositions.push({ ring: 0, index: i + 1, smilesIndex: smiles.length });
      smiles += (heteroAtoms[atomPosition] !== undefined ? heteroAtoms[atomPosition] : atom);
      atomPosition += 1;
    }

    // Shared atom 1 (bridge)
    atomPositions.push({
      ring: 0, index: sizes[0] - 3, smilesIndex: smiles.length, shared: true,
    });
    smiles += `${heteroAtoms[atomPosition] !== undefined ? heteroAtoms[atomPosition] : atom}2`;
    atomPosition += 1;

    const ringSize = sizes[1];
    const middleAtoms = ringSize - 2;
    for (let i = 0; i < middleAtoms; i += 1) {
      atomPositions.push({ ring: 1, index: i + 1, smilesIndex: smiles.length });
      smiles += (heteroAtoms[atomPosition] !== undefined ? heteroAtoms[atomPosition] : atom);
      atomPosition += 1;
    }

    // Shared atom 2 (bridge)
    atomPositions.push({
      ring: 1, index: ringSize - 1, smilesIndex: smiles.length, shared: true,
    });
    smiles += `${heteroAtoms[atomPosition] !== undefined ? heteroAtoms[atomPosition] : atom}2`;
    atomPosition += 1;

    atomPositions.push({ ring: 0, index: sizes[0] - 1, smilesIndex: smiles.length });
    smiles += `${heteroAtoms[atomPosition] !== undefined ? heteroAtoms[atomPosition] : atom}1`;

    return { smiles, atomPositions, totalAtoms: atomPosition + 1 };
  };

  const { smiles: baseSmiles, atomPositions } = buildBaseSmiles(hetero);
  const fragment = Fragment(baseSmiles);

  // Track substituents for chaining
  const substituents = {};

  // Create attachAt method
  const createAttachAt = (
    currentSubstituents,
    currentHetero,
  ) => function attachAtFunction(position, substituent, attachOptions = {}) {
    if (!Array.isArray(position) || position.length !== 2) {
      throw new Error('Position must be [ringIndex, atomIndex]');
    }

    const [ringIndex, atomIndex] = position;

    if (ringIndex < 0 || ringIndex >= sizes.length) {
      throw new Error(`Ring index ${ringIndex} is out of range`);
    }

    // Convert ring-based position to global atom position
    let globalPosition = -1;
    for (let i = 0; i < atomPositions.length; i += 1) {
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
    }

    if (globalPosition === -1) {
      throw new Error(`Position [${ringIndex}, ${atomIndex}] not found in fused ring system`);
    }

    // Create new substituents map
    const newSubstituents = { ...currentSubstituents };

    // Handle substituent - could be string, Fragment, or FusedRings
    let subSmiles;
    if (typeof substituent === 'string') {
      subSmiles = substituent;
    } else if (substituent.smiles) {
      subSmiles = substituent.smiles;
    } else {
      subSmiles = String(substituent);
    }

    // Handle options.at for specifying attachment point on incoming FusedRings
    // Note: options.at is not yet implemented - substituents attach via their first atom
    const { at } = attachOptions;
    if (at) {
      throw new Error('options.at is not yet implemented for FusedRings.attachAt');
    }

    newSubstituents[globalPosition] = subSmiles;

    // Remap ring numbers to avoid conflicts
    const remapRingNumbers = (currentSmiles, subSmilesParam) => {
      // FusedRings always uses ring markers 1 and 2, so always include them as reserved
      const usedInCurrent = findUsedRingNumbers(currentSmiles);
      usedInCurrent.add('1');
      usedInCurrent.add('2');
      const usedInSubstituent = findUsedRingNumbers(subSmilesParam);

      let remapped = subSmilesParam;
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
    };

    // Rebuild SMILES with substituents
    const buildSmilesWithSubstituents = () => {
      let result = '';
      let atomPos = 0;

      // First atom with ring marker 1
      const firstAtom = currentHetero[atomPos] !== undefined ? currentHetero[atomPos] : atom;
      if (newSubstituents[atomPos]) {
        const remappedSub = remapRingNumbers(result, newSubstituents[atomPos]);
        result += `${firstAtom}1(${remappedSub})`;
      } else {
        result += `${firstAtom}1`;
      }
      atomPos += 1;

      // First ring middle atoms
      const firstRingMiddleAtoms = sizes[0] - 4;
      for (let i = 0; i < firstRingMiddleAtoms; i += 1) {
        const currentAtom = currentHetero[atomPos] !== undefined ? currentHetero[atomPos] : atom;
        if (newSubstituents[atomPos]) {
          const remappedSub = remapRingNumbers(result, newSubstituents[atomPos]);
          result += `${currentAtom}(${remappedSub})`;
        } else {
          result += currentAtom;
        }
        atomPos += 1;
      }

      // First bridge atom with ring marker 2
      const bridgeAtom1 = currentHetero[atomPos] !== undefined ? currentHetero[atomPos] : atom;
      if (newSubstituents[atomPos]) {
        const remappedSub = remapRingNumbers(result, newSubstituents[atomPos]);
        result += `${bridgeAtom1}2(${remappedSub})`;
      } else {
        result += `${bridgeAtom1}2`;
      }
      atomPos += 1;

      // Second ring middle atoms
      const ringSize = sizes[1];
      const middleAtoms = ringSize - 2;
      for (let i = 0; i < middleAtoms; i += 1) {
        const currentAtom = currentHetero[atomPos] !== undefined ? currentHetero[atomPos] : atom;
        if (newSubstituents[atomPos]) {
          const remappedSub = remapRingNumbers(result, newSubstituents[atomPos]);
          result += `${currentAtom}(${remappedSub})`;
        } else {
          result += currentAtom;
        }
        atomPos += 1;
      }

      // Second bridge atom with ring marker 2
      const bridgeAtom2 = currentHetero[atomPos] !== undefined ? currentHetero[atomPos] : atom;
      if (newSubstituents[atomPos]) {
        const remappedSub = remapRingNumbers(result, newSubstituents[atomPos]);
        result += `${bridgeAtom2}(${remappedSub})2`;
      } else {
        result += `${bridgeAtom2}2`;
      }
      atomPos += 1;

      // Last atom with ring marker 1
      const lastAtom = currentHetero[atomPos] !== undefined ? currentHetero[atomPos] : atom;
      if (newSubstituents[atomPos]) {
        const remappedSub = remapRingNumbers(result, newSubstituents[atomPos]);
        result += `${lastAtom}(${remappedSub})1`;
      } else {
        result += `${lastAtom}1`;
      }

      return result;
    };

    const newSmiles = buildSmilesWithSubstituents();
    const newFragment = Fragment(newSmiles);

    // Add attachAt to the new fragment
    newFragment.attachAt = createAttachAt(newSubstituents, currentHetero);

    return newFragment;
  };

  fragment.attachAt = createAttachAt(substituents, hetero);

  return fragment;
}
