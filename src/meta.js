import { deepMerge } from './utils.js';

/**
 * Datatype class representing a ring descriptor with metadata
 */
export class Meta {
  constructor({
    size,
    type,
    offset = 0,
    ringNumber = null,
    substitutions = {},
    attachments = {},
  }) {
    this.size = size;
    this.type = type;
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
      size: this.size,
      type: this.type,
      offset: this.offset,
      ringNumber: this.ringNumber,
      substitutions: this.substitutions,
      attachments: this.attachments,
    };

    return new Meta(deepMerge(base, updates));
  }

  /**
   * Convert to plain object (for backward compatibility)
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      size: this.size,
      type: this.type,
      offset: this.offset,
      ringNumber: this.ringNumber,
      substitutions: this.substitutions,
      attachments: this.attachments,
    };
  }
}
