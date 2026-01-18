import { Fragment } from '../fragment.js';
import { buildBaseSmiles } from './builder.js';
import { buildSmilesWithSubstituents } from './substituents.js';
import {
  validatePosition,
  validateRingIndex,
  findGlobalPosition,
  extractSubstituentSmiles,
} from './utils.js';

export function FusedRings(sizes, atom, options = {}) {
  const { hetero = {} } = options;

  if (sizes.length !== 2) {
    throw new Error('FusedRings currently only supports 2 rings');
  }

  const { smiles: baseSmiles, atomPositions } = buildBaseSmiles(sizes, hetero, atom);
  const fragment = Fragment(baseSmiles);

  // Track substituents for chaining
  const substituents = {};

  // Create attachAt method
  const createAttachAt = (
    currentSubstituents,
    currentHetero,
  ) => function attachAtFunction(position, substituent, attachOptions = {}) {
    validatePosition(position);

    const [ringIndex, atomIndex] = position;

    validateRingIndex(ringIndex, sizes);

    // Convert ring-based position to global atom position
    const globalPosition = findGlobalPosition(ringIndex, atomIndex, atomPositions, sizes);

    if (globalPosition === -1) {
      throw new Error(`Position [${ringIndex}, ${atomIndex}] not found in fused ring system`);
    }

    // Create new substituents map
    const newSubstituents = { ...currentSubstituents };

    // Handle substituent - could be string, Fragment, or FusedRings
    const subSmiles = extractSubstituentSmiles(substituent);

    // Handle options.at for specifying attachment point on incoming FusedRings
    // Note: options.at is not yet implemented - substituents attach via their first atom
    const { at } = attachOptions;
    if (at) {
      throw new Error('options.at is not yet implemented for FusedRings.attachAt');
    }

    newSubstituents[globalPosition] = subSmiles;

    const newSmiles = buildSmilesWithSubstituents(sizes, newSubstituents, currentHetero, atom);
    const newFragment = Fragment(newSmiles);

    // Add attachAt to the new fragment
    newFragment.attachAt = createAttachAt(newSubstituents, currentHetero);

    return newFragment;
  };

  fragment.attachAt = createAttachAt(substituents, hetero);

  return fragment;
}
