/**
 * Ring group builder - constructs Ring and FusedRing nodes from parsed ring boundaries
 *
 * buildRingGroupNodeWithContext: Builds a ring group (single, fused, or sequential) from
 *   ring boundary data and atom metadata. Handles fused ring detection, sequential
 *   continuation, and metadata assignment.
 *
 * buildSingleRingNodeWithContext: Builds a single Ring node with correct substitutions,
 *   bonds, attachments, and metadata.
 */

import {
  Ring,
  FusedRing,
  Molecule,
  createFusedRingNode,
} from '../constructors.js';
import {
  ringsShareAtoms,
  calculateOffset,
} from './ring-utils.js';
import {
  findNextSeqAtom,
  collectBranchChain,
} from './branch-utils.js';

/**
 * Build a single ring node with ringBoundaries context for nested attachments
 * @param {Object} ring - Ring boundary info
 * @param {Array} atoms - All atoms
 * @param {Array} ringBoundaries - All ring boundaries
 * @param {number} offset - Offset in fused ring system
 * @param {number} ringNumber - Ring number
 * @param {Set} fusedGroupPositions - Optional set of all positions in the fused group
 * @param {Function} buildNodeFromAtomsFn - Callback to build nodes from atom lists
 */
export function buildSingleRingNodeWithContext(
  ring,
  atoms,
  ringBoundaries,
  offset = 0,
  ringNumber = 1,
  fusedGroupPositions = null,
  buildNodeFromAtomsFn = null,
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
  const bonds = [];
  for (let i = 1; i < ringAtoms.length; i += 1) {
    const bond = ringAtoms[i].bond || null;
    bonds.push(bond);
  }
  bonds.push(null);

  // Extract attachments from branches
  const attachments = {};

  // Build a set of atom positions that should be excluded from attachments
  let excludedPositions;
  if (fusedGroupPositions) {
    excludedPositions = fusedGroupPositions;
  } else {
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
    const atomDepth = atom.branchDepth;

    const branchAtoms = atoms.filter((a) => {
      if (a.parentIndex !== globalIdx) return false;
      if (a.branchDepth !== atomDepth + 1) return false;
      if (excludedPositions.has(a.index)) return false;

      if (a.prevAtomIndex === null) return true;
      if (atoms[a.prevAtomIndex]?.branchId !== a.branchId) return true;

      if (!fusedGroupPositions && excludedPositions.has(a.prevAtomIndex)) {
        return true;
      }

      return false;
    });

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

      const branchDepths = ringAtoms.map((a) => a.branchDepth);
      const firstDepth = branchDepths[0];
      const hasVaryingDepths = branchDepths.some((d) => d !== firstDepth);

      const position = localIdx + 1;
      attachments[position] = branchGroups.map(
        (group) => {
          const node = buildNodeFromAtomsFn(group.chain, atoms, ringBoundaries, true);
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
  ringNode.metaPositions = ring.positions;
  ringNode.metaStart = ring.start;
  ringNode.metaEnd = ring.end;
  ringNode.metaBranchDepths = ringAtoms.map((a) => a.branchDepth);
  ringNode.metaParentIndices = ringAtoms.map((a) => a.parentIndex);

  // Store leading bond if the first ring atom has a bond
  const firstRingAtom = ringAtoms[0];
  if (firstRingAtom && firstRingAtom.bond) {
    ringNode.metaLeadingBond = firstRingAtom.bond;
  }

  return ringNode;
}

/**
 * Separate truly fused rings (share atoms) from sequential rings (don't share)
 * @param {Array} sortedGroup - Rings sorted by start position
 * @returns {{ trulyFusedRings: Array, sequentialRingsFromGroup: Array }}
 */
function separateFusedFromSequential(sortedGroup) {
  const baseRing = sortedGroup[0];
  const trulyFusedRings = [baseRing];
  const sequentialRingsFromGroup = [];

  if (sortedGroup.length > 1) {
    for (let i = 1; i < sortedGroup.length; i += 1) {
      const ring = sortedGroup[i];
      const sharesAtoms = trulyFusedRings.some((fusedRing) => ringsShareAtoms(ring, fusedRing));
      if (sharesAtoms) {
        trulyFusedRings.push(ring);
      } else {
        sequentialRingsFromGroup.push(ring);
      }
    }
  }

  return { trulyFusedRings, sequentialRingsFromGroup };
}

/**
 * Collect all atom positions that should be output inline (ring + sequential + continuation)
 * Walks branches to find sequential rings and continuation atoms beyond the fused ring core.
 * @returns {{ allPositions: Set, allRingPositions: Set, sequentialRings: Array }}
 */
function collectAllPositions(
  trulyFusedRings,
  sequentialRingsFromGroup,
  group,
  atoms,
  ringBoundaries,
) {
  const allPositions = new Set();
  trulyFusedRings.forEach((ring) => {
    ring.positions.forEach((pos) => allPositions.add(pos));
  });

  const allRingPositions = new Set(allPositions);

  const otherRingsByPosition = new Map();
  ringBoundaries.forEach((rb) => {
    const isInGroup = group.some((g) => g.ringNumber === rb.ringNumber);
    if (!isInGroup) {
      rb.positions.forEach((pos) => otherRingsByPosition.set(pos, rb));
    }
  });

  const sequentialRings = [...sequentialRingsFromGroup];

  let addedNewPositions = true;
  while (addedNewPositions) {
    addedNewPositions = false;
    const currentPositions = [...allPositions];

    for (let pi = 0; pi < currentPositions.length; pi += 1) {
      const pos = currentPositions[pi];
      const posAtom = atoms[pos];
      if (posAtom.branchId !== null) {
        for (let ai = 0; ai < atoms.length; ai += 1) {
          const a = atoms[ai];
          const matchesPrev = a.prevAtomIndex === pos;
          const matchesBranch = a.branchDepth === posAtom.branchDepth
            && a.branchId === posAtom.branchId;
          const notAlreadyIncluded = !allRingPositions.has(a.index) && !allPositions.has(a.index);

          if (matchesPrev && matchesBranch && notAlreadyIncluded) {
            const otherRing = otherRingsByPosition.get(a.index);
            if (otherRing) {
              const baseBranchDepth = group[0].branchDepth;
              if (otherRing.branchDepth !== baseBranchDepth) {
                for (let ri = 0; ri < otherRing.positions.length; ri += 1) {
                  const ringPos = otherRing.positions[ri];
                  if (!allPositions.has(ringPos)) {
                    allPositions.add(ringPos);
                    addedNewPositions = true;
                  }
                  allRingPositions.add(ringPos);
                }
                if (!sequentialRings.includes(otherRing)) {
                  sequentialRings.push(otherRing);
                }
              }
            } else {
              const atomRing = ringBoundaries.find(
                (rb) => rb.positions.includes(a.index) && rb.branchDepth === a.branchDepth,
              );
              if (atomRing) {
                for (let ri = 0; ri < atomRing.positions.length; ri += 1) {
                  const ringPos = atomRing.positions[ri];
                  if (!allPositions.has(ringPos)) {
                    allPositions.add(ringPos);
                    addedNewPositions = true;
                  }
                  allRingPositions.add(ringPos);
                }
                if (!sequentialRings.includes(atomRing)) {
                  sequentialRings.push(atomRing);
                }
              } else {
                allPositions.add(a.index);
                addedNewPositions = true;
              }
            }
          }
        }
      }
    }
  }

  return { allPositions, allRingPositions, sequentialRings };
}

/**
 * Build branchDepth, parentIndex, atomValue, and bond maps from positions
 * @param {Array} positions - Sorted array of atom positions
 * @param {Array} atoms - All atoms
 * @returns {{ branchDepthMap, parentIndexMap, atomValueMap, bondMap }}
 */
function buildMetadataMaps(positions, atoms) {
  const branchDepthMap = new Map();
  const parentIndexMap = new Map();
  const atomValueMap = new Map();
  const bondMap = new Map();
  positions.forEach((pos) => {
    branchDepthMap.set(pos, atoms[pos].branchDepth);
    parentIndexMap.set(pos, atoms[pos].parentIndex);
    atomValueMap.set(pos, atoms[pos].rawValue);
    bondMap.set(pos, atoms[pos].bond);
  });
  return {
    branchDepthMap, parentIndexMap, atomValueMap, bondMap,
  };
}

/**
 * Build attachments map for sequential continuation atoms (non-ring positions)
 */
function buildSeqAtomAttachments(
  fusedNode,
  rings,
  seqRingNodes,
  atoms,
  ringBoundaries,
  buildNodeFromAtomsFn,
) {
  const ringPositionsForAttachments = new Set();
  [...rings, ...seqRingNodes].forEach((r) => {
    (r.metaPositions || []).forEach((pos) => ringPositionsForAttachments.add(pos));
  });

  const seqAtomAttachments = new Map();
  fusedNode.metaAllPositions.forEach((pos) => {
    if (ringPositionsForAttachments.has(pos)) return;

    const posAtom = atoms[pos];
    const atomDepth = posAtom.branchDepth;

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
        branchGroups.map((grp) => buildNodeFromAtomsFn(grp, atoms, ringBoundaries, true)),
      );
    }
  });

  return seqAtomAttachments;
}

/**
 * Assemble a FusedRing node with all metadata from ring nodes and position data
 */
function assembleFusedRingNode(
  rings,
  seqRingNodes,
  allPositions,
  totalAtoms,
  atoms,
  ringBoundaries,
  buildNodeFromAtomsFn,
) {
  // If we only have 1 truly fused ring but have sequential rings, wrap in FusedRing
  if (rings.length === 1 && seqRingNodes.length > 0) {
    const fusedNode = createFusedRingNode([rings[0]]);
    fusedNode.metaUseInterleavedCodegen = true;
    fusedNode.metaTotalAtoms = totalAtoms;
    fusedNode.metaAllPositions = [...allPositions].sort((a, b) => a - b);
    fusedNode.metaSequentialRings = seqRingNodes;

    const maps = buildMetadataMaps(fusedNode.metaAllPositions, atoms);
    fusedNode.metaBranchDepthMap = maps.branchDepthMap;
    fusedNode.metaParentIndexMap = maps.parentIndexMap;
    fusedNode.metaAtomValueMap = maps.atomValueMap;
    fusedNode.metaBondMap = maps.bondMap;

    // Include sequential ring positions
    seqRingNodes.forEach((seqRing) => {
      const seqPositions = seqRing.metaPositions || [];
      seqPositions.forEach((pos) => {
        if (!fusedNode.metaAllPositions.includes(pos)) {
          fusedNode.metaAllPositions.push(pos);
          maps.branchDepthMap.set(pos, atoms[pos].branchDepth);
          maps.parentIndexMap.set(pos, atoms[pos].parentIndex);
          maps.atomValueMap.set(pos, atoms[pos].rawValue);
          maps.bondMap.set(pos, atoms[pos].bond);
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

  // Multi-ring fused node
  const fusedNode = FusedRing(rings);
  fusedNode.metaUseInterleavedCodegen = true;
  fusedNode.metaTotalAtoms = totalAtoms;
  fusedNode.metaAllPositions = [...allPositions].sort((a, b) => a - b);
  fusedNode.metaSequentialRings = seqRingNodes;

  const maps = buildMetadataMaps(fusedNode.metaAllPositions, atoms);
  fusedNode.metaBranchDepthMap = maps.branchDepthMap;
  fusedNode.metaParentIndexMap = maps.parentIndexMap;
  fusedNode.metaAtomValueMap = maps.atomValueMap;
  fusedNode.metaBondMap = maps.bondMap;

  // Ring order map — tracks which ring markers appear at each position
  const ringOrderMap = new Map();
  fusedNode.metaAllPositions.forEach((pos) => {
    if (atoms[pos].rings && atoms[pos].rings.length > 0) {
      ringOrderMap.set(pos, [...atoms[pos].rings]);
    }
  });
  fusedNode.metaRingOrderMap = ringOrderMap;

  fusedNode.metaSeqAtomAttachments = buildSeqAtomAttachments(
    fusedNode,
    rings,
    seqRingNodes,
    atoms,
    ringBoundaries,
    buildNodeFromAtomsFn,
  );

  return fusedNode;
}

/**
 * Handle single-ring groups: detect sequential continuation rings/atoms
 * Returns a node if single-ring handling applies, or null to fall through to multi-ring logic
 */
function handleSingleRingGroup(
  group,
  atoms,
  ringBoundaries,
  buildNodeFromAtomsFn,
  buildLinearNodeSimpleFn,
) {
  const ring = group[0];
  const endAtom = atoms[ring.end];

  // Check if ring closes at a deeper branch level than where it opened
  const hasDeepSeqContinuation = endAtom
    && endAtom.branchDepth > ring.branchDepth
    && endAtom.branchId !== null;

  if (hasDeepSeqContinuation) {
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
        const expandedGroup = [...group, nextRing];
        // eslint-disable-next-line no-use-before-define
        return buildRingGroupNodeWithContext(
          expandedGroup,
          atoms,
          ringBoundaries,
          buildNodeFromAtomsFn,
          buildLinearNodeSimpleFn,
        );
      }
    }
  }

  // Check for sequential continuation atoms at the SAME depth
  if (endAtom && endAtom.branchId !== null) {
    const seqAtoms = atoms.filter(
      (a) => a.prevAtomIndex === ring.end
        && a.branchDepth === endAtom.branchDepth
        && a.branchId === endAtom.branchId
        && !a.afterBranchClose,
    );

    if (seqAtoms.length > 0) {
      const firstSeqAtom = seqAtoms[0];
      const isAttachmentToEarlierPosition = ring.positions.some(
        (pos) => pos < ring.end && firstSeqAtom.parentIndex === pos,
      );

      if (isAttachmentToEarlierPosition) {
        return buildSingleRingNodeWithContext(
          ring,
          atoms,
          ringBoundaries,
          0,
          ring.ringNumber,
          null,
          buildNodeFromAtomsFn,
        );
      }

      const nextRing = ringBoundaries.find(
        (rb) => rb.positions.includes(firstSeqAtom.index)
          && rb.branchDepth === firstSeqAtom.branchDepth,
      );

      if (nextRing) {
        const expandedGroup = [...group, nextRing];
        // eslint-disable-next-line no-use-before-define
        return buildRingGroupNodeWithContext(
          expandedGroup,
          atoms,
          ringBoundaries,
          buildNodeFromAtomsFn,
          buildLinearNodeSimpleFn,
        );
      }

      // Sequential continuation with linear atoms
      const ringNode = buildSingleRingNodeWithContext(
        ring,
        atoms,
        ringBoundaries,
        0,
        ring.ringNumber,
        null,
        buildNodeFromAtomsFn,
      );

      const seqLinearAtoms = [firstSeqAtom];
      const { branchDepth, branchId } = firstSeqAtom;
      let nextA = findNextSeqAtom(atoms, firstSeqAtom.index, branchDepth, branchId);
      while (nextA) {
        seqLinearAtoms.push(nextA);
        nextA = findNextSeqAtom(atoms, nextA.index, branchDepth, branchId);
      }

      const seqLinearNode = buildLinearNodeSimpleFn(
        seqLinearAtoms,
        atoms,
        ringBoundaries,
        false,
      );

      if (firstSeqAtom.bond) {
        seqLinearNode.metaLeadingBond = firstSeqAtom.bond;
      }

      return Molecule([ringNode, seqLinearNode]);
    }
  }

  // No sequential continuation - return a simple ring node
  return buildSingleRingNodeWithContext(
    ring,
    atoms,
    ringBoundaries,
    0,
    ring.ringNumber,
    null,
    buildNodeFromAtomsFn,
  );
}

/**
 * Build a ring or fused ring node from a group with context
 * @param {Array} group - Array of ring boundary objects
 * @param {Array} atoms - All atoms
 * @param {Array} ringBoundaries - All ring boundaries
 * @param {Function} buildNodeFromAtomsFn - Callback
 * @param {Function} buildLinearNodeSimpleFn - Callback
 */
export function buildRingGroupNodeWithContext(
  group,
  atoms,
  ringBoundaries,
  buildNodeFromAtomsFn,
  buildLinearNodeSimpleFn,
) {
  // Single-ring groups have special handling for sequential continuations
  if (group.length === 1) {
    return handleSingleRingGroup(
      group,
      atoms,
      ringBoundaries,
      buildNodeFromAtomsFn,
      buildLinearNodeSimpleFn,
    );
  }

  const sortedGroup = [...group].sort((a, b) => a.start - b.start);
  const baseRing = sortedGroup[0];

  const {
    trulyFusedRings, sequentialRingsFromGroup,
  } = separateFusedFromSequential(sortedGroup);

  const {
    allPositions, allRingPositions, sequentialRings,
  } = collectAllPositions(
    trulyFusedRings,
    sequentialRingsFromGroup,
    group,
    atoms,
    ringBoundaries,
  );

  const totalAtoms = allPositions.size;

  const rings = trulyFusedRings.map((ring) => {
    const ringOffset = ring === baseRing
      ? 0 : calculateOffset(ring, baseRing);
    return buildSingleRingNodeWithContext(
      ring,
      atoms,
      ringBoundaries,
      ringOffset,
      ring.ringNumber,
      allRingPositions,
      buildNodeFromAtomsFn,
    );
  });

  const seqRingNodes = sequentialRings.map(
    (ring) => buildSingleRingNodeWithContext(
      ring,
      atoms,
      ringBoundaries,
      0,
      ring.ringNumber,
      allRingPositions,
      buildNodeFromAtomsFn,
    ),
  );

  return assembleFusedRingNode(
    rings,
    seqRingNodes,
    allPositions,
    totalAtoms,
    atoms,
    ringBoundaries,
    buildNodeFromAtomsFn,
  );
}
