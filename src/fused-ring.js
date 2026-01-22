import { Meta, MetaType } from './meta.js';

/**
 * Fused ring class for building complex ring systems
 */
class FusedRingClass {
  constructor(rings, { purgeRingNumbers = true } = {}) {
    if (rings.length === 0) {
      throw new Error('FusedRing requires at least one ring');
    }

    // Convert to Meta instances, mapping 'type' to 'atoms' for backward compatibility
    let metaRings = rings.map((ring) => {
      const { type, attachments = {}, ...rest } = ring;

      // Convert attachments to arrays and convert strings to Meta instances
      const normalizedAttachments = {};
      Object.entries(attachments).forEach(([pos, attachment]) => {
        if (Array.isArray(attachment)) {
          // Convert each item in array to Meta if it's a string
          normalizedAttachments[pos] = attachment.map((item) => {
            if (typeof item === 'string') {
              return new Meta({ type: MetaType.LINEAR, atoms: item });
            }
            return item;
          });
        } else if (typeof attachment === 'string') {
          // Wrap attachment in array and convert to Meta if string
          normalizedAttachments[pos] = [new Meta({ type: MetaType.LINEAR, atoms: attachment })];
        } else {
          normalizedAttachments[pos] = [attachment];
        }
      });

      return new Meta({
        type: MetaType.RING,
        atoms: type,
        attachments: normalizedAttachments,
        ...rest,
      });
    });

    // Purge ring numbers if requested (default behavior)
    if (purgeRingNumbers) {
      metaRings = FusedRingClass.purgeRingNumbers(metaRings);
    }

    // Assign ring numbers via DFS
    const ringsWithNumbers = FusedRingClass.assignRingNumbers(metaRings);

    this.meta = ringsWithNumbers;
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
   * Clear all ring numbers from Meta instances
   * @param {Array<Meta>} rings - Array of Meta instances
   * @returns {Array<Meta>} Array of Meta instances with ringNumber set to null
   */
  static purgeRingNumbers(rings) {
    return rings.map((meta) => meta.update({ ringNumber: null }));
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
          // Handle arrays of attachments
          if (Array.isArray(attachment)) {
            newAttachments[position] = attachment.map((item) => {
              if (item instanceof FusedRingClass) {
                const attachedRingsWithNumbers = FusedRingClass.assignRingNumbers(item.meta);
                return { meta: attachedRingsWithNumbers };
              }
              if (Array.isArray(item)) {
                // Parsed ring attachments (array of ring descriptors from parse.js)
                const convertedRings = item.map((ring) => {
                  const { type, ...rest } = ring;
                  return new Meta({
                    type: MetaType.RING,
                    atoms: type,
                    ...rest,
                  });
                });
                return { meta: convertedRings };
              }
              if (item?.meta) {
                // Handle parsed ring attachments (plain objects with meta array)
                const convertedRings = item.meta.map((ring) => {
                  const { type, ...rest } = ring;
                  return new Meta({
                    type: MetaType.RING,
                    atoms: type,
                    ...rest,
                  });
                });
                return { meta: convertedRings };
              }
              return item;
            });
          } else if (attachment instanceof FusedRingClass) {
            // Legacy single attachment case (convert to array)
            const attachedRingsWithNumbers = FusedRingClass.assignRingNumbers(attachment.meta);
            newAttachments[position] = [{ meta: attachedRingsWithNumbers }];
          } else if (attachment?.meta) {
            // Legacy parsed ring attachment (convert to array)
            const convertedRings = attachment.meta.map((ring) => {
              const { type, ...rest } = ring;
              return new Meta({
                type: MetaType.RING,
                atoms: type,
                ...rest,
              });
            });
            newAttachments[position] = [{ meta: convertedRings }];
          } else {
            // Simple attachment (convert to array)
            newAttachments[position] = [attachment];
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
        // Handle arrays of attachments
        if (Array.isArray(attachment)) {
          newAttachments[position] = attachment.map((item) => {
            if (item instanceof FusedRingClass) {
              // Recurse into the FusedRing's meta
              const attachedRingsWithNumbers = item.meta
                .map((attachedMeta) => processRing(attachedMeta.update({ ringNumber: null })));
              return { meta: attachedRingsWithNumbers };
            }
            if (Array.isArray(item)) {
              // Parsed ring attachments (array of ring descriptors)
              const convertedRings = item.map((ring) => {
                const { type, ...rest } = ring;
                const ringMeta = new Meta({
                  type: MetaType.RING,
                  atoms: type,
                  ...rest,
                });
                return processRing(ringMeta.update({ ringNumber: null }));
              });
              return { meta: convertedRings };
            }
            // Simple attachment (Meta instance or string)
            return item;
          });
        } else if (attachment instanceof FusedRingClass) {
          // Legacy single attachment case (convert to array)
          const attachedRingsWithNumbers = attachment.meta
            .map((attachedMeta) => processRing(attachedMeta.update({ ringNumber: null })));
          newAttachments[position] = [{ meta: attachedRingsWithNumbers }];
        } else {
          // Simple attachment (no recursion needed) - convert to array
          newAttachments[position] = [attachment];
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

    // Return simple object instead of Fragment to avoid circular dependency
    const smiles = atoms.join('');
    return { smiles };
  }

  /**
   * Build a ring with attachments handling
   * @param {Meta} meta - Meta instance with ring descriptor
   * @returns {Array<string>} Array of atom strings
   */
  buildRing(meta) {
    const {
      size, atoms, substitutions, attachments, ringNumber,
    } = meta;

    // Format ring number (use %NN notation for numbers > 9)
    const ringNumStr = ringNumber > 9 ? `%${ringNumber}` : String(ringNumber);

    // Build base ring structure
    const atomsArray = [];
    for (let i = 0; i < size; i += 1) {
      const position = i + 1;
      const atomType = substitutions[position] || atoms;
      const isClosurePoint = i === 0 || i === size - 1;
      atomsArray.push(isClosurePoint ? `${atomType}${ringNumStr}` : atomType);
    }

    // Handle attachments
    Object.entries(attachments).forEach(([position, attachmentData]) => {
      const i = Number(position) - 1;

      // Handle arrays of attachments
      const attachmentArray = Array.isArray(attachmentData) ? attachmentData : [attachmentData];

      let allAttachmentsSmiles = '';
      attachmentArray.forEach((attachment) => {
        let attachSmiles;
        if (Array.isArray(attachment)) {
          // Parsed ring attachments (array of ring descriptors) - shouldn't happen here
          // but handle it just in case
          attachSmiles = '[ARRAY]';
        } else if (attachment?.meta && !attachment.smiles && typeof attachment !== 'function') {
          // Check if attachment is a plain object with meta array (fused ring attachment)
          // vs a Fragment/FusedRing instance that also has .meta
          // Rebuild the fused ring with the reassigned numbers
          const rebuiltFragment = this.build(attachment.meta);
          attachSmiles = rebuiltFragment.smiles;
        } else if (attachment instanceof Meta) {
          // Handle Meta instances (convert to SMILES)
          attachSmiles = attachment.atoms;
        } else if (typeof attachment === 'string') {
          // Simple string attachment
          attachSmiles = attachment;
        } else if (attachment instanceof FusedRingClass || typeof attachment === 'function') {
          // Handle FusedRing instances (callable functions)
          attachSmiles = attachment.smiles;
        } else {
          // Get attachment SMILES for other complex attachments (Fragment)
          attachSmiles = attachment.smiles || attachment.fragment?.smiles || String(attachment);
        }
        allAttachmentsSmiles += `(${attachSmiles})`;
      });

      // For the last position (ring closure), attachment goes after ring number
      // For other positions, strip ring number, add attachment, then ring number
      if (i === size - 1) {
        // Last position: keep ring number, add attachment after
        atomsArray[i] = `${atomsArray[i]}${allAttachmentsSmiles}`;
      } else {
        // Other positions: strip ring number, add attachment, restore ring number
        const atomWithoutRingNum = atomsArray[i].replace(ringNumStr, '');
        atomsArray[i] = `${atomWithoutRingNum}${allAttachmentsSmiles}${atomsArray[i].includes(ringNumStr) ? ringNumStr : ''}`;
      }
    });

    return atomsArray;
  }

  get smiles() {
    return this.fragment.smiles;
  }

  toString() {
    return this.smiles;
  }

  /**
   * Get a specific ring by index (1-based) for attachment operations
   * @param {number} ringIndex - 1-based ring index
   * @returns {Object} Ring accessor with attachAt method
   */
  getRing(ringIndex) {
    if (ringIndex < 1 || ringIndex > this.meta.length) {
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
        // Clone the meta array
        const newRings = fusedRingInstance.meta.map((meta, idx) => {
          if (idx === ringArrayIndex) {
            // Clone existing attachments
            const newAttachments = {};
            Object.entries(meta.attachments).forEach(([pos, attachmentArray]) => {
              newAttachments[pos] = Array.isArray(attachmentArray)
                ? [...attachmentArray]
                : [attachmentArray];
            });

            // Add new attachment to the array at this position
            if (newAttachments[position]) {
              newAttachments[position].push(attachment);
            } else {
              newAttachments[position] = [attachment];
            }

            return meta.update({ attachments: newAttachments });
          }
          return meta;
        });

        // Create new FusedRing (constructor purges and reassigns ring numbers)
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
    const lastRingIndex = this.meta.length;
    const lastRing = this.meta[lastRingIndex - 1];
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

    // Combine rings (constructor will purge and reassign ring numbers)
    const combinedRings = [...this.meta, ...other.meta];
    return new FusedRingClass(combinedRings);
  }

  /**
   * Static helper to build a single ring (for testing/convenience)
   * @param {Object} ringDesc - Ring descriptor
   * @param {number} ringNumber - Ring closure number
   * @returns {Array<string>} Array of atom strings
   */
  static buildRing(ringDesc, ringNumber) {
    // Create Meta instance with ring number, mapping type to atoms
    const { type, ...rest } = ringDesc;
    const meta = new Meta({
      type: MetaType.RING,
      atoms: type,
      ...rest,
      ringNumber,
    });
    const tempInstance = new FusedRingClass([{ type, ...rest },
    ]);
    return tempInstance.buildRing(meta);
  }
}

/**
 * Factory function that works with or without new
 * @param {Array<Object>} rings - Array of ring descriptors
 * @param {Object} options - Constructor options
 * @param {boolean} options.purgeRingNumbers - Whether to purge ring numbers
 *   before assignment (default: true)
 * @returns {FusedRingClass} FusedRing instance
 */
export function FusedRing(rings, options) {
  return new FusedRingClass(rings, options);
}

// Expose static methods on the factory function
FusedRing.buildRing = FusedRingClass.buildRing.bind(FusedRingClass);

// Import and expose parse functionality
import { parse } from './parse.js';

FusedRing.parse = function parseSMILES(smiles) {
  const cleanRings = parse(smiles);
  return new FusedRingClass(cleanRings, { purgeRingNumbers: false });
};
