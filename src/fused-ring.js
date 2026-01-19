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

    // Assign ring numbers via DFS
    const { ringsWithNumbers, usedRingNumbers } = FusedRingClass.assignRingNumbers(rings);

    this.meta = new Meta(ringsWithNumbers, usedRingNumbers);
    this.fragment = this.build(ringsWithNumbers);
  }

  /**
   * Assign unique ring numbers to each ring and its attachments via DFS
   * Treats meta as an AST and traverses it recursively
   * @param {Array<Object>} rings - Array of ring descriptors
   * @returns {Object} Object with ringsWithNumbers and usedRingNumbers arrays
   */
  static assignRingNumbers(rings) {
    let nextRingNumber = 1;
    const usedRingNumbers = [];

    /**
     * DFS traversal: assign number to current ring, then recurse into attachments
     */
    const processRing = (ringDesc) => {
      // Assign ring number to current ring
      const ringNumber = nextRingNumber;
      nextRingNumber += 1;
      usedRingNumbers.push(ringNumber);

      const newRingDesc = { ...ringDesc, ringNumber };

      // Recurse into attachments
      if (ringDesc.attachments) {
        const newAttachments = {};
        Object.entries(ringDesc.attachments).forEach(([position, attachment]) => {
          // Check if attachment is a FusedRing instance
          if (attachment instanceof FusedRingClass) {
            // Recurse into the FusedRing's rings
            const attachedRingsWithNumbers = attachment.meta.rings.map((attachedRing) => {
              // Remove old ringNumber before recursing
              const { ringNumber: oldNumber, ...ringWithoutNumber } = attachedRing;
              return processRing(ringWithoutNumber);
            });
            // Store as plain object with meta
            newAttachments[position] = {
              meta: {
                rings: attachedRingsWithNumbers,
                usedRingNumbers: attachedRingsWithNumbers.map((r) => r.ringNumber),
              },
            };
          } else {
            // Simple attachment (no recursion needed)
            newAttachments[position] = attachment;
          }
        });
        newRingDesc.attachments = newAttachments;
      }

      return newRingDesc;
    };

    // DFS from each top-level ring
    const ringsWithNumbers = rings.map(processRing);

    return { ringsWithNumbers, usedRingNumbers };
  }

  /**
   * Build a fused ring structure from ring descriptors with assigned ring numbers
   * @param {Array<Object>} rings - Array of ring descriptors with ringNumber field
   * @returns {Fragment} Built fragment
   */
  build(rings) {
    // Sort rings from largest to smallest
    const sortedRings = [...rings].sort((a, b) => b.size - a.size);

    // Build the SMILES structure
    let atoms = this.buildRing(sortedRings[0]);

    // Wrap each subsequent ring around the previous structure
    for (let ringIdx = 1; ringIdx < sortedRings.length; ringIdx += 1) {
      const ring = sortedRings[ringIdx];
      const { offset } = ring;

      const newRingAtoms = this.buildRing(ring);

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
   * @param {Object} ringDesc - Ring descriptor with size, type, substitutions,
   *                            attachments, and ringNumber
   * @returns {Array<string>} Array of atom strings
   */
  buildRing(ringDesc) {
    const {
      size, type, substitutions = {}, attachments = {}, ringNumber,
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
    Object.entries(attachments).forEach(([position, attachment]) => {
      const i = Number(position) - 1;

      let attachSmiles;
      if (attachment.meta && attachment.meta.rings) {
        // Rebuild the fused ring with the reassigned numbers
        const rebuiltFragment = this.build(attachment.meta.rings);
        attachSmiles = rebuiltFragment.smiles;
      } else {
        // Get attachment SMILES for simple attachments
        attachSmiles = attachment.smiles || attachment.fragment?.smiles || String(attachment);
      }

      // Strip ring number from atom and add attachment
      const atomWithoutRingNum = atoms[i].replace(String(ringNumber), '');
      atoms[i] = `${atomWithoutRingNum}(${attachSmiles})${atoms[i].includes(String(ringNumber)) ? ringNumber : ''}`;
    });

    return atoms;
  }

  get smiles() {
    return this.fragment.smiles;
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
    // Add ring number to descriptor and create temporary instance
    const ringDescWithNumber = { ...ringDesc, ringNumber };
    const tempInstance = new FusedRingClass([ringDescWithNumber]);
    return tempInstance.buildRing(ringDescWithNumber);
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
