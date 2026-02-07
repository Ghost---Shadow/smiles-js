/**
 * Simple Fused Ring SMILES Builder
 * Handles non-interleaved fused rings using offset approach
 */

import {
  normalizeBranchDepths,
  emitAttachment,
  openBranches,
  closeBranchesInterleaved,
} from './branch-walker.js';

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
  const branchDepthAt = new Map(); // position -> branch depth

  // Fill atom sequence with ring atoms, bonds, attachments, and branch depths
  sortedRings.forEach((ring) => {
    const {
      offset, size, atoms, substitutions = {}, attachments = {}, ringNumber, bonds = [],
    } = ring;
    const branchDepths = ring.metaBranchDepths || [];

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
      openPosition: offset,
    });

    // Place atoms, bonds, attachments, and branch depths
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

      // Add branch depth for this position (take max if multiple rings overlap)
      if (branchDepths.length > 0) {
        const depth = branchDepths[i] || 0;
        const currentDepth = branchDepthAt.get(pos) || 0;
        if (depth > currentDepth) {
          branchDepthAt.set(pos, depth);
        }
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

  // Check if any position has varying branch depths
  const hasBranchDepths = branchDepthAt.size > 0
    && [...branchDepthAt.values()].some((d) => d !== 0);

  if (hasBranchDepths) {
    return buildWithBranchDepths(atomSequence, bondsBefore, branchDepthAt, buildSMILES);
  }

  // Build SMILES string using standard notation (no branch depth handling needed)
  return buildFlat(atomSequence, bondsBefore, buildSMILES);
}

/**
 * Build SMILES for fused rings that have branch-crossing positions
 */
function buildWithBranchDepths(atomSequence, bondsBefore, branchDepthAt, buildSMILES) {
  // Collect all valid positions in order
  const positions = [];
  atomSequence.forEach((entry, pos) => {
    if (entry) positions.push(pos);
  });

  // Normalize branch depths
  const normalizedDepths = normalizeBranchDepths(branchDepthAt, positions);

  const parts = [];
  const depthRef = { value: 0 };
  const pendingAttachments = new Map();

  positions.forEach((pos, idx) => {
    const entry = atomSequence[pos];
    const { atom, markers = [], attachments = [] } = entry;
    const posDepth = normalizedDepths.get(pos) || 0;

    // Handle branch depth changes
    openBranches(parts, depthRef, posDepth);
    closeBranchesInterleaved(parts, depthRef, posDepth, pendingAttachments, buildSMILES);

    // Add bond before atom
    if (idx > 0 && bondsBefore.has(pos)) {
      parts.push(bondsBefore.get(pos));
    }

    if (atom) {
      parts.push(atom);
    }

    // Ring markers: opens first, then closes (sorted by ring number)
    const openMarkers = markers.filter((m) => m.type === 'open');
    openMarkers.forEach((marker) => {
      if (marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    const closeMarkers = markers.filter((m) => m.type === 'close');
    closeMarkers.sort((a, b) => a.ringNumber - b.ringNumber);
    closeMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });

    // Check if there's an inline branch starting after this position
    const nextPos = positions[idx + 1];
    const nextDepth = nextPos !== undefined ? (normalizedDepths.get(nextPos) || 0) : 0;
    const hasInlineBranchAfter = nextDepth > posDepth;

    if (attachments.length > 0) {
      if (hasInlineBranchAfter) {
        if (!pendingAttachments.has(posDepth)) {
          pendingAttachments.set(posDepth, []);
        }
        pendingAttachments.get(posDepth).push(...attachments);
      } else {
        attachments.forEach((attachment) => {
          emitAttachment(parts, attachment, buildSMILES);
        });
      }
    }
  });

  // Close any remaining open branches
  closeBranchesInterleaved(parts, depthRef, 0, pendingAttachments, buildSMILES);

  return parts.join('');
}

/**
 * Build SMILES for fused rings without branch depth handling (flat case)
 */
function buildFlat(atomSequence, bondsBefore, buildSMILES) {
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
    closeMarkers.sort((a, b) => a.ringNumber - b.ringNumber);
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
