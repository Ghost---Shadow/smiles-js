/**
 * Branch-Crossing Ring SMILES Builder
 * Handles rings that cross branch boundaries
 */

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
        // Compute metaIsSibling for each attachment if not set
        const processedAttachments = attachments[i].map((att) => {
          // If metaIsSibling is already set, use it
          if (att.metaIsSibling !== undefined) {
            return att;
          }
          // Otherwise, infer it: for branch-crossing rings, attachments at positions
          // where an inline branch opens should be inline continuations
          // (metaIsSibling = false means inline)
          const cloned = { ...att, metaIsSibling: false };
          return cloned;
        });
        pendingAttachments.set(i, { depth: posDepth, attachments: processedAttachments });
      } else {
        // Output attachments immediately
        attachments[i].forEach((attachment) => {
          // Check if this attachment should be rendered inline (no parentheses)
          // If metaIsSibling is not set, assume it's NOT inline (regular sibling)
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
