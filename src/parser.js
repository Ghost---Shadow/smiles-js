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
 * Collect consecutive atoms in a branch chain
 */
function collectBranchChain(branchAtom, allAtoms, processed) {
  const branchChain = [branchAtom];
  processed.add(branchAtom.index);

  // Look for continuation of this branch
  // Build a map of index -> atom for faster lookup
  const atomsByIndex = new Map();
  allAtoms.forEach((a) => atomsByIndex.set(a.index, a));

  let currentIdx = branchAtom.index + 1;
  while (currentIdx < allAtoms.length) {
    const nextAtom = atomsByIndex.get(currentIdx);
    if (!nextAtom) break;

    // Stop if we hit a different branch level or parent
    if (nextAtom.branchDepth !== branchAtom.branchDepth) break;
    if (nextAtom.parentIndex !== branchAtom.parentIndex) break;

    branchChain.push(nextAtom);
    processed.add(nextAtom.index);
    currentIdx += 1;
  }

  return branchChain;
}

/**
 * Build a linear chain node from atoms
 */
function buildLinearNode(atomList, allAtoms = [], isBranch = false) {
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
        const branchChain = collectBranchChain(branchAtom, allAtoms, processed);
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

  // TODO: Extract attachments from branches
  const attachments = {};

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

  // Group fused rings (rings that share atoms)
  const fusedGroups = groupFusedRings(ringBoundaries);

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
        components.push(buildLinearNode(currentLinear, atoms));
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);

      if (!processedGroups.has(groupIdx)) {
        // Build ring/fused ring node for this group
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNode(group, atoms);
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
    components.push(buildLinearNode(currentLinear, atoms));
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
  // Stack of branch points: { parentIndex, depth }
  const branchStack = [];
  // Branch info: { parentIndex, tokens, depth }
  const branches = [];

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

      const atom = {
        index: currentAtomIndex,
        value: token.atom,
        rawValue: token.value,
        bond: currentBond,
        rings: [], // Ring numbers this atom participates in
        branchDepth: branchStack.length,
        parentIndex,
      };

      atoms.push(atom);
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
        const startIndex = ringStacks.get(ringNumber);

        // Collect all atoms from start to current (inclusive on both ends)
        const ringPositions = [];
        for (let idx = startIndex; idx <= currentAtomIndex; idx += 1) {
          ringPositions.push(idx);
        }

        ringBoundaries.push({
          ringNumber,
          start: startIndex,
          end: currentAtomIndex,
          positions: ringPositions,
        });

        // Mark atoms as part of this ring
        ringPositions.forEach((pos) => {
          atoms[pos].rings.push(ringNumber);
        });

        ringStacks.delete(ringNumber);
      } else {
        // Open ring
        ringStacks.set(ringNumber, currentAtomIndex);
        atoms[currentAtomIndex].rings.push(ringNumber);
      }

      i += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (token.type === TokenType.BRANCH_OPEN) {
      // Start new branch
      branchStack.push({
        parentIndex: currentAtomIndex,
        depth: branchStack.length,
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
