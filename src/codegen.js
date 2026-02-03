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
 * Build SMILES for a ring that crosses branch boundaries
 * (ring closure happens inside a branch)
 */
function buildBranchCrossingRingSMILES(ring) {
  const {
    atoms, size, ringNumber, substitutions = {}, attachments = {}, bonds = [],
  } = ring;
  const branchDepths = ring.metaBranchDepths || [];

  // Normalize branch depths to start from 0
  const minDepth = Math.min(...branchDepths);
  const normalizedDepths = branchDepths.map((d) => d - minDepth);

  const parts = [];
  let currentDepth = 0;

  // Track pending attachments that should be output after we return from deeper branches
  // Key: the POSITION's 1-indexed index in the ring, Value: { depth, attachments, isSibling }
  // Sibling attachments are output with their own parens
  // Inline continuation attachments are output without extra parens
  const pendingAttachments = new Map();

  // Build ring with branch handling
  Array.from({ length: size }, (_, idx) => idx + 1).forEach((i) => {
    const posDepth = normalizedDepths[i - 1] || 0;

    // Handle branch depth changes
    while (currentDepth < posDepth) {
      parts.push('(');
      currentDepth += 1;
    }

    // Close branches back to the atom's depth, outputting pending attachments
    while (currentDepth > posDepth) {
      // Output non-sibling attachments BEFORE closing the branch (they're inside)
      // Non-siblings at depth = currentDepth - 1 should be output now
      const toDeleteNonSibling = [];
      const targetDepthNonSibling = currentDepth - 1;

      pendingAttachments.forEach((data, attachPos) => {
        if (data.depth === targetDepthNonSibling) {
          const nonSiblings = data.attachments.filter((a) => a.metaIsSibling === false);

          nonSiblings.forEach((attachment) => {
            parts.push(buildSMILES(attachment));
          });
          // Keep only siblings for later - replace the entry instead of mutating
          const keepAttachments = data.attachments.filter((a) => a.metaIsSibling !== false);
          const newEntry = { depth: data.depth, attachments: keepAttachments };
          pendingAttachments.set(attachPos, newEntry);

          if (keepAttachments.length === 0) {
            toDeleteNonSibling.push(attachPos);
          }
        }
      });

      toDeleteNonSibling.forEach((pos) => pendingAttachments.delete(pos));

      parts.push(')');
      currentDepth -= 1;

      // Output sibling attachments AFTER closing to this depth (they're outside)
      const toDeleteSibling = [];
      const targetDepthSibling = currentDepth;

      pendingAttachments.forEach((data, attachPos) => {
        if (data.depth === targetDepthSibling) {
          data.attachments.forEach((attachment) => {
            const isSibling = attachment.metaIsSibling !== false;

            if (isSibling) {
              parts.push('(');
              parts.push(buildSMILES(attachment));
              parts.push(')');
            }
          });
          toDeleteSibling.push(attachPos);
        }
      });

      toDeleteSibling.forEach((pos) => pendingAttachments.delete(pos));
    }

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

    // Add ring closing marker at the last position
    if (i === size) {
      parts.push(ringNumber.toString());
    }

    // Check if there's an inline branch starting after this position
    // (next position has greater depth). If so, delay outputting attachments.
    const nextDepth = i < size ? (normalizedDepths[i] || 0) : 0;
    const hasInlineBranchAfter = nextDepth > posDepth;

    if (attachments[i] && attachments[i].length > 0) {
      if (hasInlineBranchAfter) {
        // Delay attachments - output after inline branch closes back to this depth
        // Both siblings and inline continuations are output when returning to posDepth
        pendingAttachments.set(i, { depth: posDepth, attachments: [...attachments[i]] });
      } else {
        // Output attachments immediately
        attachments[i].forEach((attachment) => {
          // Check if this attachment should be rendered inline (no parentheses)
          const isInline = attachment.metaIsSibling === false;
          if (!isInline) {
            parts.push('(');
          }
          parts.push(buildSMILES(attachment));
          if (!isInline) {
            parts.push(')');
          }
        });
      }
    }
  });

  // Close any remaining open branches
  while (currentDepth > 0) {
    // Output non-sibling attachments BEFORE closing the branch
    const toDeleteNonSibling = [];
    const targetDepthNonSibling = currentDepth - 1;

    pendingAttachments.forEach((data, attachPos) => {
      if (data.depth === targetDepthNonSibling) {
        const nonSiblings = data.attachments.filter((a) => a.metaIsSibling === false);

        nonSiblings.forEach((attachment) => {
          parts.push(buildSMILES(attachment));
        });
        // Keep only siblings for later - replace the entry instead of mutating
        const remainingAttachments = data.attachments.filter((a) => a.metaIsSibling !== false);
        pendingAttachments.set(attachPos, { depth: data.depth, attachments: remainingAttachments });

        if (remainingAttachments.length === 0) {
          toDeleteNonSibling.push(attachPos);
        }
      }
    });

    toDeleteNonSibling.forEach((pos) => pendingAttachments.delete(pos));

    parts.push(')');
    currentDepth -= 1;

    // Output sibling attachments AFTER closing to this depth
    const toDeleteSibling = [];
    const targetDepthSibling = currentDepth;

    pendingAttachments.forEach((data, attachPos) => {
      if (data.depth === targetDepthSibling) {
        data.attachments.forEach((attachment) => {
          const isSibling = attachment.metaIsSibling !== false;

          if (isSibling) {
            parts.push('(');
            parts.push(buildSMILES(attachment));
            parts.push(')');
          }
        });
        toDeleteSibling.push(attachPos);
      }
    });

    toDeleteSibling.forEach((pos) => pendingAttachments.delete(pos));
  }

  // Output any remaining pending attachments for depth 0 (after all branches closed)
  // Use _isSibling flag to determine if parens are needed
  pendingAttachments.forEach((data) => {
    if (data.depth === 0) {
      data.attachments.forEach((attachment) => {
        const isSibling = attachment.metaIsSibling !== false; // default to true for safety

        if (isSibling) {
          parts.push('(');
          parts.push(buildSMILES(attachment));
          parts.push(')');
        } else {
          parts.push(buildSMILES(attachment));
        }
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
    return buildInterleavedFusedRingSMILES(tempFusedRing);
  }

  // Check if this ring crosses branch boundaries (ring closure inside a branch)
  const branchDepths = ring.metaBranchDepths || [];
  const hasBranchCrossing = branchDepths.length > 0
    && branchDepths.some((d) => d !== branchDepths[0]);

  if (hasBranchCrossing) {
    // Use the branch-aware codegen for rings that cross branch boundaries
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
 * Build SMILES for interleaved fused rings using stored position data
 */
function buildInterleavedFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;
  const allPositions = fusedRing.metaAllPositions;
  const rawBranchDepthMap = fusedRing.metaBranchDepthMap || new Map();

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
  const sequentialRings = fusedRing.metaSequentialRings || [];
  const allRings = [...rings, ...sequentialRings];

  // Track which positions have already had attachments added (to avoid duplicates)
  // When an atom is shared between multiple fused rings, each ring has the same
  // attachments, but we should only output them once
  const positionsWithAttachments = new Set();

  // Collect all ring markers, atom sequence, and bonds
  allRings.forEach((ring) => {
    const positions = ring.metaPositions || [];
    const start = ring.metaStart;
    const end = ring.metaEnd;
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
  const allRingPositions = new Set(allRings.flatMap((r) => r.metaPositions || []));
  const atomValueMap = fusedRing.metaAtomValueMap || new Map();
  const seqAtomAttachments = fusedRing.metaSeqAtomAttachments || new Map();
  const bondMap = fusedRing.metaBondMap || new Map();
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

  // Track pending attachments that should be output after inline branches close
  // Map of depth -> array of attachments to output when returning to that depth
  const pendingAttachments = new Map();

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

      // Check if we have pending attachments for this depth
      if (pendingAttachments.has(currentDepth)) {
        const attachmentsToOutput = pendingAttachments.get(currentDepth);
        attachmentsToOutput.forEach((attachment) => {
          // Check if this attachment should be rendered inline (no parentheses)
          const isInline = attachment.metaIsSibling === false;
          if (!isInline) {
            parts.push('(');
          }
          parts.push(buildSMILES(attachment));
          if (!isInline) {
            parts.push(')');
          }
        });
        pendingAttachments.delete(currentDepth);
      }
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

    // Sort markers: opens first, then by original order from SMILES
    // The ringOrderMap stores the order of ring markers as they appeared in the original
    const ringOrderMap = fusedRing.metaRingOrderMap || new Map();
    const originalOrder = ringOrderMap.get(pos) || [];

    markers.sort((a, b) => {
      // Opens always come before closes
      if (a.type !== b.type) {
        return a.type === 'open' ? -1 : 1;
      }
      // For same type, use original order from SMILES if available
      const aIdx = originalOrder.indexOf(a.ringNumber);
      const bIdx = originalOrder.indexOf(b.ringNumber);
      if (aIdx !== -1 && bIdx !== -1) {
        return aIdx - bIdx;
      }
      // Fallback to ring number order
      return a.ringNumber - b.ringNumber;
    });

    markers.forEach((marker) => {
      // Add ring closure bond before ring number for opening markers
      if (marker.type === 'open' && marker.closureBond) {
        parts.push(marker.closureBond);
      }
      parts.push(marker.ringNumber.toString());
    });

    // Check if there's an inline branch starting after this position
    // (next position has greater depth). If so, delay outputting attachments
    // until the branch closes back to this depth.
    const nextPos = allPositions[idx + 1];
    const nextDepth = nextPos !== undefined ? (branchDepthMap.get(nextPos) || 0) : posDepth;
    const hasInlineBranchAfter = nextDepth > posDepth;

    if (entry.attachments.length > 0) {
      if (hasInlineBranchAfter) {
        // Delay attachments until after the inline branch closes
        if (!pendingAttachments.has(posDepth)) {
          pendingAttachments.set(posDepth, []);
        }
        pendingAttachments.get(posDepth).push(...entry.attachments);
      } else {
        // Output attachments immediately
        entry.attachments.forEach((attachment) => {
          // Check if this attachment should be rendered inline (no parentheses)
          const isInline = attachment.metaIsSibling === false;
          if (!isInline) {
            parts.push('(');
          }
          parts.push(buildSMILES(attachment));
          if (!isInline) {
            parts.push(')');
          }
        });
      }
    }
  });

  // Close any remaining open branches
  while (currentDepth > 0) {
    parts.push(')');
    currentDepth -= 1;

    // Check if we have pending attachments for this depth
    if (pendingAttachments.has(currentDepth)) {
      const attachmentsToOutput = pendingAttachments.get(currentDepth);
      attachmentsToOutput.forEach((attachment) => {
        // Check if this attachment should be rendered inline (no parentheses)
        const isInline = attachment.metaIsSibling === false;
        if (!isInline) {
          parts.push('(');
        }
        parts.push(buildSMILES(attachment));
        if (!isInline) {
          parts.push(')');
        }
      });
      pendingAttachments.delete(currentDepth);
    }
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
      // Check if this attachment should be rendered inline (no parentheses)
      // This happens for sequential continuation atoms after ring closures
      const isInline = attachment.metaIsSibling === false;
      if (!isInline) {
        parts.push('(');
      }
      parts.push(buildSMILES(attachment));
      if (!isInline) {
        parts.push(')');
      }
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
  const hasPositionData = rings.some((r) => r.metaPositions);

  if (hasPositionData && fusedRing.metaAllPositions) {
    return buildInterleavedFusedRingSMILES(fusedRing);
  }

  // Fall back to offset-based approach for simple fused rings
  return buildSimpleFusedRingSMILES(fusedRing);
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
