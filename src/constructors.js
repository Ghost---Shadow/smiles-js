/**
 * Programmatic molecule construction API
 * Factory functions for building molecules from scratch
 */

import {
  ASTNodeType,
  validateAtoms,
  validateSize,
  isRingNode,
} from './ast.js';

import { buildSMILES } from './codegen.js';
import { decompile } from './decompiler.js';
import {
  ringAttach,
  ringSubstitute,
  ringSubstituteMultiple,
  ringFuse,
  ringConcat,
  ringClone,
  linearAttach,
  linearBranch,
  linearBranchAt,
  linearConcat,
  fusedRingAddRing,
  fusedRingGetRing,
  fusedRingSubstituteInRing,
  fusedRingAttachToRing,
  fusedRingRenumber,
  fusedRingConcat,
  moleculeAppend,
  moleculePrepend,
  moleculeConcat,
  moleculeGetComponent,
  moleculeReplaceComponent,
} from './manipulation.js';

/**
 * Helper functions for immutable updates
 */

export function cloneAttachments(attachments) {
  const cloned = {};
  Object.entries(attachments).forEach(([pos, list]) => {
    cloned[pos] = [...list];
  });
  return cloned;
}

export function cloneSubstitutions(substitutions) {
  return { ...substitutions };
}

export function cloneComponents(components) {
  return [...components];
}

export function deepCloneRing(ring) {
  return {
    ...ring,
    substitutions: cloneSubstitutions(ring.substitutions),
    attachments: cloneAttachments(ring.attachments),
    bonds: [...(ring.bonds || [])],
  };
}

export function deepCloneLinear(linear) {
  return {
    ...linear,
    atoms: [...linear.atoms],
    bonds: [...linear.bonds],
    attachments: cloneAttachments(linear.attachments || {}),
  };
}

export function deepCloneFusedRing(fusedRing) {
  return {
    ...fusedRing,
    rings: fusedRing.rings.map((r) => deepCloneRing(r)),
  };
}

export function deepCloneMolecule(molecule) {
  return {
    ...molecule,
    components: cloneComponents(molecule.components),
  };
}

/**
 * SMILES getter function
 */

export function getSmiles() {
  return buildSMILES(this);
}

/**
 * Method attachment functions
 */

// Attach smiles getter to all node types
export function attachSmilesGetter(node) {
  Object.defineProperty(node, 'smiles', {
    get: getSmiles,
    enumerable: true,
    configurable: true,
  });
  return node;
}

// Attach manipulation methods to Ring nodes
export function attachRingMethods(node) {
  return Object.assign(node, {
    attach(attachment, position) {
      return ringAttach(this, attachment, position);
    },
    substitute(position, newAtom) {
      return ringSubstitute(this, position, newAtom);
    },
    substituteMultiple(substitutionMap) {
      return ringSubstituteMultiple(this, substitutionMap);
    },
    fuse(otherRing, offset) {
      return ringFuse(this, otherRing, offset);
    },
    concat(other) {
      return ringConcat(this, other);
    },
    clone() {
      return ringClone(this);
    },
    toObject() {
      const result = {
        type: this.type,
        atoms: this.atoms,
        size: this.size,
        ringNumber: this.ringNumber,
        offset: this.offset,
        substitutions: { ...this.substitutions },
        attachments: {},
        bonds: [...(this.bonds || [])],
      };
      Object.entries(this.attachments).forEach(([pos, attachmentList]) => {
        result.attachments[pos] = attachmentList.map((a) => (a.toObject ? a.toObject() : a));
      });
      return result;
    },
    toCode(varName = 'ring') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to Linear nodes
export function attachLinearMethods(node) {
  return Object.assign(node, {
    attach(attachment, position) {
      return linearAttach(this, attachment, position);
    },
    branch(branchPoint, ...branches) {
      return linearBranch(this, branchPoint, ...branches);
    },
    branchAt(branchMap) {
      return linearBranchAt(this, branchMap);
    },
    concat(other) {
      return linearConcat(this, other);
    },
    clone() {
      return deepCloneLinear(this);
    },
    toObject() {
      const result = {
        type: this.type,
        atoms: [...this.atoms],
        bonds: [...this.bonds],
        attachments: {},
      };
      Object.entries(this.attachments).forEach(([pos, attachmentList]) => {
        result.attachments[pos] = attachmentList.map((a) => (a.toObject ? a.toObject() : a));
      });
      return result;
    },
    toCode(varName = 'linear') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to Molecule nodes
export function attachMoleculeMethods(node) {
  return Object.assign(node, {
    append(component) {
      return moleculeAppend(this, component);
    },
    prepend(component) {
      return moleculePrepend(this, component);
    },
    concat(other) {
      return moleculeConcat(this, other);
    },
    getComponent(index) {
      return moleculeGetComponent(this, index);
    },
    replaceComponent(index, newComponent) {
      return moleculeReplaceComponent(this, index, newComponent);
    },
    clone() {
      return deepCloneMolecule(this);
    },
    toObject() {
      return {
        type: this.type,
        components: this.components.map((c) => (c.toObject ? c.toObject() : c)),
      };
    },
    toCode(varName = 'molecule') {
      return decompile(this, { varName });
    },
  });
}

// Attach manipulation methods to FusedRing nodes
export function attachFusedRingMethods(node) {
  return Object.assign(node, {
    addRing(ring, offset) {
      return fusedRingAddRing(this, ring, offset);
    },
    getRing(ringNumber) {
      return fusedRingGetRing(this, ringNumber);
    },
    substituteInRing(ringNumber, position, newAtom) {
      return fusedRingSubstituteInRing(this, ringNumber, position, newAtom);
    },
    attachToRing(ringNumber, attachment, position) {
      return fusedRingAttachToRing(this, ringNumber, attachment, position);
    },
    renumber(startNumber = 1) {
      return fusedRingRenumber(this, startNumber);
    },
    concat(other) {
      return fusedRingConcat(this, other);
    },
    clone() {
      return deepCloneFusedRing(this);
    },
    toObject() {
      return {
        type: this.type,
        rings: this.rings.map((r) => (r.toObject ? r.toObject() : {
          type: r.type,
          atoms: r.atoms,
          size: r.size,
          ringNumber: r.ringNumber,
          offset: r.offset,
          substitutions: { ...r.substitutions },
          attachments: {},
        })),
      };
    },
    toCode(varName = 'fusedRing') {
      return decompile(this, { varName });
    },
  });
}

/**
 * Internal factory functions
 */

export function createRingNode(
  atoms,
  size,
  ringNumber,
  offset,
  subs,
  attachments,
  bonds = [],
  branchDepths = null,
) {
  const node = {
    type: ASTNodeType.RING,
    atoms,
    size,
    ringNumber,
    offset,
    substitutions: { ...subs },
    attachments: { ...attachments },
    bonds: [...bonds],
  };
  // branchDepths tracks which ring positions are inside branches
  // Used for branch-crossing rings like C1CCC(CC1)(CC(=O)O)CN
  if (branchDepths) {
    node.metaBranchDepths = [...branchDepths];
  }
  attachSmilesGetter(node);
  attachRingMethods(node);
  return node;
}

export function createLinearNode(atoms, bonds, attachments = {}) {
  const node = {
    type: ASTNodeType.LINEAR,
    atoms: [...atoms],
    bonds: [...bonds],
    attachments: { ...attachments },
  };
  attachSmilesGetter(node);
  attachLinearMethods(node);
  return node;
}

/**
 * Compute position metadata for fused rings
 * This enables proper interleaved SMILES generation
 *
 * The algorithm handles multi-ring systems with different fusion topologies:
 *
 * 1. Amitriptyline-type: Base ring with multiple inside/endpoint fusions
 *    - All inner rings fuse directly with the base ring
 *    - Inner rings are fully contained within base ring traversal
 *
 * 2. Carbamazepine-type: "Extending" fusion where inner ring extends beyond base
 *    - Ring B fuses with ring A but extends beyond A's end
 *    - Ring A's remaining atoms must be output as a BRANCH
 *    - Ring C may fuse with ring B (chained fusion)
 *
 * For Carbamazepine: C1=CC=C2C(=C1)C=CC3=CC=CC=C3N2
 * - Ring 1 (benzene, size 6, offset 0): base ring
 * - Ring 2 (7-ring, size 7, offset 3): fuses at positions 3-4, extends to position 14
 * - Ring 3 (benzene, size 6, offset 0): fuses with ring 2 (not ring 1)
 *
 * Ring 2 extends beyond ring 1 (offset 3 + size 7 - 1 = 9 > ring 1 size 6 - 1 = 5)
 * So ring 1's position 5 must be output as a branch from position 4.
 */
function computeFusedRingPositions(fusedRingNodeParam) {
  // Note: This function intentionally modifies the passed node and its rings
  // Wrapping in object to satisfy no-param-reassign while still modifying
  const target = { node: fusedRingNodeParam };
  const { rings } = target.node;

  // Sort rings by offset - base ring has offset 0
  const sortedRings = [...rings].sort((a, b) => a.offset - b.offset);
  const baseRing = sortedRings[0];
  const innerRings = sortedRings.slice(1);

  // Build fusion graph and classify rings
  const fusionGraph = new Map();
  for (let i = 0; i < sortedRings.length; i += 1) {
    fusionGraph.set(i, new Set());
  }

  // Rings with offset > 0 fuse with base ring
  for (let i = 1; i < sortedRings.length; i += 1) {
    const ring = sortedRings[i];
    if (ring.offset > 0) {
      fusionGraph.get(0).add(i);
      fusionGraph.get(i).add(0);
    }
  }

  // Rings with offset 0 (other than base) fuse with another inner ring
  const offsetZeroInnerRings = innerRings.filter((r) => r.offset === 0);
  if (offsetZeroInnerRings.length > 0 && innerRings.length > 1) {
    offsetZeroInnerRings.forEach((ring) => {
      const ringIndex = sortedRings.indexOf(ring);
      let fusionPartnerIndex = -1;
      let maxOffset = -1;

      for (let i = 1; i < sortedRings.length; i += 1) {
        if (i !== ringIndex) {
          const other = sortedRings[i];
          if (other.offset > maxOffset) {
            maxOffset = other.offset;
            fusionPartnerIndex = i;
          }
        }
      }

      if (fusionPartnerIndex >= 0) {
        fusionGraph.get(fusionPartnerIndex).add(ringIndex);
        fusionGraph.get(ringIndex).add(fusionPartnerIndex);
        fusionGraph.get(0).delete(ringIndex);
        fusionGraph.get(ringIndex).delete(0);
      }
    });
  }

  // Classify inner rings
  const insideRings = []; // Fully contained in base ring traversal
  const extendingRings = []; // Extend beyond base ring
  const endpointRings = []; // End at same point as base ring
  const chainedRings = []; // Fuse with another inner ring, not base

  innerRings.forEach((ring) => {
    const ringIndex = sortedRings.indexOf(ring);
    const fusesWithBase = fusionGraph.get(ringIndex).has(0);

    if (!fusesWithBase) {
      chainedRings.push(ring);
    } else {
      const innerEnd = ring.offset + ring.size - 1;
      const baseEnd = baseRing.size - 1;

      if (innerEnd > baseEnd) {
        // Inner ring extends BEYOND base ring - need branch for base's remaining atoms
        extendingRings.push(ring);
      } else if (innerEnd === baseEnd) {
        endpointRings.push(ring);
      } else {
        insideRings.push(ring);
      }
    }
  });

  // Build the traversal and branch depth map
  const allPositions = [];
  const baseRingPositions = [];
  const branchDepthMap = new Map();

  const innerRingData = new Map();
  innerRings.forEach((ring) => {
    innerRingData.set(ring, { positions: [], start: -1, end: -1 });
  });

  // Maps for quick lookup
  const insideRingAtOffset = new Map();
  insideRings.forEach((ring) => insideRingAtOffset.set(ring.offset, ring));

  const extendingRingAtOffset = new Map();
  extendingRings.forEach((ring) => extendingRingAtOffset.set(ring.offset, ring));

  const endpointRingAtOffset = new Map();
  endpointRings.forEach((ring) => endpointRingAtOffset.set(ring.offset, ring));

  // Detect spiro rings - rings where branchDepths indicate only the first atom is shared
  // (branchDepths[0] = 0 and all others > 0)
  const spiroRingAtOffset = new Map();
  innerRings.forEach((ring) => {
    const bd = ring.metaBranchDepths;

    if (bd && bd.length >= 2 && bd[0] === 0 && bd.slice(1).every((d) => d > 0)) {
      // This is a spiro ring - remove from insideRings and add to spiro
      insideRingAtOffset.delete(ring.offset);
      spiroRingAtOffset.set(ring.offset, ring);
    }
  });

  // For chained rings, find host ring
  const chainedRingInfo = new Map();
  chainedRings.forEach((ring) => {
    const ringIndex = sortedRings.indexOf(ring);
    const fusionPartners = fusionGraph.get(ringIndex);

    let hostRing = null;
    fusionPartners.forEach((partnerIndex) => {
      if (partnerIndex !== 0) {
        const partner = sortedRings[partnerIndex];
        if (!hostRing || partner.offset > hostRing.offset) {
          hostRing = partner;
        }
      }
    });

    if (hostRing) {
      // Chained ring fuses at a specific point in host ring's inner atoms
      // The chained ring takes 2 consecutive fusion points in the host's inner section
      // After the second fusion point, host has 1 closing atom
      // Before the first fusion point, host has (hostInnerAtoms - 3) atoms
      // So fusion starts at inner index = hostInnerAtoms - 3
      // Example: 7-ring host (5 inner atoms) with 6-ring chained:
      //   - hostOffset = 5 - 3 = 2
      //   - Fusion at inner indices 2 and 3
      const hostInnerAtoms = hostRing.size - 2;
      const hostOffset = hostInnerAtoms - 3;
      chainedRingInfo.set(ring, { hostRing, hostOffset });
    }
  });

  let currentPos = 0;
  let basePos = 0;
  let currentDepth = 0;

  while (basePos < baseRing.size) {
    const insideRing = insideRingAtOffset.get(basePos);
    const extendingRing = extendingRingAtOffset.get(basePos);
    const endpointRing = endpointRingAtOffset.get(basePos);
    const spiroRing = spiroRingAtOffset.get(basePos);

    if (spiroRing) {
      // Spiro junction: only ONE atom is shared between the rings
      // The rest of the spiro ring goes into a branch
      const data = innerRingData.get(spiroRing);
      const spiroBranchDepths = spiroRing.metaBranchDepths || [];

      // Shared atom (spiro center)
      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      data.positions.push(currentPos);
      data.start = currentPos;
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      // Spiro ring's remaining atoms (atoms 2 through size) go in a branch
      // Use the ring's branchDepths to determine depths
      for (let i = 1; i < spiroRing.size; i += 1) {
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        const ringDepth = spiroBranchDepths[i] || 0;
        branchDepthMap.set(currentPos, currentDepth + ringDepth);
        currentPos += 1;
      }

      data.end = data.positions[data.positions.length - 1];

      // Only advance basePos by 1 (only 1 shared atom in spiro)
      basePos += 1;
    } else if (insideRing) {
      // Inside fusion: base ring skips inner ring's middle atoms
      const data = innerRingData.get(insideRing);

      // First fusion point
      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      data.positions.push(currentPos);
      data.start = currentPos;
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      // Inner ring's non-shared atoms
      for (let i = 1; i < insideRing.size - 1; i += 1) {
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;

        // Check for chained rings
        for (let cr = 0; cr < chainedRings.length; cr += 1) {
          const chainedRing = chainedRings[cr];
          const info = chainedRingInfo.get(chainedRing);
          if (info && info.hostRing === insideRing && i === info.hostOffset) {
            const chainedData = innerRingData.get(chainedRing);
            chainedData.start = currentPos - 1;
            chainedData.positions.push(currentPos - 1);

            for (let j = 1; j < chainedRing.size - 1; j += 1) {
              allPositions.push(currentPos);
              chainedData.positions.push(currentPos);
              branchDepthMap.set(currentPos, currentDepth);
              currentPos += 1;
            }

            chainedData.end = currentPos;
            chainedData.positions.push(currentPos);
          }
        }
      }

      // Second fusion point
      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      data.positions.push(currentPos);
      data.end = currentPos;
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      basePos += 2;
    } else if (extendingRing) {
      // Extending fusion: inner ring extends beyond base ring's end
      // Fusion is at inner ring's first (atom 0) and last (atom size-1) atoms
      // These share positions with base ring atoms at offset and offset+1
      // For benzimidazole (5-ring fused with 6-ring at offset 2):
      //   Base ring: atoms 0,1,2,3,4 at positions 0,1,2,7,8
      //   Inner ring: atoms 0,1,2,3,4,5 at positions 2,3,4,5,6,7
      //   Shared: position 2 (base atom 2, inner atom 0) and position 7 (base atom 3, inner atom 5)
      // For Carbamazepine (6-ring fused with 7-ring at offset 3, plus chained 6-ring):
      //   Base ring atoms after fusion go in a BRANCH because chained ring needs to fit
      const data = innerRingData.get(extendingRing);

      // Check if any chained ring fuses with this extending ring
      let hasChainedRings = false;
      chainedRings.forEach((chainedRing) => {
        const info = chainedRingInfo.get(chainedRing);
        if (info && info.hostRing === extendingRing) {
          hasChainedRings = true;
        }
      });

      // First fusion point: base atom at offset / inner atom 0
      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      data.positions.push(currentPos);
      data.start = currentPos;
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      if (hasChainedRings) {
        // Carbamazepine case: base ring's second fusion point comes immediately after first
        // Then base ring's remaining atoms go in a BRANCH
        // Then extending ring's middle atoms
        // Then chained ring
        // Then extending ring's closing atom (shared with chained ring)

        // Second fusion point of base ring with extending ring
        allPositions.push(currentPos);
        baseRingPositions.push(currentPos);
        data.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;

        // Base ring's remaining atoms go in a BRANCH
        const remainingBaseAtoms = baseRing.size - (extendingRing.offset + 2);
        if (remainingBaseAtoms > 0) {
          currentDepth += 1;
          for (let i = 0; i < remainingBaseAtoms; i += 1) {
            allPositions.push(currentPos);
            baseRingPositions.push(currentPos);
            branchDepthMap.set(currentPos, currentDepth);
            currentPos += 1;
          }
          currentDepth -= 1;
        }

        // Extending ring's middle atoms (atoms 2 through size-2)
        const extendingInnerAtoms = extendingRing.size - 3;
        let innerIdx = 0;
        while (innerIdx < extendingInnerAtoms) {
          // Check if a chained ring starts at this inner index
          let chainedRingHere = null;
          for (let cr = 0; cr < chainedRings.length; cr += 1) {
            const chainedRing = chainedRings[cr];
            const info = chainedRingInfo.get(chainedRing);
            if (info && info.hostRing === extendingRing && innerIdx === info.hostOffset) {
              chainedRingHere = chainedRing;
            }
          }

          if (chainedRingHere) {
            // First fusion: shared between extending and chained ring
            allPositions.push(currentPos);
            data.positions.push(currentPos);
            const chainedData = innerRingData.get(chainedRingHere);
            chainedData.start = currentPos;
            chainedData.positions.push(currentPos);
            branchDepthMap.set(currentPos, currentDepth);
            currentPos += 1;
            innerIdx += 1;

            // Chained ring's inner atoms
            for (let j = 1; j < chainedRingHere.size - 1; j += 1) {
              allPositions.push(currentPos);
              chainedData.positions.push(currentPos);
              branchDepthMap.set(currentPos, currentDepth);
              currentPos += 1;
            }

            // Second fusion: shared between extending and chained ring
            allPositions.push(currentPos);
            data.positions.push(currentPos);
            chainedData.positions.push(currentPos);
            chainedData.end = currentPos;
            branchDepthMap.set(currentPos, currentDepth);
            currentPos += 1;
            innerIdx += 1;
          } else {
            // Regular extending ring inner atom
            allPositions.push(currentPos);
            data.positions.push(currentPos);
            branchDepthMap.set(currentPos, currentDepth);
            currentPos += 1;
            innerIdx += 1;
          }
        }

        // Extending ring's closing atom
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        data.end = currentPos;
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
      } else {
        // Benzimidazole case: inner ring's middle atoms come between fusion points
        // No branch needed

        // Inner ring's middle atoms (atoms 1 through size-2)
        for (let i = 1; i < extendingRing.size - 1; i += 1) {
          allPositions.push(currentPos);
          data.positions.push(currentPos);
          branchDepthMap.set(currentPos, currentDepth);
          currentPos += 1;
        }

        // Second fusion point: base atom at offset+1 / inner atom size-1
        // This is the inner ring's closing atom
        allPositions.push(currentPos);
        baseRingPositions.push(currentPos);
        data.positions.push(currentPos);
        data.end = currentPos;
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;

        // Base ring's remaining atoms (atoms offset+2 through size-1)
        const remainingBaseAtoms = baseRing.size - (extendingRing.offset + 2);
        for (let i = 0; i < remainingBaseAtoms; i += 1) {
          allPositions.push(currentPos);
          baseRingPositions.push(currentPos);
          branchDepthMap.set(currentPos, currentDepth);
          currentPos += 1;
        }
      }

      // Skip past all of base ring (it's been fully processed)
      basePos = baseRing.size;
    } else if (endpointRing) {
      // Endpoint fusion: base and inner ring share all remaining positions
      const data = innerRingData.get(endpointRing);
      data.start = currentPos;

      for (let i = 0; i < endpointRing.size; i += 1) {
        allPositions.push(currentPos);
        baseRingPositions.push(currentPos);
        data.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
      }

      data.end = currentPos - 1;
      basePos += endpointRing.size;
    } else {
      // Regular base ring atom
      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;
      basePos += 1;
    }
  }

  const totalAtoms = currentPos;

  // Store position metadata
  sortedRings[0].metaPositions = baseRingPositions;
  sortedRings[0].metaStart = 0;
  sortedRings[0].metaEnd = baseRingPositions[baseRingPositions.length - 1];

  innerRings.forEach((innerRing, idx) => {
    const data = innerRingData.get(innerRing);
    if (data && data.positions.length > 0) {
      sortedRings[idx + 1].metaPositions = data.positions;
      sortedRings[idx + 1].metaStart = data.start;
      sortedRings[idx + 1].metaEnd = data.end;
    }
  });

  target.node.metaAllPositions = allPositions;
  target.node.metaTotalAtoms = totalAtoms;

  target.node.metaBranchDepthMap = branchDepthMap;

  // Build ring order map
  const ringOrderMap = new Map();
  const closePositions = new Map();

  [baseRing, ...innerRings].forEach((ring) => {
    const data = innerRingData.get(ring);
    const endPos = data ? data.end : (totalAtoms - 1);
    if (endPos >= 0) {
      if (!closePositions.has(endPos)) {
        closePositions.set(endPos, []);
      }
      closePositions.get(endPos).push(ring.ringNumber);
    }
  });

  closePositions.forEach((ringNumbers, pos) => {
    if (ringNumbers.length > 1) {
      const chainedRingNumbers = chainedRings.map((r) => r.ringNumber);
      const endpointRingNumbers = endpointRings.map((r) => r.ringNumber);
      const sorted = [...ringNumbers].sort((a, b) => {
        const aIsChained = chainedRingNumbers.includes(a);
        const bIsChained = chainedRingNumbers.includes(b);
        const aIsEndpoint = endpointRingNumbers.includes(a);
        const bIsEndpoint = endpointRingNumbers.includes(b);

        if (aIsChained && !bIsChained) return -1;
        if (!aIsChained && bIsChained) return 1;
        if (aIsEndpoint && !bIsEndpoint) return -1;
        if (!aIsEndpoint && bIsEndpoint) return 1;
        return b - a;
      });
      ringOrderMap.set(pos, sorted);
    }
  });

  target.node.metaRingOrderMap = ringOrderMap;
}

/**
 * Apply branch depths from constituent rings to fused ring's branchDepthMap
 * This handles branch-crossing rings created via API with branchDepths option
 */
function applyRingBranchDepthsToFusedRing(node) {
  const branchDepthMap = node.metaBranchDepthMap;
  if (!branchDepthMap) return;

  node.rings.forEach((ring) => {
    const ringBranchDepths = ring.metaBranchDepths;
    const ringPositions = ring.metaPositions;

    if (ringBranchDepths && ringPositions && ringBranchDepths.length === ringPositions.length) {
      // Apply the ring's branch depths to the corresponding positions
      ringPositions.forEach((pos, idx) => {
        const depth = ringBranchDepths[idx];
        // Use the maximum depth (ring's depth takes precedence if higher)
        const currentDepth = branchDepthMap.get(pos) || 0;
        if (depth > currentDepth) {
          branchDepthMap.set(pos, depth);
        }
      });
    }
  });
}

export function createFusedRingNode(rings, options = {}) {
  // Create base node
  const node = {
    type: ASTNodeType.FUSED_RING,
    rings: rings.map((r) => ({ ...r })),
  };

  // Store leading bond if provided (for connecting to previous component in molecule)
  if (options.leadingBond) {
    node.metaLeadingBond = options.leadingBond;
  }

  // Only compute position metadata if not already present from parser
  // Parser-generated rings have _positions, API-created rings don't
  const hasParserPositions = rings.some((r) => r.metaPositions);

  if (!hasParserPositions) {
    // Compute interleaved position metadata for proper SMILES generation
    // This is needed when rings are created via API (not parser)
    computeFusedRingPositions(node);

    // Apply branch depths from constituent rings if they have metaBranchDepths
    applyRingBranchDepthsToFusedRing(node);
  }

  attachSmilesGetter(node);
  attachFusedRingMethods(node);
  return node;
}

export function createMoleculeNode(components) {
  const node = {
    type: ASTNodeType.MOLECULE,
    components: [...components],
  };
  attachSmilesGetter(node);
  attachMoleculeMethods(node);
  return node;
}

/**
 * Public constructor functions
 */

/**
 * Create a Ring node
 * @param {Object} options - Ring options
 * @param {string} options.atoms - Base atom type (e.g., 'c', 'C', 'N')
 * @param {number} options.size - Ring size (number of atoms)
 * @param {number} [options.ringNumber=1] - Ring number for SMILES notation
 * @param {number} [options.offset=0] - Offset for fused rings
 * @param {Object} [options.substitutions={}] - Position -> atom substitutions
 * @param {Object} [options.attachments={}] - Position -> attachment list
 * @param {Array} [options.bonds=[]] - Bond types between atoms (size-1 or size for closure)
 * @returns {Object} Ring AST node
 */
export function Ring(options) {
  const {
    atoms,
    size,
    ringNumber = 1,
    offset = 0,
    substitutions = {},
    attachments = {},
    bonds = [],
    branchDepths = null,
  } = options;

  validateAtoms(atoms);
  validateSize(size);

  return createRingNode(
    atoms,
    size,
    ringNumber,
    offset,
    substitutions,
    attachments,
    bonds,
    branchDepths,
  );
}

/**
 * Create a Linear chain node
 * @param {Array<string>} atoms - Array of atom symbols
 * @param {Array<string>} [bonds=[]] - Array of bond types
 * @param {Object} [attachments={}] - Position -> attachment list
 * @returns {Object} Linear AST node
 */
export function Linear(atoms, bonds = [], attachments = {}) {
  if (!Array.isArray(atoms)) {
    throw new Error('Linear atoms must be an array');
  }
  validateAtoms(atoms);

  return createLinearNode(atoms, bonds, attachments);
}

/**
 * Create a FusedRing node
 * @param {Array<Object>} rings - Array of Ring nodes
 * @returns {Object} FusedRing AST node
 */
export function FusedRing(rings, options = {}) {
  if (!Array.isArray(rings)) {
    throw new Error('FusedRing requires an array of rings');
  }
  if (rings.length < 2) {
    throw new Error('FusedRing requires at least 2 rings');
  }
  if (!rings.every((r) => isRingNode(r))) {
    throw new Error('All elements must be Ring nodes');
  }

  return createFusedRingNode(rings, options);
}

/**
 * Create a Molecule node
 * @param {Array<Object>} [components=[]] - Array of AST nodes
 * @returns {Object} Molecule AST node
 */
export function Molecule(components = []) {
  if (!Array.isArray(components)) {
    throw new Error('Molecule components must be an array');
  }

  return createMoleculeNode(components);
}

/**
 * Create a RawFragment node that stores and echoes back raw SMILES.
 *
 * WARNING: This is for DEBUGGING and TESTING purposes ONLY.
 * DO NOT use RawFragment in production code or generated code.
 * Instead, use the proper Ring, Linear, FusedRing, and Molecule constructors
 * with the appropriate options (e.g., { sibling: true } for attach()).
 *
 * RawFragment bypasses the SMILES generation logic and simply returns
 * the stored string, which means it won't benefit from any future
 * improvements to the codegen.
 *
 * @param {string} smilesString - Raw SMILES string to store
 * @returns {Object} RawFragment node
 * @deprecated Use proper constructors instead
 */
export function RawFragment(smilesString) {
  if (typeof smilesString !== 'string') {
    throw new Error('RawFragment requires a SMILES string');
  }

  return {
    type: 'raw_fragment',
    smiles: smilesString,
    toObject() {
      return {
        type: 'raw_fragment',
        smiles: smilesString,
      };
    },
    toCode(varName = 'raw') {
      return `export const ${varName}1 = RawFragment(${JSON.stringify(smilesString)});`;
    },
    clone() {
      return RawFragment(smilesString);
    },
  };
}
