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
 * Build SMILES for a Molecule node
 * @param {Object} molecule - Molecule AST node
 * @returns {string} SMILES string
 */
export function buildMoleculeSMILES(molecule) {
  // eslint-disable-next-line no-use-before-define
  const parts = molecule.components.map((component) => buildSMILES(component));
  return parts.join('');
}

/**
 * Build SMILES for a Linear chain node
 * @param {Object} linear - Linear AST node
 * @returns {string} SMILES string
 */
export function buildLinearSMILES(linear) {
  const { atoms, bonds = [] } = linear;
  const parts = [];

  atoms.forEach((atom, i) => {
    if (i > 0 && bonds[i - 1]) {
      parts.push(bonds[i - 1]);
    }
    parts.push(atom);
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

  // Build ring with opening marker
  Array.from({ length: size }, (_, idx) => idx + 1).forEach((i) => {
    // Add ring opening marker at position 1
    if (i === 1) {
      parts.push(ringNumber.toString());
    }

    // Get the atom at this position (base atom or substitution)
    const atom = substitutions[i] || atoms;

    // Add the atom first
    parts.push(atom);

    // Then add attachments if any
    if (attachments[i]) {
      const attachmentList = attachments[i];
      attachmentList.forEach((attachment) => {
        parts.push('(');
        // eslint-disable-next-line no-use-before-define
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
 * Build SMILES for a FusedRing node
 * @param {Object} fusedRing - FusedRing AST node
 * @returns {string} SMILES string
 */
export function buildFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;

  // Sort rings by offset to process in order
  const sortedRings = [...rings].sort((a, b) => a.offset - b.offset);

  // Build atom sequence considering overlaps
  const maxEnd = Math.max(...sortedRings.map((r) => r.offset + r.size));
  const atomSequence = new Array(maxEnd);
  const ringMarkers = [];

  // Fill atom sequence with ring atoms
  sortedRings.forEach((ring) => {
    const {
      offset, size, atoms, substitutions = {}, ringNumber,
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

    // Place atoms
    Array.from({ length: size }, (_, idx) => idx).forEach((i) => {
      const pos = offset + i;
      const relativePos = i + 1; // 1-indexed position within the ring
      const atom = substitutions[relativePos] || atoms;

      if (!atomSequence[pos]) {
        atomSequence[pos] = { atom, attachments: [] };
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

  // Build SMILES string
  const parts = [];
  atomSequence.forEach((entry) => {
    if (!entry) return;

    const { atom, markers = [], attachments = [] } = entry;

    // Add opening ring markers
    const openMarkers = markers.filter((m) => m.type === 'open');
    openMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });

    // Add attachments
    attachments.forEach((attachment) => {
      parts.push('(');
      // eslint-disable-next-line no-use-before-define
      parts.push(buildSMILES(attachment));
      parts.push(')');
    });

    // Add atom
    if (atom) {
      parts.push(atom);
    }

    // Add closing ring markers
    const closeMarkers = markers.filter((m) => m.type === 'close');
    closeMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });
  });

  return parts.join('');
}

/**
 * Main entry point: Convert any AST node to SMILES string
 * @param {Object} ast - AST node
 * @returns {string} SMILES string
 */
export function buildSMILES(ast) {
  if (isMoleculeNode(ast)) {
    return buildMoleculeSMILES(ast);
  }
  if (isFusedRingNode(ast)) {
    return buildFusedRingSMILES(ast);
  }
  if (isRingNode(ast)) {
    return buildRingSMILES(ast);
  }
  if (isLinearNode(ast)) {
    return buildLinearSMILES(ast);
  }
  throw new Error(`Unknown AST node type: ${ast?.type}`);
}
