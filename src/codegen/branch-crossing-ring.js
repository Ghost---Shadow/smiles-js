/**
 * Branch-Crossing Ring SMILES Builder
 * Handles rings that cross branch boundaries
 */

import {
  normalizeBranchDepths,
  emitAttachment,
  openBranches,
  closeBranchesCrossing,
} from './branch-walker.js';

/**
 * Build SMILES for a ring that crosses branch boundaries
 * (ring closure happens inside a branch)
 * @param {Object} ring - Ring AST node
 * @param {Function} buildSMILES - Reference to main buildSMILES function
 * @returns {string} SMILES string
 */
export function buildBranchCrossingRingSMILES(ring, buildSMILES) {
  const {
    atoms, size, ringNumber, substitutions = {}, attachments = {}, bonds = [],
  } = ring;
  const branchDepths = ring.metaBranchDepths || [];

  // Normalize branch depths to start from 0
  const normalizedDepths = normalizeBranchDepths(branchDepths);

  const parts = [];

  // Add leading bond if present (e.g., C(=C2...) has = before the ring)
  if (ring.metaLeadingBond) {
    parts.push(ring.metaLeadingBond);
  }

  const depthRef = { value: 0 };

  // Track pending attachments that should be output after we return from deeper branches
  // Key: the POSITION's 1-indexed index in the ring, Value: { depth, attachments, isSibling }
  const pendingAttachments = new Map();

  // Build ring with branch handling
  Array.from({ length: size }, (_, idx) => idx + 1).forEach((i) => {
    const posDepth = normalizedDepths[i - 1] || 0;

    // Handle branch depth changes
    openBranches(parts, depthRef, posDepth);
    closeBranchesCrossing(parts, depthRef, posDepth, pendingAttachments, buildSMILES);

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
    const nextDepth = i < size ? (normalizedDepths[i] || 0) : 0;
    const hasInlineBranchAfter = nextDepth > posDepth;

    if (attachments[i] && attachments[i].length > 0) {
      if (hasInlineBranchAfter) {
        // Delay attachments - output after inline branch closes back to this depth
        const processedAttachments = attachments[i].map((att) => {
          if (att.metaIsSibling !== undefined) {
            return att;
          }
          return { ...att, metaIsSibling: true };
        });
        pendingAttachments.set(i, { depth: posDepth, attachments: processedAttachments });
      } else {
        // Output attachments immediately
        attachments[i].forEach((attachment) => {
          emitAttachment(parts, attachment, buildSMILES);
        });
      }
    }
  });

  // Close any remaining open branches
  closeBranchesCrossing(parts, depthRef, 0, pendingAttachments, buildSMILES);

  // Output any remaining pending attachments for depth 0 (after all branches closed)
  pendingAttachments.forEach((data) => {
    if (data.depth === 0) {
      data.attachments.forEach((attachment) => {
        const isSibling = attachment.metaIsSibling !== false;
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
