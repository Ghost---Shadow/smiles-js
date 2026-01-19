import { Fragment } from './fragment.js';
import { Meta } from './meta.js';

/**
 * Fused ring class for building complex ring systems
 */
class FusedRingClass {
  constructor(rings) {
    if (rings.length === 0) {
      throw new Error('FusedRing requires at least one ring');
    }

    // Track used ring numbers
    const usedRingNumbers = [];
    for (let i = 0; i < rings.length; i += 1) {
      usedRingNumbers.push(i + 1);
    }

    this.meta = new Meta(rings, usedRingNumbers);
    this.fragment = this.build(rings, usedRingNumbers);
  }

  /**
   * Build a fused ring structure from ring descriptors
   * @param {Array<Object>} rings - Array of ring descriptors
   * @param {Array<number>} usedRingNumbers - Ring numbers to use
   * @returns {Fragment} Built fragment
   */
  build(rings, usedRingNumbers) {
    // Sort rings from largest to smallest
    const sortedRings = [...rings].sort((a, b) => b.size - a.size);

    // Build the SMILES structure
    let atoms = this.buildRing(sortedRings[0], usedRingNumbers[0]);

    // Wrap each subsequent ring around the previous structure
    for (let ringIdx = 1; ringIdx < sortedRings.length; ringIdx += 1) {
      const ring = sortedRings[ringIdx];
      const { offset } = ring;

      const newRingAtoms = this.buildRing(ring, usedRingNumbers[ringIdx]);

      const beforeFusion = atoms.slice(0, offset);
      const afterFusion = atoms.slice(offset + 2);

      atoms = [
        ...beforeFusion,
        ...newRingAtoms,
        ...afterFusion,
      ];
    }

    return Fragment(atoms.join(''));
  }

  /**
   * Build a ring with attachments handling
   * @param {Object} ringDesc - Ring descriptor with size, type, substitutions, and attachments
   * @param {number} ringNumber - Ring closure number
   * @returns {Array<string>} Array of atom strings
   */
  buildRing(ringDesc, ringNumber) {
    const {
      size, type, substitutions = {}, attachments = {},
    } = ringDesc;

    // Build base ring structure
    const atoms = [];
    for (let i = 0; i < size; i += 1) {
      const position = i + 1;
      const atomType = substitutions[position] || type;
      const isClosurePoint = i === 0 || i === size - 1;
      atoms.push(isClosurePoint ? `${atomType}${ringNumber}` : atomType);
    }

    // Handle attachments
    if (Object.keys(attachments).length > 0) {
      for (let i = 0; i < atoms.length; i += 1) {
        const position = i + 1;
        const attachment = attachments[position];

        if (attachment) {
          let attachSmiles;

          if (attachment.meta) {
            // Create ring number mapping using this.meta
            const ringNumberMap = this.meta.createRingNumberMapping(attachment.meta, ringNumber);
            const remappedFragment = this.remapRingNumbers(attachment, ringNumberMap);
            attachSmiles = remappedFragment.smiles;
          } else {
            attachSmiles = attachment.smiles || attachment.fragment?.smiles || String(attachment);
          }

          // Strip ring number from atom and add attachment
          const atomWithoutRingNum = atoms[i].replace(String(ringNumber), '');
          atoms[i] = `${atomWithoutRingNum}(${attachSmiles})${atoms[i].includes(String(ringNumber)) ? ringNumber : ''}`;
        }
      }
    }

    return atoms;
  }

  get smiles() {
    return this.fragment.smiles;
  }

  /**
   * Remap ring numbers in a FusedRing by rebuilding it
   * @param {FusedRingClass} fusedRing - FusedRing with meta.rings
   * @param {Map<number, number>} ringNumberMap - Map from old to new ring numbers
   * @returns {Fragment} Fragment with remapped ring numbers
   */
  remapRingNumbers(fusedRing, ringNumberMap) {
    if (ringNumberMap.size === 0) {
      return fusedRing.fragment;
    }

    const { rings } = fusedRing.meta;

    // Build the structure with remapped ring numbers
    const newUsedRingNumbers = [];
    for (let i = 0; i < rings.length; i += 1) {
      const originalRingNum = i + 1;
      const mappedRingNum = ringNumberMap.get(originalRingNum) || originalRingNum;
      newUsedRingNumbers.push(mappedRingNum);
    }

    return this.build(rings, newUsedRingNumbers);
  }

  toString() {
    return this.smiles;
  }

  /**
   * Fuse this ring with another ring
   * @param {FusedRingClass} other - Ring to fuse with
   * @returns {FusedRingClass} New fused ring
   */
  fuse(other) {
    if (!(other instanceof FusedRingClass)) {
      throw new Error('Can only fuse with another FusedRing instance');
    }

    const rings1 = this.meta.rings;
    const rings2 = other.meta.rings;

    const combinedRings = [...rings1, ...rings2];
    return new FusedRingClass(combinedRings);
  }

  /**
   * Static helper to build a single ring (for testing/convenience)
   * @param {Object} ringDesc - Ring descriptor
   * @param {number} ringNumber - Ring closure number
   * @returns {Array<string>} Array of atom strings
   */
  static buildRing(ringDesc, ringNumber) {
    // Create a temporary instance to use the instance method
    const tempInstance = new FusedRingClass([ringDesc]);
    return tempInstance.buildRing(ringDesc, ringNumber);
  }
}

/**
 * Factory function that works with or without new
 * @param {Array<Object>} rings - Array of ring descriptors
 * @returns {FusedRingClass} FusedRing instance
 */
export function FusedRing(rings) {
  return new FusedRingClass(rings);
}

// Expose static methods on the factory function
FusedRing.buildRing = FusedRingClass.buildRing.bind(FusedRingClass);
