import { FusedRing } from './fused-ring.js';

/**
 * Ring factory function - wraps FusedRing to accept a single ring descriptor
 * @param {Object} descriptor - Ring descriptor object
 * @returns {FusedRingClass} Ring instance (actually a FusedRing with one ring)
 */
export function Ring(descriptor) {
  // Wrap single descriptor in an array and pass to FusedRing
  const fusedRing = FusedRing([descriptor]);

  // Add convenience attachAt method for single rings that supports chaining
  fusedRing.attachAt = function attachAt(position, attachment) {
    const result = this.getRing(1).attachAt(position, attachment);
    // Re-add attachAt to the result for chaining
    result.attachAt = fusedRing.attachAt.bind(result);
    return result;
  };

  return fusedRing;
}

// Expose static buildRing method from FusedRing
Ring.buildRing = FusedRing.buildRing;
