/**
 * Shared branch-depth walking utility for SMILES code generation.
 * Used by both interleaved-fused-ring and branch-crossing-ring builders.
 */

/**
 * Normalize an array or Map of branch depths so the minimum is 0.
 * @param {Array|Map} depths - Branch depths (array indexed by position, or Map<pos, depth>)
 * @param {Array} [positions] - If depths is a Map, the positions to consider
 * @returns {Map<number, number>|Array<number>} Normalized depths in the same format
 */
export function normalizeBranchDepths(depths, positions) {
  if (depths instanceof Map) {
    const minDepth = positions && positions.length > 0
      ? Math.min(...positions.map((pos) => depths.get(pos) || 0))
      : 0;
    const normalized = new Map();
    positions.forEach((pos) => {
      normalized.set(pos, (depths.get(pos) || 0) - minDepth);
    });
    return normalized;
  }
  // Array form
  const minDepth = Math.min(...depths);
  return depths.map((d) => d - minDepth);
}

/**
 * Output attachment SMILES with or without branch parentheses.
 * @param {Array} parts - The parts array to push to
 * @param {Object} attachment - The attachment AST node
 * @param {Function} buildSMILES - SMILES builder function
 */
export function emitAttachment(parts, attachment, buildSMILES) {
  const isInline = attachment.metaIsSibling === false;
  if (!isInline) {
    parts.push('(');
  }
  parts.push(buildSMILES(attachment));
  if (!isInline) {
    parts.push(')');
  }
}

/**
 * Open branches by pushing '(' until currentDepth reaches targetDepth.
 * @param {Array} parts - The parts array to push to
 * @param {{ value: number }} depthRef - Mutable ref for current depth
 * @param {number} targetDepth - The depth to reach
 */
export function openBranches(parts, depthRef, targetDepth) {
  while (depthRef.value < targetDepth) {
    parts.push('(');
    // eslint-disable-next-line no-param-reassign
    depthRef.value += 1;
  }
}

/**
 * Close branches for interleaved fused rings (simpler model).
 * Closes from currentDepth down to targetDepth, emitting pending attachments
 * after each ')' at the matching depth.
 *
 * @param {Array} parts - The parts array to push to
 * @param {{ value: number }} depthRef - Mutable ref for current depth
 * @param {number} targetDepth - The depth to reach
 * @param {Map} pendingAttachments - Map of depth -> attachment[] to emit on close
 * @param {Function} buildSMILES - SMILES builder function
 */
// eslint-disable-next-line max-len
export function closeBranchesInterleaved(parts, depthRef, targetDepth, pendingAttachments, buildSMILES) {
  while (depthRef.value > targetDepth) {
    parts.push(')');
    // eslint-disable-next-line no-param-reassign
    depthRef.value -= 1;

    if (pendingAttachments.has(depthRef.value)) {
      const attachmentsToOutput = pendingAttachments.get(depthRef.value);
      attachmentsToOutput.forEach((attachment) => {
        emitAttachment(parts, attachment, buildSMILES);
      });
      pendingAttachments.delete(depthRef.value);
    }
  }
}

/**
 * Close branches for branch-crossing rings (complex sibling/non-sibling model).
 * Non-sibling attachments are emitted BEFORE ')' (inside the branch),
 * sibling attachments are emitted AFTER ')' (outside the branch).
 *
 * @param {Array} parts - The parts array to push to
 * @param {{ value: number }} depthRef - Mutable ref for current depth
 * @param {number} targetDepth - The depth to reach
 * @param {Map} pendingAttachments - Map of position -> { depth, attachments } to emit on close
 * @param {Function} buildSMILES - SMILES builder function
 */
// eslint-disable-next-line max-len
export function closeBranchesCrossing(parts, depthRef, targetDepth, pendingAttachments, buildSMILES) {
  while (depthRef.value > targetDepth) {
    // Output non-sibling attachments BEFORE closing the branch (they're inside)
    const toDeleteNonSibling = [];
    const targetDepthNonSibling = depthRef.value - 1;

    pendingAttachments.forEach((data, attachPos) => {
      if (data.depth === targetDepthNonSibling) {
        const nonSiblings = data.attachments.filter((a) => a.metaIsSibling === false);
        nonSiblings.forEach((attachment) => {
          parts.push(buildSMILES(attachment));
        });
        const keepAttachments = data.attachments.filter((a) => a.metaIsSibling !== false);
        pendingAttachments.set(attachPos, { depth: data.depth, attachments: keepAttachments });
        if (keepAttachments.length === 0) {
          toDeleteNonSibling.push(attachPos);
        }
      }
    });
    toDeleteNonSibling.forEach((pos) => pendingAttachments.delete(pos));

    parts.push(')');
    // eslint-disable-next-line no-param-reassign
    depthRef.value -= 1;

    // Output sibling attachments AFTER closing to this depth (they're outside)
    const toDeleteSibling = [];
    const targetDepthSibling = depthRef.value;

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
}
