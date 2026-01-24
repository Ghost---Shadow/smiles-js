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
 *
 * Strategy:
 * 1. Build a linear atom sequence covering all fused rings
 * 2. Track which ring markers (open/close) appear at each position
 * 3. Serialize by walking the atom sequence and emitting:
 *    - Atom
 *    - Ring markers after the atom (standard SMILES notation)
 *    - Attachments in parentheses
 *
 * Example: Naphthalene C1=CC2=CC=CC=C2C=C1
 * - Ring 1 spans positions 0-9 (10 atoms)
 * - Ring 2 spans positions 2-7 (6 atoms, fused at offset 2)
 * - Ring markers: 1 after pos 0, 2 after pos 2, 2 after pos 7, 1 after pos 9
 *
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

  // Build SMILES string using standard notation
  // Standard SMILES: atom comes first, then ring markers
  const parts = [];
  atomSequence.forEach((entry) => {
    if (!entry) return;

    const { atom, markers = [], attachments = [] } = entry;

    // Add atom first (standard SMILES)
    if (atom) {
      parts.push(atom);
    }

    // Add ring markers after the atom (standard SMILES)
    // Opening markers first
    const openMarkers = markers.filter((m) => m.type === 'open');
    openMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });

    // Then closing markers
    const closeMarkers = markers.filter((m) => m.type === 'close');
    closeMarkers.forEach((marker) => {
      parts.push(marker.ringNumber.toString());
    });

    // Add attachments last
    attachments.forEach((attachment) => {
      parts.push('(');
      // eslint-disable-next-line no-use-before-define
      parts.push(buildSMILES(attachment));
      parts.push(')');
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
