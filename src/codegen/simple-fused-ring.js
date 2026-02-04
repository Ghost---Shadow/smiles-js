/**
 * Simple Fused Ring SMILES Builder
 * Handles non-interleaved fused rings using offset approach
 */

/**
 * Build SMILES for simple (non-interleaved) fused rings using offset approach
 * @param {Object} fusedRing - FusedRing AST node
 * @param {Function} buildSMILES - Reference to main buildSMILES function
 * @returns {string} SMILES string
 */
export function buildSimpleFusedRingSMILES(fusedRing, buildSMILES) {
  const { rings } = fusedRing;

  // Sort rings by offset to process in order
  const sortedRings = [...rings].sort((a, b) => a.offset - b.offset);

  // Build atom sequence considering overlaps
  const maxEnd = Math.max(...sortedRings.map((r) => r.offset + r.size));
  const atomSequence = new Array(maxEnd);
  const ringMarkers = [];
  const bondsBefore = new Map(); // position -> bond

  // Fill atom sequence with ring atoms, bonds, and attachments
  sortedRings.forEach((ring) => {
    const {
      offset, size, atoms, substitutions = {}, attachments = {}, ringNumber, bonds = [],
    } = ring;

    // Record ring opening and closing positions with closure bond
    const closureBond = bonds[size - 1] || null;
    ringMarkers.push({
      position: offset,
      ringNumber,
      type: 'open',
      closureBond,
    });
    ringMarkers.push({
      position: offset + size - 1,
      ringNumber,
      type: 'close',
    });

    // Place atoms, bonds, and attachments
    Array.from({ length: size }, (_, idx) => idx).forEach((i) => {
      const pos = offset + i;
      const relativePos = i + 1; // 1-indexed position within the ring
      const atom = substitutions[relativePos] || atoms;

      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom, attachments: [] };
      }

      // Add bond before this atom (for atoms after the first in the ring)
      if (i > 0 && bonds[i - 1] && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bonds[i - 1]);
      }

      // Add attachments at this relative position (if any)
      // Attachments are added even if atom was already set by another ring
      if (attachments[relativePos]) {
        atomSequence[pos].attachments.push(...attachments[relativePos]);
      }
    });
  });

  // Add ring markers to the atom sequence
  ringMarkers.forEach((marker) => {
    if (!atomSequence[marker.position]) {
      atomSequence[marker.position] = { atom: null, attachments: [] };
    }
    if (!atomSequence[marker.position].markers) {
      atomSequence[marker.position].markers = [];
    }
    atomSequence[marker.position].markers.push(marker);
  });

  // Build SMILES string using standard notation
  const parts = [];
  atomSequence.forEach((entry, pos) => {
    if (!entry) return;

    const { atom, markers = [], attachments = [] } = entry;

    // Add bond before atom (if not first atom and bond exists)
    if (pos > 0 && bondsBefore.has(pos)) {
      parts.push(bondsBefore.get(pos));
    }

    if (atom) {
      parts.push(atom);
    }

    const openMarkers = markers.filter((m) => m.type === 'open');
    openMarkers.forEach((marker) => {
      // Add ring closure bond before ring number
      if (marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    const closeMarkers = markers.filter((m) => m.type === 'close');
    closeMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });

    attachments.forEach((attachment) => {
      // Check if this attachment should be rendered inline (no parentheses)
      // This happens for sequential continuation atoms after ring closures
      const isInline = attachment.metaIsSibling === false;
      if (!isInline) {
        parts.push('(');
      }
      parts.push(buildSMILES(attachment));
      if (!isInline) {
        parts.push(')');
      }
    });
  });

  return parts.join('');
}
