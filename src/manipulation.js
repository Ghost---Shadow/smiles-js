/**
 * Manipulation methods for AST nodes
 * All methods are immutable - they return new nodes
 */

import {
  createRingNode,
  createLinearNode,
  createFusedRingNode,
  createMoleculeNode,
  cloneAttachments,
  cloneSubstitutions,
  cloneComponents,
  deepCloneRing,
} from './constructors.js';
import { validatePosition, isLinearNode, isMoleculeNode } from './ast.js';
import { computeFusedRingPositions } from './layout/index.js';

/**
 * Ring manipulation methods
 */

export function ringAttach(ring, position, attachment, options = {}) {
  validatePosition(position, ring.size);

  const updatedAttachments = cloneAttachments(ring.attachments);

  if (!updatedAttachments[position]) {
    updatedAttachments[position] = [];
  }

  // Clone the attachment and set metaIsSibling if provided in options
  let attachmentToAdd = attachment;
  if (options.sibling !== undefined) {
    attachmentToAdd = { ...attachment, metaIsSibling: options.sibling };
  }

  updatedAttachments[position] = [...updatedAttachments[position], attachmentToAdd];

  const newRing = createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    ring.offset,
    ring.substitutions,
    updatedAttachments,
    ring.bonds || [],
    ring.metaBranchDepths || null,
  );

  // Preserve metadata from original ring
  if (ring.metaLeadingBond) {
    newRing.metaLeadingBond = ring.metaLeadingBond;
  }

  return newRing;
}

export function ringSubstitute(ring, position, newAtom) {
  validatePosition(position, ring.size);

  const updatedSubstitutions = cloneSubstitutions(ring.substitutions);
  const baseAtom = ring.atoms;

  if (newAtom === baseAtom) {
    delete updatedSubstitutions[position];
  } else {
    updatedSubstitutions[position] = newAtom;
  }

  return createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    ring.offset,
    updatedSubstitutions,
    ring.attachments,
    ring.bonds || [],
    ring.metaBranchDepths || null,
  );
}

export function ringSubstituteMultiple(ring, substitutionMap) {
  return Object.entries(substitutionMap).reduce(
    (result, [position, atom]) => ringSubstitute(result, Number(position), atom),
    ring,
  );
}

export function ringFuse(ring, offset, otherRing, options = {}) {
  const ring1 = createRingNode(
    ring.atoms,
    ring.size,
    ring.ringNumber,
    0,
    ring.substitutions,
    ring.attachments,
    ring.bonds || [],
    ring.metaBranchDepths || null,
  );

  const ring2 = createRingNode(
    otherRing.atoms,
    otherRing.size,
    otherRing.ringNumber || ring.ringNumber + 1,
    offset,
    otherRing.substitutions,
    otherRing.attachments,
    otherRing.bonds || [],
    otherRing.metaBranchDepths || null,
  );

  return createFusedRingNode([ring1, ring2], options);
}

export function ringConcat(ring, other) {
  return createMoleculeNode([ring, other]);
}

export function ringClone(ring) {
  return deepCloneRing(ring);
}

/**
 * Linear manipulation methods
 */

export function linearAttach(linear, position, attachment) {
  if (position < 1 || position > linear.atoms.length) {
    throw new Error(`Position must be an integer between 1 and ${linear.atoms.length}`);
  }

  const updatedAttachments = cloneAttachments(linear.attachments || {});

  if (!updatedAttachments[position]) {
    updatedAttachments[position] = [];
  }

  updatedAttachments[position] = [...updatedAttachments[position], attachment];

  return createLinearNode(linear.atoms, linear.bonds, updatedAttachments);
}

export function linearBranch(linear, branchPoint, ...branches) {
  if (branchPoint < 1 || branchPoint > linear.atoms.length) {
    throw new Error(`Branch point must be an integer between 1 and ${linear.atoms.length}`);
  }

  return branches.reduce(
    (result, branch) => linearAttach(result, branchPoint, branch),
    linear,
  );
}

export function linearBranchAt(linear, branchMap) {
  return Object.entries(branchMap).reduce(
    (result, [position, branches]) => {
      const pos = Number(position);
      const branchList = Array.isArray(branches) ? branches : [branches];
      return linearBranch(result, pos, ...branchList);
    },
    linear,
  );
}

export function linearConcat(linear, other) {
  if (isLinearNode(other)) {
    const newAtoms = [...linear.atoms, ...other.atoms];
    const newBonds = [...linear.bonds];

    if (other.bonds.length > 0) {
      newBonds.push(...other.bonds);
    }

    return createLinearNode(newAtoms, newBonds, {});
  }
  return createMoleculeNode([linear, other]);
}

/**
 * FusedRing manipulation methods
 */

export function fusedRingAddRing(fusedRing, offset, ring) {
  const newRings = fusedRing.rings.map((r) => ({ ...r }));
  const ringWithOffset = { ...ring, offset };
  newRings.push(ringWithOffset);
  return createFusedRingNode(newRings);
}

export function fusedRingGetRing(fusedRing, ringNumber) {
  return fusedRing.rings.find((r) => r.ringNumber === ringNumber);
}

/**
 * Helper to update a specific ring in a fused ring system
 * @param {Object} fusedRing - FusedRing node
 * @param {number} ringNumber - Ring number to update
 * @param {Function} updateFn - Function that takes the ring and returns updated ring
 * @returns {Object} New FusedRing node
 */
function updateRingInFused(fusedRing, ringNumber, updateFn) {
  const targetRing = fusedRingGetRing(fusedRing, ringNumber);
  if (!targetRing) {
    throw new Error(`Ring ${ringNumber} not found in fused ring system`);
  }

  const updatedRing = updateFn(targetRing);
  const newRings = fusedRing.rings.map(
    (r) => (r.ringNumber === ringNumber ? updatedRing : { ...r }),
  );

  return createFusedRingNode(newRings);
}

export function fusedRingSubstituteInRing(fusedRing, ringNumber, position, newAtom) {
  return updateRingInFused(
    fusedRing,
    ringNumber,
    (ring) => ringSubstitute(ring, position, newAtom),
  );
}

export function fusedRingAttachToRing(fusedRing, ringNumber, position, attachment) {
  return updateRingInFused(
    fusedRing,
    ringNumber,
    (ring) => ringAttach(ring, position, attachment),
  );
}

export function fusedRingRenumber(fusedRing, startNumber = 1) {
  const newRings = fusedRing.rings.map((r, idx) => ({
    ...r,
    ringNumber: startNumber + idx,
  }));
  return createFusedRingNode(newRings);
}

export function fusedRingAddSequentialRings(fusedRing, seqRings, options = {}) {
  const newRings = fusedRing.rings.map((r) => ({ ...r }));
  const newNode = createFusedRingNode(newRings, { skipPositionComputation: true });

  // Copy interleaved codegen flag if present (parser-created nodes)
  if (fusedRing.metaUseInterleavedCodegen) {
    newNode.metaUseInterleavedCodegen = true;
  }

  // Copy existing metadata from the base fused ring
  newNode.metaAllPositions = [...(fusedRing.metaAllPositions || [])];
  newNode.metaTotalAtoms = fusedRing.metaTotalAtoms || 0;
  newNode.metaBranchDepthMap = new Map(fusedRing.metaBranchDepthMap || []);
  newNode.metaAtomValueMap = new Map(fusedRing.metaAtomValueMap || []);
  newNode.metaBondMap = new Map(fusedRing.metaBondMap || []);
  newNode.metaRingOrderMap = new Map(fusedRing.metaRingOrderMap || []);

  // Copy ring-level metadata
  fusedRing.rings.forEach((origRing, idx) => {
    if (origRing.metaPositions) newNode.rings[idx].metaPositions = [...origRing.metaPositions];
    if (origRing.metaStart !== undefined) newNode.rings[idx].metaStart = origRing.metaStart;
    if (origRing.metaEnd !== undefined) newNode.rings[idx].metaEnd = origRing.metaEnd;
  });

  // Store sequential rings
  newNode.metaSequentialRings = [...seqRings];

  // Determine the depth of each sequential ring.
  // Priority: (1) explicit depths option, (2) ring's metaBranchDepths[0], (3) 0
  const depths = options.depths || [];
  const seqRingDepths = seqRings.map((ring, idx) => {
    if (depths[idx] !== undefined) return depths[idx];
    if (ring.metaBranchDepths && ring.metaBranchDepths.length > 0) return ring.metaBranchDepths[0];
    return 0;
  });

  // Group sequential rings by depth, keeping input order within each depth group.
  const depthGroups = new Map();
  seqRings.forEach((ring, idx) => {
    const depth = seqRingDepths[idx];
    if (!depthGroups.has(depth)) depthGroups.set(depth, []);
    depthGroups.get(depth).push({ ring, idx });
  });
  // Deeper rings appear first in allPositions (they're inside branches).
  const sortedDepths = [...depthGroups.keys()].sort((a, b) => b - a);

  // chainAtoms: optional array of {atom, bond?, depth} describing standalone atoms
  // between sequential rings (not part of any ring structure).
  // They are emitted before each depth group and after the deepest group.
  const chainAtoms = options.chainAtoms || [];

  // Index chain atoms by depth and position (before/after)
  // Chain atoms at a given depth go: before-atoms, rings, after-atoms
  const chainAtomsByDepth = new Map();
  chainAtoms.forEach((ca) => {
    const d = ca.depth !== undefined ? ca.depth : 0;
    if (!chainAtomsByDepth.has(d)) chainAtomsByDepth.set(d, { before: [], after: [] });
    const bucket = chainAtomsByDepth.get(d);
    if (ca.position === 'before') bucket.before.push(ca);
    else bucket.after.push(ca);
  });

  // Assign positions to sequential rings, ordered by depth (deepest first).
  // Within each depth group, rings with overlapping offsets form fused sub-systems.
  // We use computeFusedRingPositions to compute correct interleaved positions.
  let nextPos = newNode.metaTotalAtoms;

  // Track chain atom attachments (position → attachment nodes)
  const chainAtomAttachments = new Map();

  // Helper to emit a chain atom
  const emitChainAtom = (ca) => {
    const pos = nextPos;
    newNode.metaAllPositions.push(pos);
    newNode.metaBranchDepthMap.set(pos, ca.depth !== undefined ? ca.depth : 0);
    if (ca.atom && ca.atom !== 'C') {
      newNode.metaAtomValueMap.set(pos, ca.atom);
    }
    if (ca.bond) {
      newNode.metaBondMap.set(pos, ca.bond);
    }
    if (ca.attachments && ca.attachments.length > 0) {
      chainAtomAttachments.set(pos, ca.attachments);
    }
    nextPos += 1;
  };

  sortedDepths.forEach((depth) => {
    const group = depthGroups.get(depth);

    // Emit chain atoms that go BEFORE rings at this depth
    const chainGroup = chainAtomsByDepth.get(depth);
    if (chainGroup) {
      chainGroup.before.forEach(emitChainAtom);
    }

    // Check if any rings in this depth group overlap (share atoms via offsets)
    const hasOverlap = group.length >= 2 && group.some(({ ring: r }, i) => {
      for (let j = i + 1; j < group.length; j += 1) {
        const rj = group[j].ring;
        const startA = r.offset || 0;
        const endA = startA + r.size;
        const startB = rj.offset || 0;
        const endB = startB + rj.size;
        if (startA < endB && startB < endA) return true;
      }
      return false;
    });

    if (hasOverlap && group.length >= 2) {
      // Create a temporary fused ring from the sequential rings in this group
      // and use computeFusedRingPositions to compute their interleaved positions.
      const tempRings = group.map(({ ring: seqRing }) => createRingNode(
        seqRing.atoms,
        seqRing.size,
        seqRing.ringNumber,
        seqRing.offset || 0,
        seqRing.substitutions || {},
        seqRing.attachments || {},
        seqRing.bonds || [],
        null,
      ));
      const tempFused = createFusedRingNode(tempRings, { skipPositionComputation: true });
      tempFused.rings = tempRings;
      computeFusedRingPositions(tempFused);

      // Map the temp fused ring's positions to global positions
      const tempAllPos = tempFused.metaAllPositions || [];
      const localToGlobal = new Map();
      tempAllPos.forEach((localPos) => {
        localToGlobal.set(localPos, nextPos);
        newNode.metaAllPositions.push(nextPos);
        const localDepth = tempFused.metaBranchDepthMap
          ? (tempFused.metaBranchDepthMap.get(localPos) || 0) : 0;
        newNode.metaBranchDepthMap.set(nextPos, depth + localDepth);
        const atomVal = tempFused.metaAtomValueMap
          ? tempFused.metaAtomValueMap.get(localPos) : undefined;
        if (atomVal) newNode.metaAtomValueMap.set(nextPos, atomVal);
        const bond = tempFused.metaBondMap
          ? tempFused.metaBondMap.get(localPos) : undefined;
        if (bond) newNode.metaBondMap.set(nextPos, bond);
        nextPos += 1;
      });

      // Map each sequential ring's metaPositions to global
      group.forEach(({ ring: seqRing }, gi) => {
        const tempRing = tempFused.rings[gi];
        const tempPositions = tempRing.metaPositions || [];
        const globalPositions = tempPositions.map((lp) => localToGlobal.get(lp));
        seqRing.metaPositions = globalPositions;
        seqRing.metaStart = globalPositions[0];
        seqRing.metaEnd = globalPositions[globalPositions.length - 1];
      });

      // Copy ring order map from temp fused ring
      const tempRingOrderMap = tempFused.metaRingOrderMap || new Map();
      tempRingOrderMap.forEach((ringNums, localPos) => {
        const globalPos = localToGlobal.get(localPos);
        if (globalPos !== undefined) {
          newNode.metaRingOrderMap.set(globalPos, ringNums);
        }
      });
    } else {
      // No overlap: assign contiguous positions for each ring sequentially
      group.forEach(({ ring: seqRing }) => {
        const ringBranchDepths = seqRing.metaBranchDepths || [];
        const positions = [];
        const { substitutions = {}, bonds = [] } = seqRing;

        for (let i = 0; i < seqRing.size; i += 1) {
          positions.push(nextPos);
          newNode.metaAllPositions.push(nextPos);
          const atomDepth = ringBranchDepths.length > 0 ? ringBranchDepths[i] : depth;
          newNode.metaBranchDepthMap.set(nextPos, atomDepth);
          const relativePos = i + 1;
          if (substitutions[relativePos]) {
            newNode.metaAtomValueMap.set(nextPos, substitutions[relativePos]);
          }
          if (i > 0 && bonds[i - 1]) {
            newNode.metaBondMap.set(nextPos, bonds[i - 1]);
          }
          nextPos += 1;
        }

        seqRing.metaPositions = positions;
        seqRing.metaStart = positions[0];
        seqRing.metaEnd = positions[positions.length - 1];
      });
    }

    // Emit chain atoms that go AFTER rings at this depth
    if (chainGroup) {
      chainGroup.after.forEach(emitChainAtom);
    }

    // Handle legacy atomAttachments: create position entries for each attachment
    // (Only used when chainAtoms are not provided)
    if (options.atomAttachments && chainAtoms.length === 0) {
      Object.entries(options.atomAttachments).forEach(([key, atts]) => {
        const attDepth = options.atomAttachmentDepths
          ? options.atomAttachmentDepths[key] : depth;
        if (attDepth === depth) {
          newNode.metaAllPositions.push(nextPos);
          newNode.metaBranchDepthMap.set(nextPos, depth);
          nextPos += 1;
        }
      });
    }
  });

  // Emit chain atoms whose depths had no corresponding ring group.
  // Walk remaining depths in descending order so deeper atoms come first.
  const processedDepths = new Set(sortedDepths);
  const remainingDepths = [...chainAtomsByDepth.keys()]
    .filter((d) => !processedDepths.has(d))
    .sort((a, b) => b - a);
  remainingDepths.forEach((d) => {
    const bucket = chainAtomsByDepth.get(d);
    if (bucket) {
      bucket.before.forEach(emitChainAtom);
      bucket.after.forEach(emitChainAtom);
    }
  });

  newNode.metaTotalAtoms = nextPos;

  // Store seq atom attachments from both sources:
  // 1. options.atomAttachments (legacy/explicit position → attachments)
  // 2. chainAtomAttachments (computed from chain atoms with attachments)
  const seqAtomAtts = new Map();
  if (options.atomAttachments) {
    Object.entries(options.atomAttachments).forEach(([pos, atts]) => {
      seqAtomAtts.set(Number(pos), atts);
    });
  }
  chainAtomAttachments.forEach((atts, pos) => {
    seqAtomAtts.set(pos, atts);
  });
  newNode.metaSeqAtomAttachments = seqAtomAtts;

  return newNode;
}

export function fusedRingAddSequentialAtomAttachment(fusedRing, position, attachment) {
  const newRings = fusedRing.rings.map((r) => ({ ...r }));
  const newNode = createFusedRingNode(newRings, { skipPositionComputation: true });

  // Copy interleaved codegen flag if present (parser-created nodes)
  if (fusedRing.metaUseInterleavedCodegen) {
    newNode.metaUseInterleavedCodegen = true;
  }

  // Copy all existing metadata
  newNode.metaAllPositions = [...(fusedRing.metaAllPositions || [])];
  newNode.metaTotalAtoms = fusedRing.metaTotalAtoms || 0;
  newNode.metaBranchDepthMap = new Map(fusedRing.metaBranchDepthMap || []);
  newNode.metaAtomValueMap = new Map(fusedRing.metaAtomValueMap || []);
  newNode.metaBondMap = new Map(fusedRing.metaBondMap || []);
  newNode.metaRingOrderMap = new Map(fusedRing.metaRingOrderMap || []);
  newNode.metaSequentialRings = fusedRing.metaSequentialRings ? [...fusedRing.metaSequentialRings] : [];

  // Copy ring-level metadata
  fusedRing.rings.forEach((origRing, idx) => {
    if (origRing.metaPositions) newNode.rings[idx].metaPositions = [...origRing.metaPositions];
    if (origRing.metaStart !== undefined) newNode.rings[idx].metaStart = origRing.metaStart;
    if (origRing.metaEnd !== undefined) newNode.rings[idx].metaEnd = origRing.metaEnd;
  });

  // Copy and extend seq atom attachments
  const existingAttachments = new Map(fusedRing.metaSeqAtomAttachments || []);
  const current = existingAttachments.get(position) || [];
  existingAttachments.set(position, [...current, attachment]);
  newNode.metaSeqAtomAttachments = existingAttachments;

  return newNode;
}

export function fusedRingConcat(fusedRing, other) {
  return createMoleculeNode([fusedRing, other]);
}

/**
 * Molecule manipulation methods
 */

export function moleculeAppend(molecule, component) {
  const newComponents = cloneComponents(molecule.components);
  newComponents.push(component);
  return createMoleculeNode(newComponents);
}

export function moleculePrepend(molecule, component) {
  const newComponents = cloneComponents(molecule.components);
  newComponents.unshift(component);
  return createMoleculeNode(newComponents);
}

export function moleculeConcat(molecule, other) {
  const newComponents = cloneComponents(molecule.components);
  if (isMoleculeNode(other)) {
    newComponents.push(...other.components);
  } else {
    newComponents.push(other);
  }
  return createMoleculeNode(newComponents);
}

export function moleculeGetComponent(molecule, index) {
  return molecule.components[index];
}

export function moleculeReplaceComponent(molecule, index, newComponent) {
  const newComponents = cloneComponents(molecule.components);
  newComponents[index] = newComponent;
  return createMoleculeNode(newComponents);
}
