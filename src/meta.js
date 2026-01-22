import { deepMerge } from './utils.js';

/**
 * Meta type enum
 */
export const MetaType = {
  RING: 'ring',
  LINEAR: 'linear',
};

/**
 * Datatype class representing a molecular structure descriptor with metadata
 */
export class Meta {
  constructor({
    type,
    size = null,
    atoms = null,
    offset = 0,
    ringNumber = null,
    substitutions = {},
    attachments = {},
  }) {
    this.type = type;
    this.size = size;
    this.atoms = atoms;
    this.offset = offset;
    this.ringNumber = ringNumber;
    this.substitutions = substitutions;
    this.attachments = attachments;
  }

  /**
   * Create a new Meta with updated properties (uses deep merge for nested objects)
   * @param {Object} updates - Properties to update
   * @returns {Meta} New Meta instance with updates applied
   */
  update(updates) {
    const base = {
      type: this.type,
      size: this.size,
      atoms: this.atoms,
      offset: this.offset,
      ringNumber: this.ringNumber,
      substitutions: this.substitutions,
      attachments: this.attachments,
    };

    return new Meta(deepMerge(base, updates));
  }

  /**
   * Check if a value should be included in the output object
   * @param {*} value - Value to check
   * @param {*} defaultValue - Default value to compare against
   * @returns {boolean} True if value should be included
   */
  static shouldInclude(value, defaultValue = null) {
    if (value === null || value === undefined) return false;
    if (defaultValue === 0 && value === 0) return false;
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).length > 0;
    }
    return true;
  }

  /**
   * Convert to plain object (for backward compatibility)
   * Recursively converts nested Meta instances in attachments
   * @returns {Object} Plain object representation
   */
  toObject() {
    const obj = {
      type: this.type,
    };

    // Add fields if they should be included
    if (Meta.shouldInclude(this.size)) obj.size = this.size;
    if (Meta.shouldInclude(this.atoms)) obj.atoms = this.atoms;
    if (Meta.shouldInclude(this.offset, 0)) obj.offset = this.offset;
    if (Meta.shouldInclude(this.ringNumber)) obj.ringNumber = this.ringNumber;
    if (Meta.shouldInclude(this.substitutions)) obj.substitutions = this.substitutions;

    // Recursively convert attachments
    if (Meta.shouldInclude(this.attachments)) {
      const convertedAttachments = {};
      Object.entries(this.attachments).forEach(([position, attachment]) => {
        if (Array.isArray(attachment)) {
          // Handle arrays of Meta instances
          convertedAttachments[position] = attachment.map((item) => (
            item instanceof Meta ? item.toObject() : item
          ));
        } else if (attachment instanceof Meta) {
          convertedAttachments[position] = attachment.toObject();
        } else if (attachment?.meta) {
          // Handle FusedRing attachments with meta array
          convertedAttachments[position] = {
            meta: attachment.meta.map((ring) => (ring instanceof Meta ? ring.toObject() : ring)),
          };
        } else {
          convertedAttachments[position] = attachment;
        }
      });
      obj.attachments = convertedAttachments;
    }

    return obj;
  }
}
