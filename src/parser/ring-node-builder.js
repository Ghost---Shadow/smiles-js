/**
 * Functions for building Ring and FusedRing AST nodes
 */

import {
  Ring,
  Linear,
  Molecule,
} from '../constructors.js';
import {
  determineBaseAtom,
  calculateSubstitutions,
  extractRingBonds,
} from './ring-utils.js';
import {
  buildExcludedPositions,
  atomStartsNewBranch,
  collectBranchChain,
  findDeepSeqContinuationRing,
  findSameDepthSeqAtoms,
  areSeqAtomsAttachmentsToEarlierPosition,
  findNextSeqAtom,
} from './branch-utils.js';

// Forward declarations
let buildLinearNodeSimpleInternal;

/**
 * Build an AST node from a list of atoms (could be Linear or Ring)
 */
export function buildNodeFromAtoms(
  atomList,
  allAtoms,
  ringBoundaries,
  isBranch = false,
) {
  const atomIndices = new Set(atomList.map((a) => a.index));
  const containedRings = ringBoundaries.filter(
    (ring) => ring.positions.every((pos) => atomIndices.has(pos)),
  );

  if (containedRings.length > 0) {
    // This would need buildBranchWithRingsInternal - not implemented yet
    return buildLinearNodeSimpleInternal(atomList, allAtoms, ringBoundaries, isBranch);
  }

  return buildLinearNodeSimpleInternal(atomList, allAtoms, ringBoundaries, isBranch);
}

/**
 * Build a linear chain node from atoms (no rings in this chain)
 */
buildLinearNodeSimpleInternal = function buildLinear(
  list,
  all,
  bounds,
  isBranch = false,
) {
  const atomList = list;
  const allAtoms = all;
  const ringBoundaries = bounds;
  const baseDepth = atomList[0].branchDepth;
  const sameDepthAtoms = atomList.filter((a) => a.branchDepth === baseDepth);

  const atomValues = sameDepthAtoms.map((atom) => atom.rawValue);
  const bondStart = isBranch ? 0 : 1;
  const bonds = sameDepthAtoms.slice(bondStart).map((atom) => atom.bond);

  const attachments = {};

  sameDepthAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;

    const branchAtoms = allAtoms.filter(
      (a) => a.parentIndex === globalIdx && a.branchDepth === baseDepth + 1,
    );

    if (branchAtoms.length > 0) {
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;
        const branchChain = collectBranchChain(branchAtom, allAtoms, processed);
        branchGroups.push(branchChain);
      });

      const position = localIdx + 1;
      attachments[position] = branchGroups.map(
        (group) => buildNodeFromAtoms(group, allAtoms, ringBoundaries, true),
      );
    }
  });

  return Linear(atomValues, bonds, attachments);
};

export { buildLinearNodeSimpleInternal };

/**
 * Build a single ring node with ringBoundaries context for nested attachments
 */
export function buildSingleRingNodeWithContext(
  ring,
  atoms,
  ringBoundaries,
  offset = 0,
  ringNumber = 1,
  fusedGroupPositions = null,
) {
  const ringAtoms = ring.positions.map((pos) => atoms[pos]);
  const baseAtom = determineBaseAtom(ringAtoms);
  const substitutions = calculateSubstitutions(ringAtoms, baseAtom);
  const bonds = extractRingBonds(ringAtoms);

  const attachments = {};
  const excludedPositions = buildExcludedPositions(fusedGroupPositions, ringAtoms, ringBoundaries);

  ringAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;
    const atomDepth = atom.branchDepth;

    const branchAtoms = atoms.filter((a) => {
      if (a.parentIndex !== globalIdx) return false;
      if (a.branchDepth !== atomDepth + 1) return false;
      if (excludedPositions.has(a.index)) return false;
      return atomStartsNewBranch(a, atoms, excludedPositions, fusedGroupPositions);
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
          const node = buildNodeFromAtoms(group.chain, atoms, ringBoundaries, true);
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

  ringNode.metaPositions = ring.positions;
  ringNode.metaStart = ring.start;
  ringNode.metaEnd = ring.end;
  ringNode.metaBranchDepths = ringAtoms.map((a) => a.branchDepth);
  ringNode.metaParentIndices = ringAtoms.map((a) => a.parentIndex);

  return ringNode;
}

/**
 * Build a ring or fused ring node from a group with context
 */
export function buildRingGroupNodeWithContext(group, atoms, ringBoundaries) {
  if (group.length === 1) {
    const ring = group[0];
    const endAtom = atoms[ring.end];

    const deepSeqRing = findDeepSeqContinuationRing(ring, atoms, ringBoundaries, group);
    if (deepSeqRing) {
      const expandedGroup = [...group, deepSeqRing];
      return buildRingGroupNodeWithContext(expandedGroup, atoms, ringBoundaries);
    }

    const seqAtoms = findSameDepthSeqAtoms(ring, atoms, endAtom);
    if (seqAtoms.length > 0) {
      if (areSeqAtomsAttachmentsToEarlierPosition(seqAtoms, ring)) {
        return buildSingleRingNodeWithContext(
          ring,
          atoms,
          ringBoundaries,
          0,
          ring.ringNumber,
        );
      }

      const firstSeqAtom = seqAtoms[0];
      const nextRing = ringBoundaries.find(
        (rb) => rb.positions.includes(firstSeqAtom.index)
          && rb.branchDepth === firstSeqAtom.branchDepth,
      );

      if (nextRing) {
        const expandedGroup = [...group, nextRing];
        return buildRingGroupNodeWithContext(expandedGroup, atoms, ringBoundaries);
      }

      const ringNode = buildSingleRingNodeWithContext(
        ring,
        atoms,
        ringBoundaries,
        0,
        ring.ringNumber,
      );

      const seqLinearAtoms = [firstSeqAtom];
      const { branchDepth, branchId } = firstSeqAtom;
      let nextA = findNextSeqAtom(atoms, firstSeqAtom.index, branchDepth, branchId);
      while (nextA) {
        seqLinearAtoms.push(nextA);
        nextA = findNextSeqAtom(atoms, nextA.index, branchDepth, branchId);
      }

      const seqLinearNode = buildLinearNodeSimpleInternal(
        seqLinearAtoms,
        atoms,
        ringBoundaries,
        false,
      );
      return Molecule([ringNode, seqLinearNode]);
    }

    return buildSingleRingNodeWithContext(
      ring,
      atoms,
      ringBoundaries,
      0,
      ring.ringNumber,
    );
  }

  // Handle multiple rings - would need buildFusedRingGroup implementation
  // For now, return first ring as a fallback
  return buildSingleRingNodeWithContext(
    group[0],
    atoms,
    ringBoundaries,
    0,
    group[0].ringNumber,
  );
}
