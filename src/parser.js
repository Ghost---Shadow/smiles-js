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
} from './constructors.js';

/**
 * Collect the proper path for a ring, handling interleaved fused rings.
 * When an inner ring closes while we're collecting atoms for an outer ring,
 * the inner ring creates a "shortcut" - we skip from its start to its end.
 *
 * @param {number} startIdx - Starting atom index
 * @param {number} endIdx - Ending atom index
 * @param {Array} atoms - All atoms
 * @param {number} branchDepth - Branch depth of this ring
 * @param {number|null} branchId - Branch ID
 * @param {Array} closedRings - List of rings that closed before this one
 */
function collectRingPath(startIdx, endIdx, atoms, branchDepth, branchId, closedRings) {
  const positions = [];

  // Find inner rings that start and end within our range
  // These create shortcuts in our path
  const innerRings = closedRings.filter((r) => r.start > startIdx && r.end < endIdx);

  // Sort by start position
  innerRings.sort((a, b) => a.start - b.start);

  let idx = startIdx;
  while (idx <= endIdx) {
    const atom = atoms[idx];
    if (!atom) {
      idx += 1;
      continue;
    }

    // Check if we're at an inner ring's start
    const innerRing = innerRings.find((r) => r.start === idx);
    if (innerRing) {
      // Include the start atom (shared fusion point)
      if (atom.branchDepth === branchDepth) {
        if (branchDepth === 0 || atom.branchId === branchId || isInSameBranchContext(atom, atoms[startIdx], atoms)) {
          positions.push(idx);
        }
      }
      // Jump to the end of the inner ring (which is also a shared fusion point)
      // The inner ring's atoms between start+1 and end-1 are NOT part of the outer ring
      idx = innerRing.end;
      continue;
    }

    // Regular atom - include if at correct depth
    if (atom.branchDepth === branchDepth) {
      if (branchDepth === 0 || atom.branchId === branchId || isInSameBranchContext(atom, atoms[startIdx], atoms)) {
        positions.push(idx);
      }
    }

    idx += 1;
  }

  return positions;
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
 * Collect consecutive atoms in a branch chain, including sub-branch atoms
 */
function collectBranchChain(branchAtom, allAtoms, processed, branchId) {
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
 * Build an AST node from a list of atoms (could be Linear or Ring)
 * This is the recursive function that handles rings inside branches
 */
function buildNodeFromAtoms(atomList, allAtoms, ringBoundaries, isBranch = false) {
  // Check if this atom list forms a ring
  const atomIndices = new Set(atomList.map((a) => a.index));
  const containedRings = ringBoundaries.filter((ring) => ring.positions.every((pos) => atomIndices.has(pos)));

  if (containedRings.length > 0) {
    // This branch contains ring(s) - build ring node(s)
    return buildBranchWithRings(atomList, allAtoms, containedRings, ringBoundaries, isBranch);
  }

  // No rings in this branch - build linear node
  return buildLinearNodeSimple(atomList, allAtoms, ringBoundaries, isBranch);
}

/**
 * Build a linear chain node from atoms (no rings in this chain)
 */
function buildLinearNodeSimple(atomList, allAtoms, ringBoundaries, isBranch = false) {
  // Filter to only atoms at the same branch depth as the first atom
  const baseDepth = atomList[0].branchDepth;
  const sameDepthAtoms = atomList.filter((a) => a.branchDepth === baseDepth);

  const atomValues = sameDepthAtoms.map((atom) => {
    if (typeof atom.value === 'string') {
      return atom.value;
    }
    return atom.value.raw || 'C';
  });

  // For branches, include the bond on the first atom (connection to parent)
  // For main chain, start from second atom (skip first atom's bond)
  const bondStart = isBranch ? 0 : 1;
  const bonds = sameDepthAtoms.slice(bondStart).map((atom) => atom.bond).filter((b) => b !== null);

  // Build attachments from branches
  const attachments = {};

  // Group branch atoms by their parent index within this linear chain
  sameDepthAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;

    // Find all atoms that branch from this atom (one depth level deeper)
    const branchAtoms = allAtoms.filter((a) => a.parentIndex === globalIdx && a.branchDepth === baseDepth + 1);

    if (branchAtoms.length > 0) {
      // Group branches by branchId to handle multiple branches
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;

        // Collect all atoms in this branch (including deeper sub-branches)
        const branchChain = collectBranchChain(branchAtom, allAtoms, processed, branchAtom.branchId);
        branchGroups.push(branchChain);
      });

      // Build nodes for each branch group (could be Ring or Linear)
      const position = localIdx + 1; // Convert to 1-indexed position
      attachments[position] = branchGroups.map((group) => buildNodeFromAtoms(group, allAtoms, ringBoundaries, true));
    }
  });

  return Linear(atomValues, bonds, attachments);
}

/**
 * Build a branch that contains rings
 */
function buildBranchWithRings(atomList, allAtoms, containedRings, ringBoundaries, isBranch) {
  // Group fused rings
  const fusedGroups = groupFusedRings(containedRings);

  // Map atom index to its ring group
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
        components.push(buildLinearNodeSimple(currentLinear, allAtoms, ringBoundaries, isBranch && components.length === 0));
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);
      if (!processedGroups.has(groupIdx)) {
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNodeWithContext(group, allAtoms, ringBoundaries);
        components.push(ringNode);
        processedGroups.add(groupIdx);
      }

      // Skip remaining atoms in this ring group
      const group = fusedGroups[groupIdx];
      const maxPos = Math.max(...group.flatMap((r) => r.positions));
      while (i + 1 < sameDepthAtoms.length && sameDepthAtoms[i + 1].index <= maxPos) {
        i += 1;
      }
    } else {
      currentLinear.push(atom);
    }
  }

  // Flush remaining linear
  if (currentLinear.length > 0) {
    components.push(buildLinearNodeSimple(currentLinear, allAtoms, ringBoundaries, isBranch && components.length === 0));
  }

  // Return appropriate node
  if (components.length === 0) {
    return Linear([], [], {});
  }
  if (components.length === 1) {
    return components[0];
  }
  return Molecule(components);
}

/**
 * Build a linear chain node from atoms (legacy wrapper for compatibility)
 */
function buildLinearNode(atomList, allAtoms = [], isBranch = false) {
  // This is now a wrapper that uses the new buildLinearNodeSimple
  // but without ringBoundaries context (for backward compatibility in some code paths)
  const atomValues = atomList.map((atom) => {
    if (typeof atom.value === 'string') {
      return atom.value;
    }
    return atom.value.raw || 'C';
  });

  // For branches, include the bond on the first atom (connection to parent)
  // For main chain, start from second atom (skip first atom's bond)
  const bondStart = isBranch ? 0 : 1;
  const bonds = atomList.slice(bondStart).map((atom) => atom.bond).filter((b) => b !== null);

  // Build attachments from branches
  const attachments = {};

  // Group branch atoms by their parent index within this linear chain
  atomList.forEach((atom, localIdx) => {
    const globalIdx = atom.index;

    // Find all atoms that branch from this atom
    const branchAtoms = allAtoms.filter((a) => a.parentIndex === globalIdx && a.branchDepth > 0);

    if (branchAtoms.length > 0) {
      // Group branches by depth to handle multiple branches
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;

        // Collect consecutive atoms at this branch depth
        const branchChain = collectBranchChain(branchAtom, allAtoms, processed, branchAtom.branchId);
        branchGroups.push(branchChain);
      });

      // Build Linear nodes for each branch group
      const position = localIdx + 1; // Convert to 1-indexed position
      attachments[position] = branchGroups.map((group) => buildLinearNode(group, allAtoms, true));
    }
  });

  return Linear(atomValues, bonds, attachments);
}

/**
 * Build a single ring node with ringBoundaries context for nested attachments
 */
function buildSingleRingNodeWithContext(ring, atoms, ringBoundaries, offset = 0, ringNumber = 1) {
  const ringAtoms = ring.positions.map((pos) => atoms[pos]);

  // Determine base atom type (most common, prefer later atoms in tie)
  const atomCounts = new Map();
  ringAtoms.forEach((atom) => {
    const val = typeof atom.value === 'string' ? atom.value : atom.value.raw || 'C';
    atomCounts.set(val, (atomCounts.get(val) || 0) + 1);
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
    const val = typeof atom.value === 'string' ? atom.value : atom.value.raw || 'C';
    if (val !== baseAtom) {
      substitutions[idx + 1] = val;
    }
  });

  // Extract attachments from branches
  const attachments = {};
  const ringDepth = ringAtoms[0].branchDepth;

  ringAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;

    // Find all atoms that branch from this ring atom (one depth deeper)
    const branchAtoms = atoms.filter((a) => a.parentIndex === globalIdx && a.branchDepth === ringDepth + 1);

    if (branchAtoms.length > 0) {
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;

        const branchChain = collectBranchChain(branchAtom, atoms, processed, branchAtom.branchId);
        branchGroups.push(branchChain);
      });

      const position = localIdx + 1;
      attachments[position] = branchGroups.map((group) => buildNodeFromAtoms(group, atoms, ringBoundaries, true));
    }
  });

  const ringNode = Ring({
    atoms: baseAtom,
    size: ringAtoms.length,
    ringNumber,
    offset,
    substitutions,
    attachments,
  });

  // Store the original positions for fused ring codegen
  // This is needed to properly reconstruct interleaved fused rings
  ringNode._positions = ring.positions;
  ringNode._start = ring.start;
  ringNode._end = ring.end;

  return ringNode;
}

/**
 * Build a ring or fused ring node from a group with context
 */
function buildRingGroupNodeWithContext(group, atoms, ringBoundaries) {
  if (group.length === 1) {
    // Pass the ring's actual ringNumber from the parsed boundary
    return buildSingleRingNodeWithContext(group[0], atoms, ringBoundaries, 0, group[0].ringNumber);
  }

  // Sort rings by their start position to determine base ring
  // The ring that starts first (lowest start position) is the base ring
  const sortedGroup = [...group].sort((a, b) => a.start - b.start);
  const baseRing = sortedGroup[0];

  // Calculate the total atom span for this fused system
  const allPositions = new Set();
  sortedGroup.forEach((ring) => {
    ring.positions.forEach((pos) => allPositions.add(pos));
  });
  const totalAtoms = allPositions.size;

  const rings = sortedGroup.map((ring) => {
    const offset = ring === baseRing ? 0 : calculateOffset(ring, baseRing);
    return buildSingleRingNodeWithContext(ring, atoms, ringBoundaries, offset, ring.ringNumber);
  });

  const fusedNode = FusedRing(rings);
  // Store total atoms and all positions for proper codegen
  fusedNode._totalAtoms = totalAtoms;
  fusedNode._allPositions = [...allPositions].sort((a, b) => a - b);

  return fusedNode;
}

/**
 * Build a single ring node
 */
function buildSingleRingNode(ring, atoms, offset = 0, ringNumber = 1) {
  const ringAtoms = ring.positions.map((pos) => atoms[pos]);

  // Determine base atom type (most common, prefer later atoms in tie)
  const atomCounts = new Map();
  ringAtoms.forEach((atom) => {
    const val = typeof atom.value === 'string' ? atom.value : atom.value.raw || 'C';
    atomCounts.set(val, (atomCounts.get(val) || 0) + 1);
  });

  let baseAtom = 'C';
  let maxCount = 0;
  // Use >= instead of > to prefer later atoms in tie (last atom wins)
  atomCounts.forEach((count, atom) => {
    if (count >= maxCount) {
      maxCount = count;
      baseAtom = atom;
    }
  });

  // Calculate substitutions (atoms that differ from base)
  const substitutions = {};
  ringAtoms.forEach((atom, idx) => {
    const val = typeof atom.value === 'string' ? atom.value : atom.value.raw || 'C';
    if (val !== baseAtom) {
      substitutions[idx + 1] = val; // 1-indexed positions
    }
  });

  // Extract attachments from branches
  const attachments = {};
  ringAtoms.forEach((atom, localIdx) => {
    const globalIdx = atom.index;

    // Find all atoms that branch from this atom
    const branchAtoms = atoms.filter((a) => a.parentIndex === globalIdx && a.branchDepth > 0);

    if (branchAtoms.length > 0) {
      // Group branches by branchId to handle multiple branches
      const branchGroups = [];
      const processed = new Set();

      branchAtoms.forEach((branchAtom) => {
        if (processed.has(branchAtom.index)) return;

        // Collect consecutive atoms at this branch
        const branchChain = collectBranchChain(branchAtom, atoms, processed);
        branchGroups.push(branchChain);
      });

      // Build Linear nodes for each branch group
      const position = localIdx + 1; // Convert to 1-indexed position
      attachments[position] = branchGroups.map((group) => buildLinearNode(group, atoms, true));
    }
  });

  return Ring({
    atoms: baseAtom,
    size: ringAtoms.length,
    ringNumber,
    offset,
    substitutions,
    attachments,
  });
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
 * Build a ring or fused ring node from a group
 */
function buildRingGroupNode(group, atoms) {
  if (group.length === 1) {
    return buildSingleRingNode(group[0], atoms);
  }

  // Fused ring system
  const rings = group.map((ring, idx) => {
    const offset = idx === 0 ? 0 : calculateOffset(ring, group[0]);
    return buildSingleRingNode(ring, atoms, offset, ring.ringNumber);
  });

  return FusedRing(rings);
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
 */
function groupFusedRings(ringBoundaries) {
  const groups = [];
  const assigned = new Set();

  ringBoundaries.forEach((ring) => {
    if (assigned.has(ring.ringNumber)) {
      return;
    }

    const group = [ring];
    assigned.add(ring.ringNumber);

    // Find all rings that share atoms with this group
    let didExpand = true;
    while (didExpand) {
      didExpand = false;

      // Use traditional for loop to avoid no-loop-func error
      for (let j = 0; j < ringBoundaries.length; j += 1) {
        const otherRing = ringBoundaries[j];

        if (assigned.has(otherRing.ringNumber)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Check if otherRing shares atoms with any ring in group
        const hasOverlap = group.some((groupRing) => ringsShareAtoms(groupRing, otherRing));

        if (hasOverlap) {
          group.push(otherRing);
          assigned.add(otherRing.ringNumber);
          didExpand = true;
        }
      }
    }

    groups.push(group);
  });

  return groups;
}

/**
 * Pass 2: Build hierarchical AST
 * Groups atoms into rings and linear chains
 */
function buildAST(atoms, ringBoundaries) {
  if (atoms.length === 0) {
    return Molecule([]);
  }

  // Filter to main chain rings only (depth 0) for top-level structure
  const mainChainRings = ringBoundaries.filter((r) => r.branchDepth === 0);

  // Group fused rings (rings that share atoms)
  const fusedGroups = groupFusedRings(mainChainRings);

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

  // Filter out atoms that are branches (will be attached to parents)
  const mainChainAtoms = atoms.filter((atom) => atom.branchDepth === 0);

  for (let i = 0; i < mainChainAtoms.length; i += 1) {
    const atom = mainChainAtoms[i];
    const globalIdx = atom.index;

    // Check if this atom is part of a ring group
    if (atomToGroup.has(globalIdx)) {
      // Flush any pending linear chain
      if (currentLinear.length > 0) {
        components.push(buildLinearNodeSimple(currentLinear, atoms, ringBoundaries, false));
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);

      if (!processedGroups.has(groupIdx)) {
        // Build ring/fused ring node for this group
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNodeWithContext(group, atoms, ringBoundaries);
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
    components.push(buildLinearNodeSimple(currentLinear, atoms, ringBoundaries, false));
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
function buildAtomList(tokens) {
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

      const atom = {
        index: currentAtomIndex,
        value: token.atom,
        rawValue: token.value,
        bond: currentBond,
        rings: [], // Ring numbers this atom participates in
        branchDepth: branchStack.length,
        parentIndex,
        branchId, // Unique ID of the branch this atom belongs to
      };

      atoms.push(atom);

      // Track last atom at this depth level
      lastAtomAtDepth.set(branchStack.length, currentAtomIndex);

      currentBond = null;
      i += 1;

      // eslint-disable-next-line no-continue
      continue;
    }

    if (token.type === TokenType.BOND) {
      currentBond = token.value;
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (token.type === TokenType.RING_MARKER) {
      const { ringNumber } = token;

      if (ringStacks.has(ringNumber)) {
        // Close ring - build the full ring atom sequence
        const { startIndex, branchDepth: ringBranchDepth, branchId: ringBranchId } = ringStacks.get(ringNumber);

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
        const currentBranchId = branchStack.length > 0 ? branchStack[branchStack.length - 1].branchId : null;

        ringStacks.set(ringNumber, {
          startIndex: currentAtomIndex,
          branchDepth: currentDepth,
          branchId: currentBranchId,
        });
        atoms[currentAtomIndex].rings.push(ringNumber);
      }

      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (token.type === TokenType.BRANCH_OPEN) {
      // Start new branch - assign unique branch ID
      // Parent is the last atom at the CURRENT depth level
      const currentDepth = branchStack.length;
      const parentIdx = lastAtomAtDepth.get(currentDepth);

      branchStack.push({
        parentIndex: parentIdx !== undefined ? parentIdx : -1,
        depth: currentDepth,
        branchId: i, // Use token position as unique ID
      });

      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (token.type === TokenType.BRANCH_CLOSE) {
      // End current branch
      branchStack.pop();
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (token.type === TokenType.DOT) {
      // Disconnected fragment - for now, skip
      // TODO: Handle disconnected fragments
      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

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
  const { atoms, ringBoundaries, branches } = buildAtomList(tokens);

  // Pass 2: Build hierarchical AST from atoms and ring info
  const ast = buildAST(atoms, ringBoundaries, branches);

  return ast;
}
