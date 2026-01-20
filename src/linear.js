import { Meta, MetaType } from './meta.js';

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
      parsed = { atoms: smiles, attachments: {} };
    } else {
      // Parse branches normally
      parsed = LinearClass.parseSmiles(smiles);
    }

    this.smiles = smiles;
    this.meta = new Meta({
      type: MetaType.LINEAR,
      smiles: null,
      atoms: parsed.atoms,
      attachments: parsed.attachments,
    });
  }

  /**
   * Parse SMILES string into atoms and attachments
   * @param {string} smiles - SMILES string
   * @returns {Object} Parsed structure with atoms and attachments
   */
  static parseSmiles(smiles) {
    const atoms = [];
    const attachments = {};
    let atomIndex = 1; // 1-based indexing

    let i = 0;
    while (i < smiles.length) {
      const char = smiles[i];

      if (char === '(') {
        // Extract attachment content
        let depth = 1;
        let j = i + 1;
        let attachmentContent = '';

        while (j < smiles.length && depth > 0) {
          if (smiles[j] === '(') {
            depth += 1;
          } else if (smiles[j] === ')') {
            depth -= 1;
          }
          if (depth > 0) {
            attachmentContent += smiles[j];
          }
          j += 1;
        }

        // Recursively parse attachment
        if (atoms.length > 0) {
          const parsed = LinearClass.parseSmiles(attachmentContent);
          attachments[atomIndex - 1] = new Meta({
            type: MetaType.LINEAR,
            smiles: null,
            atoms: parsed.atoms,
            attachments: parsed.attachments,
          });
        }

        i = j;
      } else if (char === '[') {
        // Handle bracketed atoms
        let j = i + 1;
        while (j < smiles.length && smiles[j] !== ']') {
          j += 1;
        }
        atoms.push(smiles.substring(i, j + 1));
        atomIndex += 1;
        i = j + 1;
      } else if (/[A-Z]/.test(char)) {
        // Handle atoms
        let atom = char;
        if (i + 1 < smiles.length && /[a-z]/.test(smiles[i + 1])) {
          atom += smiles[i + 1];
          i += 1;
        }
        atoms.push(atom);
        atomIndex += 1;
        i += 1;
      } else if (char === '=' || char === '#') {
        // Bond symbols
        atoms.push(char);
        i += 1;
      } else {
        // Skip other characters
        i += 1;
      }
    }

    return {
      atoms: atoms.join(''),
      attachments,
    };
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
