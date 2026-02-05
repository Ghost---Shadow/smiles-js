/**
 * SMILES Code Generator / Serializer
 * Converts AST nodes back to SMILES strings
 */

import {
  isMoleculeNode,
  isFusedRingNode,
  isRingNode,
  isLinearNode,
} from '../ast.js';
import { buildBranchCrossingRingSMILES } from './branch-crossing-ring.js';
import { buildInterleavedFusedRingSMILES } from './interleaved-fused-ring.js';
import { buildSimpleFusedRingSMILES } from './simple-fused-ring.js';

// Forward declaration to allow mutual recursion without violating no-use-before-define
let buildSMILESInternal;

/**
 * Main entry point: Convert any AST node to SMILES string
 * @param {Object} ast - AST node
 * @returns {string} SMILES string
 */
export function buildSMILES(ast) {
  return buildSMILESInternal(ast);
}

/**
 * Build SMILES for a Molecule node
 * @param {Object} molecule - Molecule AST node
 * @returns {string} SMILES string
 */
export function buildMoleculeSMILES(molecule) {
  const parts = molecule.components.map((component, idx) => {
    const smiles = buildSMILES(component);
    // Check if component has a leading bond (connecting to previous component)
    const leadingBond = idx > 0 && component.metaLeadingBond ? component.metaLeadingBond : '';

    return leadingBond + smiles;
  });
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

  // Bond array format varies:
  // - Branch: bonds.length === atoms.length, bonds[i] is bond BEFORE atoms[i]
  // - Main chain: bonds.length === atoms.length - 1, bonds[i] is bond BETWEEN atoms[i] and atoms[i+1]
  const isBranchFormat = bonds.length === atoms.length;

  atoms.forEach((atom, i) => {
    // Add bond before atom
    if (isBranchFormat) {
      // Branch format: bonds[i] is the bond before atoms[i]
      if (bonds[i]) {
        parts.push(bonds[i]);
      }
    } else {
      // Main chain format: bonds[i] is bond between atoms[i] and atoms[i+1]
      // So for atoms[i], we need bonds[i-1]
      if (i > 0 && bonds[i - 1]) {
        parts.push(bonds[i - 1]);
      }
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

  // Check if this ring has sequential ring metadata (from a single-ring FusedRing)
  // If so, treat it like an interleaved fused ring
  const hasSequentialRings = ring.metaSequentialRings && ring.metaSequentialRings.length > 0;
  if (hasSequentialRings && ring.metaAllPositions) {
    // Treat this as a fused ring with sequential rings
    // Build a temporary fused ring structure for codegen
    const tempFusedRing = {
      rings: [ring],
      metaSequentialRings: ring.metaSequentialRings,
      metaAllPositions: ring.metaAllPositions,
      metaBranchDepthMap: ring.metaBranchDepthMap,
      metaAtomValueMap: ring.metaAtomValueMap,
      metaBondMap: ring.metaBondMap,
      metaSeqAtomAttachments: ring.metaSeqAtomAttachments,
      metaRingOrderMap: ring.metaRingOrderMap,
    };
    return buildInterleavedFusedRingSMILES(tempFusedRing, buildSMILES);
  }

  // Check if this ring crosses branch boundaries (ring closure inside a branch)
  const branchDepths = ring.metaBranchDepths || [];
  const hasBranchCrossing = branchDepths.length > 0
    && branchDepths.some((d) => d !== branchDepths[0]);

  if (hasBranchCrossing) {
    // Use the branch-aware codegen for rings that cross branch boundaries
    return buildBranchCrossingRingSMILES(ring, buildSMILES);
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
  const hasPositionData = rings.some((r) => r.metaPositions);

  if (hasPositionData && fusedRing.metaAllPositions) {
    return buildInterleavedFusedRingSMILES(fusedRing, buildSMILES);
  }

  // Fall back to offset-based approach for simple fused rings
  return buildSimpleFusedRingSMILES(fusedRing, buildSMILES);
}

// Initialize the internal dispatcher after all functions are defined
buildSMILESInternal = function buildSMILESInternalImpl(ast) {
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
};
