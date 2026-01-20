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

    // Convert to Meta instances
    const metaRings = rings.map((ring) => new Meta(ring));

    // Assign ring numbers via DFS
    const ringsWithNumbers = FusedRingClass.assignRingNumbers(metaRings);

    this.rings = ringsWithNumbers;
    this.fragment = this.build(ringsWithNumbers);

    // Make the instance callable by returning a function with instance methods
    const callable = (attachment) => this.attach(attachment);

    // Copy all properties and methods to the callable function
    Object.setPrototypeOf(callable, Object.getPrototypeOf(this));
    Object.assign(callable, this);

    // eslint-disable-next-line no-constructor-return
    return callable;
  }

  /**
   * Assign unique ring numbers to each ring and its attachments via DFS
   * Treats meta as an AST and traverses it recursively
   * @param {Array<Meta>} rings - Array of Meta instances
   * @returns {Array<Meta>} Array of Meta instances with ringNumber assigned
   */
  static assignRingNumbers(rings) {
    // Check if ring numbers are already assigned (e.g., from parsing)
    const hasRingNumbers = rings.every((meta) => meta.ringNumber != null);
    if (hasRingNumbers) {
      // Ring numbers already assigned, just process attachments
      return rings.map((meta) => {
        const newAttachments = {};
        Object.entries(meta.attachments).forEach(([position, attachment]) => {
          if (attachment instanceof FusedRingClass) {
            const attachedRingsWithNumbers = FusedRingClass.assignRingNumbers(attachment.rings);
            newAttachments[position] = { rings: attachedRingsWithNumbers };
          } else {
            newAttachments[position] = attachment;
          }
        });
        return meta.update({ attachments: newAttachments });
      });
    }

    let nextRingNumber = 1;

    /**
     * DFS traversal: assign number to current ring, then recurse into attachments
     */
    const processRing = (meta) => {
      // Assign ring number to current ring
      const ringNumber = nextRingNumber;
      nextRingNumber += 1;

      // Recurse into attachments
      const newAttachments = {};
      Object.entries(meta.attachments).forEach(([position, attachment]) => {
        // Check if attachment is a FusedRing instance
        if (attachment instanceof FusedRingClass) {
          // Recurse into the FusedRing's rings
          const attachedRingsWithNumbers = attachment.rings
            .map((attachedMeta) => processRing(attachedMeta.update({ ringNumber: null })));
          // Store as plain object with rings array
          newAttachments[position] = {
            rings: attachedRingsWithNumbers,
          };
        } else {
          // Simple attachment (no recursion needed)
          newAttachments[position] = attachment;
        }
      });

      return meta.update({ ringNumber, attachments: newAttachments });
    };

    // DFS from each top-level ring
    return rings.map(processRing);
  }

  /**
   * Build a fused ring structure from Meta instances with assigned ring numbers
   * @param {Array<Meta>} rings - Array of Meta instances with ringNumber field
   * @returns {Fragment} Built fragment
   */
  build(rings) {
    // Sort rings from largest to smallest
    const sortedRings = [...rings].sort((a, b) => b.size - a.size);

    // Build the SMILES structure
    let atoms = this.buildRing(sortedRings[0]);

    // Wrap each subsequent ring around the previous structure
    for (let ringIdx = 1; ringIdx < sortedRings.length; ringIdx += 1) {
      const meta = sortedRings[ringIdx];
      const { offset } = meta;

      const newRingAtoms = this.buildRing(meta);

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
   * @param {Meta} meta - Meta instance with ring descriptor
   * @returns {Array<string>} Array of atom strings
   */
  buildRing(meta) {
    const {
      size, type, substitutions, attachments, ringNumber,
    } = meta;

    // Format ring number (use %NN notation for numbers > 9)
    const ringNumStr = ringNumber > 9 ? `%${ringNumber}` : String(ringNumber);

    // Build base ring structure
    const atoms = [];
    for (let i = 0; i < size; i += 1) {
      const position = i + 1;
      const atomType = substitutions[position] || type;
      const isClosurePoint = i === 0 || i === size - 1;
      atoms.push(isClosurePoint ? `${atomType}${ringNumStr}` : atomType);
    }

    // Handle attachments
    Object.entries(attachments).forEach(([position, attachment]) => {
      const i = Number(position) - 1;

      let attachSmiles;
      if (attachment.rings) {
        // Rebuild the fused ring with the reassigned numbers
        const rebuiltFragment = this.build(attachment.rings);
        attachSmiles = rebuiltFragment.smiles;
      } else {
        // Get attachment SMILES for simple attachments
        attachSmiles = attachment.smiles || attachment.fragment?.smiles || String(attachment);
      }

      // For the last position (ring closure), attachment goes after ring number
      // For other positions, strip ring number, add attachment, then ring number
      if (i === size - 1) {
        // Last position: keep ring number, add attachment after
        atoms[i] = `${atoms[i]}(${attachSmiles})`;
      } else {
        // Other positions: strip ring number, add attachment, restore ring number
        const atomWithoutRingNum = atoms[i].replace(ringNumStr, '');
        atoms[i] = `${atomWithoutRingNum}(${attachSmiles})${atoms[i].includes(ringNumStr) ? ringNumStr : ''}`;
      }
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
   * Get meta (backward compatibility and convenience)
   * @returns {Object} Meta object with rings and usedRingNumbers
   */
  get meta() {
    // TODO: usedRingNumbers needs to be recursive
    return {
      rings: this.rings.map((meta) => meta.toObject()),
      usedRingNumbers: this.rings.map((meta) => meta.ringNumber),
    };
  }

  /**
   * Get a specific ring by index (1-based) for attachment operations
   * @param {number} ringIndex - 1-based ring index
   * @returns {Object} Ring accessor with attachAt method
   */
  getRing(ringIndex) {
    if (ringIndex < 1 || ringIndex > this.rings.length) {
      throw new Error(`Ring index ${ringIndex} out of bounds`);
    }

    const ringArrayIndex = ringIndex - 1;
    const fusedRingInstance = this;

    return {
      /**
       * Attach something at a specific position on this ring
       * @param {number} position - Position on the ring (1-based)
       * @param {*} attachment - What to attach (FusedRing, string, Fragment, etc.)
       * @returns {FusedRingClass} New FusedRing with the attachment
       */
      attachAt(position, attachment) {
        // Clone the rings array
        const newRings = fusedRingInstance.rings.map((meta, idx) => {
          if (idx === ringArrayIndex) {
            // This is the ring we're attaching to - use update() to deep merge
            return meta.update({
              attachments: {
                [position]: attachment,
              },
            });
          }
          return meta;
        });

        // Create new FusedRing with modified rings
        return new FusedRingClass(newRings);
      },
    };
  }

  /**
   * Attach another fragment to the last position of the last ring
   * @param {*} attachment - What to attach (FusedRing, string, Fragment, etc.)
   * @returns {FusedRingClass} New FusedRing with the attachment
   */
  attach(attachment) {
    const lastRingIndex = this.rings.length;
    const lastRing = this.rings[lastRingIndex - 1];
    const lastPosition = lastRing.size;
    return this.getRing(lastRingIndex).attachAt(lastPosition, attachment);
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

    // Clear ring numbers so they get reassigned in the combined structure
    const clearRingNumbers = (rings) => rings.map((meta) => meta.update({ ringNumber: null }));

    const combinedRings = [
      ...clearRingNumbers(this.rings),
      ...clearRingNumbers(other.rings),
    ];
    return new FusedRingClass(combinedRings);
  }

  /**
   * Static helper to build a single ring (for testing/convenience)
   * @param {Object} ringDesc - Ring descriptor
   * @param {number} ringNumber - Ring closure number
   * @returns {Array<string>} Array of atom strings
   */
  static buildRing(ringDesc, ringNumber) {
    // Create Meta instance with ring number
    const meta = new Meta({ ...ringDesc, ringNumber });
    const tempInstance = new FusedRingClass([meta]);
    return tempInstance.buildRing(meta);
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

// Import and expose parse functionality
import { parse } from './parse.js';

FusedRing.parse = function parseSMILES(smiles) {
  const cleanRings = parse(smiles);
  return new FusedRingClass(cleanRings);
};
