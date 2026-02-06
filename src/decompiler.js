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

// Forward declaration for mutual recursion
let decompileNodeInternal;

// Helper to call decompileNodeInternal (satisfies no-loop-func rule)
function decompileChildNode(node, indent, nextVar) {
  return decompileNodeInternal(node, indent, nextVar);
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
  if (Object.keys(ring.attachments).length > 0) {
    Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        const attachResult = decompileNodeInternal(attachment, indent, nextVar);
        const { code: aCode, finalVar: aFinalVar } = attachResult;
        lines.push(aCode);

        const newVar = nextVar();
        const isSibling = attachment.metaIsSibling;
        if (isSibling === true) {
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos}, { sibling: true });`);
        } else if (isSibling === false) {
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos}, { sibling: false });`);
        } else {
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
        }
        currentVar = newVar;
      });
    });
  }

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
  if (hasNonNullBonds) {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [${formatBondsArray(linear.bonds)}]);`);
  } else {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}]);`);
  }

  let currentVar = varName;

  // Add attachments
  if (Object.keys(linear.attachments).length > 0) {
    Object.entries(linear.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        const attachRes = decompileNodeInternal(attachment, indent, nextVar);
        const { code: aCode, finalVar: aFinalVar } = attachRes;
        lines.push(aCode);

        const newVar = nextVar();
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Decompile a simple FusedRing node (no sequential rings/branch structure)
 */
function decompileSimpleFusedRing(fusedRing, indent, nextVar) {
  const lines = [];
  const ringFinalVars = [];

  // Create individual rings with their substitutions and attachments
  fusedRing.rings.forEach((ring) => {
    const { code: ringCode, finalVar: ringFinalVar } = decompileRing(ring, indent, nextVar);
    lines.push(ringCode);
    ringFinalVars.push(ringFinalVar);
  });

  // Check for leading bond (bond connecting to previous component)
  const leadingBond = fusedRing.metaLeadingBond;

  // Fuse rings together
  const finalVar = nextVar();
  if (fusedRing.rings.length === 2) {
    const ring1 = ringFinalVars[0];
    const ring2 = ringFinalVars[1];
    const { offset } = fusedRing.rings[1];
    if (leadingBond) {
      lines.push(`${indent}const ${finalVar} = ${ring1}.fuse(${ring2}, ${offset}, { leadingBond: '${leadingBond}' });`);
    } else {
      lines.push(`${indent}const ${finalVar} = ${ring1}.fuse(${ring2}, ${offset});`);
    }
  } else {
    const ringsStr = ringFinalVars.join(', ');
    if (leadingBond) {
      lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}], { leadingBond: '${leadingBond}' });`);
    } else {
      lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}]);`);
    }
  }

  return { code: lines.join('\n'), finalVar };
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
  const allPositions = fusedRing.metaAllPositions || [];
  const branchDepthMap = fusedRing.metaBranchDepthMap || new Map();
  const atomValueMap = fusedRing.metaAtomValueMap || new Map();
  const bondMap = fusedRing.metaBondMap || new Map();
  const seqAtomAttachments = fusedRing.metaSeqAtomAttachments || new Map();

  // Step 1: Decompile the base fused ring
  const ringVars = [];
  fusedRing.rings.forEach((ring) => {
    const { optionsStr } = buildRingOptions(ring, { includeBranchDepths: true });
    const varName = nextVar();
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

    const subResult = generateSubstitutionCode(ring, indent, nextVar, varName);
    lines.push(...subResult.lines);

    ringVars.push({ var: subResult.currentVar, ring });
  });

  // Fuse the base rings
  let fusedVar;
  if (fusedRing.rings.length === 2) {
    fusedVar = nextVar();
    const { offset } = fusedRing.rings[1];
    lines.push(`${indent}const ${fusedVar} = ${ringVars[0].var}.fuse(${ringVars[1].var}, ${offset});`);
  } else if (fusedRing.rings.length === 1) {
    fusedVar = ringVars[0].var;
  } else {
    fusedVar = nextVar();
    const ringsStr = ringVars.map((rv) => rv.var).join(', ');
    lines.push(`${indent}const ${fusedVar} = FusedRing([${ringsStr}]);`);
  }

  // Set ring position metadata on the FUSED ring's internal rings (not pre-fused)
  // For single-ring FusedRings, set metadata directly on the ring variable
  if (fusedRing.rings.length === 1) {
    const ring = fusedRing.rings[0];
    const positions = ring.metaPositions || [];
    if (positions.length > 0) {
      lines.push(`${indent}${fusedVar}.metaPositions = [${positions.join(', ')}];`);
      lines.push(`${indent}${fusedVar}.metaStart = ${ring.metaStart};`);
      lines.push(`${indent}${fusedVar}.metaEnd = ${ring.metaEnd};`);
    }
  } else {
    fusedRing.rings.forEach((ring, ringIdx) => {
      const positions = ring.metaPositions || [];
      if (positions.length > 0) {
        lines.push(`${indent}${fusedVar}.rings[${ringIdx}].metaPositions = [${positions.join(', ')}];`);
        lines.push(`${indent}${fusedVar}.rings[${ringIdx}].metaStart = ${ring.metaStart};`);
        lines.push(`${indent}${fusedVar}.rings[${ringIdx}].metaEnd = ${ring.metaEnd};`);
      }
    });
  }

  // Step 2: Decompile sequential rings
  const seqRingVars = [];
  sequentialRings.forEach((ring) => {
    const { optionsStr } = buildRingOptions(ring, { includeBranchDepths: true });
    const varName = nextVar();
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

    const subResult = generateSubstitutionCode(ring, indent, nextVar, varName);
    lines.push(...subResult.lines);

    // Set ring position metadata
    const positions = ring.metaPositions || [];
    if (positions.length > 0) {
      lines.push(`${indent}${subResult.currentVar}.metaPositions = [${positions.join(', ')}];`);
      lines.push(`${indent}${subResult.currentVar}.metaStart = ${ring.metaStart};`);
      lines.push(`${indent}${subResult.currentVar}.metaEnd = ${ring.metaEnd};`);
    }

    seqRingVars.push(subResult.currentVar);
  });

  // Step 3: Decompile seq atom attachments
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

  // Step 4: Set up the fused ring's metadata
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
    // Filter out null bonds
    const nonNullBonds = new Map();
    bondMap.forEach((value, key) => {
      if (value !== null) {
        nonNullBonds.set(key, value);
      }
    });
    if (nonNullBonds.size > 0) {
      lines.push(`${indent}${fusedVar}.metaBondMap = ${formatMapCode(nonNullBonds)};`);
    }
  }

  if (seqAtomAttachmentVars.size > 0) {
    const entries = [];
    seqAtomAttachmentVars.forEach((vars, pos) => {
      entries.push(`[${pos}, [${vars.join(', ')}]]`);
    });
    lines.push(`${indent}${fusedVar}.metaSeqAtomAttachments = new Map([${entries.join(', ')}]);`);
  }

  return { code: lines.join('\n'), finalVar: fusedVar };
}

/**
 * Check if fused ring has sequential linear atoms (atoms outside of ring positions)
 */
function hasSequentialLinearAtoms(fusedRing) {
  const allPositions = fusedRing.metaAllPositions || [];
  if (allPositions.length === 0) return false;

  // Get all positions covered by the rings
  const ringPositions = new Set();
  fusedRing.rings.forEach((ring) => {
    (ring.metaPositions || []).forEach((pos) => ringPositions.add(pos));
  });

  // Check if there are positions not covered by rings
  return allPositions.some((pos) => !ringPositions.has(pos));
}

/**
 * Find sequential linear atoms that follow ring positions and add them as ring attachments
 * Handles multiple sequential atoms at varying branch depths
 */
function injectSequentialAtomsAsAttachments(fusedRing, indent, nextVar) {
  const allPositions = fusedRing.metaAllPositions || [];
  const atomValueMap = fusedRing.metaAtomValueMap || new Map();
  const bondMap = fusedRing.metaBondMap || new Map();
  const branchDepthMap = fusedRing.metaBranchDepthMap || new Map();

  // Get all ring positions with their info
  const ringPositionToRing = new Map();
  fusedRing.rings.forEach((ring) => {
    (ring.metaPositions || []).forEach((pos, idx) => {
      ringPositionToRing.set(pos, { ring, idx });
    });
  });

  // Find sequential atoms (positions not in any ring)
  const seqPositions = allPositions.filter((pos) => !ringPositionToRing.has(pos));

  const lines = [];
  const injectedVars = new Map(); // ringIdx -> Map(position -> varName)

  // Process each sequential position
  seqPositions.forEach((seqPos) => {
    const posIdx = allPositions.indexOf(seqPos);
    if (posIdx <= 0) return;

    const seqDepth = branchDepthMap.get(seqPos) || 0;
    const atomValue = atomValueMap.get(seqPos) || 'C';
    const bond = bondMap.get(seqPos);

    // Create a Linear node for this atom
    const linearVar = nextVar();
    if (bond) {
      lines.push(`${indent}const ${linearVar} = Linear(['${atomValue}'], ['${bond}']);`);
    } else {
      lines.push(`${indent}const ${linearVar} = Linear(['${atomValue}']);`);
    }
    // Mark as inline continuation (not a sibling branch)
    lines.push(`${indent}${linearVar}.metaIsSibling = false;`);

    // Find the ring position to attach to
    // Look backwards for a ring position at the same depth or the nearest ring position
    // that is a valid attachment point
    let attachInfo = null;
    for (let i = posIdx - 1; i >= 0; i -= 1) {
      const checkPos = allPositions[i];
      const checkDepth = branchDepthMap.get(checkPos) || 0;
      const ringInfo = ringPositionToRing.get(checkPos);

      if (ringInfo && checkDepth === seqDepth) {
        // Found a ring position at the same depth
        attachInfo = ringInfo;
        break;
      }
      if (ringInfo && checkDepth < seqDepth) {
        // Crossed to a shallower depth without finding same-depth ring position
        // This sequential position should be attached as a sibling
        // Find the last ring position at the target depth
        for (let j = i; j >= 0; j -= 1) {
          const innerPos = allPositions[j];
          const innerDepth = branchDepthMap.get(innerPos) || 0;
          const innerRingInfo = ringPositionToRing.get(innerPos);
          if (innerRingInfo && innerDepth === seqDepth) {
            attachInfo = innerRingInfo;
            break;
          }
        }
        break;
      }
    }

    if (attachInfo) {
      const ringIdx = fusedRing.rings.indexOf(attachInfo.ring);
      const attachPosition = attachInfo.idx + 1; // 1-indexed

      if (!injectedVars.has(ringIdx)) {
        injectedVars.set(ringIdx, new Map());
      }
      injectedVars.get(ringIdx).set(attachPosition, linearVar);
    }
  });

  return { lines, injectedVars };
}

/**
 * Decompile a FusedRing node with injected sequential atoms
 */
function decompileFusedRingWithInjection(fusedRing, indent, nextVar) {
  const lines = [];
  const ringFinalVars = [];

  // Pre-create linear nodes for sequential atoms
  const { lines: injectionLines, injectedVars } = injectSequentialAtomsAsAttachments(
    fusedRing,
    indent,
    nextVar,
  );
  lines.push(...injectionLines);

  // Create individual rings with their substitutions and attachments
  fusedRing.rings.forEach((ring, ringIdx) => {
    const { optionsStr } = buildRingOptions(ring, { includeBranchDepths: true });
    const varName = nextVar();
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

    // Add substitutions
    const subResult = generateSubstitutionCode(ring, indent, nextVar, varName);
    lines.push(...subResult.lines);
    let { currentVar } = subResult;

    // Add regular attachments from the ring
    if (Object.keys(ring.attachments).length > 0) {
      Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
        attachmentList.forEach((attachment) => {
          const attachResult = decompileNodeInternal(attachment, indent, nextVar);
          const { code: aCode, finalVar: aFinalVar } = attachResult;
          lines.push(aCode);

          const newVar = nextVar();
          lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
          currentVar = newVar;
        });
      });
    }

    // Add injected sequential atom attachments
    const injectedForRing = injectedVars.get(ringIdx);
    if (injectedForRing) {
      injectedForRing.forEach((linearVar, position) => {
        const newVar = nextVar();
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${linearVar}, ${position});`);
        currentVar = newVar;
      });
    }

    ringFinalVars.push(currentVar);
  });

  // Check for leading bond (bond connecting to previous component)
  const leadingBond = fusedRing.metaLeadingBond;

  // Fuse rings together
  const finalVar = nextVar();
  if (fusedRing.rings.length === 2) {
    const ring1 = ringFinalVars[0];
    const ring2 = ringFinalVars[1];
    const { offset } = fusedRing.rings[1];
    if (leadingBond) {
      lines.push(`${indent}const ${finalVar} = ${ring1}.fuse(${ring2}, ${offset}, { leadingBond: '${leadingBond}' });`);
    } else {
      lines.push(`${indent}const ${finalVar} = ${ring1}.fuse(${ring2}, ${offset});`);
    }
  } else {
    const ringsStr = ringFinalVars.join(', ');
    if (leadingBond) {
      lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}], { leadingBond: '${leadingBond}' });`);
    } else {
      lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}]);`);
    }
  }

  return { code: lines.join('\n'), finalVar };
}

/**
 * Decompile an interleaved fused ring using FusedRing constructor
 * For patterns like C2C3CCCC3C(OC2)C where ring3 is nested within ring2
 *
 * For interleaved patterns, we do NOT decompile substitutions or attachments on individual rings.
 * Instead, all atom values (including substitutions and attachments) are already encoded in the
 * metaAtomValueMap and will be used during SMILES generation.
 */
function decompileInterleavedFusedRing(fusedRing, indent, nextVar) {
  const lines = [];
  const ringVars = [];

  // Create individual rings with metadata preserved (WITHOUT substitutions or attachments)
  fusedRing.rings.forEach((ring) => {
    // Build ring with basic options only
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

    // Include bonds if present
    const bonds = ring.bonds || [];
    const hasNonNullBonds = bonds.some((b) => b !== null);
    if (hasNonNullBonds) {
      options.bonds = `[${formatBondsArray(bonds)}]`;
    }

    // Include branchDepths
    if (ring.metaBranchDepths && ring.metaBranchDepths.length > 0) {
      const firstDepth = ring.metaBranchDepths[0];
      const hasVaryingDepths = ring.metaBranchDepths.some((d) => d !== firstDepth);
      if (hasVaryingDepths) {
        options.branchDepths = `[${ring.metaBranchDepths.join(', ')}]`;
      }
    }

    const optionsStr = Object.entries(options)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const varName = nextVar();
    lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

    // Preserve metaPositions, metaStart, metaEnd
    const positions = ring.metaPositions || [];
    if (positions.length > 0) {
      lines.push(`${indent}${varName}.metaPositions = [${positions.join(', ')}];`);
      lines.push(`${indent}${varName}.metaStart = ${ring.metaStart};`);
      lines.push(`${indent}${varName}.metaEnd = ${ring.metaEnd};`);
    }

    // Preserve attachments (needed for codegen to know about sibling attachments)
    if (Object.keys(ring.attachments).length > 0) {
      const attEntries = [];
      Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
        const attListCode = attachmentList.map((att) => {
          const attCode = decompileChildNode(att, '', nextVar);
          const codeLines = attCode.code.split('\n').filter((line) => line.trim());

          // If the attachment decompilation produced multiple lines, we need to output
          // ALL lines, then use the final variable
          if (codeLines.length > 1) {
            // Output all lines
            codeLines.forEach((line) => {
              lines.push(indent + line);
            });
            // Use the finalVar from the decompilation
            return attCode.finalVar;
          }

          // Single line - extract just the constructor call, removing export/const/variable name
          const match = attCode.code.match(/= (.+);?$/);
          if (match) {
            return match[1].replace(/;$/, '');
          }
          return `Linear(['${att.atoms?.[0] || 'C'}'])`;
        });
        attEntries.push(`${pos}: [${attListCode.join(', ')}]`);
      });
      lines.push(`${indent}${varName}.attachments = { ${attEntries.join(', ')} };`);
    }

    ringVars.push(varName);
  });

  // Create FusedRing with skipPositionComputation option
  const finalVar = nextVar();
  const ringsStr = ringVars.join(', ');
  const leadingBond = fusedRing.metaLeadingBond;

  if (leadingBond) {
    lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}], { leadingBond: '${leadingBond}', skipPositionComputation: true });`);
  } else {
    lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}], { skipPositionComputation: true });`);
  }

  // Preserve FusedRing-level metadata
  if (fusedRing.metaTotalAtoms) {
    lines.push(`${indent}${finalVar}.metaTotalAtoms = ${fusedRing.metaTotalAtoms};`);
  }
  if (fusedRing.metaAllPositions && fusedRing.metaAllPositions.length > 0) {
    lines.push(`${indent}${finalVar}.metaAllPositions = [${fusedRing.metaAllPositions.join(', ')}];`);
  }
  if (fusedRing.metaSequentialRings) {
    lines.push(`${indent}${finalVar}.metaSequentialRings = [];`);
  }
  if (fusedRing.metaBranchDepthMap && fusedRing.metaBranchDepthMap.size > 0) {
    lines.push(`${indent}${finalVar}.metaBranchDepthMap = ${formatMapCode(fusedRing.metaBranchDepthMap)};`);
  }
  if (fusedRing.metaParentIndexMap && fusedRing.metaParentIndexMap.size > 0) {
    lines.push(`${indent}${finalVar}.metaParentIndexMap = ${formatMapCode(fusedRing.metaParentIndexMap)};`);
  }
  if (fusedRing.metaAtomValueMap && fusedRing.metaAtomValueMap.size > 0) {
    lines.push(`${indent}${finalVar}.metaAtomValueMap = ${formatMapCode(fusedRing.metaAtomValueMap)};`);
  }
  if (fusedRing.metaBondMap && fusedRing.metaBondMap.size > 0) {
    lines.push(`${indent}${finalVar}.metaBondMap = ${formatMapCode(fusedRing.metaBondMap)};`);
  }
  if (fusedRing.metaRingOrderMap && fusedRing.metaRingOrderMap.size > 0) {
    const entries = [];
    fusedRing.metaRingOrderMap.forEach((value, key) => {
      entries.push(`[${key}, [${value.join(', ')}]]`);
    });
    lines.push(`${indent}${finalVar}.metaRingOrderMap = new Map([${entries.join(', ')}]);`);
  }
  if (fusedRing.metaSeqAtomAttachments) {
    lines.push(`${indent}${finalVar}.metaSeqAtomAttachments = new Map();`);
  }

  return { code: lines.join('\n'), finalVar };
}

/**
 * Check if a fused ring has interleaved pattern (rings nested within each other)
 * Example: C2C3CCCC3C(OC2)C where ring3 is fully nested within ring2
 *
 * Sequential pattern: C1=CC2CCCCC2C1
 *   Ring1 branchDepths: [0, 0, 0, 0, 0] - all at same depth
 *   Ring2 branchDepths: [0, 0, 0, 0, 0, 0] - all at same depth
 *   .fuse() API works correctly
 *
 * Interleaved pattern: C2C3CCCC3C(OC2)C
 *   Ring2 branchDepths: [0, 0, 0, 0, 1, 1] - crosses branch boundary
 *   Ring3 branchDepths: [0, 0, 0, 0, 0] - all at same depth
 *   .fuse() API fails - need FusedRing constructor
 *
 * The key indicator is varying branch depths in ANY ring
 */
function isInterleavedFusedRing(fusedRing) {
  // Check if any ring has varying branch depths
  for (const ring of fusedRing.rings) {
    if (!ring.metaBranchDepths || ring.metaBranchDepths.length === 0) continue;

    const firstDepth = ring.metaBranchDepths[0];
    const hasVaryingDepths = ring.metaBranchDepths.some((d) => d !== firstDepth);

    if (hasVaryingDepths) {
      return true;
    }
  }

  return false;
}

/**
 * Decompile a FusedRing node
 */
function decompileFusedRing(fusedRing, indent, nextVar) {
  const seqRings = fusedRing.metaSequentialRings;
  const hasSeqRings = seqRings && seqRings.length > 0;
  const isInterleaved = isInterleavedFusedRing(fusedRing);
  const hasSeqLinear = hasSequentialLinearAtoms(fusedRing);

  // Check if this is a complex parsed structure (not a simple manual .fuse())
  // Complex structures have metaRingOrderMap which tracks which rings contribute to each position
  const isComplexParsed = fusedRing.metaRingOrderMap && fusedRing.metaRingOrderMap.size > 0;

  // Use complex decompilation if there are sequential rings
  if (hasSeqRings) {
    return decompileComplexFusedRing(fusedRing, indent, nextVar);
  }

  // Use FusedRing constructor for interleaved patterns (check BEFORE sequential linear)
  // Interleaved patterns may have sequential positions (sibling attachments) but should
  // use the interleaved decompiler which handles them via metadata
  if (isInterleaved) {
    return decompileInterleavedFusedRing(fusedRing, indent, nextVar);
  }

  // If this is a complex parsed structure with ring order metadata, use interleaved decompiler
  // This handles complex fused rings like steroids where rings share atoms
  if (isComplexParsed) {
    return decompileInterleavedFusedRing(fusedRing, indent, nextVar);
  }

  // Use injection approach for fused rings with sequential linear atoms but no sequential rings
  if (hasSeqLinear) {
    return decompileFusedRingWithInjection(fusedRing, indent, nextVar);
  }

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
    const { code: componentCode, finalVar } = decompileNodeInternal(component, indent, nextVar);
    lines.push(componentCode);
    componentFinalVars.push(finalVar);
  });

  // Create molecule using the final variable names
  const finalVarName = nextVar();
  const componentsStr = componentFinalVars.join(', ');
  lines.push(`${indent}const ${finalVarName} = Molecule([${componentsStr}]);`);

  return { code: lines.join('\n'), finalVar: finalVarName };
}

// Initialize the internal dispatcher after all functions are defined
decompileNodeInternal = function decompileNodeImpl(node, indent, nextVar) {
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
};

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

  const { code } = decompileNodeInternal(node, indentStr, nextVar);

  // Always use export const
  let result = code.replace(/^(\s*)const /gm, '$1export const ');

  // Filter out metadata assignments if not requested
  if (!includeMetadata) {
    result = result.split('\n').filter((line) => (
      // Remove lines that set meta properties
      !line.match(/\.meta[A-Z][a-zA-Z]*\s*=/)
    )).join('\n');
  }

  return result;
}
