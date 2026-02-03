/**
 * Branch-related utility functions for SMILES parser
 */

/**
 * Find the next sequential atom in the chain
 */
export function findNextSeqAtom(atoms, prevIdx, branchDepth, branchId) {
  return atoms.find(
    (a) => a.prevAtomIndex === prevIdx
      && a.branchDepth === branchDepth
      && a.branchId === branchId
      && !a.afterBranchClose,
  );
}

/**
 * Collect consecutive atoms in a branch chain, including sub-branch atoms
 */
export function collectBranchChain(branchAtom, allAtoms, processed) {
  const branchChain = [branchAtom];
  processed.add(branchAtom.index);

  const atomsByIndex = new Map();
  allAtoms.forEach((a) => atomsByIndex.set(a.index, a));

  let currentIdx = branchAtom.index + 1;
  while (currentIdx < allAtoms.length) {
    const nextAtom = atomsByIndex.get(currentIdx);
    if (!nextAtom) break;

    if (nextAtom.branchDepth < branchAtom.branchDepth) break;
    if (nextAtom.branchDepth === branchAtom.branchDepth) {
      if (nextAtom.parentIndex !== branchAtom.parentIndex) break;
      if (nextAtom.branchId !== branchAtom.branchId) break;
    }

    branchChain.push(nextAtom);
    processed.add(nextAtom.index);
    currentIdx += 1;
  }

  return branchChain;
}

/**
 * Build excluded positions set for ring attachments
 */
export function buildExcludedPositions(fusedGroupPositions, ringAtoms, ringBoundaries) {
  if (fusedGroupPositions) {
    return fusedGroupPositions;
  }
  const ringBranchDepth = ringAtoms[0]?.branchDepth ?? 0;
  const excludedPositions = new Set();
  ringBoundaries.forEach((rb) => {
    if (rb.branchDepth === ringBranchDepth) {
      rb.positions.forEach((pos) => excludedPositions.add(pos));
    }
  });
  return excludedPositions;
}

/**
 * Check if an atom starts a new branch
 */
export function atomStartsNewBranch(atom, atoms, excludedPositions, fusedGroupPositions) {
  if (atom.prevAtomIndex === null) return true;
  if (atoms[atom.prevAtomIndex]?.branchId !== atom.branchId) return true;
  if (!fusedGroupPositions && excludedPositions.has(atom.prevAtomIndex)) {
    return true;
  }
  return false;
}

/**
 * Find sequential continuation ring in a branch
 */
export function findDeepSeqContinuationRing(ring, atoms, ringBoundaries, group) {
  const endAtom = atoms[ring.end];
  const hasDeepSeqContinuation = endAtom
    && endAtom.branchDepth > ring.branchDepth
    && endAtom.branchId !== null;

  if (!hasDeepSeqContinuation) return null;

  const nextAtom = atoms.find(
    (a) => a.prevAtomIndex === ring.end
      && a.branchDepth === endAtom.branchDepth
      && a.branchId === endAtom.branchId
      && !a.afterBranchClose,
  );

  if (!nextAtom) return null;

  const nextRing = ringBoundaries.find(
    (rb) => rb.positions.includes(nextAtom.index) && rb.branchDepth === nextAtom.branchDepth,
  );

  if (nextRing && !group.some((g) => g.ringNumber === nextRing.ringNumber)) {
    return nextRing;
  }
  return null;
}

/**
 * Handle sequential continuation atoms at the same depth
 */
export function findSameDepthSeqAtoms(ring, atoms, endAtom) {
  if (!endAtom || endAtom.branchId === null) return [];

  return atoms.filter(
    (a) => a.prevAtomIndex === ring.end
      && a.branchDepth === endAtom.branchDepth
      && a.branchId === endAtom.branchId
      && !a.afterBranchClose,
  );
}

/**
 * Check if sequential atoms are attachments to an earlier position
 */
export function areSeqAtomsAttachmentsToEarlierPosition(seqAtoms, ring) {
  if (seqAtoms.length === 0) return false;
  const firstSeqAtom = seqAtoms[0];
  return ring.positions.some(
    (pos) => pos < ring.end && firstSeqAtom.parentIndex === pos,
  );
}
