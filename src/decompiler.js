/**
 * Decompiler - Converts AST nodes to JavaScript constructor code
 * This allows users to see the programmatic construction of molecules
 */

import {
  isMoleculeNode,
  isFusedRingNode,
  isRingNode,
  isLinearNode,
} from './ast.js';

// Helper to call decompileNode (satisfies no-loop-func rule)
function decompileChildNode(node, indent, nextVar) {
  // eslint-disable-next-line no-use-before-define
  return decompileNode(node, indent, nextVar);
}

/**
 * Counter-based variable name generator
 */
function createCounter(prefix) {
  let count = 0;
  return () => {
    count += 1;
    return `${prefix}${count}`;
  };
}

/**
 * Format a bonds array as a string for code generation
 */
function formatBondsArray(bonds) {
  return bonds.map((b) => (b === null ? 'null' : `'${b}'`)).join(', ');
}

/**
 * Build the Ring constructor options object as a code string
 * @param {Object} ring - Ring node
 * @param {Object} opts - Options
 * @param {boolean} opts.includeBranchDepths - Whether to include branchDepths
 * @returns {Object} { options, optionsStr } - Options object and formatted string
 */
function buildRingOptions(ring, opts = {}) {
  const { includeBranchDepths = false } = opts;
  const options = {
    atoms: `'${ring.atoms}'`,
    size: ring.size,
  };

  if (ring.ringNumber !== 1) {
    options.ringNumber = ring.ringNumber;
  }

  if (ring.offset !== 0) {
    options.offset = ring.offset;
  }

  // Include bonds if present and not all null
  const bonds = ring.bonds || [];
  const hasNonNullBonds = bonds.some((b) => b !== null);
  if (hasNonNullBonds) {
    options.bonds = `[${formatBondsArray(bonds)}]`;
  }

  // Include branchDepths for branch-crossing rings
  // e.g., Ring with branchDepths [0, 0, 0, 0, 1, 1] means the ring path
  // crosses from depth 0 to depth 1 (enters a branch for closing atoms)
  // This is needed to correctly serialize rings like CC2=CC=C(C=C2)
  if (includeBranchDepths && ring.metaBranchDepths && ring.metaBranchDepths.length > 0) {
    const firstDepth = ring.metaBranchDepths[0];
    const hasVaryingDepths = ring.metaBranchDepths.some((d) => d !== firstDepth);
    if (hasVaryingDepths) {
      options.branchDepths = `[${ring.metaBranchDepths.join(', ')}]`;
    }
  }

  // Include leadingBond if present (bond before the ring in the SMILES)
  if (ring.metaLeadingBond) {
    options.leadingBond = `'${ring.metaLeadingBond}'`;
  }

  const optionsStr = Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return { options, optionsStr };
}

/**
 * Generate code for ring substitutions
 * @returns {{ lines: string[], currentVar: string }}
 */
function generateSubstitutionCode(ring, indent, nextVar, initialVar) {
  const lines = [];
  let currentVar = initialVar;

  if (Object.keys(ring.substitutions).length > 0) {
    Object.entries(ring.substitutions).forEach(([pos, atom]) => {
      const newVar = nextVar();
      lines.push(`${indent}const ${newVar} = ${currentVar}.substitute(${pos}, '${atom}');`);
      currentVar = newVar;
    });
  }

  return { lines, currentVar };
}

/**
 * Generate code for ring attachments
 * @returns {{ lines: string[], currentVar: string }}
 */
function generateAttachmentCode(ring, indent, nextVar, initialVar) {
  const lines = [];
  let currentVar = initialVar;

  if (ring.attachments && Object.keys(ring.attachments).length > 0) {
    Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        const attachResult = decompileChildNode(attachment, indent, nextVar);
        lines.push(attachResult.code);

        const newVar = nextVar();
        const isSibling = attachment.metaIsSibling;
        if (isSibling === true) {
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${pos}, ${attachResult.finalVar}, { sibling: true });`);
        } else if (isSibling === false) {
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${pos}, ${attachResult.finalVar}, { sibling: false });`);
        } else {
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${pos}, ${attachResult.finalVar});`);
        }
        currentVar = newVar;
      });
    });
  }

  return { lines, currentVar };
}

/**
 * Decompile a Ring node
 */
function decompileRing(ring, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

  // Build options object (include branchDepths for full decompilation)
  const { optionsStr } = buildRingOptions(ring, { includeBranchDepths: true });
  lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

  // Add substitutions
  const { lines: subLines, currentVar: subVar } = generateSubstitutionCode(
    ring,
    indent,
    nextVar,
    varName,
  );
  lines.push(...subLines);
  let currentVar = subVar;

  // Add attachments
  const { lines: attLines, currentVar: attVar } = generateAttachmentCode(
    ring,
    indent,
    nextVar,
    currentVar,
  );
  lines.push(...attLines);
  currentVar = attVar;

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Decompile a Linear node
 */
function decompileLinear(linear, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

  const atomsStr = linear.atoms.map((a) => `'${a}'`).join(', ');

  // Only include bonds array if there are non-null bonds
  const hasNonNullBonds = linear.bonds.some((b) => b !== null);
  const hasLeadingBond = linear.metaLeadingBond !== undefined;

  if (hasNonNullBonds && hasLeadingBond) {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [${formatBondsArray(linear.bonds)}], {}, '${linear.metaLeadingBond}');`);
  } else if (hasNonNullBonds) {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [${formatBondsArray(linear.bonds)}]);`);
  } else if (hasLeadingBond) {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [], {}, '${linear.metaLeadingBond}');`);
  } else {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}]);`);
  }

  let currentVar = varName;

  // Add attachments
  if (Object.keys(linear.attachments).length > 0) {
    Object.entries(linear.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        // eslint-disable-next-line no-use-before-define
        const attachRes = decompileNode(attachment, indent, nextVar);
        const { code: aCode, finalVar: aFinalVar } = attachRes;
        lines.push(aCode);

        const newVar = nextVar();
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${pos}, ${aFinalVar});`);
        currentVar = newVar;
      });
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Check if a fused ring needs the interleaved codegen path.
 * Returns true if the offset-based simple codegen cannot represent the ring topology.
 * Checks: (1) computed offsets cover all positions, (2) overlap between adjacent rings
 * from offsets matches the actual shared positions from metaPositions.
 */
function needsInterleavedCodegen(fusedRing) {
  const allPositions = fusedRing.metaAllPositions;
  if (!allPositions || allPositions.length === 0) return false;

  const posToIndex = new Map();
  allPositions.forEach((pos, idx) => { posToIndex.set(pos, idx); });

  // Compute offsets from positions
  const offsets = fusedRing.rings.map((ring) => {
    const positions = ring.metaPositions;
    if (!positions || positions.length === 0) return ring.offset || 0;
    return posToIndex.get(positions[0]) || 0;
  });

  // Check 1: If the max extent from offsets doesn't match total positions,
  // the ring topology can't be represented by offsets alone
  const maxEnd = Math.max(...offsets.map((o, i) => o + fusedRing.rings[i].size));
  if (maxEnd !== allPositions.length) return true;

  // Check 2: For each pair of rings, verify that the overlap predicted by offsets
  // matches the actual shared positions from metaPositions.
  // When offsets predict N shared atoms but the parser saw M shared atoms (N !== M),
  // the simple codegen will produce a structurally different ring system.
  for (let i = 0; i < fusedRing.rings.length; i += 1) {
    const ringA = fusedRing.rings[i];
    const posA = ringA.metaPositions;
    if (posA && posA.length > 0) {
      const setA = new Set(posA);

      for (let j = i + 1; j < fusedRing.rings.length; j += 1) {
        const ringB = fusedRing.rings[j];
        const posB = ringB.metaPositions;
        if (posB && posB.length > 0) {
          // Count actual shared positions between rings
          const actualOverlap = posB.filter((p) => setA.has(p)).length;

          // Predict overlap from offsets: two rings overlap if their offset ranges intersect
          const startA = offsets[i];
          const endA = offsets[i] + ringA.size;
          const startB = offsets[j];
          const endB = offsets[j] + ringB.size;
          const overlapStart = Math.max(startA, startB);
          const overlapEnd = Math.min(endA, endB);
          const predictedOverlap = Math.max(0, overlapEnd - overlapStart);

          if (predictedOverlap !== actualOverlap) return true;
        }
      }
    }
  }

  // Check 3: At positions where multiple rings close, verify the parser's ring closure
  // order matches ascending ring number (which is what the simple codegen produces).
  // If not, the simple path will produce different SMILES.
  const ringOrderMap = fusedRing.metaRingOrderMap;
  if (ringOrderMap) {
    // Build a set of closing positions per ring from offsets
    const closePositions = new Map(); // offset-position → [ringNumbers]
    fusedRing.rings.forEach((ring, idx) => {
      const closePos = offsets[idx] + ring.size - 1;
      if (!closePositions.has(closePos)) closePositions.set(closePos, []);
      closePositions.get(closePos).push(ring.ringNumber);
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const [, ringNums] of closePositions) {
      if (ringNums.length >= 2) {
        // Simple codegen sorts ascending
        const simpleOrder = [...ringNums].sort((a, b) => a - b);
        // Check if parser's ring order at this position differs
        // Find the corresponding parser position for this offset-position
        const offsetPos = [...closePositions.keys()]
          .find((k) => closePositions.get(k) === ringNums);
        const parserPos = allPositions[offsetPos];
        const parserOrder = ringOrderMap.get(parserPos);
        if (parserOrder) {
          // Extract only close markers (ring numbers that appear at the END of ring traversal)
          const closeRingNums = parserOrder.filter((rn) => ringNums.includes(rn));
          // Deduplicate while preserving order (a ring number appears twice = open+close)
          const seen = new Map(); // rn -> count
          closeRingNums.forEach((rn) => {
            const count = (seen.get(rn) || 0) + 1;
            seen.set(rn, count);
            // The second occurrence is the close marker
            if (count === 2 || !ringNums.includes(rn)) {
              // Actually just check: is the last occurrence's order different from ascending?
            }
          });
          // Simpler: just check if the ring numbers at this position, when sorted ascending,
          // produce the same last-occurrence order as the parser
          const lastOccurrence = [];
          const rnCount = new Map();
          parserOrder.forEach((rn) => {
            if (!ringNums.includes(rn)) return;
            rnCount.set(rn, (rnCount.get(rn) || 0) + 1);
          });
          // Ring numbers that appear only once at a close position are close markers
          // Ring numbers that appear twice have both open and close
          parserOrder.forEach((rn) => {
            if (!ringNums.includes(rn)) return;
            const total = rnCount.get(rn) || 0;
            if (total === 1) {
              // Single occurrence = close marker
              if (!lastOccurrence.includes(rn)) lastOccurrence.push(rn);
            }
          });
          if (lastOccurrence.length >= 2) {
            const matches = lastOccurrence.every((rn, i) => rn === simpleOrder[i]);
            if (!matches) return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Compute correct offsets for rings from their metaPositions and the fused ring's metaAllPositions.
 * Converts parser-created position-based rings into offset-based rings for the simple codegen.
 */
function computeOffsetsFromPositions(fusedRing) {
  const allPositions = fusedRing.metaAllPositions;
  if (!allPositions || allPositions.length === 0) return null;

  const posToIndex = new Map();
  allPositions.forEach((pos, idx) => { posToIndex.set(pos, idx); });

  return fusedRing.rings.map((ring) => {
    const positions = ring.metaPositions;
    if (!positions || positions.length === 0) return ring.offset;
    const firstPos = positions[0];
    return posToIndex.get(firstPos) || 0;
  });
}

/**
 * Compute which ring positions are shared between rings in the fused system.
 * Returns a Map of ringIdx → Set of 1-indexed positions that are owned by a prior ring.
 */
function computeSharedPositions(fusedRing) {
  const sharedPositions = new Map();
  const claimedPositions = new Set();

  fusedRing.rings.forEach((ring, ringIdx) => {
    const shared = new Set();
    const positions = ring.metaPositions || [];

    if (positions.length > 0) {
      positions.forEach((pos, i) => {
        if (claimedPositions.has(pos)) {
          shared.add(i + 1); // 1-indexed ring-relative position
        } else {
          claimedPositions.add(pos);
        }
      });
    } else {
      // For API-created rings without metaPositions, use offset-based overlap
      const offset = ring.offset || 0;
      for (let i = 0; i < ring.size; i += 1) {
        const absPos = offset + i;
        if (claimedPositions.has(absPos)) {
          shared.add(i + 1);
        } else {
          claimedPositions.add(absPos);
        }
      }
    }

    sharedPositions.set(ringIdx, shared);
  });

  return sharedPositions;
}

/**
 * Decompile a FusedRing node using only structural API calls (no metadata).
 * Emits .fuse() for the first pair and .addRing() for subsequent rings.
 * The resulting code goes through the simple codegen path (offset-based).
 */
function decompileSimpleFusedRing(fusedRing, indent, nextVar) {
  const lines = [];
  const ringFinalVars = [];

  // Compute correct offsets from parser positions (if available)
  const computedOffsets = computeOffsetsFromPositions(fusedRing);

  // Assign ring numbers, allowing reuse when rings don't overlap in offset space.
  // The parser reuses ring numbers (e.g., ring 1 closes then a later ring also uses 1).
  // This is valid SMILES as long as the ring markers don't overlap.
  const ringNumberOverrides = fusedRing.rings.map((ring, idx) => {
    const offset = computedOffsets ? computedOffsets[idx] : (ring.offset || 0);
    return { ringNumber: ring.ringNumber, start: offset, end: offset + ring.size - 1 };
  });
  // Check for ring number conflicts (same ring number used by overlapping rings)
  for (let i = 0; i < ringNumberOverrides.length; i += 1) {
    const ri = ringNumberOverrides[i];
    for (let j = i + 1; j < ringNumberOverrides.length; j += 1) {
      const rj = ringNumberOverrides[j];
      if (ri.ringNumber === rj.ringNumber) {
        // Conflict only if the rings overlap in offset space
        const overlaps = ri.start <= rj.end && rj.start <= ri.end;
        if (overlaps) {
          // Find a free ring number for ring j
          const usedNums = new Set(ringNumberOverrides.map((r) => r.ringNumber));
          let num = 1;
          while (usedNums.has(num)) num += 1;
          rj.ringNumber = num;
        }
      }
    }
  }

  // Compute which positions are shared (to avoid duplicating attachments/substitutions)
  const sharedPositions = computeSharedPositions(fusedRing);

  // Decompile individual rings with substitutions and attachments
  fusedRing.rings.forEach((ring, ringIdx) => {
    const overrideOffset = computedOffsets ? computedOffsets[ringIdx] : null;
    const overrideRingNumber = ringNumberOverrides[ringIdx].ringNumber !== ring.ringNumber
      ? ringNumberOverrides[ringIdx].ringNumber : null;

    const effectiveRing = { ...ring };
    if (overrideOffset !== null) effectiveRing.offset = overrideOffset;
    if (overrideRingNumber !== null) effectiveRing.ringNumber = overrideRingNumber;

    // Filter out substitutions and attachments on shared positions
    const shared = sharedPositions.get(ringIdx) || new Set();
    if (shared.size > 0) {
      const filteredSubs = {};
      Object.entries(ring.substitutions || {}).forEach(([pos, atom]) => {
        if (!shared.has(Number(pos))) filteredSubs[pos] = atom;
      });
      effectiveRing.substitutions = filteredSubs;

      const filteredAtts = {};
      Object.entries(ring.attachments || {}).forEach(([pos, attList]) => {
        if (!shared.has(Number(pos))) filteredAtts[pos] = attList;
      });
      effectiveRing.attachments = filteredAtts;
    }

    const varName = nextVar();
    const { optionsStr } = buildRingOptions(effectiveRing, { includeBranchDepths: true });
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

    const {
      lines: subLines, currentVar: subVar,
    } = generateSubstitutionCode(effectiveRing, indent, nextVar, varName);
    lines.push(...subLines);

    const {
      lines: attLines, currentVar: attVar,
    } = generateAttachmentCode(effectiveRing, indent, nextVar, subVar);
    lines.push(...attLines);

    ringFinalVars.push(attVar);
  });

  const leadingBond = fusedRing.metaLeadingBond;

  // Single-ring FusedRing — just return the ring directly
  if (fusedRing.rings.length === 1) {
    return { code: lines.join('\n'), finalVar: ringFinalVars[0] };
  }

  // Fuse first two rings, then .addRing() for the rest
  const offset1 = computedOffsets ? computedOffsets[1] : fusedRing.rings[1].offset;
  let currentFusedVar = nextVar();

  if (leadingBond) {
    lines.push(`${indent}const ${currentFusedVar} = ${ringFinalVars[0]}.fuse(${offset1}, ${ringFinalVars[1]}, { leadingBond: '${leadingBond}' });`);
  } else {
    lines.push(`${indent}const ${currentFusedVar} = ${ringFinalVars[0]}.fuse(${offset1}, ${ringFinalVars[1]});`);
  }

  // Chain .addRing() for rings 3+
  for (let i = 2; i < fusedRing.rings.length; i += 1) {
    const offset = computedOffsets ? computedOffsets[i] : fusedRing.rings[i].offset;
    const newVar = nextVar();
    lines.push(`${indent}const ${newVar} = ${currentFusedVar}.addRing(${offset}, ${ringFinalVars[i]});`);
    currentFusedVar = newVar;
  }

  return { code: lines.join('\n'), finalVar: currentFusedVar };
}

/**
 * Helper to format a Map as JavaScript code
 */
function formatMapCode(map) {
  const entries = [];
  map.forEach((value, key) => {
    if (typeof value === 'string') {
      entries.push(`[${key}, '${value}']`);
    } else if (value === null) {
      entries.push(`[${key}, null]`);
    } else if (Array.isArray(value)) {
      entries.push(`[${key}, [${value.join(', ')}]]`);
    } else {
      entries.push(`[${key}, ${value}]`);
    }
  });
  return `new Map([${entries.join(', ')}])`;
}

/**
 * Decompile a complex FusedRing with sequential rings
 *
 * For complex fused rings with sequential rings, we need to manually set up the
 * metadata that the parser creates, because there's no public API to add sequential
 * rings to a fused ring. The codegen uses this metadata to correctly interleave
 * ring markers and handle branch depths.
 */
function decompileComplexFusedRing(fusedRing, indent, nextVar) {
  const lines = [];
  const sequentialRings = fusedRing.metaSequentialRings || [];
  const seqAtomAttachments = fusedRing.metaSeqAtomAttachments || new Map();

  // Step 1: Decompile the base fused ring
  const ringVars = [];
  fusedRing.rings.forEach((ring) => {
    const { optionsStr } = buildRingOptions(ring, { includeBranchDepths: true });
    const varName = nextVar();
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

    const subResult = generateSubstitutionCode(ring, indent, nextVar, varName);
    lines.push(...subResult.lines);

    const attResult = generateAttachmentCode(ring, indent, nextVar, subResult.currentVar);
    lines.push(...attResult.lines);

    ringVars.push({ var: attResult.currentVar, ring });
  });

  // Decompile seqAtomAttachments BEFORE fuse so their vars are declared early
  const hasSeqRings = sequentialRings.length > 0;
  const seqAtomAttachmentVarEntries = [];
  if (!hasSeqRings && seqAtomAttachments.size > 0) {
    seqAtomAttachments.forEach((attachments, pos) => {
      const attVars = [];
      attachments.forEach((att) => {
        const attResult = decompileChildNode(att, indent, nextVar);
        lines.push(attResult.code);
        attVars.push(attResult.finalVar);
      });
      seqAtomAttachmentVarEntries.push(`[${pos}, [${attVars.join(', ')}]]`);
    });
  }

  // Fuse the base rings
  let fusedVar;
  if (fusedRing.rings.length === 2) {
    fusedVar = nextVar();
    const decl = hasSeqRings ? 'let' : 'const';
    const { offset } = fusedRing.rings[1];
    lines.push(`${indent}${decl} ${fusedVar} = ${ringVars[0].var}.fuse(${offset}, ${ringVars[1].var});`);
  } else if (fusedRing.rings.length >= 3) {
    fusedVar = nextVar();
    const decl = hasSeqRings ? 'let' : 'const';
    const ringsStr = ringVars.map((rv) => rv.var).join(', ');
    lines.push(`${indent}${decl} ${fusedVar} = FusedRing([${ringsStr}]);`);
  } else {
    // Single ring wrapped in FusedRing — if it has sequential rings, handle below
    // Otherwise this shouldn't happen in practice (single-ring FusedRing without seq rings)
    fusedVar = ringVars[0].var;
    if (!hasSeqRings) {
      // This case should not occur, but if it does, just return the ring
      return { code: lines.join('\n'), finalVar: fusedVar };
    }
    // For single ring with sequential rings:
    // Check if the base ring has attachments - if so, use verbose metadata
    const baseRingHasAttachments = fusedRing.rings[0].attachments
      && Object.keys(fusedRing.rings[0].attachments).length > 0;
    if (baseRingHasAttachments) {
      // Use verbose metadata path (decompileComplexFusedRingSingleRing)
      // eslint-disable-next-line no-use-before-define
      return decompileComplexFusedRingSingleRing(
        fusedRing,
        fusedVar,
        sequentialRings,
        seqAtomAttachments,
        lines,
        indent,
        nextVar,
      );
    }
    // For simple rings without attachments, we'll use addSequentialRings below
    // Need to change it to 'let' since we'll reassign it
    const lastLine = lines[lines.length - 1];
    if (lastLine.includes('const')) {
      lines[lines.length - 1] = lastLine.replace('const', 'let');
    }
  }

  // Step 2: Decompile sequential rings with computed offsets and depths
  if (hasSeqRings) {
    // Compute depth and offset for each sequential ring from parser metadata
    const allPositions = fusedRing.metaAllPositions || [];
    const branchDepthMap = fusedRing.metaBranchDepthMap || new Map();
    const allRingPositions = new Set();
    fusedRing.rings.forEach((r) => (r.metaPositions || []).forEach((p) => allRingPositions.add(p)));
    sequentialRings.forEach((r) => (r.metaPositions || []).forEach((p) => allRingPositions.add(p)));

    // Compute per-ring depth from the ring's first position in the branch depth map
    // Normalize depths relative to the base ring's depth
    const baseRingDepth = fusedRing.rings.length > 0 && fusedRing.rings[0].metaPositions
      ? (branchDepthMap.get(fusedRing.rings[0].metaPositions[0]) || 0)
      : 0;
    const seqDepths = sequentialRings.map((ring) => {
      const positions = ring.metaPositions || [];
      if (positions.length > 0) {
        const absDepth = branchDepthMap.get(positions[0]) || 0;
        return absDepth - baseRingDepth;
      }
      if (ring.metaBranchDepths && ring.metaBranchDepths.length > 0) {
        return ring.metaBranchDepths[0];
      }
      return 0;
    });

    // Group by depth to compute within-group offsets
    const depthGroups = new Map();
    sequentialRings.forEach((ring, idx) => {
      const depth = seqDepths[idx];
      if (!depthGroups.has(depth)) depthGroups.set(depth, []);
      depthGroups.get(depth).push({ ring, idx });
    });

    // Compute within-group offsets based on metaPositions
    depthGroups.forEach((group) => {
      if (group.length <= 1) return; // Single ring in group: offset 0 (default)
      // Find the minimum position across all rings in this group
      let minPos = Infinity;
      group.forEach(({ ring }) => {
        const positions = ring.metaPositions || [];
        if (positions.length > 0) minPos = Math.min(minPos, positions[0]);
      });
      // Set offset relative to the group's minimum position
      group.forEach(({ ring }) => {
        const positions = ring.metaPositions || [];
        if (positions.length > 0) {
          // eslint-disable-next-line no-param-reassign
          ring.offset = positions[0] - minPos;
        }
      });
    });

    // Identify standalone atoms (in allPositions but not in any ring)
    const chainAtomEntries = [];
    const seqStartPos = Math.min(...sequentialRings.flatMap((r) => r.metaPositions || []));
    const seqEndPos = Math.max(...sequentialRings.flatMap((r) => r.metaPositions || []));
    const atomValueMap = fusedRing.metaAtomValueMap || new Map();
    const bondMap = fusedRing.metaBondMap || new Map();

    // Walk allPositions to find standalone atoms in the sequential section
    allPositions.forEach((pos) => {
      if (pos < seqStartPos && !allRingPositions.has(pos)) {
        // Chain atom before first sequential ring
        const atom = atomValueMap.get(pos) || 'C';
        const depth = branchDepthMap.get(pos) || 0;
        const bond = bondMap.get(pos) || null;
        const entry = { atom, depth, position: 'before' };
        if (bond) entry.bond = bond;
        // Check for seqAtomAttachments at this position
        if (seqAtomAttachments.has(pos)) {
          entry.attachmentPos = pos;
        }
        chainAtomEntries.push(entry);
      } else if (pos > seqEndPos && !allRingPositions.has(pos)) {
        // Chain atom after all sequential rings — use the depth to determine group
        const atom = atomValueMap.get(pos) || 'C';
        const depth = branchDepthMap.get(pos) || 0;
        const bond = bondMap.get(pos) || null;
        const entry = { atom, depth, position: 'after' };
        if (bond) entry.bond = bond;
        if (seqAtomAttachments.has(pos)) {
          entry.attachmentPos = pos;
        }
        chainAtomEntries.push(entry);
      } else if (!allRingPositions.has(pos) && pos >= seqStartPos && pos <= seqEndPos) {
        // Chain atom between sequential rings
        const atom = atomValueMap.get(pos) || 'C';
        const depth = branchDepthMap.get(pos) || 0;
        const bond = bondMap.get(pos) || null;
        // Determine if before or after based on whether it precedes or follows
        // the rings at this depth
        const sameDepthRings = [];
        depthGroups.forEach((group, d) => {
          if (d === depth) sameDepthRings.push(...group);
        });
        const firstRingPos = sameDepthRings.length > 0
          ? Math.min(...sameDepthRings.flatMap(({ ring: r }) => r.metaPositions || []))
          : pos;
        const posType = pos < firstRingPos ? 'before' : 'after';
        const entry = { atom, depth, position: posType };
        if (bond) entry.bond = bond;
        if (seqAtomAttachments.has(pos)) {
          entry.attachmentPos = pos;
        }
        chainAtomEntries.push(entry);
      }
    });

    // Decompile sequential rings
    const seqRingVars = [];
    sequentialRings.forEach((ring) => {
      const { optionsStr } = buildRingOptions(ring, { includeBranchDepths: true });
      const varName = nextVar();
      lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

      const subResult = generateSubstitutionCode(ring, indent, nextVar, varName);
      lines.push(...subResult.lines);

      const attResult = generateAttachmentCode(ring, indent, nextVar, subResult.currentVar);
      lines.push(...attResult.lines);

      seqRingVars.push(attResult.currentVar);
    });

    // Decompile chain atom attachments
    chainAtomEntries.forEach((entry) => {
      if (entry.attachmentPos !== undefined) {
        const attachments = seqAtomAttachments.get(entry.attachmentPos) || [];
        const attVars = [];
        attachments.forEach((att) => {
          const attResult = decompileChildNode(att, indent, nextVar);
          lines.push(attResult.code);
          attVars.push(attResult.finalVar);
        });
        // eslint-disable-next-line no-param-reassign
        entry.attachmentVars = attVars;
      }
    });

    // Build the addSequentialRings options
    const optionParts = [];

    // depths array
    const depthsStr = `[${seqDepths.join(', ')}]`;
    optionParts.push(`depths: ${depthsStr}`);

    // chainAtoms array (only if there are chain atoms)
    if (chainAtomEntries.length > 0) {
      const chainParts = chainAtomEntries.map((entry) => {
        const parts = [`atom: '${entry.atom}'`, `depth: ${entry.depth}`, `position: '${entry.position}'`];
        if (entry.bond) parts.push(`bond: '${entry.bond}'`);
        if (entry.attachmentVars && entry.attachmentVars.length > 0) {
          parts.push(`attachments: [${entry.attachmentVars.join(', ')}]`);
        }
        return `{ ${parts.join(', ')} }`;
      });
      optionParts.push(`chainAtoms: [${chainParts.join(', ')}]`);
    }

    const seqRingsStr = seqRingVars.join(', ');
    const optionsStr = optionParts.length > 0 ? `, { ${optionParts.join(', ')} }` : '';
    lines.push(`${indent}${fusedVar} = ${fusedVar}.addSequentialRings([${seqRingsStr}]${optionsStr});`);
  } else {
    // Non-sequential interleaved fused ring: use FusedRing constructor with metadata
    // to avoid mutations. Reconstruct using FusedRing([rings], { metadata: {...} })

    const allPositions = fusedRing.metaAllPositions || [];
    const branchDepthMap = fusedRing.metaBranchDepthMap || new Map();
    const atomValueMap = fusedRing.metaAtomValueMap || new Map();
    const bondMap = fusedRing.metaBondMap || new Map();
    const ringOrderMap = fusedRing.metaRingOrderMap;

    // Build metadata using legacy format (more compatible with all cases)
    const metadataParts = [];

    // Always use legacy format for now (hierarchical format has issues with standalone atoms)
    metadataParts.push(`allPositions: [${allPositions.join(', ')}]`);
    if (branchDepthMap.size > 0) {
      metadataParts.push(`branchDepthMap: ${formatMapCode(branchDepthMap)}`);
    }
    if (atomValueMap.size > 0) {
      metadataParts.push(`atomValueMap: ${formatMapCode(atomValueMap)}`);
    }
    if (bondMap.size > 0) {
      const nonNullBonds = new Map();
      bondMap.forEach((value, key) => { if (value !== null) nonNullBonds.set(key, value); });
      if (nonNullBonds.size > 0) {
        metadataParts.push(`bondMap: ${formatMapCode(nonNullBonds)}`);
      }
    }
    if (ringOrderMap && ringOrderMap.size > 0) {
      metadataParts.push(`ringOrderMap: ${formatMapCode(ringOrderMap)}`);
    }
    // Add per-ring metadata
    const ringMeta = fusedRing.rings.map((ring) => {
      const positions = ring.metaPositions || [];
      if (positions.length === 0) return 'null';
      return `{ positions: [${positions.join(', ')}], start: ${ring.metaStart}, end: ${ring.metaEnd} }`;
    });
    metadataParts.push(`ringMetadata: [${ringMeta.join(', ')}]`)

    // Add leadingBond to metadata if present
    if (fusedRing.metaLeadingBond) {
      metadataParts.push(`leadingBond: '${fusedRing.metaLeadingBond}'`);
    }

    // Add seqAtomAttachments if present (non-seq-ring case)
    if (seqAtomAttachmentVarEntries.length > 0) {
      metadataParts.push(`seqAtomAttachments: new Map([${seqAtomAttachmentVarEntries.join(', ')}])`);
    }

    if (metadataParts.length > 0) {
      // Replace the fuse/FusedRing call with one that includes metadata
      const lastLineIdx = lines.length - 1;
      const lastLine = lines[lastLineIdx];
      // Change from: const v8 = v6.fuse(2, v7);
      // To: const v8 = v6.fuse(2, v7, { metadata: {...} });
      // Or from: const v8 = FusedRing([...]);
      // To: const v8 = FusedRing({ metadata: {...} }); (refs are in metadata)
      const metadataStr = `{ ${metadataParts.join(', ')} }`;
      if (lastLine.includes('.fuse(')) {
        // Replace .fuse(offset, ring); with .fuse(offset, ring, { metadata: {...} });
        lines[lastLineIdx] = lastLine.replace(/\);$/, `, { metadata: ${metadataStr} });`);
      } else if (lastLine.includes('FusedRing(')) {
        // Keep the rings array but add metadata as second parameter
        // Change: const v8 = FusedRing([v1, v2, v3]);
        // To: const v8 = FusedRing([v1, v2, v3], { metadata: {...} });
        lines[lastLineIdx] = lastLine.replace(/\);$/, `, { metadata: ${metadataStr} });`);
      }
    }
  }

  return { code: lines.join('\n'), finalVar: fusedVar };
}

// Handle single-ring FusedRing case with raw metadata (no public API for single-ring FusedRing)
function decompileComplexFusedRingSingleRing(
  fusedRing,
  fusedVar,
  sequentialRings,
  seqAtomAttachments,
  lines,
  indent,
  nextVar,
) {
  const allPositions = fusedRing.metaAllPositions || [];
  const branchDepthMap = fusedRing.metaBranchDepthMap || new Map();
  const atomValueMap = fusedRing.metaAtomValueMap || new Map();
  const bondMap = fusedRing.metaBondMap || new Map();

  // Mark as using interleaved codegen (parser-created)
  lines.push(`${indent}${fusedVar}.metaUseInterleavedCodegen = true;`);

  // Set ring position metadata directly on the ring variable
  const ring = fusedRing.rings[0];
  const positions = ring.metaPositions || [];
  if (positions.length > 0) {
    lines.push(`${indent}${fusedVar}.metaPositions = [${positions.join(', ')}];`);
    lines.push(`${indent}${fusedVar}.metaStart = ${ring.metaStart};`);
    lines.push(`${indent}${fusedVar}.metaEnd = ${ring.metaEnd};`);
  }

  // Decompile sequential rings
  const seqRingVars = [];
  sequentialRings.forEach((seqRing) => {
    const { optionsStr } = buildRingOptions(seqRing, { includeBranchDepths: true });
    const varName = nextVar();
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);
    const subResult = generateSubstitutionCode(seqRing, indent, nextVar, varName);
    lines.push(...subResult.lines);
    const attResult = generateAttachmentCode(seqRing, indent, nextVar, subResult.currentVar);
    lines.push(...attResult.lines);
    const seqPositions = seqRing.metaPositions || [];
    if (seqPositions.length > 0) {
      lines.push(`${indent}${attResult.currentVar}.metaPositions = [${seqPositions.join(', ')}];`);
      lines.push(`${indent}${attResult.currentVar}.metaStart = ${seqRing.metaStart};`);
      lines.push(`${indent}${attResult.currentVar}.metaEnd = ${seqRing.metaEnd};`);
    }
    seqRingVars.push(attResult.currentVar);
  });

  // Decompile seq atom attachments
  const seqAtomAttachmentVars = new Map();
  seqAtomAttachments.forEach((attachments, pos) => {
    const attVars = [];
    attachments.forEach((att) => {
      const attResult = decompileChildNode(att, indent, nextVar);
      lines.push(attResult.code);
      attVars.push(attResult.finalVar);
    });
    seqAtomAttachmentVars.set(pos, attVars);
  });

  // Set raw metadata
  if (seqRingVars.length > 0) {
    lines.push(`${indent}${fusedVar}.metaSequentialRings = [${seqRingVars.join(', ')}];`);
  }
  if (allPositions.length > 0) {
    lines.push(`${indent}${fusedVar}.metaAllPositions = [${allPositions.join(', ')}];`);
  }
  if (branchDepthMap.size > 0) {
    lines.push(`${indent}${fusedVar}.metaBranchDepthMap = ${formatMapCode(branchDepthMap)};`);
  }
  if (atomValueMap.size > 0) {
    lines.push(`${indent}${fusedVar}.metaAtomValueMap = ${formatMapCode(atomValueMap)};`);
  }
  if (bondMap.size > 0) {
    const nonNullBonds = new Map();
    bondMap.forEach((value, key) => { if (value !== null) nonNullBonds.set(key, value); });
    if (nonNullBonds.size > 0) {
      lines.push(`${indent}${fusedVar}.metaBondMap = ${formatMapCode(nonNullBonds)};`);
    }
  }
  if (seqAtomAttachmentVars.size > 0) {
    const entries = [];
    seqAtomAttachmentVars.forEach((vars, pos) => { entries.push(`[${pos}, [${vars.join(', ')}]]`); });
    lines.push(`${indent}${fusedVar}.metaSeqAtomAttachments = new Map([${entries.join(', ')}]);`);
  }

  return { code: lines.join('\n'), finalVar: fusedVar };
}

/**
 * Decompile a FusedRing node
 *
 * Routes to the appropriate decompiler based on the complexity:
 * - Sequential rings or interleaved codegen → preserves metadata (needs it for correct SMILES)
 * - Everything else → structural API calls only (no metadata)
 */
function decompileFusedRing(fusedRing, indent, nextVar) {
  const seqRings = fusedRing.metaSequentialRings;
  const hasSeqRings = seqRings && seqRings.length > 0;
  const isInterleaved = needsInterleavedCodegen(fusedRing);

  // Use complex decompilation for sequential rings or genuinely interleaved fused rings
  if (hasSeqRings || isInterleaved) {
    return decompileComplexFusedRing(fusedRing, indent, nextVar);
  }

  // Everything else goes through the simple path (no metadata)
  return decompileSimpleFusedRing(fusedRing, indent, nextVar);
}

/**
 * Decompile a Molecule node
 */
function decompileMolecule(molecule, indent, nextVar) {
  const lines = [];
  const { components } = molecule;

  if (components.length === 0) {
    const finalVarName = nextVar();
    lines.push(`${indent}const ${finalVarName} = Molecule([]);`);
    return { code: lines.join('\n'), finalVar: finalVarName };
  }

  // Default behavior: create components and wrap in Molecule
  // This correctly handles fused ring followed by linear - Molecule concatenation
  // produces the right SMILES without needing attachToRing
  const componentFinalVars = [];
  components.forEach((component) => {
    // eslint-disable-next-line no-use-before-define
    const { code: componentCode, finalVar } = decompileNode(component, indent, nextVar);
    lines.push(componentCode);
    // Note: metaLeadingBond is now handled in component constructors via metadata
    // or leadingBond option, so no mutation needed here
    componentFinalVars.push(finalVar);
  });

  // Create molecule using the final variable names
  const finalVarName = nextVar();
  const componentsStr = componentFinalVars.join(', ');
  lines.push(`${indent}const ${finalVarName} = Molecule([${componentsStr}]);`);

  return { code: lines.join('\n'), finalVar: finalVarName };
}

function decompileNode(node, indent, nextVar) {
  if (isRingNode(node)) {
    return decompileRing(node, indent, nextVar);
  }

  if (isLinearNode(node)) {
    return decompileLinear(node, indent, nextVar);
  }

  if (isFusedRingNode(node)) {
    return decompileFusedRing(node, indent, nextVar);
  }

  if (isMoleculeNode(node)) {
    return decompileMolecule(node, indent, nextVar);
  }

  throw new Error(`Unknown node type: ${node.type}`);
}

/**
 * Main decompile dispatcher - public API
 * @param {Object} node - AST node to decompile
 * @param {Object} options - Options
 * @param {number} options.indent - Indentation level (default 0)
 * @param {string} options.varName - Variable name prefix (default 'v')
 * @param {boolean} options.includeMetadata - Include metadata assignments
 *   (default true). Set to false for cleaner output (but code may not work)
 */
export function decompile(node, options = {}) {
  const { indent = 0, varName = 'v', includeMetadata = true } = options;
  const indentStr = '  '.repeat(indent);
  const nextVar = createCounter(varName);

  const { code } = decompileNode(node, indentStr, nextVar);

  // Always use export for declarations
  let result = code.replace(/^(\s*)(const|let) /gm, '$1export $2 ');

  // Filter out metadata assignments if not requested
  if (!includeMetadata) {
    result = result.split('\n').filter((line) => (
      // Remove lines that set meta properties
      !line.match(/\.meta[A-Z][a-zA-Z]*\s*=/)
    )).join('\n');
  }

  return result;
}
