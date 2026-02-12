/**
 * AST Builder - Converts flat atom list into hierarchical AST
 *
 * buildAST: Main entry point. Takes atoms and ring boundaries from buildAtomList,
 *   groups fused rings, and assembles components into a Molecule/Ring/Linear node.
 *
 * buildBranchWithRings: Handles branches that contain ring structures, separating
 *   linear chain segments from ring groups and assembling them as Molecule components.
 *
 * buildNodeFromAtoms: Local dispatcher that routes atom lists to either
 *   buildBranchWithRings (if rings present) or buildLinearNodeSimple.
 *
 * buildLinearNodeSimple: Builds a Linear node from a flat atom list,
 *   extracting bonds and recursively building branch attachments.
 */

import {
  Linear,
  Molecule,
} from '../constructors.js';
import {
  groupFusedRings,
} from './ring-utils.js';
import {
  collectBranchChain,
} from './branch-utils.js';
import {
  buildRingGroupNodeWithContext,
} from './ring-group-builder.js';

/**
 * Build an AST node from a list of atoms (could be Linear or Ring)
 * This is the recursive function that handles rings inside branches
 */
function buildNodeFromAtoms(atomList, allAtoms, ringBoundaries, isBranch = false) {
  const atomIndices = new Set(atomList.map((a) => a.index));
  const containedRings = ringBoundaries.filter(
    (ring) => ring.positions.every((pos) => atomIndices.has(pos)),
  );

  if (containedRings.length > 0) {
    // eslint-disable-next-line no-use-before-define
    return buildBranchWithRings(atomList, allAtoms, containedRings, ringBoundaries, isBranch);
  }

  // eslint-disable-next-line no-use-before-define
  return buildLinearNodeSimple(atomList, allAtoms, ringBoundaries, isBranch);
}

/**
 * Build a linear chain node from atoms (no rings in this chain)
 */
function buildLinearNodeSimple(list, all, bounds, isBranch = false) {
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
}

/**
 * Build a branch that contains rings
 */
function buildBranchWithRings(atoms, all, rings, bounds, branch) {
  const atomList = atoms;
  const allAtoms = all;
  const containedRings = rings;
  const ringBoundaries = bounds;
  const isBranch = branch;
  const fusedGroups = groupFusedRings(containedRings);

  const globalRingPositions = new Set();
  containedRings.forEach((ring) => {
    ring.positions.forEach((pos) => globalRingPositions.add(pos));
  });

  const atomToGroup = new Map();
  fusedGroups.forEach((group, groupIdx) => {
    const allPositions = new Set();
    group.forEach((ring) => {
      ring.positions.forEach((pos) => allPositions.add(pos));
    });

    group.forEach((ring) => {
      const endPos = ring.end;
      const endAtom = allAtoms[endPos];
      if (endAtom && endAtom.branchId !== null) {
        allAtoms.forEach((a) => {
          if (a.prevAtomIndex === endPos
              && a.branchDepth === endAtom.branchDepth
              && a.branchId === endAtom.branchId
              && !a.afterBranchClose
              && !globalRingPositions.has(a.index)) {
            allPositions.add(a.index);
          }
        });
      }
    });

    allPositions.forEach((pos) => {
      atomToGroup.set(pos, groupIdx);
    });
  });

  const baseDepth = atomList[0].branchDepth;
  const sameDepthAtoms = atomList.filter((a) => a.branchDepth === baseDepth);

  const components = [];
  const processedGroups = new Set();
  let currentLinear = [];

  for (let i = 0; i < sameDepthAtoms.length; i += 1) {
    const atom = sameDepthAtoms[i];
    const globalIdx = atom.index;

    if (atomToGroup.has(globalIdx)) {
      if (currentLinear.length > 0) {
        const brch = isBranch && components.length === 0;
        const lin = buildLinearNodeSimple(currentLinear, allAtoms, ringBoundaries, brch);
        components.push(lin);
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);
      if (!processedGroups.has(groupIdx)) {
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNodeWithContext(
          group,
          allAtoms,
          ringBoundaries,
          buildNodeFromAtoms,
          buildLinearNodeSimple,
        );
        components.push(ringNode);
        processedGroups.add(groupIdx);

        const allRingsInNode = ringNode.rings || [ringNode];
        allRingsInNode.forEach((r) => {
          const ringNum = r.ringNumber;
          fusedGroups.forEach((grp, grpIdx) => {
            if (grp.some((gr) => gr.ringNumber === ringNum)) {
              processedGroups.add(grpIdx);
            }
          });
        });

        const ringAllPositions = ringNode.metaAllPositions || new Set();
        ringAllPositions.forEach((pos) => {
          if (!atomToGroup.has(pos)) {
            atomToGroup.set(pos, groupIdx);
          }
        });

        const seqRings = ringNode.metaSequentialRings || [];
        seqRings.forEach((seqRingNode) => {
          const seqPositions = seqRingNode.metaPositions || [];
          seqPositions.forEach((pos) => {
            atomToGroup.set(pos, groupIdx);
          });
          const seqRingNumber = seqRingNode.ringNumber;
          fusedGroups.forEach((grp, grpIdx) => {
            if (grp.some((r) => r.ringNumber === seqRingNumber)) {
              processedGroups.add(grpIdx);
            }
          });
        });
      }

      while (i + 1 < sameDepthAtoms.length
             && atomToGroup.get(sameDepthAtoms[i + 1].index) === groupIdx) {
        i += 1;
      }
    } else {
      currentLinear.push(atom);
    }
  }

  if (currentLinear.length > 0) {
    const lb = isBranch && components.length === 0;
    const trailingLinear = buildLinearNodeSimple(currentLinear, allAtoms, ringBoundaries, lb);
    if (components.length > 0 && currentLinear[0].bond) {
      trailingLinear.metaLeadingBond = currentLinear[0].bond;
    }
    components.push(trailingLinear);
  }

  if (components.length === 0) {
    return Linear([], [], {});
  }
  if (components.length === 1) {
    return components[0];
  }
  return Molecule(components);
}

/**
 * Pass 2: Build hierarchical AST
 * Groups atoms into rings and linear chains
 */
export function buildAST(atoms, ringBoundaries) {
  if (atoms.length === 0) {
    return Molecule([]);
  }

  // Include rings that are on the main chain (branchDepth 0) or that have
  // any positions on the main chain (depth 0 atoms in their path)
  const mainChainRings = ringBoundaries.filter(
    (r) => r.branchDepth === 0
      || r.positions.some((pos) => atoms[pos].branchDepth === 0),
  );

  const knownPositions = new Set();
  mainChainRings.forEach((r) => {
    r.positions.forEach((pos) => knownPositions.add(pos));
  });

  // Iteratively discover bridge rings — rings that share atoms with already-known positions
  const includedRings = new Set(mainChainRings.map((r) => r.ringNumber));
  let foundNew = true;
  while (foundNew) {
    foundNew = false;
    ringBoundaries.forEach((r) => {
      if (includedRings.has(r.ringNumber)) return;
      if (r.positions.some((pos) => knownPositions.has(pos))) {
        includedRings.add(r.ringNumber);
        r.positions.forEach((pos) => knownPositions.add(pos));
        foundNew = true;
      }
    });
  }

  const ringsToGroup = ringBoundaries.filter((r) => includedRings.has(r.ringNumber));
  const fusedGroups = groupFusedRings(ringsToGroup);

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

  const components = [];
  const processedGroups = new Set();
  let currentLinear = [];

  const componentPositions = [];

  const mainChainAtoms = atoms.filter((atom) => atom.branchDepth === 0);

  for (let i = 0; i < mainChainAtoms.length; i += 1) {
    const atom = mainChainAtoms[i];
    const globalIdx = atom.index;

    if (atomToGroup.has(globalIdx)) {
      if (currentLinear.length > 0) {
        const linNode = buildLinearNodeSimple(currentLinear, atoms, ringBoundaries, false);
        if (components.length > 0 && currentLinear[0].bond) {
          linNode.metaLeadingBond = currentLinear[0].bond;
        }
        const linearPositions = new Set(currentLinear.map((a) => a.index));
        componentPositions.push({ componentIndex: components.length, positions: linearPositions });
        components.push(linNode);
        currentLinear = [];
      }

      const groupIdx = atomToGroup.get(globalIdx);

      if (!processedGroups.has(groupIdx)) {
        const group = fusedGroups[groupIdx];
        const ringNode = buildRingGroupNodeWithContext(
          group,
          atoms,
          ringBoundaries,
          buildNodeFromAtoms,
          buildLinearNodeSimple,
        );

        const groupPositions = new Set();
        group.forEach((ring) => {
          ring.positions.forEach((pos) => groupPositions.add(pos));
        });

        const firstAtomOfGroup = atom;
        if (firstAtomOfGroup.bond && components.length > 0) {
          ringNode.metaLeadingBond = firstAtomOfGroup.bond;
        }

        const firstRingAtomIdx = Math.min(...groupPositions);
        const firstRingAtom = atoms[firstRingAtomIdx];
        if (firstRingAtom && firstRingAtom.prevAtomIndex !== null) {
          const prevIdx = firstRingAtom.prevAtomIndex;
          for (let ci = componentPositions.length - 1; ci >= 0; ci -= 1) {
            const compInfo = componentPositions[ci];
            if (compInfo.positions.has(prevIdx)) {
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

      const group = fusedGroups[groupIdx];
      const maxPos = Math.max(...group.flatMap((r) => r.positions));
      while (i + 1 < mainChainAtoms.length && mainChainAtoms[i + 1].index <= maxPos) {
        i += 1;
      }
    } else {
      currentLinear.push(atom);
    }
  }

  if (currentLinear.length > 0) {
    const trailingLinear = buildLinearNodeSimple(currentLinear, atoms, ringBoundaries, false);
    if (components.length > 0 && currentLinear[0].bond) {
      trailingLinear.metaLeadingBond = currentLinear[0].bond;
    }
    components.push(trailingLinear);
  }

  if (components.length === 0) {
    return Molecule([]);
  }
  if (components.length === 1) {
    return components[0];
  }
  return Molecule(components);
}
