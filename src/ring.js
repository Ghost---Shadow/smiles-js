import { Fragment } from './fragment.js';
import { findUsedRingNumbers, getNextRingNumber } from './utils.js';

export function Ring(atom, size, options = {}) {
  const { replace = {} } = options;

  // Build the ring SMILES
  const buildRingSmiles = (replacements) => {
    const parts = [];

    for (let i = 0; i < size; i++) {
      const currentAtom = replacements[i] !== undefined ? replacements[i] : atom;

      if (i === 0) {
        parts.push(currentAtom + '1');
      } else if (i === size - 1) {
        parts.push(currentAtom + '1');
      } else {
        parts.push(currentAtom);
      }
    }

    return parts.join('');
  };

  const smiles = buildRingSmiles(replace);
  const fragment = Fragment(smiles);

  // Track substituents for chaining
  const substituents = {};

  // Add attachAt method to the fragment
  const createAttachAt = (currentSubstituents) => {
    return function(position, substituent) {
      if (position < 1 || position > size) {
        throw new Error(`Position ${position} is out of range for ring of size ${size}`);
      }

      // Convert 1-based position to 0-based index
      const index = position - 1;

      // Create new substituents map with this addition
      const newSubstituents = { ...currentSubstituents };

      // Handle substituent - could be string, Fragment, or Ring
      let subSmiles;
      if (typeof substituent === 'string') {
        subSmiles = substituent;
      } else if (substituent.smiles) {
        subSmiles = substituent.smiles;
      } else {
        subSmiles = String(substituent);
      }

      newSubstituents[index] = subSmiles;

      // Build SMILES with all substituents at the specified positions
      const parts = [];

      for (let i = 0; i < size; i++) {
        const currentAtom = replace[i] !== undefined ? replace[i] : atom;

        if (newSubstituents[i]) {
          // Remap ring numbers in substituent to avoid conflicts
          const currentSmiles = parts.join('');
          const usedInCurrent = findUsedRingNumbers(currentSmiles);
          const usedInSubstituent = findUsedRingNumbers(newSubstituents[i]);

          let remappedSubstituent = newSubstituents[i];
          for (const ringNum of usedInSubstituent) {
            if (usedInCurrent.has(ringNum)) {
              const newNum = getNextRingNumber(currentSmiles + remappedSubstituent);
              // For %NN format, replace the whole %NN
              // For single digit, replace all occurrences (this works because each ring number appears exactly twice)
              if (ringNum.length > 1) {
                remappedSubstituent = remappedSubstituent.replaceAll(`%${ringNum}`, newNum);
              } else {
                remappedSubstituent = remappedSubstituent.replaceAll(ringNum, newNum.replace('%', ''));
              }
            }
          }

          // Add substituent at this position
          if (i === 0) {
            parts.push(currentAtom + '1(' + remappedSubstituent + ')');
          } else if (i === size - 1) {
            parts.push(currentAtom + '(' + remappedSubstituent + ')1');
          } else {
            parts.push(currentAtom + '(' + remappedSubstituent + ')');
          }
        } else if (i === 0) {
          parts.push(currentAtom + '1');
        } else if (i === size - 1) {
          parts.push(currentAtom + '1');
        } else {
          parts.push(currentAtom);
        }
      }

      const newSmiles = parts.join('');
      const newFragment = Fragment(newSmiles);

      // Recursively add attachAt to the new fragment with updated substituents
      newFragment.attachAt = createAttachAt(newSubstituents);

      return newFragment;
    };
  };

  fragment.attachAt = createAttachAt(substituents);

  return fragment;
}
