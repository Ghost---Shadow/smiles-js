/**
 * Interleaved Fused Ring SMILES Builder
 * Handles fused rings using stored position data
 */

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

  // Normalize branch depths - the fused ring may be inside a branch (as an attachment),
  // so we need relative depths starting from 0, not absolute depths from parsing
  const minDepth = allPositions.length > 0
    ? Math.min(...allPositions.map((pos) => rawBranchDepthMap.get(pos) || 0))
    : 0;
  const branchDepthMap = new Map();
  allPositions.forEach((pos) => {
    const rawDepth = rawBranchDepthMap.get(pos) || 0;
    branchDepthMap.set(pos, rawDepth - minDepth);
  });

  // Build the atom sequence with attachments and bonds
  const atomSequence = [];
  const ringMarkers = new Map(); // position -> [{ringNumber, type, closureBond?}]
  const bondsBefore = new Map(); // position -> bond (bond to add before atom at this position)

  // Include sequential continuation rings in addition to fused group rings
  const sequentialRings = fusedRing.metaSequentialRings || [];
  const allRings = [...rings, ...sequentialRings];

  // Track which positions have already had attachments added (to avoid duplicates)
  // When an atom is shared between multiple fused rings, each ring has the same
  // attachments, but we should only output them once
  const positionsWithAttachments = new Set();

  // Collect all ring markers, atom sequence, and bonds
  allRings.forEach((ring) => {
    const positions = ring.metaPositions || [];
    const start = ring.metaStart;
    const end = ring.metaEnd;
    const {
      ringNumber, atoms, substitutions = {}, attachments = {}, bonds = [],
    } = ring;

    // Ring opens at its first position (which is the start atom index)
    // Include the ring closure bond if present
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
      const atomValue = substitutions[relativePos] || atoms;
      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom: atomValue, attachments: [] };
      }

      // For positions > 1 in the ring, add the bond before this atom
      // bonds[idx-1] is the bond before the (idx+1)th atom (1-indexed relative position)
      if (idx > 0 && bonds[idx - 1] && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bonds[idx - 1]);
      }

      // Add attachments at this relative position (if any)
      // Only add if we haven't already added attachments for this position
      // (shared positions between fused rings would otherwise get duplicates)
      if (attachments[relativePos] && !positionsWithAttachments.has(pos)) {
        atomSequence[pos].attachments.push(...attachments[relativePos]);
        positionsWithAttachments.add(pos);
      }
    });
  });

  // For positions that aren't in any ring (sequential continuations), we need to
  // create atomSequence entries. These are atoms that follow ring-closing atoms
  // but aren't part of the ring structure.
  const allRingPositions = new Set(allRings.flatMap((r) => r.metaPositions || []));
  const atomValueMap = fusedRing.metaAtomValueMap || new Map();
  const seqAtomAttachments = fusedRing.metaSeqAtomAttachments || new Map();
  const bondMap = fusedRing.metaBondMap || new Map();
  allPositions.forEach((pos) => {
    if (!atomSequence[pos] && !allRingPositions.has(pos)) {
      // This is a sequential continuation atom - use stored atom value and attachments
      const atomValue = atomValueMap.get(pos) || 'C';
      const attachments = seqAtomAttachments.get(pos) || [];
      atomSequence[pos] = { atom: atomValue, attachments };
      // Also add bond for this position if present
      const bond = bondMap.get(pos);
      if (bond && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bond);
      }
    }
  });

  // Build SMILES by walking through all positions in order
  // Track branch depth to insert ( and ) correctly
  const parts = [];
  let currentDepth = 0;

  // Track pending attachments that should be output after inline branches close
  // Map of depth -> array of attachments to output when returning to that depth
  const pendingAttachments = new Map();

  allPositions.forEach((pos, idx) => {
    const entry = atomSequence[pos];
    if (!entry) return;

    const posDepth = branchDepthMap.get(pos) || 0;

    // Handle branch depth changes
    while (currentDepth < posDepth) {
      parts.push('(');
      currentDepth += 1;
    }
    while (currentDepth > posDepth) {
      parts.push(')');
      currentDepth -= 1;

      // Check if we have pending attachments for this depth
      if (pendingAttachments.has(currentDepth)) {
        const attachmentsToOutput = pendingAttachments.get(currentDepth);
        attachmentsToOutput.forEach((attachment) => {
          // Check if this attachment should be rendered inline (no parentheses)
          const isInline = attachment.metaIsSibling === false;
          if (!isInline) {
            parts.push('(');
          }
          parts.push(buildSMILES(attachment));
          if (!isInline) {
            parts.push(')');
          }
        });
        pendingAttachments.delete(currentDepth);
      }
    }

    // Add bond before atom (if not first atom in the sequence)
    // Bonds CAN come right after opening paren - e.g., C(=C) means C double-bonded to branch C
    if (idx > 0 && bondsBefore.has(pos)) {
      parts.push(bondsBefore.get(pos));
    }

    // Add atom
    parts.push(entry.atom);

    // Add ring markers for this position
    const markers = ringMarkers.get(pos) || [];

    // Sort markers: opens first, then by original order from SMILES
    // The ringOrderMap stores the order of ring markers as they appeared in the original
    const ringOrderMap = fusedRing.metaRingOrderMap || new Map();
    const originalOrder = ringOrderMap.get(pos) || [];

    markers.sort((a, b) => {
      // Opens always come before closes
      if (a.type !== b.type) {
        return a.type === 'open' ? -1 : 1;
      }
      // For same type, use original order from SMILES if available
      const aIdx = originalOrder.indexOf(a.ringNumber);
      const bIdx = originalOrder.indexOf(b.ringNumber);
      if (aIdx !== -1 && bIdx !== -1) {
        return aIdx - bIdx;
      }
      // Fallback to ring number order
      return a.ringNumber - b.ringNumber;
    });

    markers.forEach((marker) => {
      // Add ring closure bond before ring number for opening markers
      if (marker.type === 'open' && marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    // Check if there's an inline branch starting after this position
    // (next position has greater depth). If so, delay outputting attachments
    // until the branch closes back to this depth.
    const nextPos = allPositions[idx + 1];
    const nextDepth = nextPos !== undefined ? (branchDepthMap.get(nextPos) || 0) : posDepth;
    const hasInlineBranchAfter = nextDepth > posDepth;

    if (entry.attachments.length > 0) {
      if (hasInlineBranchAfter) {
        // Delay attachments until after the inline branch closes
        if (!pendingAttachments.has(posDepth)) {
          pendingAttachments.set(posDepth, []);
        }
        pendingAttachments.get(posDepth).push(...entry.attachments);
      } else {
        // Output attachments immediately
        entry.attachments.forEach((attachment) => {
          // Check if this attachment should be rendered inline (no parentheses)
          const isInline = attachment.metaIsSibling === false;
          if (!isInline) {
            parts.push('(');
          }
          parts.push(buildSMILES(attachment));
          if (!isInline) {
            parts.push(')');
          }
        });
      }
    }
  });

  // Close any remaining open branches
  while (currentDepth > 0) {
    parts.push(')');
    currentDepth -= 1;

    // Check if we have pending attachments for this depth
    if (pendingAttachments.has(currentDepth)) {
      const attachmentsToOutput = pendingAttachments.get(currentDepth);
      attachmentsToOutput.forEach((attachment) => {
        // Check if this attachment should be rendered inline (no parentheses)
        const isInline = attachment.metaIsSibling === false;
        if (!isInline) {
          parts.push('(');
        }
        parts.push(buildSMILES(attachment));
        if (!isInline) {
          parts.push(')');
        }
      });
      pendingAttachments.delete(currentDepth);
    }
  }

  return parts.join('');
}
