/**
 * SMILES Code Generator / Serializer
 * Converts AST nodes back to SMILES strings
 */

import {
  isMoleculeNode,
  isFusedRingNode,
  isRingNode,
  isLinearNode,
} from './ast.js';

/**
 * Main entry point: Convert any AST node to SMILES string
 * @param {Object} ast - AST node
 * @returns {string} SMILES string
 */
export function buildSMILES(ast) {
  if (isMoleculeNode(ast)) {
    // eslint-disable-next-line no-use-before-define
    return buildMoleculeSMILES(ast);
  }
  if (isFusedRingNode(ast)) {
    // eslint-disable-next-line no-use-before-define
    return buildFusedRingSMILES(ast);
  }
  if (isRingNode(ast)) {
    // eslint-disable-next-line no-use-before-define
    return buildRingSMILES(ast);
  }
  if (isLinearNode(ast)) {
    // eslint-disable-next-line no-use-before-define
    return buildLinearSMILES(ast);
  }
  throw new Error(`Unknown AST node type: ${ast?.type}`);
}

/**
 * Build SMILES for a Molecule node
 * @param {Object} molecule - Molecule AST node
 * @returns {string} SMILES string
 */
export function buildMoleculeSMILES(molecule) {
  const parts = molecule.components.map((component) => buildSMILES(component));
  return parts.join('');
}

/**
 * Build SMILES for a Linear chain node
 * @param {Object} linear - Linear AST node
 * @returns {string} SMILES string
 */
export function buildLinearSMILES(linear) {
  const { atoms, bonds = [], attachments = {} } = linear;
  const parts = [];

  atoms.forEach((atom, i) => {
    // Add bond before atom
    // For a branch attachment (single atom with bond), bonds.length === 1 and atoms.length === 1
    // In this case, bonds[0] is the bond from parent to this atom
    // For regular linear chains, bonds[i-1] is the bond between atoms[i-1] and atoms[i]
    const isBranchWithBond = atoms.length === 1 && bonds.length === 1;

    if (isBranchWithBond && i === 0) {
      // Single-atom branch with explicit bond
      parts.push(bonds[0]);
    } else if (i > 0 && bonds[i - 1]) {
      // Regular case: bond between previous and current atom
      parts.push(bonds[i - 1]);
    }

    // Add atom
    parts.push(atom);

    // Add any attachments at this position (1-indexed)
    const position = i + 1;
    if (attachments[position]) {
      attachments[position].forEach((attachment) => {
        const attachmentSMILES = buildSMILES(attachment);
        parts.push(`(${attachmentSMILES})`);
      });
    }
  });

  return parts.join('');
}

/**
 * Build SMILES for a Ring node
 * @param {Object} ring - Ring AST node
 * @returns {string} SMILES string
 */
export function buildRingSMILES(ring) {
  const {
    atoms, size, ringNumber, substitutions = {}, attachments = {}, bonds = [],
  } = ring;

  // Check if this ring crosses branch boundaries (ring closure inside a branch)
  // eslint-disable-next-line no-underscore-dangle
  const branchDepths = ring._branchDepths || [];
  const hasBranchCrossing = branchDepths.length > 0
    && branchDepths.some((d) => d !== branchDepths[0]);

  if (hasBranchCrossing) {
    // Use the branch-aware codegen for rings that cross branch boundaries
    // eslint-disable-next-line no-use-before-define
    return buildBranchCrossingRingSMILES(ring);
  }

  const parts = [];

  // Build ring with standard SMILES notation
  // Ring marker appears AFTER the first atom (standard notation)
  // Bonds array: bonds[i-1] is the bond BEFORE atom i (for i=2..size)
  // bonds[size-1] is the ring closure bond (if any)
  Array.from({ length: size }, (_, idx) => idx + 1).forEach((i) => {
    // Add bond before atom (for atoms 2 through size)
    // bonds[0] is the bond between atom 1 and atom 2
    // bonds[i-2] is the bond before atom i (for i >= 2)
    if (i > 1 && bonds[i - 2]) {
      parts.push(bonds[i - 2]);
    }

    // Get the atom at this position (base atom or substitution)
    const atom = substitutions[i] || atoms;

    // Add the atom first
    parts.push(atom);

    // Add ring opening marker after position 1 (standard SMILES)
    // Include the ring closure bond if present
    if (i === 1) {
      // Ring closure bond (bonds[size-1]) should be added before the ring marker
      const closureBond = bonds[size - 1];
      if (closureBond) {
        parts.push(closureBond);
      }
      parts.push(ringNumber.toString());
    }

    // Add ring closing marker at the last position
    if (i === size) {
      parts.push(ringNumber.toString());
    }

    // Then add attachments if any (AFTER ring markers)
    if (attachments[i]) {
      const attachmentList = attachments[i];
      attachmentList.forEach((attachment) => {
        parts.push('(');
        parts.push(buildSMILES(attachment));
        parts.push(')');
      });
    }
  });

  return parts.join('');
}

/**
 * Build SMILES for a ring that crosses branch boundaries
 * (ring closure happens inside a branch)
 */
function buildBranchCrossingRingSMILES(ring) {
  const {
    atoms, size, ringNumber, substitutions = {}, attachments = {}, bonds = [],
  } = ring;
  // eslint-disable-next-line no-underscore-dangle
  const branchDepths = ring._branchDepths || [];

  // Normalize branch depths to start from 0
  const minDepth = Math.min(...branchDepths);
  const normalizedDepths = branchDepths.map((d) => d - minDepth);

  const parts = [];
  let currentDepth = 0;

  // Build ring with branch handling
  Array.from({ length: size }, (_, idx) => idx + 1).forEach((i) => {
    const posDepth = normalizedDepths[i - 1] || 0;

    // Handle branch depth changes
    while (currentDepth < posDepth) {
      parts.push('(');
      currentDepth += 1;
    }
    // Don't close branches mid-ring - they close after the ring marker

    // Add bond before atom (for atoms 2 through size)
    if (i > 1 && bonds[i - 2]) {
      parts.push(bonds[i - 2]);
    }

    // Get the atom at this position (base atom or substitution)
    const atom = substitutions[i] || atoms;
    parts.push(atom);

    // Add ring opening marker after position 1
    if (i === 1) {
      const closureBond = bonds[size - 1];
      if (closureBond) {
        parts.push(closureBond);
      }
      parts.push(ringNumber.toString());
    }

    // Add ring closing marker at the last position (before closing branches)
    if (i === size) {
      parts.push(ringNumber.toString());
    }

    // Close branches back to the atom's depth AFTER ring markers
    // But we need to handle attachments correctly
    const nextDepth = i < size ? (normalizedDepths[i] || 0) : 0;
    while (currentDepth > nextDepth && currentDepth > 0) {
      parts.push(')');
      currentDepth -= 1;
    }

    // Add attachments after branch handling
    if (attachments[i]) {
      attachments[i].forEach((attachment) => {
        parts.push('(');
        parts.push(buildSMILES(attachment));
        parts.push(')');
      });
    }
  });

  // Close any remaining open branches
  while (currentDepth > 0) {
    parts.push(')');
    currentDepth -= 1;
  }

  return parts.join('');
}

/**
 * Build SMILES for interleaved fused rings using stored position data
 */
function buildInterleavedFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;
  // eslint-disable-next-line no-underscore-dangle
  const allPositions = fusedRing._allPositions;
  // eslint-disable-next-line no-underscore-dangle
  const rawBranchDepthMap = fusedRing._branchDepthMap || new Map();

  // Normalize branch depths - the fused ring may be inside a branch (as an attachment),
  // so we need relative depths starting from 0, not absolute depths from parsing
  const minDepth = allPositions.length > 0
    ? Math.min(...allPositions.map((pos) => rawBranchDepthMap.get(pos) || 0))
    : 0;
  const branchDepthMap = new Map();
  allPositions.forEach((pos) => {
    const rawDepth = rawBranchDepthMap.get(pos) || 0;
    branchDepthMap.set(pos, rawDepth - minDepth);
  });

  // Build the atom sequence with attachments and bonds
  const atomSequence = [];
  const ringMarkers = new Map(); // position -> [{ringNumber, type, closureBond?}]
  const bondsBefore = new Map(); // position -> bond (bond to add before atom at this position)

  // Include sequential continuation rings in addition to fused group rings
  // eslint-disable-next-line no-underscore-dangle
  const sequentialRings = fusedRing._sequentialRings || [];
  const allRings = [...rings, ...sequentialRings];

  // Track which positions have already had attachments added (to avoid duplicates)
  // When an atom is shared between multiple fused rings, each ring has the same
  // attachments, but we should only output them once
  const positionsWithAttachments = new Set();

  // Collect all ring markers, atom sequence, and bonds
  allRings.forEach((ring) => {
    // eslint-disable-next-line no-underscore-dangle
    const positions = ring._positions || [];
    // eslint-disable-next-line no-underscore-dangle
    const start = ring._start;
    // eslint-disable-next-line no-underscore-dangle
    const end = ring._end;
    const {
      ringNumber, atoms, substitutions = {}, attachments = {}, bonds = [],
    } = ring;

    // Ring opens at its first position (which is the start atom index)
    // Include the ring closure bond if present
    const closureBond = bonds[ring.size - 1] || null;
    if (!ringMarkers.has(start)) {
      ringMarkers.set(start, []);
    }
    ringMarkers.get(start).push({ ringNumber, type: 'open', closureBond });

    // Ring closes at its last position (which is the end atom index)
    if (!ringMarkers.has(end)) {
      ringMarkers.set(end, []);
    }
    ringMarkers.get(end).push({ ringNumber, type: 'close' });

    // Fill in atom values, bonds, and attachments for this ring's positions
    positions.forEach((pos, idx) => {
      const relativePos = idx + 1;
      const atomValue = substitutions[relativePos] || atoms;
      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom: atomValue, attachments: [] };
      }

      // For positions > 1 in the ring, add the bond before this atom
      // bonds[idx-1] is the bond before the (idx+1)th atom (1-indexed relative position)
      if (idx > 0 && bonds[idx - 1] && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bonds[idx - 1]);
      }

      // Add attachments at this relative position (if any)
      // Only add if we haven't already added attachments for this position
      // (shared positions between fused rings would otherwise get duplicates)
      if (attachments[relativePos] && !positionsWithAttachments.has(pos)) {
        atomSequence[pos].attachments.push(...attachments[relativePos]);
        positionsWithAttachments.add(pos);
      }
    });
  });

  // For positions that aren't in any ring (sequential continuations), we need to
  // create atomSequence entries. These are atoms that follow ring-closing atoms
  // but aren't part of the ring structure.
  // eslint-disable-next-line no-underscore-dangle
  const allRingPositions = new Set(allRings.flatMap((r) => r._positions || []));
  // eslint-disable-next-line no-underscore-dangle
  const atomValueMap = fusedRing._atomValueMap || new Map();
  // eslint-disable-next-line no-underscore-dangle
  const seqAtomAttachments = fusedRing._seqAtomAttachments || new Map();
  // eslint-disable-next-line no-underscore-dangle
  const bondMap = fusedRing._bondMap || new Map();
  allPositions.forEach((pos) => {
    if (!atomSequence[pos] && !allRingPositions.has(pos)) {
      // This is a sequential continuation atom - use stored atom value and attachments
      const atomValue = atomValueMap.get(pos) || 'C';
      const attachments = seqAtomAttachments.get(pos) || [];
      atomSequence[pos] = { atom: atomValue, attachments };
      // Also add bond for this position if present
      const bond = bondMap.get(pos);
      if (bond && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bond);
      }
    }
  });

  // Build SMILES by walking through all positions in order
  // Track branch depth to insert ( and ) correctly
  const parts = [];
  let currentDepth = 0;

  allPositions.forEach((pos, idx) => {
    const entry = atomSequence[pos];
    if (!entry) return;

    const posDepth = branchDepthMap.get(pos) || 0;

    // Handle branch depth changes
    while (currentDepth < posDepth) {
      parts.push('(');
      currentDepth += 1;
    }
    while (currentDepth > posDepth) {
      parts.push(')');
      currentDepth -= 1;
    }

    // Add bond before atom (if not first atom in the sequence)
    // Bonds CAN come right after opening paren - e.g., C(=C) means C double-bonded to branch C
    if (idx > 0 && bondsBefore.has(pos)) {
      parts.push(bondsBefore.get(pos));
    }

    // Add atom
    parts.push(entry.atom);

    // Add ring markers for this position
    const markers = ringMarkers.get(pos) || [];
    // Sort: opens first, then by ring number
    markers.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'open' ? -1 : 1;
      }
      return a.ringNumber - b.ringNumber;
    });

    markers.forEach((marker) => {
      // Add ring closure bond before ring number for opening markers
      if (marker.type === 'open' && marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    // Add attachments after ring markers
    entry.attachments.forEach((attachment) => {
      parts.push('(');
      parts.push(buildSMILES(attachment));
      parts.push(')');
    });
  });

  // Close any remaining open branches
  while (currentDepth > 0) {
    parts.push(')');
    currentDepth -= 1;
  }

  return parts.join('');
}

/**
 * Build SMILES for simple (non-interleaved) fused rings using offset approach
 */
function buildSimpleFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;

  // Sort rings by offset to process in order
  const sortedRings = [...rings].sort((a, b) => a.offset - b.offset);

  // Build atom sequence considering overlaps
  const maxEnd = Math.max(...sortedRings.map((r) => r.offset + r.size));
  const atomSequence = new Array(maxEnd);
  const ringMarkers = [];
  const bondsBefore = new Map(); // position -> bond

  // Fill atom sequence with ring atoms, bonds, and attachments
  sortedRings.forEach((ring) => {
    const {
      offset, size, atoms, substitutions = {}, attachments = {}, ringNumber, bonds = [],
    } = ring;

    // Record ring opening and closing positions with closure bond
    const closureBond = bonds[size - 1] || null;
    ringMarkers.push({
      position: offset,
      ringNumber,
      type: 'open',
      closureBond,
    });
    ringMarkers.push({
      position: offset + size - 1,
      ringNumber,
      type: 'close',
    });

    // Place atoms, bonds, and attachments
    Array.from({ length: size }, (_, idx) => idx).forEach((i) => {
      const pos = offset + i;
      const relativePos = i + 1; // 1-indexed position within the ring
      const atom = substitutions[relativePos] || atoms;

      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom, attachments: [] };
      }

      // Add bond before this atom (for atoms after the first in the ring)
      if (i > 0 && bonds[i - 1] && !bondsBefore.has(pos)) {
        bondsBefore.set(pos, bonds[i - 1]);
      }

      // Add attachments at this relative position (if any)
      // Attachments are added even if atom was already set by another ring
      if (attachments[relativePos]) {
        atomSequence[pos].attachments.push(...attachments[relativePos]);
      }
    });
  });

  // Add ring markers to the atom sequence
  ringMarkers.forEach((marker) => {
    if (!atomSequence[marker.position]) {
      atomSequence[marker.position] = { atom: null, attachments: [] };
    }
    if (!atomSequence[marker.position].markers) {
      atomSequence[marker.position].markers = [];
    }
    atomSequence[marker.position].markers.push(marker);
  });

  // Build SMILES string using standard notation
  const parts = [];
  atomSequence.forEach((entry, pos) => {
    if (!entry) return;

    const { atom, markers = [], attachments = [] } = entry;

    // Add bond before atom (if not first atom and bond exists)
    if (pos > 0 && bondsBefore.has(pos)) {
      parts.push(bondsBefore.get(pos));
    }

    if (atom) {
      parts.push(atom);
    }

    const openMarkers = markers.filter((m) => m.type === 'open');
    openMarkers.forEach((marker) => {
      // Add ring closure bond before ring number
      if (marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    const closeMarkers = markers.filter((m) => m.type === 'close');
    closeMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });

    attachments.forEach((attachment) => {
      parts.push('(');
      parts.push(buildSMILES(attachment));
      parts.push(')');
    });
  });

  return parts.join('');
}

/**
 * Build SMILES for a FusedRing node
 *
 * For interleaved fused rings (like naphthalene C1CC2CCCCC2CC1), we use
 * the stored positions to properly reconstruct the SMILES with correct
 * ring marker placement.
 *
 * @param {Object} fusedRing - FusedRing AST node
 * @returns {string} SMILES string
 */
export function buildFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;

  // Check if we have position data for interleaved fused ring handling
  // eslint-disable-next-line no-underscore-dangle
  const hasPositionData = rings.some((r) => r._positions);

  // eslint-disable-next-line no-underscore-dangle
  if (hasPositionData && fusedRing._allPositions) {
    return buildInterleavedFusedRingSMILES(fusedRing);
  }

  // Fall back to offset-based approach for simple fused rings
  return buildSimpleFusedRingSMILES(fusedRing);
}
