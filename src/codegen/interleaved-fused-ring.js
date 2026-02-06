/**
 * Interleaved Fused Ring SMILES Builder
 * Handles fused rings using stored position data
 */

import {
  normalizeBranchDepths,
  emitAttachment,
  openBranches,
  closeBranchesInterleaved,
} from './branch-walker.js';

/**
 * Build SMILES for interleaved fused rings using stored position data
 * @param {Object} fusedRing - FusedRing AST node
 * @param {Function} buildSMILES - Reference to main buildSMILES function
 * @returns {string} SMILES string
 */
export function buildInterleavedFusedRingSMILES(fusedRing, buildSMILES) {
  const { rings } = fusedRing;
  const allPositions = fusedRing.metaAllPositions;
  const rawBranchDepthMap = fusedRing.metaBranchDepthMap || new Map();

  // Normalize branch depths relative to the fused ring's base depth
  const branchDepthMap = normalizeBranchDepths(rawBranchDepthMap, allPositions);

  // Build the atom sequence with attachments and bonds
  const atomSequence = [];
  const ringMarkers = new Map(); // position -> [{ringNumber, type, closureBond?}]
  const bondsBefore = new Map(); // position -> bond (bond to add before atom at this position)

  // Include sequential continuation rings in addition to fused group rings
  const sequentialRings = fusedRing.metaSequentialRings || [];
  const allRings = [...rings, ...sequentialRings];

  // Track which positions have already had attachments added (to avoid duplicates)
  const positionsWithAttachments = new Set();

  // Get metaAtomValueMap early for use in atom value lookups
  const atomValueMap = fusedRing.metaAtomValueMap || new Map();

  // Collect all ring markers, atom sequence, and bonds
  allRings.forEach((ring) => {
    const positions = ring.metaPositions || [];
    const start = ring.metaStart;
    const end = ring.metaEnd;
    const {
      ringNumber, atoms, substitutions = {}, attachments = {}, bonds = [],
    } = ring;

    // Ring opens at its first position (which is the start atom index)
    const closureBond = bonds[ring.size - 1] || null;
    if (!ringMarkers.has(start)) {
      ringMarkers.set(start, []);
    }
    ringMarkers.get(start).push({ ringNumber, type: 'open', closureBond });

    // Ring closes at its last position (which is the end atom index)
    if (!ringMarkers.has(end)) {
      ringMarkers.set(end, []);
    }
    ringMarkers.get(end).push({ ringNumber, type: 'close' });

    // Fill in atom values, bonds, and attachments for this ring's positions
    positions.forEach((pos, idx) => {
      const relativePos = idx + 1;
      const atomValue = atomValueMap.get(pos) || substitutions[relativePos] || atoms;
      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom: atomValue, attachments: [] };
      }

      if (idx > 0 && bonds[idx - 1] && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bonds[idx - 1]);
      }

      if (attachments[relativePos] && !positionsWithAttachments.has(pos)) {
        atomSequence[pos].attachments.push(...attachments[relativePos]);
        positionsWithAttachments.add(pos);
      }
    });
  });

  // For positions not in any ring (sequential continuations), create atomSequence entries
  const allRingPositions = new Set(allRings.flatMap((r) => r.metaPositions || []));
  const seqAtomAttachments = fusedRing.metaSeqAtomAttachments || new Map();
  const bondMap = fusedRing.metaBondMap || new Map();
  allPositions.forEach((pos) => {
    if (!atomSequence[pos] && !allRingPositions.has(pos)) {
      const atomValue = atomValueMap.get(pos) || 'C';
      const attachments = seqAtomAttachments.get(pos) || [];
      atomSequence[pos] = { atom: atomValue, attachments };
      const bond = bondMap.get(pos);
      if (bond && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bond);
      }
    }
  });

  // Build SMILES by walking through all positions in order
  const parts = [];
  const depthRef = { value: 0 };

  // Pending attachments: depth -> attachment[]
  const pendingAttachments = new Map();

  allPositions.forEach((pos, idx) => {
    const entry = atomSequence[pos];
    if (!entry) return;

    const posDepth = branchDepthMap.get(pos) || 0;

    // Handle branch depth changes
    openBranches(parts, depthRef, posDepth);
    closeBranchesInterleaved(parts, depthRef, posDepth, pendingAttachments, buildSMILES);

    // Add bond before atom (if not first atom in the sequence)
    if (idx > 0 && bondsBefore.has(pos)) {
      parts.push(bondsBefore.get(pos));
    }

    // Add atom
    parts.push(entry.atom);

    // Add ring markers for this position
    const markers = ringMarkers.get(pos) || [];

    // Sort markers: opens first, then by original order from SMILES
    const ringOrderMap = fusedRing.metaRingOrderMap || new Map();
    const originalOrder = ringOrderMap.get(pos) || [];

    markers.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'open' ? -1 : 1;
      }
      const aIdx = originalOrder.indexOf(a.ringNumber);
      const bIdx = originalOrder.indexOf(b.ringNumber);
      if (aIdx !== -1 && bIdx !== -1) {
        return aIdx - bIdx;
      }
      return a.ringNumber - b.ringNumber;
    });

    markers.forEach((marker) => {
      if (marker.type === 'open' && marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    // Check if there's an inline branch starting after this position
    const nextPos = allPositions[idx + 1];
    const nextDepth = nextPos !== undefined ? (branchDepthMap.get(nextPos) || 0) : posDepth;
    const hasInlineBranchAfter = nextDepth > posDepth;

    if (entry.attachments.length > 0) {
      if (hasInlineBranchAfter) {
        if (!pendingAttachments.has(posDepth)) {
          pendingAttachments.set(posDepth, []);
        }
        pendingAttachments.get(posDepth).push(...entry.attachments);
      } else {
        entry.attachments.forEach((attachment) => {
          emitAttachment(parts, attachment, buildSMILES);
        });
      }
    }
  });

  // Close any remaining open branches
  closeBranchesInterleaved(parts, depthRef, 0, pendingAttachments, buildSMILES);

  return parts.join('');
}
