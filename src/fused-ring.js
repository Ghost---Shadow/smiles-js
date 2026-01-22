import { Meta, MetaType } from './meta.js';
import { MetaList } from './meta-list.js';

/**
 * Fused ring class for building complex ring systems
 */
class FusedRingClass {
  constructor(rings, { purgeRingNumbers = true } = {}) {
    if (rings.length === 0) {
      throw new Error('FusedRing requires at least one ring');
    }

    // Convert to Meta instances
    let metaRings = rings.map((ring) => {
      const {
        type, atoms, attachments = {}, ...rest
      } = ring;

      // Normalize attachments to arrays and convert to Meta instances
      const normalizedAttachments = {};
      Object.entries(attachments).forEach(([pos, attachment]) => {
        normalizedAttachments[pos] = attachment.map((att) => Meta.from(att));
      });

      return new Meta({
        type: MetaType.RING,
        atoms: atoms || type,
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

    this.meta = MetaList.from(ringsWithNumbers);
    this.fragment = FusedRingClass.build(ringsWithNumbers);

    // Make the instance callable by returning a function with instance methods
    const callable = (attachment) => this.attach(attachment);

    // Copy all properties and methods to the callable function
    Object.setPrototypeOf(callable, Object.getPrototypeOf(this));
    Object.assign(callable, this);

    // Copy getters explicitly - use callable.fragment since Object.assign copied it
    Object.defineProperty(callable, 'smiles', {
      get() {
        return callable.fragment.smiles;
      },
      enumerable: true,
      configurable: true,
    });

    // eslint-disable-next-line no-constructor-return
    return callable;
  }

  /**
   * Clear all ring numbers from Meta instances recursively
   * @param {Array<Meta>} rings - Array of Meta instances
   * @returns {Array<Meta>} Array of Meta instances with ringNumber set to null
   */
  static purgeRingNumbers(rings) {
    // Just clear the ring number - attachments will be processed during assignRingNumbers
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
      return rings;
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
      Object.entries(meta.attachments).forEach(([position, attachmentArray]) => {
        newAttachments[position] = attachmentArray.map((item) => {
          if (item instanceof FusedRingClass) {
            // Purge ring numbers from attached FusedRing and assign new ones
            const purgedMeta = FusedRingClass.purgeRingNumbers(item.meta);
            const renumberedMeta = purgedMeta.map((attachedMeta) => processRing(attachedMeta));
            // Create new FusedRing with renumbered meta
            // eslint-disable-next-line no-use-before-define
            return FusedRing(renumberedMeta.map((m) => m.toObject()), { purgeRingNumbers: false });
          }
          // Simple attachment (Meta instance)
          return item;
        });
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
  static build(rings) {
    // Sort rings from largest to smallest
    const sortedRings = [...rings].sort((a, b) => b.size - a.size);

    // Build the SMILES structure
    let atoms = FusedRingClass.buildRing(sortedRings[0]);

    // Wrap each subsequent ring around the previous structure
    for (let ringIdx = 1; ringIdx < sortedRings.length; ringIdx += 1) {
      const meta = sortedRings[ringIdx];
      const { offset } = meta;

      const newRingAtoms = FusedRingClass.buildRing(meta);

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
   * Can be called with either:
   * - (meta: Meta) - Meta instance with ringNumber already set
   * - (ringDesc: Object, ringNumber: number) - Ring descriptor and explicit ring number
   * @returns {Array<string>} Array of atom strings
   */
  static buildRing(metaOrDesc, explicitRingNumber) {
    // Handle two-argument form: buildRing(ringDesc, ringNumber)
    let meta = metaOrDesc;
    if (explicitRingNumber !== undefined) {
      const { type, ...rest } = metaOrDesc;
      meta = new Meta({
        type: MetaType.RING,
        atoms: type,
        ...rest,
        ringNumber: explicitRingNumber,
      });
    }

    const {
      size,
      atoms,
      substitutions,
      attachments,
      ringNumber,
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
    Object.entries(attachments).forEach(([position, attachmentArray]) => {
      const i = Number(position) - 1;

      let allAttachmentsSmiles = '';
      attachmentArray.forEach((attachment) => {
        allAttachmentsSmiles += `(${attachment.smiles})`;
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

  toObject() {
    return this.meta.toObject();
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
        // Build plain ring descriptors from Meta instances
        const newRings = fusedRingInstance.meta.map((meta, idx) => {
          if (idx === ringArrayIndex) {
            // Clone existing attachments
            const newAttachments = {};
            Object.entries(meta.attachments).forEach(([pos, attachmentArray]) => {
              newAttachments[pos] = [...attachmentArray];
            });

            // Add new attachment to the array at this position
            if (newAttachments[position]) {
              newAttachments[position].push(attachment);
            } else {
              newAttachments[position] = [attachment];
            }

            // Return plain descriptor object with atoms mapped from meta
            return {
              type: meta.type,
              atoms: meta.atoms,
              size: meta.size,
              offset: meta.offset,
              substitutions: meta.substitutions,
              attachments: newAttachments,
            };
          }
          // Return plain descriptor object for unchanged rings
          return {
            type: meta.type,
            atoms: meta.atoms,
            size: meta.size,
            offset: meta.offset,
            substitutions: meta.substitutions,
            attachments: meta.attachments,
          };
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
