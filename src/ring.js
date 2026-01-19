import { FusedRing } from './fused-ring.js';

/**
 * Ring factory function - wraps FusedRing to accept a single ring descriptor
 * @param {Object} ringDescriptor - Single ring descriptor object
 * @returns {FusedRingClass} Ring instance (actually a FusedRing with one ring)
 */
export function Ring(ringDescriptor) {
  // Wrap single descriptor in an array and pass to FusedRing
  return FusedRing([ringDescriptor]);
}

// Expose static buildRing method from FusedRing
Ring.buildRing = FusedRing.buildRing;
