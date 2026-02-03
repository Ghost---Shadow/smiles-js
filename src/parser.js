/**
 * SMILES Parser (Phase 2)
 * Converts token stream into hierarchical AST
 * Uses two-pass strategy: linear scan + AST building
 */

import {
  tokenize,
  TokenType,
} from './tokenizer.js';
import {
  Ring,
  Linear,
  FusedRing,
  Molecule,
  createFusedRingNode,
} from './constructors.js';

// Forward declarations for mutual recursion
let buildBranchWithRingsInternal;
let buildLinearNodeSimpleInternal;

/**
 * Find the next sequential atom in the chain
 */
function findNextSeqAtom(atoms, prevIdx, branchDepth, branchId) {
  return atoms.find(
    (a) => a.prevAtomIndex === prevIdx
      && a.branchDepth === branchDepth
      && a.branchId === branchId
      && !a.afterBranchClose,
  );
}

/**
 * Check if two atoms are in the same branch context
 * (share the same branch ancestry)
 */
function isInSameBranchContext(atom1, atom2, allAtoms) {
  if (atom1.branchDepth !== atom2.branchDepth) return false;
  if (atom1.branchDepth === 0) return true;

  // For branch atoms, check they have the same parent chain
  // Trace back to find if they share ancestry
  let p1 = atom1.parentIndex;
  let p2 = atom2.parentIndex;

  // Keep going up until we find a common ancestor or reach null
  while (p1 !== null && p2 !== null) {
    if (p1 === p2) return true;
    const parent1 = allAtoms[p1];
    const parent2 = allAtoms[p2];
    if (!parent1 || !parent2) break;
    p1 = parent1.parentIndex;
    p2 = parent2.parentIndex;
  }

  // Check if they share the same branchId
  return atom1.branchId === atom2.branchId;
}

/**
 * Collect the proper path for a ring, handling interleaved fused rings.
 * When an inner ring closes while we're collecting atoms for an outer ring,
 * the inner ring creates a "shortcut" - we skip from its start to its end.
 *
 * Important: A ring can traverse into deeper branches. For example:
 * C1CC(C1) - ring 1 opens at depth 0, enters branch at depth 1, closes inside branch
 *
 * However, we must distinguish between:
 * - Branches that are PART of the ring path (ring continues through them)
 * - Branches that are ATTACHMENTS (separate substituents)
 *
 * A branch is part of the ring path if the ring CLOSURE occurs within it.
 *
 * @param {number} startIdx - Starting atom index
 * @param {number} endIdx - Ending atom index
 * @param {Array} atoms - All atoms
 * @param {number} branchDepth - Branch depth where ring opened (may close at deeper depth)
 * @param {number|null} branchId - Branch ID where ring opened
 * @param {Array} closedRings - List of rings that closed before this one
 */
function collectRingPath(startIdx, endIdx, atoms, branchDepth, branchId, closedRings) {
  const positions = [];

  // Find inner rings that are ACTUALLY FUSED with this ring (not just in branches)
  // A ring is fused if it starts at the same branch depth as our ring
  // Rings inside branches are attachments, not fused rings
  const innerRings = closedRings.filter((r) => {
    if (r.start <= startIdx || r.end >= endIdx) return false;
    // Check if the inner ring is at the same branch depth (truly interleaved)
    const innerStartAtom = atoms[r.start];
    return innerStartAtom && innerStartAtom.branchDepth === branchDepth;
  });

  // Sort by start position
  innerRings.sort((a, b) => a.start - b.start);

  // Determine which branches the ring path must traverse
  // If end atom is at a deeper depth, we need to enter that branch
  const endAtom = atoms[endIdx];
  const ringEntersDeepBranch = endAtom && endAtom.branchDepth > branchDepth;

  // If ring enters a deep branch, find the path of branch IDs from start to end
  const ringPathBranchIds = new Set();
  if (ringEntersDeepBranch) {
    // Trace from end atom back to find which branches we traverse
    let traceAtom = endAtom;
    while (traceAtom && traceAtom.branchDepth > branchDepth) {
      if (traceAtom.branchId !== null) {
        ringPathBranchIds.add(traceAtom.branchId);
      }
      // Find parent atom at shallower depth
      const parentIdx = traceAtom.parentIndex;
      traceAtom = parentIdx !== null ? atoms[parentIdx] : null;
    }
  }

  let idx = startIdx;
  while (idx <= endIdx) {
    const atom = atoms[idx];
    if (!atom) {
      idx += 1;
    } else {
      // Check if we're at an inner ring's start (creates a shortcut for fused rings)
      const currentIdx = idx;
      const innerRing = innerRings.find((r) => r.start === currentIdx);
      if (innerRing) {
        // Include the start atom (shared fusion point)
        positions.push(idx);
        // Jump to the end of the inner ring (which is also a shared fusion point)
        idx = innerRing.end;
      } else {
        // Check if atom is part of the ring path
        const atOriginalDepth = atom.branchDepth === branchDepth;
        const inRingPathBranch = ringPathBranchIds.has(atom.branchId);

        if (atOriginalDepth) {
          // At original depth - check branch context
          const startAtom = atoms[startIdx];
          const inContext = branchDepth === 0 || atom.branchId === branchId
            || isInSameBranchContext(atom, startAtom, atoms);
          if (inContext) {
            positions.push(idx);
          }
        } else if (inRingPathBranch) {
          // In a branch that the ring path traverses
          positions.push(idx);
        }

        idx += 1;
      }
    }
  }

  return positions;
}

/**
 * Collect consecutive atoms in a branch chain, including sub-branch atoms
 */
function collectBranchChain(branchAtom, allAtoms, processed) {
  const branchChain = [branchAtom];
  processed.add(branchAtom.index);

  // Build a map of index -> atom for faster lookup
  const atomsByIndex = new Map();
  allAtoms.forEach((a) => atomsByIndex.set(a.index, a));

  let currentIdx = branchAtom.index + 1;
  while (currentIdx < allAtoms.length) {
    const nextAtom = atomsByIndex.get(currentIdx);
    if (!nextAtom) break;

    // Stop if we hit a different branch level, parent, or branch ID at the same depth
    if (nextAtom.branchDepth < branchAtom.branchDepth) break;
    if (nextAtom.branchDepth === branchAtom.branchDepth) {
      if (nextAtom.parentIndex !== branchAtom.parentIndex) break;
      if (nextAtom.branchId !== branchAtom.branchId) break;
    }

    // Include atoms at same depth with same branchId, or deeper sub-branches
    branchChain.push(nextAtom);
    processed.add(nextAtom.index);
    currentIdx += 1;
  }

  return branchChain;
}

/**
 * Check if two rings share any atoms
 */
function ringsShareAtoms(ring1, ring2) {
  const set1 = new Set(ring1.positions);
  return ring2.positions.some((pos) => set1.has(pos));
}

/**
 * Group rings that share atoms (fused rings)
 * Uses ring boundary index to track assignment since ring numbers can be reused
 */
function groupFusedRings(ringBoundaries) {
  const groups = [];
  const assigned = new Set(); // Track by index, not ring number

  ringBoundaries.forEach((ring, ringIdx) => {
    if (assigned.has(ringIdx)) {
      return;
    }

    const group = [ring];
    assigned.add(ringIdx);

    // Find all rings that share atoms with this group
    let didExpand = true;
    while (didExpand) {
      didExpand = false;

      // Use traditional for loop to avoid no-loop-func error
      for (let j = 0; j < ringBoundaries.length; j += 1) {
        const otherRing = ringBoundaries[j];

        if (!assigned.has(j)) {
          // Check if otherRing shares atoms with any ring in group
          const hasOverlap = group.some((groupRing) => ringsShareAtoms(groupRing, otherRing));

          if (hasOverlap) {
            group.push(otherRing);
            assigned.add(j);
            didExpand = true;
          }
        }
      }
    }

    groups.push(group);
  });

  return groups;
}

/**
 * Calculate offset for a fused ring relative to the first ring
 */
function calculateOffset(ring, baseRing) {
  // Find the first shared atom
  const baseSet = new Set(baseRing.positions);
  const sharedPos = ring.positions.find((pos) => baseSet.has(pos));

  if (sharedPos === undefined) {
    return 0;
  }

  return baseRing.positions.indexOf(sharedPos);
}

/**
 * Build an AST node from a list of atoms (could be Linear or Ring)
 * This is the recursive function that handles rings inside branches
 */
function buildNodeFromAtoms(atomList, allAtoms, ringBoundaries, isBranch = false) {
  // Check if this atom list forms a ring
  const atomIndices = new Set(atomList.map((a) => a.index));
  const containedRings = ringBoundaries.filter(
    (ring) => ring.positions.every((pos) => atomIndices.has(pos)),
  );

  if (containedRings.length > 0) {
    // This branch contains ring(s) - build ring node(s)
    const rings = containedRings;
    return buildBranchWithRingsInternal(atomList, allAtoms, rings, ringBoundaries, isBranch);
  }

  // No rings in this branch - build linear node
  return buildLinearNodeSimpleInternal(atomList, allAtoms, ringBoundaries, isBranch);
}

/**
 * Build a linear chain node from atoms (no rings in this chain)
 */
buildLinearNodeSimpleInternal = function buildLinear(list, all, bounds, isBranch = false) {
  const atomList = list;
  const allAtoms = all;
  const ringBoundaries = bounds;
  // Filter to only atoms at the same branch depth as the first atom
  const baseDepth = atomList[0].branchDepth;
  const sameDepthAtoms = atomList.filter((a) => a.branchDepth === baseDepth);

  const atomValues = sameDepthAtoms.map((atom) => atom.rawValue);

  // For branches, include the bond on the first atom (connection to parent)
  // For main chain, start from second atom (skip first atom's bond)
  // Keep null bonds to preserve positions - bonds[i] is the bond BEFORE atom i+1
  const bondStart = isBranch ? 0 : 1;
  const bonds = sameDepthAtoms.slice(bondStart).map((atom) => atom.bond);

  // Build attachments from branches
  const attachments = {};

  // Group branch atoms by their parent index within this linear chain
  sameDepthAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;

    // Find all atoms that branch from this atom (one depth level deeper)
    const branchAtoms = allAtoms.filter(
      (a) => a.parentIndex === globalIdx && a.branchDepth === baseDepth + 1,
    );

    if (branchAtoms.length > 0) {
      // Group branches by branchId to handle multiple branches
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;

        // Collect all atoms in this branch (including deeper sub-branches)
        const branchChain = collectBranchChain(branchAtom, allAtoms, processed);
        branchGroups.push(branchChain);
      });

      // Build nodes for each branch group (could be Ring or Linear)
      const position = localIdx + 1; // Convert to 1-indexed position
      attachments[position] = branchGroups.map(
        (group) => buildNodeFromAtoms(group, allAtoms, ringBoundaries, true),
      );
    }
  });

  return Linear(atomValues, bonds, attachments);
};

/**
 * Build a single ring node with ringBoundaries context for nested attachments
 * @param {Object} ring - Ring boundary info
 * @param {Array} atoms - All atoms
 * @param {Array} ringBoundaries - All ring boundaries
 * @param {number} offset - Offset in fused ring system
 * @param {number} ringNumber - Ring number
 * @param {Set} fusedGroupPositions - Optional set of all positions in the fused group
 */
function buildSingleRingNodeWithContext(
  ring,
  atoms,
  ringBoundaries,
  offset = 0,
  ringNumber = 1,
  fusedGroupPositions = null,
) {
  const ringAtoms = ring.positions.map((pos) => atoms[pos]);

  // Determine base atom type (most common, prefer later atoms in tie)
  const atomCounts = new Map();
  ringAtoms.forEach((atom) => {
    atomCounts.set(atom.rawValue, (atomCounts.get(atom.rawValue) || 0) + 1);
  });

  let baseAtom = 'C';
  let maxCount = 0;
  atomCounts.forEach((count, atom) => {
    if (count >= maxCount) {
      maxCount = count;
      baseAtom = atom;
    }
  });

  // Calculate substitutions (atoms that differ from base)
  const substitutions = {};
  ringAtoms.forEach((atom, idx) => {
    if (atom.rawValue !== baseAtom) {
      substitutions[idx + 1] = atom.rawValue;
    }
  });

  // Extract bonds between ring atoms
  // Bonds array has size elements: bonds[i] is the bond BEFORE atom i (for i=1..size-1)
  // and bonds[size-1] is the ring closure bond (from last atom back to first)
  const bonds = [];
  for (let i = 1; i < ringAtoms.length; i += 1) {
    // Bond before atom i is stored on atom i
    const bond = ringAtoms[i].bond || null;
    bonds.push(bond);
  }
  // Ring closure bond: the bond on the first atom (if it came from a ring marker)
  // Actually, the ring closure bond is typically on the closing atom, but we need
  // to check if there's a bond associated with the ring closure
  // For now, use null for the ring closure bond (will be same as previous pattern)
  bonds.push(null);

  // Extract attachments from branches
  const attachments = {};

  // Build a set of atom positions that should be excluded from attachments
  // If we have fused group positions, use those (they include all rings in the fused group)
  // Otherwise fall back to same-depth ring positions for standalone rings
  let excludedPositions;
  if (fusedGroupPositions) {
    excludedPositions = fusedGroupPositions;
  } else {
    // Build a set of atom positions that are part of rings at the SAME branch depth
    // Only these should be excluded from attachments. Rings in deeper branches
    // are legitimate attachments and should be included (buildNodeFromAtoms handles them).
    // We need to get the ring's branch depth from the first atom
    const ringBranchDepth = ringAtoms[0]?.branchDepth ?? 0;
    excludedPositions = new Set();
    ringBoundaries.forEach((rb) => {
      if (rb.branchDepth === ringBranchDepth) {
        rb.positions.forEach((pos) => excludedPositions.add(pos));
      }
    });
  }

  ringAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;
    // Each ring atom can be at different branch depth due to ring closures in branches
    // Look for attachments one level deeper than THIS atom's depth
    const atomDepth = atom.branchDepth;

    // Find all atoms that branch from this ring atom (one depth deeper)
    // Only include atoms that start a new branch. An atom starts a new branch if:
    // 1. prevAtomIndex is null (first atom at this depth), OR
    // 2. prevAtomIndex points to an atom in a different branch (different branchId), OR
    // 3. (Standalone rings only) afterBranchClose is true AND prevAtomIndex is an
    //    excluded ring atom - this handles branch-crossing rings where the ring
    //    dives into nested branches and then continues at the original depth
    // Exclude atoms that are part of any ring's path in the fused group
    const branchAtoms = atoms.filter((a) => {
      if (a.parentIndex !== globalIdx) return false;
      if (a.branchDepth !== atomDepth + 1) return false;
      if (excludedPositions.has(a.index)) return false;

      // Check if this atom starts a new branch
      if (a.prevAtomIndex === null) return true;
      if (atoms[a.prevAtomIndex]?.branchId !== a.branchId) return true;

      // Special case for branch-crossing STANDALONE rings only (not fused rings):
      // If the previous atom at this depth is an excluded ring atom,
      // this atom starts an attachment chain (it follows the ring inline).
      // This handles both:
      // - Sequential continuation: ring closes and chain continues in same branch
      // - After branch close: a nested branch closed between prev and this atom
      // For fused rings, this is handled by the fused ring attachment logic.
      if (!fusedGroupPositions && excludedPositions.has(a.prevAtomIndex)) {
        return true;
      }

      return false;
    });

    // Note: Sequential continuation atoms (like "N1C" where C follows N after ring closure)
    // are NOT attachments - they're handled by including them in _allPositions and outputting
    // them inline in the codegen. Only true branch attachments (depth + 1) are added here.
    // Atoms that continue AFTER a branch closes (like "N(...)C") are also NOT attachments
    // in the ring sense - they're continuations of the main chain and should be handled
    // by buildAST as part of the main chain, output after the ring component.

    const allBranchAtoms = [...branchAtoms];

    if (allBranchAtoms.length > 0) {
      const branchGroups = [];
      const processed = new Set();

      allBranchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;

        const branchChain = collectBranchChain(branchAtom, atoms, processed);
        branchGroups.push({ chain: branchChain, branchId: branchAtom.branchId });
      });

      // Collect branchIds that the ring path traverses AFTER this position
      const ringPathBranchIdsAfter = new Set();
      for (let j = localIdx + 1; j < ringAtoms.length; j += 1) {
        if (ringAtoms[j].branchId !== null) {
          ringPathBranchIdsAfter.add(ringAtoms[j].branchId);
        }
      }

      // Check if the ring crosses branches (has varying branchDepths)
      // This is needed to determine if attachments are truly siblings
      const branchDepths = ringAtoms.map((a) => a.branchDepth);
      const firstDepth = branchDepths[0];
      const hasVaryingDepths = branchDepths.some((d) => d !== firstDepth);

      const position = localIdx + 1;
      attachments[position] = branchGroups.map(
        (group) => {
          const node = buildNodeFromAtoms(group.chain, atoms, ringBoundaries, true);
          // Mark as sibling only if:
          // 1. Ring has varying branchDepths (ring crosses branches)
          // 2. Attachment is in a different branch than the ring path continues in
          // For simple rings (all same depth), attachments are not siblings
          if (hasVaryingDepths) {
            node.metaIsSibling = !ringPathBranchIdsAfter.has(group.branchId);
          }

          return node;
        },
      );
    }
  });

  const ringNode = Ring({
    atoms: baseAtom,
    size: ringAtoms.length,
    ringNumber,
    offset,
    substitutions,
    attachments,
    bonds,
  });

  // Store the original positions for fused ring codegen
  // This is needed to properly reconstruct interleaved fused rings
  ringNode.metaPositions = ring.positions;
  ringNode.metaStart = ring.start;
  ringNode.metaEnd = ring.end;
  // Store branch depth for each position - needed for codegen to reconstruct branches
  ringNode.metaBranchDepths = ringAtoms.map((a) => a.branchDepth);
  ringNode.metaParentIndices = ringAtoms.map((a) => a.parentIndex);

  return ringNode;
}

/**
 * Build a ring or fused ring node from a group with context
 */
function buildRingGroupNodeWithContext(group, atoms, ringBoundaries) {
  // For single rings, check if there's a sequential continuation ring in a branch.
  // This handles the celecoxib pattern: C1CC(C1C2CCC2)C
  // where ring 2 opens inside a branch that contains ring 1's closure.
  if (group.length === 1) {
    const ring = group[0];
    const endAtom = atoms[ring.end];

    // Check if ring closes at a deeper branch level than where it opened
    const hasDeepSeqContinuation = endAtom
      && endAtom.branchDepth > ring.branchDepth
      && endAtom.branchId !== null;

    if (hasDeepSeqContinuation) {
      // Check if there's a ring that immediately follows this ring's close
      const nextAtom = atoms.find(
        (a) => a.prevAtomIndex === ring.end
          && a.branchDepth === endAtom.branchDepth
          && a.branchId === endAtom.branchId
          && !a.afterBranchClose,
      );

      if (nextAtom) {
        const nextRing = ringBoundaries.find(
          (rb) => rb.positions.includes(nextAtom.index) && rb.branchDepth === nextAtom.branchDepth,
        );

        if (nextRing && !group.some((g) => g.ringNumber === nextRing.ringNumber)) {
          // Found a sequential continuation ring - add it to the group and process together
          const expandedGroup = [...group, nextRing];
          // Recursively process the expanded group
          return buildRingGroupNodeWithContext(expandedGroup, atoms, ringBoundaries);
        }
      }
    }

    // Check for sequential continuation atoms at the SAME depth (not just deeper)
    // This handles patterns like C(C1CCCCC1C) where C follows ring closure in branch
    if (endAtom && endAtom.branchId !== null) {
      // Find atoms that follow the ring's end position in the same branch
      const seqAtoms = atoms.filter(
        (a) => a.prevAtomIndex === ring.end
          && a.branchDepth === endAtom.branchDepth
          && a.branchId === endAtom.branchId
          && !a.afterBranchClose,
      );

      if (seqAtoms.length > 0) {
        // Check if these atoms are already attachments to an earlier ring position
        // by checking if any atom's parentIndex points to a ring position before the end
        const firstSeqAtom = seqAtoms[0];
        const isAttachmentToEarlierPosition = ring.positions.some(
          (pos) => pos < ring.end && firstSeqAtom.parentIndex === pos,
        );

        // Skip sequential continuation if atoms are already attachments
        if (isAttachmentToEarlierPosition) {
          // These atoms will be handled as attachments in buildSingleRingNodeWithContext
          return buildSingleRingNodeWithContext(ring, atoms, ringBoundaries, 0, ring.ringNumber);
        }

        // Check if the first sequential atom is a ring or linear
        const nextRing = ringBoundaries.find(
          (rb) => rb.positions.includes(firstSeqAtom.index)
            && rb.branchDepth === firstSeqAtom.branchDepth,
        );

        if (nextRing) {
          // Sequential continuation with another ring - expand group
          const expandedGroup = [...group, nextRing];
          return buildRingGroupNodeWithContext(expandedGroup, atoms, ringBoundaries);
        }

        // Sequential continuation with linear atoms - need to include them
        // Build a Molecule containing the ring and the trailing atoms
        const ringNode = buildSingleRingNodeWithContext(
          ring,
          atoms,
          ringBoundaries,
          0,
          ring.ringNumber,
        );

        // Collect sequential linear atoms starting from firstSeqAtom
        const seqLinearAtoms = [firstSeqAtom];
        const { branchDepth, branchId } = firstSeqAtom;
        let nextA = findNextSeqAtom(atoms, firstSeqAtom.index, branchDepth, branchId);
        while (nextA) {
          seqLinearAtoms.push(nextA);
          nextA = findNextSeqAtom(atoms, nextA.index, branchDepth, branchId);
        }

        // Build a linear node for the sequential atoms
        const seqLinearNode = buildLinearNodeSimpleInternal(
          seqLinearAtoms,
          atoms,
          ringBoundaries,
          false,
        );

        // Return a Molecule combining ring and sequential linear
        return Molecule([ringNode, seqLinearNode]);
      }
    }

    // No sequential continuation - return a simple ring node
    return buildSingleRingNodeWithContext(ring, atoms, ringBoundaries, 0, ring.ringNumber);
  }

  // Sort rings by their start position to determine base ring
  // The ring that starts first (lowest start position) is the base ring
  const sortedGroup = [...group].sort((a, b) => a.start - b.start);
  const baseRing = sortedGroup[0];

  // CRITICAL FIX: Separate truly fused rings (share atoms) from sequential rings (don't share)
  // When the group was expanded via sequential ring detection (lines 555-559), it may contain
  // rings that don't actually share atoms. These should be treated as sequential rings.
  const trulyFusedRings = [baseRing];
  const sequentialRingsFromGroup = [];

  if (sortedGroup.length > 1) {
    for (let i = 1; i < sortedGroup.length; i += 1) {
      const ring = sortedGroup[i];
      // Check if this ring shares atoms with any of the truly fused rings
      const sharesAtoms = trulyFusedRings.some((fusedRing) => ringsShareAtoms(ring, fusedRing));
      if (sharesAtoms) {
        trulyFusedRings.push(ring);
      } else {
        sequentialRingsFromGroup.push(ring);
      }
    }
  }

  // Calculate the total atom span for this fused system (only truly fused rings)
  const allPositions = new Set();
  trulyFusedRings.forEach((ring) => {
    ring.positions.forEach((pos) => allPositions.add(pos));
  });

  // Also include sequential continuation atoms (atoms that follow ring-closing atoms
  // directly without a branch boundary). These should be output inline, not as attachments.
  // Follow the FULL chain of sequential atoms, not just the immediate next one.
  // BUT stop when we hit atoms that are part of a different ring.
  const allRingPositions = new Set(allPositions);

  // Build a map of position -> ring boundary for rings not in this fused group
  // We need to distinguish between:
  // - Sibling rings at the SAME branch depth (should be excluded from sequential continuation)
  // - Rings at DEEPER branch depths (these are attachments and should NOT be excluded)
  const otherRingsByPosition = new Map();
  ringBoundaries.forEach((rb) => {
    const isInGroup = group.some((g) => g.ringNumber === rb.ringNumber);
    if (!isInGroup) {
      rb.positions.forEach((pos) => otherRingsByPosition.set(pos, rb));
    }
  });

  // Track rings found during sequential continuation - they need to be in codegen output
  // Start with rings from the group that don't share atoms (detected above)
  const sequentialRings = [...sequentialRingsFromGroup];

  // Unified iterative loop to collect all atoms that should be output inline:
  // 1. Sequential continuations (atoms that follow a ring's end without afterBranchClose)
  // 2. AfterBranchClose atoms (atoms that continue after a nested branch closes)
  // 3. Rings encountered during traversal
  // Keep iterating until no new positions are added
  let addedNewPositions = true;
  while (addedNewPositions) {
    addedNewPositions = false;
    const currentPositions = [...allPositions];

    for (let pi = 0; pi < currentPositions.length; pi += 1) {
      const pos = currentPositions[pi];
      const posAtom = atoms[pos];
      if (posAtom.branchId !== null) {
        // Process branch atoms - find atoms that directly follow this position
        // OR atoms that continue after a nested branch closes (afterBranchClose)
        // Only exclude atoms that are part of SIBLING rings (same branch depth)
        // Rings at deeper branch depths are attachments and should be included
        for (let ai = 0; ai < atoms.length; ai += 1) {
          const a = atoms[ai];
          const matchesPrev = a.prevAtomIndex === pos;
          const matchesBranch = a.branchDepth === posAtom.branchDepth
            && a.branchId === posAtom.branchId;
          const notAlreadyIncluded = !allRingPositions.has(a.index) && !allPositions.has(a.index);
          // Include atoms even if afterBranchClose=true, as long as they're in the same branch
          // The afterBranchClose flag just means a nested sub-branch closed, not the main branch

          if (matchesPrev && matchesBranch && notAlreadyIncluded) {
            // Check if this atom is part of another ring
            const otherRing = otherRingsByPosition.get(a.index);
            if (otherRing) {
              // This atom is part of a ring not in our fused group
              // Only exclude if it's a SIBLING ring (same branch depth as fused group's base)
              // Rings at deeper depths are attachments and should be included
              const baseBranchDepth = group[0].branchDepth;
              if (otherRing.branchDepth !== baseBranchDepth) {
                // Ring at deeper depth - this is an attachment, include it
                // Add all atoms of this ring to allPositions
                for (let ri = 0; ri < otherRing.positions.length; ri += 1) {
                  const ringPos = otherRing.positions[ri];
                  if (!allPositions.has(ringPos)) {
                    allPositions.add(ringPos);
                    addedNewPositions = true;
                  }
                  // Add to allRingPositions so these atoms are treated as ring atoms
                  allRingPositions.add(ringPos);
                }
                // Track this ring for codegen if not already tracked
                if (!sequentialRings.includes(otherRing)) {
                  sequentialRings.push(otherRing);
                }
              }
              // Sibling ring at same depth - exclude (do nothing)
            } else {
              // Check if this atom is part of a ring at this depth (from our fused group)
              const atomRing = ringBoundaries.find(
                (rb) => rb.positions.includes(a.index) && rb.branchDepth === a.branchDepth,
              );
              if (atomRing) {
                // Add all atoms of this ring to allPositions AND allRingPositions
                // (allRingPositions is used later to exclude ring atoms from being attachments)
                for (let ri = 0; ri < atomRing.positions.length; ri += 1) {
                  const ringPos = atomRing.positions[ri];
                  if (!allPositions.has(ringPos)) {
                    allPositions.add(ringPos);
                    addedNewPositions = true;
                  }
                  // Also add to allRingPositions so these atoms won't become attachments
                  allRingPositions.add(ringPos);
                }
                // Track this ring for codegen if not already tracked
                if (!sequentialRings.includes(atomRing)) {
                  sequentialRings.push(atomRing);
                }
              } else {
                // Regular atom (not part of any ring)
                // Add it as sequential continuation - follows a ring atom and is in same branch
                allPositions.add(a.index);
                addedNewPositions = true;
              }
            }
          }
        }
      }
    }
  }

  const totalAtoms = allPositions.size;

  // Pass allRingPositions to exclude them from attachments - these atoms are part
  // of the fused ring structure and should not be treated as branch attachments
  // Use trulyFusedRings (not sortedGroup) to only include rings that share atoms
  const rings = trulyFusedRings.map((ring) => {
    const ringOffset = ring === baseRing ? 0 : calculateOffset(ring, baseRing);
    return buildSingleRingNodeWithContext(
      ring,
      atoms,
      ringBoundaries,
      ringOffset,
      ring.ringNumber,
      allRingPositions,
    );
  });

  // Build ring nodes for sequential continuation rings (not part of the fused group)
  const seqRingNodes = sequentialRings.map(
    (ring) => buildSingleRingNodeWithContext(
      ring,
      atoms,
      ringBoundaries,
      0,
      ring.ringNumber,
      allRingPositions,
    ),
  );

  // If we only have 1 truly fused ring but have sequential rings, we need to wrap it
  // in a FusedRing structure so the sequential ring metadata can be attached
  // Use createFusedRingNode directly to bypass the validation that requires 2+ rings
  if (rings.length === 1 && seqRingNodes.length > 0) {
    const fusedNode = createFusedRingNode([rings[0]]);
    fusedNode.metaTotalAtoms = totalAtoms;
    fusedNode.metaAllPositions = [...allPositions].sort((a, b) => a - b);
    fusedNode.metaSequentialRings = seqRingNodes;

    // Set up metadata...
    const branchDepthMap = new Map();
    const parentIndexMap = new Map();
    const atomValueMap = new Map();
    const bondMap = new Map();
    fusedNode.metaAllPositions.forEach((pos) => {
      branchDepthMap.set(pos, atoms[pos].branchDepth);
      parentIndexMap.set(pos, atoms[pos].parentIndex);
      atomValueMap.set(pos, atoms[pos].value);
      bondMap.set(pos, atoms[pos].bond);
    });
    fusedNode.metaBranchDepthMap = branchDepthMap;
    fusedNode.metaParentIndexMap = parentIndexMap;
    fusedNode.metaAtomValueMap = atomValueMap;
    fusedNode.metaBondMap = bondMap;

    // Also need to include sequential ring positions in allPositions
    seqRingNodes.forEach((seqRing) => {
      const seqPositions = seqRing.metaPositions || [];
      seqPositions.forEach((pos) => {
        if (!fusedNode.metaAllPositions.includes(pos)) {
          fusedNode.metaAllPositions.push(pos);
          branchDepthMap.set(pos, atoms[pos].branchDepth);
          parentIndexMap.set(pos, atoms[pos].parentIndex);
          atomValueMap.set(pos, atoms[pos].value);
          bondMap.set(pos, atoms[pos].bond);
        }
      });
    });
    fusedNode.metaAllPositions.sort((a, b) => a - b);

    return fusedNode;
  }

  // If we only have 1 truly fused ring and no sequential rings, return the single ring
  if (rings.length === 1) {
    return rings[0];
  }

  const fusedNode = FusedRing(rings);
  // Store total atoms and all positions for proper codegen
  fusedNode.metaTotalAtoms = totalAtoms;
  fusedNode.metaAllPositions = [...allPositions].sort((a, b) => a - b);
  // Store sequential continuation rings for codegen to output their markers
  fusedNode.metaSequentialRings = seqRingNodes;
  // Build position-to-branchDepth map, atom value map, and bond map for codegen
  // Use the atoms array to get branch depth, atom value, and bond info
  const branchDepthMap = new Map();
  const parentIndexMap = new Map();
  const atomValueMap = new Map();
  const bondMap = new Map();
  fusedNode.metaAllPositions.forEach((pos) => {
    branchDepthMap.set(pos, atoms[pos].branchDepth);
    parentIndexMap.set(pos, atoms[pos].parentIndex);
    atomValueMap.set(pos, atoms[pos].value);
    bondMap.set(pos, atoms[pos].bond);
  });
  fusedNode.metaBranchDepthMap = branchDepthMap;
  fusedNode.metaParentIndexMap = parentIndexMap;
  fusedNode.metaAtomValueMap = atomValueMap;
  fusedNode.metaBondMap = bondMap;

  // Store ring closure order for each position
  // The atoms[pos].rings array preserves the order of ring markers in the original SMILES
  // This is important for correctly outputting ring closures (e.g., C31 vs C13)
  const ringOrderMap = new Map();
  fusedNode.metaAllPositions.forEach((pos) => {
    if (atoms[pos].rings && atoms[pos].rings.length > 0) {
      ringOrderMap.set(pos, [...atoms[pos].rings]);
    }
  });
  fusedNode.metaRingOrderMap = ringOrderMap;

  // Build attachments for sequential continuation atoms (non-ring positions)
  // These are atoms that have branches attached at depth+1
  const ringPositionsForAttachments = new Set();
  [...rings, ...seqRingNodes].forEach((r) => {
    (r.metaPositions || []).forEach((pos) => ringPositionsForAttachments.add(pos));
  });

  const seqAtomAttachments = new Map(); // position -> array of attachment nodes
  fusedNode.metaAllPositions.forEach((pos) => {
    if (ringPositionsForAttachments.has(pos)) return; // Ring attachments are handled separately

    const posAtom = atoms[pos];
    const atomDepth = posAtom.branchDepth;

    // Find atoms that branch from this position (one depth deeper)
    const branchAtoms = atoms.filter(
      (a) => a.parentIndex === pos
        && a.branchDepth === atomDepth + 1
        && (a.prevAtomIndex === null || atoms[a.prevAtomIndex]?.branchId !== a.branchId),
    );

    if (branchAtoms.length > 0) {
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;
        const branchChain = collectBranchChain(branchAtom, atoms, processed);
        branchGroups.push(branchChain);
      });

      seqAtomAttachments.set(
        pos,
        branchGroups.map((grp) => buildNodeFromAtoms(grp, atoms, ringBoundaries, true)),
      );
    }
  });
  fusedNode.metaSeqAtomAttachments = seqAtomAttachments;

  return fusedNode;
}

/**
 * Build a branch that contains rings
 */
buildBranchWithRingsInternal = function buildBranchWithRings(atoms, all, rings, bounds, branch) {
  const atomList = atoms;
  const allAtoms = all;
  const containedRings = rings;
  const ringBoundaries = bounds;
  const isBranch = branch;
  // Group fused rings
  const fusedGroups = groupFusedRings(containedRings);

  // Build a set of ALL ring positions across all groups
  // Used to prevent adding atoms from other rings as sequential continuations
  const globalRingPositions = new Set();
  containedRings.forEach((ring) => {
    ring.positions.forEach((pos) => globalRingPositions.add(pos));
  });

  // Map atom index to its ring group
  // Include sequential continuation atoms (atoms that follow ring closures inline)
  const atomToGroup = new Map();
  fusedGroups.forEach((group, groupIdx) => {
    const allPositions = new Set();
    group.forEach((ring) => {
      ring.positions.forEach((pos) => allPositions.add(pos));
    });

    // Also include sequential continuation atoms that follow ring-closing atoms
    // These atoms will be output inline with the fused ring, not as separate linear chains
    // NOTE: We don't add atoms from OTHER rings here - sequential rings are handled
    // separately in the main loop by processing each group
    group.forEach((ring) => {
      const endPos = ring.end;
      const endAtom = allAtoms[endPos];
      if (endAtom && endAtom.branchId !== null) {
        allAtoms.forEach((a) => {
          if (a.prevAtomIndex === endPos
              && a.branchDepth === endAtom.branchDepth
              && a.branchId === endAtom.branchId
              && !a.afterBranchClose
              && !globalRingPositions.has(a.index)) { // Exclude atoms from OTHER rings
            allPositions.add(a.index);
          }
        });
      }
    });

    allPositions.forEach((pos) => {
      atomToGroup.set(pos, groupIdx);
    });
  });

  // Find atoms in the branch that are NOT in any ring (leading/trailing linear parts)
  const baseDepth = atomList[0].branchDepth;
  const sameDepthAtoms = atomList.filter((a) => a.branchDepth === baseDepth);

  const components = [];
  const processedGroups = new Set();
  let currentLinear = [];

  for (let i = 0; i < sameDepthAtoms.length; i += 1) {
    const atom = sameDepthAtoms[i];
    const globalIdx = atom.index;

    if (atomToGroup.has(globalIdx)) {
      // Flush pending linear chain
      if (currentLinear.length > 0) {
        const brch = isBranch && components.length === 0;
        const lin = buildLinearNodeSimpleInternal(currentLinear, allAtoms, ringBoundaries, brch);
        const linearNode = lin;
        components.push(linearNode);
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);
      if (!processedGroups.has(groupIdx)) {
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNodeWithContext(group, allAtoms, ringBoundaries);
        components.push(ringNode);
        processedGroups.add(groupIdx);

        // CRITICAL FIX: Mark ALL ring numbers in this built node as processed
        // When buildRingGroupNodeWithContext expands the group (e.g., [1] -> [1,2]),
        // it builds a fused ring containing multiple rings. We need to mark ALL those
        // rings' groups as processed so they don't get built again as separate components.
        const allRingsInNode = ringNode.rings || [ringNode];
        allRingsInNode.forEach((r) => {
          const ringNum = r.ringNumber;
          fusedGroups.forEach((grp, grpIdx) => {
            if (grp.some((gr) => gr.ringNumber === ringNum)) {
              processedGroups.add(grpIdx);
            }
          });
        });

        // Update atomToGroup with all positions from the built ring node
        // This includes sequential continuation atoms that were discovered during ring building
        const ringAllPositions = ringNode.metaAllPositions || new Set();
        ringAllPositions.forEach((pos) => {
          if (!atomToGroup.has(pos)) {
            atomToGroup.set(pos, groupIdx);
          }
        });

        // CRITICAL FIX: Mark sequential rings as processed to prevent duplication
        // When buildRingGroupNodeWithContext discovers sequential continuation rings,
        // they are included in the fused ring's metaSequentialRings. We need to mark
        // ALL atoms from these sequential rings as belonging to this group so they
        // don't get processed again as separate components.
        const seqRings = ringNode.metaSequentialRings || [];
        seqRings.forEach((seqRingNode) => {
          const seqPositions = seqRingNode.metaPositions || [];
          seqPositions.forEach((pos) => {
            atomToGroup.set(pos, groupIdx);
          });
          // Also mark the ring's group as processed to prevent it from being built again
          // Find which group index contains this sequential ring and mark it as processed
          const seqRingNumber = seqRingNode.ringNumber;
          fusedGroups.forEach((grp, grpIdx) => {
            if (grp.some((r) => r.ringNumber === seqRingNumber)) {
              processedGroups.add(grpIdx);
            }
          });
        });
      }

      // Skip remaining atoms in this SAME ring group (not other groups)
      while (i + 1 < sameDepthAtoms.length
             && atomToGroup.get(sameDepthAtoms[i + 1].index) === groupIdx) {
        i += 1;
      }
    } else {
      currentLinear.push(atom);
    }
  }

  // Flush remaining linear
  if (currentLinear.length > 0) {
    const lb = isBranch && components.length === 0;
    components.push(buildLinearNodeSimpleInternal(currentLinear, allAtoms, ringBoundaries, lb));
  }

  // Return appropriate node
  if (components.length === 0) {
    return Linear([], [], {});
  }
  if (components.length === 1) {
    return components[0];
  }
  return Molecule(components);
};

/**
 * Pass 2: Build hierarchical AST
 * Groups atoms into rings and linear chains
 */
function buildAST(atoms, ringBoundaries) {
  if (atoms.length === 0) {
    return Molecule([]);
  }

  // Start with main chain rings (depth 0), but also include rings at deeper depths
  // if they share atoms with the main chain rings. This handles cases like oxycodone
  // where a ring (ring 5) spans from depth 1 into depth 2-3 but shares atoms (13,14,15)
  // with depth-0 rings (rings 3 and 4).
  const mainChainRings = ringBoundaries.filter((r) => r.branchDepth === 0);

  // Collect all atom positions covered by main chain rings
  const mainChainPositions = new Set();
  mainChainRings.forEach((r) => {
    r.positions.forEach((pos) => mainChainPositions.add(pos));
  });

  // Find rings at other depths that share atoms with main chain rings
  // These are "bridge rings" that connect different depths
  const bridgeRings = ringBoundaries.filter((r) => {
    if (r.branchDepth === 0) return false; // Already in mainChainRings
    // Check if this ring shares any atoms with main chain positions
    return r.positions.some((pos) => mainChainPositions.has(pos));
  });

  // Combine main chain rings with bridge rings for grouping
  const ringsToGroup = [...mainChainRings, ...bridgeRings];

  // Group fused rings (rings that share atoms)
  const fusedGroups = groupFusedRings(ringsToGroup);

  // Map each atom index to its group (if in a ring)
  const atomToGroup = new Map();
  fusedGroups.forEach((group, groupIdx) => {
    const allPositions = new Set();
    group.forEach((ring) => {
      ring.positions.forEach((pos) => allPositions.add(pos));
    });
    allPositions.forEach((pos) => {
      atomToGroup.set(pos, groupIdx);
    });
  });

  // Build components
  const components = [];
  const processedGroups = new Set();
  let currentLinear = [];

  // Track component position ranges for inter-component connection detection
  // Each entry: { componentIndex, positions: Set of atom indices }
  const componentPositions = [];

  // Filter out atoms that are branches (will be attached to parents)
  const mainChainAtoms = atoms.filter((atom) => atom.branchDepth === 0);

  for (let i = 0; i < mainChainAtoms.length; i += 1) {
    const atom = mainChainAtoms[i];
    const globalIdx = atom.index;

    // Check if this atom is part of a ring group
    if (atomToGroup.has(globalIdx)) {
      // Flush any pending linear chain
      if (currentLinear.length > 0) {
        const linNode = buildLinearNodeSimpleInternal(currentLinear, atoms, ringBoundaries, false);
        const linearNode = linNode;
        const linearPositions = new Set(currentLinear.map((a) => a.index));
        componentPositions.push({ componentIndex: components.length, positions: linearPositions });
        components.push(linearNode);
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);

      if (!processedGroups.has(groupIdx)) {
        // Build ring/fused ring node for this group
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNodeWithContext(group, atoms, ringBoundaries);

        // Collect all positions in this ring group
        const groupPositions = new Set();
        group.forEach((ring) => {
          ring.positions.forEach((pos) => groupPositions.add(pos));
        });

        // Store leading bond (the bond on the first atom of this ring component)
        // This is the bond connecting this component to the previous component
        const firstAtomOfGroup = atom; // This is the first atom we encounter for this group
        if (firstAtomOfGroup.bond && components.length > 0) {
          ringNode.metaLeadingBond = firstAtomOfGroup.bond;
        }

        // Check if this ring connects to a previous component
        // Look at the first atom's prevAtomIndex - if it points to a position
        // in a previous component, store the connection info
        const firstRingAtomIdx = Math.min(...groupPositions);
        const firstRingAtom = atoms[firstRingAtomIdx];
        if (firstRingAtom && firstRingAtom.prevAtomIndex !== null) {
          const prevIdx = firstRingAtom.prevAtomIndex;
          // Find which previous component contains this prevAtomIndex
          for (let ci = componentPositions.length - 1; ci >= 0; ci -= 1) {
            const compInfo = componentPositions[ci];
            if (compInfo.positions.has(prevIdx)) {
              // Found the component this ring connects to
              ringNode.metaConnectsToComponent = compInfo.componentIndex;
              ringNode.metaConnectsAtPosition = prevIdx;
              break;
            }
          }
        }

        componentPositions.push({ componentIndex: components.length, positions: groupPositions });
        components.push(ringNode);
        processedGroups.add(groupIdx);
      }

      // Skip to end of this group in main chain
      const group = fusedGroups[groupIdx];
      const maxPos = Math.max(...group.flatMap((r) => r.positions));
      while (i + 1 < mainChainAtoms.length && mainChainAtoms[i + 1].index <= maxPos) {
        i += 1;
      }
    } else {
      // Atom not in a ring - add to linear chain
      currentLinear.push(atom);
    }
  }

  // Flush remaining linear chain
  if (currentLinear.length > 0) {
    components.push(buildLinearNodeSimpleInternal(currentLinear, atoms, ringBoundaries, false));
  }

  // Return appropriate node type
  if (components.length === 0) {
    return Molecule([]);
  }
  if (components.length === 1) {
    return components[0];
  }
  return Molecule(components);
}

/**
 * Pass 1: Linear scan with ring and branch tracking
 * Builds a flat list of atoms with metadata about rings and branches
 */
export function buildAtomList(tokens) {
  const atoms = [];
  // Track open rings: ringNumber -> startIndex
  const ringStacks = new Map();
  // Final ring boundaries: { ringNumber, start, end, positions }
  const ringBoundaries = [];
  // Track closed rings for interleaved fused ring handling
  const closedRings = [];
  // Stack of branch points: { parentIndex, depth, branchId }
  const branchStack = [];
  // Branch info: { parentIndex, tokens, depth }
  const branches = [];
  // Track last atom index at each depth level
  const lastAtomAtDepth = new Map(); // depth -> atomIndex

  let currentAtomIndex = -1;
  let currentBond = null;
  let i = 0;
  // Track if a branch closed since the last atom at each depth (for sequential detection)
  const branchClosedSinceLastAtom = new Map(); // depth -> boolean

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === TokenType.ATOM) {
      currentAtomIndex += 1;

      const parentIndex = branchStack.length > 0
        ? branchStack[branchStack.length - 1].parentIndex
        : null;

      const branchId = branchStack.length > 0
        ? branchStack[branchStack.length - 1].branchId
        : null;

      // Track the previous atom at this depth for sequential bonding
      const prevAtomAtDepth = lastAtomAtDepth.get(branchStack.length);

      // Check if a branch closed between the previous atom at this depth and now
      const hadBranchClose = branchClosedSinceLastAtom.get(branchStack.length) || false;

      const atom = {
        index: currentAtomIndex,
        value: token.atom,
        rawValue: token.value,
        bond: currentBond,
        rings: [], // Ring numbers this atom participates in
        branchDepth: branchStack.length,
        parentIndex,
        branchId, // Unique ID of the branch this atom belongs to
        // Previous atom in sequence at same depth (for finding attachments after ring closures)
        prevAtomIndex: prevAtomAtDepth !== undefined ? prevAtomAtDepth : null,
        // Whether a branch closed between previous atom at this depth and this atom
        // Used to distinguish "N1C" (immediate) from "C(...)C" (after branch close)
        afterBranchClose: hadBranchClose,
      };

      atoms.push(atom);

      // Track last atom at this depth level
      lastAtomAtDepth.set(branchStack.length, currentAtomIndex);
      // Reset branch close flag for this depth
      branchClosedSinceLastAtom.set(branchStack.length, false);

      currentBond = null;
    } else if (token.type === TokenType.BOND) {
      currentBond = token.value;
    } else if (token.type === TokenType.RING_MARKER) {
      const { ringNumber } = token;

      if (ringStacks.has(ringNumber)) {
        // Close ring - build the full ring atom sequence
        const ringData = ringStacks.get(ringNumber);
        const { startIndex, branchDepth: ringBranchDepth, branchId: ringBranchId } = ringData;

        // For interleaved fused rings, we need to calculate the proper path.
        // When a ring opens INSIDE another ring, it creates a "shortcut" - the outer ring
        // path jumps from the inner ring's opening position to its closing position.
        const ringPositions = collectRingPath(
          startIndex,
          currentAtomIndex,
          atoms,
          ringBranchDepth,
          ringBranchId,
          closedRings,
        );

        // Record this ring as closed
        closedRings.push({
          ringNumber,
          start: startIndex,
          end: currentAtomIndex,
        });

        ringBoundaries.push({
          ringNumber,
          start: startIndex,
          end: currentAtomIndex,
          positions: ringPositions,
          branchDepth: ringBranchDepth,
          branchId: ringBranchId,
        });

        // Mark atoms as part of this ring
        ringPositions.forEach((pos) => {
          atoms[pos].rings.push(ringNumber);
        });

        ringStacks.delete(ringNumber);
      } else {
        // Open ring - record current depth and branch context
        const currentDepth = branchStack.length;
        const stackTop = branchStack[branchStack.length - 1];
        const currentBranchId = branchStack.length > 0 ? stackTop.branchId : null;

        ringStacks.set(ringNumber, {
          startIndex: currentAtomIndex,
          branchDepth: currentDepth,
          branchId: currentBranchId,
        });
        atoms[currentAtomIndex].rings.push(ringNumber);
      }
    } else if (token.type === TokenType.BRANCH_OPEN) {
      // Start new branch - assign unique branch ID
      // Parent is the last atom at the CURRENT depth level
      const currentDepth = branchStack.length;
      const parentIdx = lastAtomAtDepth.get(currentDepth);

      branchStack.push({
        parentIndex: parentIdx !== undefined ? parentIdx : -1,
        depth: currentDepth,
        branchId: i, // Use token position as unique ID
      });

      // Clear lastAtomAtDepth for the new depth level
      // This ensures atoms in this branch don't link to atoms from previous branches
      lastAtomAtDepth.delete(currentDepth + 1);
    } else if (token.type === TokenType.BRANCH_CLOSE) {
      // End current branch
      branchStack.pop();
      // Mark that a branch closed at the new current depth
      // This helps distinguish "N1C" from "C(...)C"
      branchClosedSinceLastAtom.set(branchStack.length, true);
    }
    // DOT and unknown tokens - just skip

    i += 1;
  }

  // Check for unclosed rings
  if (ringStacks.size > 0) {
    const unclosed = Array.from(ringStacks.keys()).join(', ');
    throw new Error(`Unclosed rings: ${unclosed}`);
  }

  return { atoms, ringBoundaries, branches };
}

/**
 * Parse a SMILES string into an AST
 * @param {string} smiles - SMILES string to parse
 * @returns {Object} AST node (Ring, Linear, FusedRing, or Molecule)
 */
export function parse(smiles) {
  const tokens = tokenize(smiles);

  // Pass 1: Build linear atom list with ring tracking
  const { atoms, ringBoundaries } = buildAtomList(tokens);

  // Pass 2: Build hierarchical AST from atoms and ring info
  const ast = buildAST(atoms, ringBoundaries);

  return ast;
}
