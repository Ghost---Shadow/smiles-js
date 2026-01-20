import { Meta, MetaType } from './meta.js';
import { parseLinear } from './parse.js';

/**
 * Linear structure class
 */
class LinearClass {
  constructor(smiles) {
    if (!smiles || smiles.length === 0) {
      throw new Error('Linear requires a non-empty SMILES string');
    }

    // Basic validation - check for invalid characters
    // Valid SMILES characters: letters, digits, ()[]=#@+-/\\, and a few others
    if (/[^A-Za-z0-9()[\]=#@+\-/\\%.]/.test(smiles)) {
      throw new Error(`Invalid SMILES string: ${smiles}`);
    }

    // Check if SMILES contains complex features (stereochemistry, charges in brackets)
    // If so, don't parse branches - store as-is
    const hasComplexFeatures = /[@#]|[[].*[+\-@#].*[\]]/.test(smiles);

    let parsed;
    if (hasComplexFeatures) {
      // Store as-is without parsing branches
      parsed = { type: 'linear', atoms: smiles, attachments: {} };
    } else {
      // Use shared parse logic
      parsed = parseLinear(smiles);
    }

    this.smiles = smiles;
    this.meta = LinearClass.convertToMeta(parsed);
  }

  /**
   * Convert parsed linear structure to Meta instance
   * @param {Object} parsed - Parsed structure from parseLinear
   * @returns {Meta} Meta instance
   */
  static convertToMeta(parsed) {
    const { atoms, attachments } = parsed;

    // Convert nested attachments to Meta instances
    const metaAttachments = {};
    Object.entries(attachments).forEach(([pos, attachment]) => {
      metaAttachments[pos] = LinearClass.convertToMeta(attachment);
    });

    return new Meta({
      type: MetaType.LINEAR,
      smiles: null,
      atoms,
      attachments: metaAttachments,
    });
  }

  /**
   * Build SMILES string from meta
   * @param {Meta} meta - Meta instance
   * @returns {string} SMILES string
   */
  static buildSmiles(meta) {
    const { atoms, attachments } = meta;

    if (Object.keys(attachments).length === 0) {
      return atoms;
    }

    let result = '';
    let atomIndex = 0;

    for (let i = 0; i < atoms.length; i += 1) {
      const char = atoms[i];

      // Bond symbols
      if (char === '=' || char === '#') {
        result += char;
      } else if (char === '[') {
        // Bracketed atoms
        let j = i;
        while (j < atoms.length && atoms[j] !== ']') {
          result += atoms[j];
          j += 1;
        }
        result += ']';
        atomIndex += 1;
        i = j;

        // Add attachment
        if (attachments[atomIndex]) {
          const attachment = attachments[atomIndex];
          if (attachment instanceof Meta) {
            result += `(${LinearClass.buildSmiles(attachment)})`;
          } else if (attachment.smiles) {
            result += `(${attachment.smiles})`;
          }
        }
      } else {
        // Regular atom
        result += char;

        // Two-letter atom
        if (i + 1 < atoms.length && /[a-z]/.test(atoms[i + 1])) {
          result += atoms[i + 1];
          i += 1;
        }

        atomIndex += 1;

        // Add attachment
        if (attachments[atomIndex]) {
          const attachment = attachments[atomIndex];
          if (attachment instanceof Meta) {
            result += `(${LinearClass.buildSmiles(attachment)})`;
          } else if (attachment.smiles) {
            result += `(${attachment.smiles})`;
          }
        }
      }
    }

    return result;
  }

  /**
   * Create Linear instance from meta without re-parsing
   * @param {string} smiles - SMILES string
   * @param {Meta} meta - Meta instance
   * @returns {LinearClass} New Linear instance
   */
  static fromMeta(smiles, meta) {
    const instance = Object.create(LinearClass.prototype);
    instance.smiles = smiles;
    instance.meta = meta;
    return instance;
  }

  /**
   * Concatenate another linear structure
   * @param {string|LinearClass} other - SMILES string or Linear instance
   * @returns {LinearClass} New Linear instance
   */
  concat(other) {
    const otherLinear = typeof other === 'string' ? new LinearClass(other) : other;

    // Count atoms (excluding bond symbols)
    const atomsCount = this.meta.atoms.replace(/[=#]/g, '').length;

    // Merge attachments with adjusted positions
    const newAttachments = { ...this.meta.attachments };
    Object.entries(otherLinear.meta.attachments).forEach(([pos, attachment]) => {
      const adjustedPos = parseInt(pos, 10) + atomsCount;
      newAttachments[adjustedPos] = attachment;
    });

    // Merge atoms
    const newAtoms = this.meta.atoms + otherLinear.meta.atoms;

    // Create new meta
    const newMeta = new Meta({
      type: MetaType.LINEAR,
      smiles: null,
      atoms: newAtoms,
      attachments: newAttachments,
    });

    // Build SMILES
    const newSmiles = LinearClass.buildSmiles(newMeta);

    return LinearClass.fromMeta(newSmiles, newMeta);
  }

  /**
   * Attach at last position
   * @param {string|LinearClass} branch - SMILES string or Linear instance
   * @returns {LinearClass} New Linear instance
   */
  attach(branch) {
    const atomsCount = this.meta.atoms.replace(/[=#]/g, '').length;
    return this.attachAt(atomsCount, branch);
  }

  /**
   * Attach at specific position
   * @param {number} position - 1-based position
   * @param {string|LinearClass} branch - SMILES string or Linear instance
   * @returns {LinearClass} New Linear instance
   */
  attachAt(position, branch) {
    const branchLinear = typeof branch === 'string' ? new LinearClass(branch) : branch;

    // Clone existing attachments
    const newAttachments = { ...this.meta.attachments };

    // If position already has an attachment, concatenate with it
    if (newAttachments[position]) {
      const existingLinear = LinearClass.fromMeta(
        LinearClass.buildSmiles(newAttachments[position]),
        newAttachments[position],
      );
      const concatenated = existingLinear.concat(branchLinear);
      newAttachments[position] = concatenated.meta;
    } else {
      newAttachments[position] = branchLinear.meta;
    }

    // Create new meta
    const newMeta = new Meta({
      type: MetaType.LINEAR,
      smiles: null,
      atoms: this.meta.atoms,
      attachments: newAttachments,
    });

    // Build SMILES
    const newSmiles = LinearClass.buildSmiles(newMeta);

    // Create instance directly without re-parsing
    return LinearClass.fromMeta(newSmiles, newMeta);
  }
}

/**
 * Linear factory function
 * @param {string} smiles - SMILES string
 * @returns {LinearClass} Linear instance
 */
export function Linear(smiles) {
  return new LinearClass(smiles);
}

/**
 * Static concat method
 * @param {string|LinearClass} first - First SMILES string or Linear instance
 * @param {string|LinearClass} second - Second SMILES string or Linear instance
 * @returns {LinearClass} New Linear instance
 */
Linear.concat = function concat(first, second) {
  const firstLinear = typeof first === 'string' ? new LinearClass(first) : first;
  return firstLinear.concat(second);
};
