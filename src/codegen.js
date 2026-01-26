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
    atoms, size, ringNumber, substitutions = {}, attachments = {},
  } = ring;
  const parts = [];

  // Build ring with standard SMILES notation
  // Ring marker appears AFTER the first atom (standard notation)
  Array.from({ length: size }, (_, idx) => idx + 1).forEach((i) => {
    // Get the atom at this position (base atom or substitution)
    const atom = substitutions[i] || atoms;

    // Add the atom first
    parts.push(atom);

    // Add ring opening marker after position 1 (standard SMILES)
    if (i === 1) {
      parts.push(ringNumber.toString());
    }

    // Then add attachments if any
    if (attachments[i]) {
      const attachmentList = attachments[i];
      attachmentList.forEach((attachment) => {
        parts.push('(');
        parts.push(buildSMILES(attachment));
        parts.push(')');
      });
    }

    // Add ring closing marker at the last position
    if (i === size) {
      parts.push(ringNumber.toString());
    }
  });

  return parts.join('');
}

/**
 * Build SMILES for interleaved fused rings using stored position data
 */
function buildInterleavedFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;
  // eslint-disable-next-line no-underscore-dangle
  const allPositions = fusedRing._allPositions;

  // Build the atom sequence with attachments
  const atomSequence = [];
  const ringMarkers = new Map(); // position -> [{ringNumber, type}]

  // Collect all ring markers and build atom sequence
  rings.forEach((ring) => {
    // eslint-disable-next-line no-underscore-dangle
    const positions = ring._positions || [];
    // eslint-disable-next-line no-underscore-dangle
    const start = ring._start;
    // eslint-disable-next-line no-underscore-dangle
    const end = ring._end;
    const {
      ringNumber, atoms, substitutions = {}, attachments = {},
    } = ring;

    // Ring opens at its first position (which is the start atom index)
    if (!ringMarkers.has(start)) {
      ringMarkers.set(start, []);
    }
    ringMarkers.get(start).push({ ringNumber, type: 'open' });

    // Ring closes at its last position (which is the end atom index)
    if (!ringMarkers.has(end)) {
      ringMarkers.set(end, []);
    }
    ringMarkers.get(end).push({ ringNumber, type: 'close' });

    // Fill in atom values and attachments for this ring's positions
    positions.forEach((pos, idx) => {
      const relativePos = idx + 1;
      const atomValue = substitutions[relativePos] || atoms;
      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom: atomValue, attachments: [] };
      }
      // Add attachments at this relative position (if any)
      if (attachments[relativePos]) {
        atomSequence[pos].attachments.push(...attachments[relativePos]);
      }
    });
  });

  // Build SMILES by walking through all positions in order
  const parts = [];
  allPositions.forEach((pos) => {
    const entry = atomSequence[pos];
    if (!entry) return;

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
      parts.push(marker.ringNumber.toString());
    });

    // Add attachments after ring markers
    entry.attachments.forEach((attachment) => {
      parts.push('(');
      parts.push(buildSMILES(attachment));
      parts.push(')');
    });
  });

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

  // Fill atom sequence with ring atoms and attachments
  sortedRings.forEach((ring) => {
    const {
      offset, size, atoms, substitutions = {}, attachments = {}, ringNumber,
    } = ring;

    // Record ring opening and closing positions
    ringMarkers.push({
      position: offset,
      ringNumber,
      type: 'open',
    });
    ringMarkers.push({
      position: offset + size - 1,
      ringNumber,
      type: 'close',
    });

    // Place atoms and attachments
    Array.from({ length: size }, (_, idx) => idx).forEach((i) => {
      const pos = offset + i;
      const relativePos = i + 1; // 1-indexed position within the ring
      const atom = substitutions[relativePos] || atoms;

      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom, attachments: [] };
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
  atomSequence.forEach((entry) => {
    if (!entry) return;

    const { atom, markers = [], attachments = [] } = entry;

    if (atom) {
      parts.push(atom);
    }

    const openMarkers = markers.filter((m) => m.type === 'open');
    openMarkers.forEach((marker) => {
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
