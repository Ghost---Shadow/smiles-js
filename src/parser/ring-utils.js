/**
 * Ring-related utility functions for SMILES parser
 */

/**
 * Check if two atoms are in the same branch context
 * (share the same branch ancestry)
 */
export function isInSameBranchContext(atom1, atom2, allAtoms) {
  if (atom1.branchDepth !== atom2.branchDepth) return false;
  if (atom1.branchDepth === 0) return true;

  let p1 = atom1.parentIndex;
  let p2 = atom2.parentIndex;

  while (p1 !== null && p2 !== null) {
    if (p1 === p2) return true;
    const parent1 = allAtoms[p1];
    const parent2 = allAtoms[p2];
    if (!parent1 || !parent2) break;
    p1 = parent1.parentIndex;
    p2 = parent2.parentIndex;
  }

  return atom1.branchId === atom2.branchId;
}

/**
 * Find inner rings that are fused with the current ring
 */
export function findInnerFusedRings(startIdx, endIdx, atoms, branchDepth, closedRings) {
  const innerRings = closedRings.filter((r) => {
    if (r.start <= startIdx || r.end >= endIdx) return false;
    const innerStartAtom = atoms[r.start];
    return innerStartAtom && innerStartAtom.branchDepth === branchDepth;
  });
  return innerRings.sort((a, b) => a.start - b.start);
}

/**
 * Trace branch IDs from end atom back to the starting depth
 */
export function traceRingPathBranchIds(endAtom, branchDepth, atoms) {
  const ringPathBranchIds = new Set();
  let traceAtom = endAtom;
  while (traceAtom && traceAtom.branchDepth > branchDepth) {
    if (traceAtom.branchId !== null) {
      ringPathBranchIds.add(traceAtom.branchId);
    }
    const parentIdx = traceAtom.parentIndex;
    traceAtom = parentIdx !== null ? atoms[parentIdx] : null;
  }
  return ringPathBranchIds;
}

/**
 * Check if an atom should be included in the ring path
 */
export function shouldIncludeAtomInRing(
  atom,
  startAtom,
  branchDepth,
  branchId,
  ringPathBranchIds,
  atoms,
) {
  const atOriginalDepth = atom.branchDepth === branchDepth;
  const inRingPathBranch = ringPathBranchIds.has(atom.branchId);

  if (atOriginalDepth) {
    const inContext = branchDepth === 0 || atom.branchId === branchId
      || isInSameBranchContext(atom, startAtom, atoms);
    return inContext;
  }
  return inRingPathBranch;
}

/**
 * Collect the proper path for a ring, handling interleaved fused rings
 */
export function collectRingPath(
  startIdx,
  endIdx,
  atoms,
  branchDepth,
  branchId,
  closedRings,
) {
  const positions = [];
  const innerRings = findInnerFusedRings(startIdx, endIdx, atoms, branchDepth, closedRings);
  const endAtom = atoms[endIdx];
  const ringEntersDeepBranch = endAtom && endAtom.branchDepth > branchDepth;
  const ringExitsToShallowerDepth = endAtom && endAtom.branchDepth < branchDepth;
  const ringPathBranchIds = ringEntersDeepBranch
    ? traceRingPathBranchIds(endAtom, branchDepth, atoms)
    : new Set();

  // When ring exits to a shallower depth, trace from start atom to find branch IDs
  // that contain the start, and also include atoms at the shallower end depth
  const exitBranchIds = new Set();
  if (ringExitsToShallowerDepth) {
    let traceAtom = atoms[startIdx];
    while (traceAtom && traceAtom.branchDepth > endAtom.branchDepth) {
      if (traceAtom.branchId !== null) {
        exitBranchIds.add(traceAtom.branchId);
      }
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
      const currentIdx = idx;
      const innerRing = innerRings.find((r) => r.start === currentIdx);
      if (innerRing) {
        positions.push(idx);
        idx = innerRing.end;
      } else if (ringExitsToShallowerDepth) {
        // For rings that exit to shallower depth:
        // Include atoms at the start's branch context OR at the end's depth
        const inStartBranch = atom.branchDepth === branchDepth
          && (branchDepth === 0 || atom.branchId === branchId);
        const inExitBranch = exitBranchIds.has(atom.branchId);
        const atEndDepth = atom.branchDepth === endAtom.branchDepth
          && (endAtom.branchDepth === 0
            || isInSameBranchContext(atom, endAtom, atoms));
        if (inStartBranch || inExitBranch || atEndDepth) {
          positions.push(idx);
        }
        idx += 1;
      } else {
        const startAtom = atoms[startIdx];
        if (shouldIncludeAtomInRing(
          atom,
          startAtom,
          branchDepth,
          branchId,
          ringPathBranchIds,
          atoms,
        )) {
          positions.push(idx);
        }
        idx += 1;
      }
    }
  }

  return positions;
}

/**
 * Check if two rings share any atoms
 */
export function ringsShareAtoms(ring1, ring2) {
  const set1 = new Set(ring1.positions);
  return ring2.positions.some((pos) => set1.has(pos));
}

/**
 * Group rings that share atoms (fused rings)
 */
export function groupFusedRings(ringBoundaries) {
  const groups = [];
  const assigned = new Set();

  ringBoundaries.forEach((ring, ringIdx) => {
    if (assigned.has(ringIdx)) {
      return;
    }

    const group = [ring];
    assigned.add(ringIdx);

    let didExpand = true;
    while (didExpand) {
      didExpand = false;

      for (let j = 0; j < ringBoundaries.length; j += 1) {
        const otherRing = ringBoundaries[j];

        if (!assigned.has(j)) {
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
export function calculateOffset(ring, baseRing) {
  const baseSet = new Set(baseRing.positions);
  const sharedPos = ring.positions.find((pos) => baseSet.has(pos));

  if (sharedPos === undefined) {
    return 0;
  }

  return baseRing.positions.indexOf(sharedPos);
}

/**
 * Determine the most common atom type in a ring (base atom)
 */
export function determineBaseAtom(ringAtoms) {
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
  return baseAtom;
}

/**
 * Calculate substitutions for atoms that differ from the base atom
 */
export function calculateSubstitutions(ringAtoms, baseAtom) {
  const substitutions = {};
  ringAtoms.forEach((atom, idx) => {
    if (atom.rawValue !== baseAtom) {
      substitutions[idx + 1] = atom.rawValue;
    }
  });
  return substitutions;
}

/**
 * Extract bonds between ring atoms
 */
export function extractRingBonds(ringAtoms) {
  const bonds = [];
  for (let i = 1; i < ringAtoms.length; i += 1) {
    const bond = ringAtoms[i].bond || null;
    bonds.push(bond);
  }
  bonds.push(null);
  return bonds;
}
