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
 * Decompile a Ring node
 */
function decompileRing(ring, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

  // Build options object
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

  const optionsStr = Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

  let currentVar = varName;

  // Add substitutions
  if (Object.keys(ring.substitutions).length > 0) {
    Object.entries(ring.substitutions).forEach(([pos, atom]) => {
      const newVar = nextVar();
      lines.push(`${indent}const ${newVar} = ${currentVar}.substitute(${pos}, '${atom}');`);
      currentVar = newVar;
    });
  }

  // Add attachments
  if (Object.keys(ring.attachments).length > 0) {
    Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        // eslint-disable-next-line no-use-before-define
        const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, nextVar);
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
 * Decompile a Linear node
 */
function decompileLinear(linear, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

  const atomsStr = linear.atoms.map((a) => `'${a}'`).join(', ');

  // Only include bonds array if there are non-null bonds
  const hasNonNullBonds = linear.bonds.some((b) => b !== null);
  if (hasNonNullBonds) {
    const bondsStr = linear.bonds.map((b) => (b === null ? 'null' : `'${b}'`)).join(', ');
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [${bondsStr}]);`);
  } else {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}]);`);
  }

  let currentVar = varName;

  // Add attachments
  if (Object.keys(linear.attachments).length > 0) {
    Object.entries(linear.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        // eslint-disable-next-line no-use-before-define
        const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, nextVar);
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

  // Fuse rings together
  const finalVar = nextVar();
  if (fusedRing.rings.length === 2) {
    const ring1 = ringFinalVars[0];
    const ring2 = ringFinalVars[1];
    const { offset } = fusedRing.rings[1];
    lines.push(`${indent}const ${finalVar} = ${ring1}.fuse(${ring2}, ${offset});`);
  } else {
    const ringsStr = ringFinalVars.join(', ');
    lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}]);`);
  }

  return { code: lines.join('\n'), finalVar };
}

/**
 * Calculate the fusion offset between two rings based on shared positions
 */
function calculateFusionOffset(ring1, ring2) {
  /* eslint-disable no-underscore-dangle */
  const ring1Positions = ring1._positions || [];
  const ring2Positions = ring2._positions || [];
  /* eslint-enable no-underscore-dangle */

  // Find the first shared position
  const ring1Set = new Set(ring1Positions);
  const firstShared = ring2Positions.find((pos) => ring1Set.has(pos));

  if (firstShared === undefined) {
    return ring2.offset || 0;
  }

  // The offset is the index of the first shared position in ring1
  return ring1Positions.indexOf(firstShared);
}

/**
 * Build a basic ring decompilation (without attachments)
 */
function buildBasicRingCode(ring, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

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
    const bondsStr = bonds.map((b) => (b === null ? 'null' : `'${b}'`)).join(', ');
    options.bonds = `[${bondsStr}]`;
  }

  const optionsStr = Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

  let currentVar = varName;

  // Add substitutions
  if (Object.keys(ring.substitutions).length > 0) {
    Object.entries(ring.substitutions).forEach(([pos, atom]) => {
      const newVar = nextVar();
      lines.push(`${indent}const ${newVar} = ${currentVar}.substitute(${pos}, '${atom}');`);
      currentVar = newVar;
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Build a linear chain decompilation from positions
 */
function buildLinearFromPositions(positions, atomValueMap, bondMap, indent, nextVar) {
  const lines = [];
  const atoms = positions.map((p) => {
    const val = atomValueMap.get(p);
    return typeof val === 'string' ? val : (val?.raw || 'C');
  });

  // Extract bonds for positions after the first
  const bonds = [];
  for (let i = 1; i < positions.length; i += 1) {
    const bond = bondMap ? bondMap.get(positions[i]) : null;
    if (bond) {
      bonds.push(bond);
    }
  }

  const varName = nextVar();
  const atomsStr = atoms.map((a) => `'${a}'`).join(', ');

  if (bonds.length > 0) {
    const bondsStr = bonds.map((b) => `'${b}'`).join(', ');
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [${bondsStr}]);`);
  } else {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}]);`);
  }

  return { code: lines.join('\n'), finalVar: varName };
}

/**
 * Recursively build code for a branch at a specific depth
 * Returns { code, components: [{finalVar, type, startPos}] }
 */
function buildBranchCode(
  positions,
  depth,
  allRings,
  branchDepthMap,
  parentIndexMap,
  atomValueMap,
  bondMap,
  seqAtomAttachments,
  indent,
  nextVar,
  processedRings,
) {
  const lines = [];
  const components = [];

  // Filter positions at this depth
  const positionsAtDepth = positions.filter((p) => (branchDepthMap.get(p) || 0) === depth);
  if (positionsAtDepth.length === 0) {
    return { code: '', components: [] };
  }

  // Find rings that start at this depth
  const ringsAtDepth = allRings.filter((ring) => {
    if (processedRings.has(ring.ringNumber)) return false;
    /* eslint-disable no-underscore-dangle */
    const ringPositions = ring._positions || [];
    /* eslint-enable no-underscore-dangle */
    if (ringPositions.length === 0) return false;
    const firstPos = ringPositions[0];
    return positions.includes(firstPos) && (branchDepthMap.get(firstPos) || 0) === depth;
  });

  // Group fused rings
  const fusedGroups = [];
  const assignedRings = new Set();

  ringsAtDepth.forEach((ring) => {
    if (assignedRings.has(ring.ringNumber)) return;

    const group = [ring];
    assignedRings.add(ring.ringNumber);

    /* eslint-disable no-underscore-dangle */
    const ringPositions = new Set(ring._positions || []);
    /* eslint-enable no-underscore-dangle */

    let didExpand = true;
    while (didExpand) {
      didExpand = false;
      for (let ri = 0; ri < ringsAtDepth.length; ri += 1) {
        const other = ringsAtDepth[ri];
        if (assignedRings.has(other.ringNumber)) {
          // eslint-disable-next-line no-continue
          continue;
        }
        /* eslint-disable no-underscore-dangle */
        const otherPositions = other._positions || [];
        /* eslint-enable no-underscore-dangle */
        const hasOverlap = otherPositions.some((pos) => ringPositions.has(pos));
        if (hasOverlap) {
          group.push(other);
          assignedRings.add(other.ringNumber);
          otherPositions.forEach((pos) => ringPositions.add(pos));
          didExpand = true;
        }
      }
    }

    fusedGroups.push(group);
  });

  // Build ring positions set
  const ringPositionsSet = new Set();
  ringsAtDepth.forEach((ring) => {
    /* eslint-disable no-underscore-dangle */
    (ring._positions || []).forEach((pos) => ringPositionsSet.add(pos));
    /* eslint-enable no-underscore-dangle */
  });

  // Process positions in order
  let i = 0;
  while (i < positionsAtDepth.length) {
    const pos = positionsAtDepth[i];

    // Check if this position is part of a ring group
    /* eslint-disable no-underscore-dangle */
    const ringGroup = fusedGroups.find(
      (group) => group.some((ring) => (ring._positions || []).includes(pos)),
    );
    /* eslint-enable no-underscore-dangle */

    if (ringGroup && !ringGroup.processed) {
      ringGroup.processed = true;
      ringGroup.forEach((ring) => processedRings.add(ring.ringNumber));

      // Get all positions in this ring group
      const groupPositions = new Set();
      ringGroup.forEach((ring) => {
        /* eslint-disable no-underscore-dangle */
        (ring._positions || []).forEach((p) => groupPositions.add(p));
        /* eslint-enable no-underscore-dangle */
      });

      // Check for deeper branches attached to this ring group
      const deeperPositions = positions.filter((p) => {
        const pDepth = branchDepthMap.get(p) || 0;
        const pParent = parentIndexMap.get(p);
        return pDepth > depth && groupPositions.has(pParent);
      });

      if (ringGroup.length === 1) {
        // Single ring
        const ring = ringGroup[0];
        const { code, finalVar } = buildBasicRingCode(ring, indent, nextVar);
        lines.push(code);

        let currentVar = finalVar;

        // Handle deeper attachments to this ring
        if (deeperPositions.length > 0) {
          const { code: deeperCode, components: deeperComponents } = buildBranchCode(
            deeperPositions,
            depth + 1,
            allRings,
            branchDepthMap,
            parentIndexMap,
            atomValueMap,
            bondMap,
            seqAtomAttachments,
            indent,
            nextVar,
            processedRings,
          );

          if (deeperCode) {
            lines.push(deeperCode);

            // Attach deeper components
            if (deeperComponents.length > 0) {
              // Create a Molecule from deeper components if multiple
              let attachmentVar;
              if (deeperComponents.length === 1) {
                attachmentVar = deeperComponents[0].finalVar;
              } else {
                const moleculeVar = nextVar();
                const compVars = deeperComponents.map((c) => c.finalVar).join(', ');
                lines.push(`${indent}const ${moleculeVar} = Molecule([${compVars}]);`);
                attachmentVar = moleculeVar;
              }

              // Find attachment position on the ring
              /* eslint-disable no-underscore-dangle */
              const ringPositions = ring._positions || [];
              /* eslint-enable no-underscore-dangle */
              const attachPos = ringPositions.findIndex((p) => {
                const childPositions = deeperPositions.filter(
                  (dp) => parentIndexMap.get(dp) === p,
                );
                return childPositions.length > 0;
              });

              if (attachPos >= 0) {
                const newVar = nextVar();
                lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${attachmentVar}, ${attachPos + 1});`);
                currentVar = newVar;
              }
            }
          }
        }

        /* eslint-disable no-underscore-dangle */
        components.push({ finalVar: currentVar, type: 'ring', startPos: ring._positions[0] });
        /* eslint-enable no-underscore-dangle */
      } else if (ringGroup.length === 2) {
        // Two rings to fuse - but we need to handle attachments BEFORE fusing
        /* eslint-disable no-underscore-dangle */
        const sortedGroup = [...ringGroup].sort(
          (a, b) => (a._positions[0] || 0) - (b._positions[0] || 0),
        );
        /* eslint-enable no-underscore-dangle */

        const ring1 = sortedGroup[0];
        const ring2 = sortedGroup[1];

        const { code: code1, finalVar: var1 } = buildBasicRingCode(ring1, indent, nextVar);
        lines.push(code1);

        const { code: code2, finalVar: var2 } = buildBasicRingCode(ring2, indent, nextVar);
        lines.push(code2);

        let ring2Var = var2;

        // Handle deeper attachments BEFORE fusing
        // Check which ring(s) the attachments connect to
        if (deeperPositions.length > 0) {
          const { code: deeperCode, components: deeperComponents } = buildBranchCode(
            deeperPositions,
            depth + 1,
            allRings,
            branchDepthMap,
            parentIndexMap,
            atomValueMap,
            bondMap,
            seqAtomAttachments,
            indent,
            nextVar,
            processedRings,
          );

          if (deeperCode) {
            lines.push(deeperCode);

            if (deeperComponents.length > 0) {
              let attachmentVar;
              if (deeperComponents.length === 1) {
                attachmentVar = deeperComponents[0].finalVar;
              } else {
                const moleculeVar = nextVar();
                const compVars = deeperComponents.map((c) => c.finalVar).join(', ');
                lines.push(`${indent}const ${moleculeVar} = Molecule([${compVars}]);`);
                attachmentVar = moleculeVar;
              }

              // Check which ring to attach to (ring1 or ring2)
              /* eslint-disable no-underscore-dangle */
              const ring1Positions = ring1._positions || [];
              const ring2Positions = ring2._positions || [];
              /* eslint-enable no-underscore-dangle */

              // Check ring2 first (more common case for fused rings)
              let attachPos = ring2Positions.findIndex((p) => {
                const childPositions = deeperPositions.filter(
                  (dp) => parentIndexMap.get(dp) === p,
                );
                return childPositions.length > 0;
              });

              if (attachPos >= 0) {
                // Attach to ring2 BEFORE fusing
                const newVar = nextVar();
                lines.push(`${indent}const ${newVar} = ${ring2Var}.attach(${attachmentVar}, ${attachPos + 1});`);
                ring2Var = newVar;
              } else {
                // Check ring1
                attachPos = ring1Positions.findIndex((p) => {
                  const childPositions = deeperPositions.filter(
                    (dp) => parentIndexMap.get(dp) === p,
                  );
                  return childPositions.length > 0;
                });

                if (attachPos >= 0) {
                  // Attach to ring1 (rare case)
                  const newVar = nextVar();
                  const pos1 = attachPos + 1;
                  lines.push(`${indent}const ${newVar} = ${var1}.attach(${attachmentVar}, ${pos1});`);
                  // Note: we'd need to update var1 but for simplicity assume ring2 is attach point
                }
              }
            }
          }
        }

        // Now fuse the rings (with ring2 potentially having attachments)
        // Calculate proper offset based on shared positions
        const fusionOffset = calculateFusionOffset(ring1, ring2);
        const fusedVar = nextVar();
        lines.push(`${indent}const ${fusedVar} = ${var1}.fuse(${ring2Var}, ${fusionOffset});`);

        /* eslint-disable no-underscore-dangle */
        components.push({ finalVar: fusedVar, type: 'fused_ring', startPos: ring1._positions[0] });
        /* eslint-enable no-underscore-dangle */
      }

      // Skip positions that are part of this ring group
      while (i < positionsAtDepth.length && groupPositions.has(positionsAtDepth[i])) {
        i += 1;
      }
    } else if (!ringPositionsSet.has(pos)) {
      // Linear segment
      const linearPositions = [pos];
      let j = i + 1;
      while (j < positionsAtDepth.length
             && !ringPositionsSet.has(positionsAtDepth[j])
             && positionsAtDepth[j] - positionsAtDepth[j - 1] <= 2) {
        linearPositions.push(positionsAtDepth[j]);
        j += 1;
      }

      const linArgs = [linearPositions, atomValueMap, bondMap, indent, nextVar];
      const { code, finalVar } = buildLinearFromPositions(...linArgs);
      lines.push(code);

      let currentVar = finalVar;

      // Check for attachments on linear positions
      linearPositions.forEach((lp, idx) => {
        const attachments = seqAtomAttachments.get(lp);
        if (attachments) {
          attachments.forEach((attachment) => {
            // eslint-disable-next-line no-use-before-define
            const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, nextVar);
            lines.push(aCode);
            const newVar = nextVar();
            lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${idx + 1});`);
            currentVar = newVar;
          });
        }
      });

      // Check for deeper branches from linear positions
      const deeperPositions = positions.filter((p) => {
        const pDepth = branchDepthMap.get(p) || 0;
        const pParent = parentIndexMap.get(p);
        return pDepth > depth && linearPositions.includes(pParent);
      });

      if (deeperPositions.length > 0) {
        const { code: deeperCode, components: deeperComponents } = buildBranchCode(
          deeperPositions,
          depth + 1,
          allRings,
          branchDepthMap,
          parentIndexMap,
          atomValueMap,
          bondMap,
          seqAtomAttachments,
          indent,
          nextVar,
          processedRings,
        );

        if (deeperCode) {
          lines.push(deeperCode);

          if (deeperComponents.length > 0) {
            let attachmentVar;
            if (deeperComponents.length === 1) {
              attachmentVar = deeperComponents[0].finalVar;
            } else {
              const moleculeVar = nextVar();
              const compVars = deeperComponents.map((c) => c.finalVar).join(', ');
              lines.push(`${indent}const ${moleculeVar} = Molecule([${compVars}]);`);
              attachmentVar = moleculeVar;
            }

            // Find attachment position
            const attachIdx = linearPositions.findIndex((lp) => {
              const childPositions = deeperPositions.filter(
                (dp) => parentIndexMap.get(dp) === lp,
              );
              return childPositions.length > 0;
            });

            if (attachIdx >= 0) {
              const newVar = nextVar();
              lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${attachmentVar}, ${attachIdx + 1});`);
              currentVar = newVar;
            }
          }
        }
      }

      components.push({ finalVar: currentVar, type: 'linear', startPos: linearPositions[0] });
      i = j;
    } else {
      i += 1;
    }
  }

  // Chain sequential components together
  // If a component's first position immediately follows another component's position, attach it
  if (components.length > 1) {
    const chainedComponents = [];
    let currentChain = components[0];
    // Track all rings in the current chain for finding attachment points
    let chainRings = currentChain.type === 'ring' ? [currentChain.startPos] : [];

    for (let ci = 1; ci < components.length; ci += 1) {
      const nextComp = components[ci];
      let attached = false;

      // Try to chain if current has rings (not fused_ring which needs .attachToRing)
      if (chainRings.length > 0 || currentChain.type === 'ring') {
        // Find all rings that are part of the current chain
        const allChainRingPositions = [];
        /* eslint-disable no-underscore-dangle */
        chainRings.forEach((startPos) => {
          const ring = ringsAtDepth.find(
            (r) => (r._positions || []).includes(startPos),
          );
          if (ring) {
            (ring._positions || []).forEach((p) => allChainRingPositions.push(p));
          }
        });
        /* eslint-enable no-underscore-dangle */

        // Find the ring/position that precedes nextComp.startPos
        const positionsBeforeNext = allChainRingPositions.filter((p) => {
          const pDepth = branchDepthMap.get(p) || 0;
          return p < nextComp.startPos && pDepth <= depth;
        });

        if (positionsBeforeNext.length > 0) {
          const predecessorPos = Math.max(...positionsBeforeNext);

          // Only chain if the gap is small
          if (nextComp.startPos - predecessorPos <= 5) {
            // Find which ring contains this predecessor position
            /* eslint-disable no-underscore-dangle */
            const predecessorRing = ringsAtDepth.find(
              (r) => (r._positions || []).includes(predecessorPos),
            );
            /* eslint-enable no-underscore-dangle */

            if (predecessorRing) {
              /* eslint-disable no-underscore-dangle */
              const rp = predecessorRing._positions || [];
              /* eslint-enable no-underscore-dangle */
              const attachIdx = rp.indexOf(predecessorPos);

              if (attachIdx >= 0) {
                const newVar = nextVar();
                const chainVar = currentChain.finalVar;
                const nextV = nextComp.finalVar;
                lines.push(`${indent}const ${newVar} = ${chainVar}.attach(${nextV}, ${attachIdx + 1});`);

                // Update chain info - if nextComp is a ring, add it to chainRings
                if (nextComp.type === 'ring') {
                  chainRings.push(nextComp.startPos);
                }
                currentChain = { finalVar: newVar, type: 'ring', startPos: currentChain.startPos };
                attached = true;
              }
            }
          }
        }
      }

      if (!attached) {
        chainedComponents.push(currentChain);
        currentChain = nextComp;
        chainRings = nextComp.type === 'ring' ? [nextComp.startPos] : [];
      }
    }
    chainedComponents.push(currentChain);

    return { code: lines.join('\n'), components: chainedComponents };
  }

  return { code: lines.join('\n'), components };
}

/**
 * Decompile a complex FusedRing with sequential rings and branch structure
 */
function decompileComplexFusedRing(fusedRing, indent, nextVar) {
  /* eslint-disable no-underscore-dangle */
  const allPositions = fusedRing._allPositions || [];
  const branchDepthMap = fusedRing._branchDepthMap || new Map();
  const parentIndexMap = fusedRing._parentIndexMap || new Map();
  const atomValueMap = fusedRing._atomValueMap || new Map();
  const bondMap = fusedRing._bondMap || new Map();
  const sequentialRings = fusedRing._sequentialRings || [];
  const seqAtomAttachments = fusedRing._seqAtomAttachments || new Map();
  /* eslint-enable no-underscore-dangle */

  const allRings = [...fusedRing.rings, ...sequentialRings];
  const processedRings = new Set();

  // Build code recursively starting from depth 0
  const { code, components } = buildBranchCode(
    allPositions,
    0,
    allRings,
    branchDepthMap,
    parentIndexMap,
    atomValueMap,
    bondMap,
    seqAtomAttachments,
    indent,
    nextVar,
    processedRings,
  );

  if (components.length === 0) {
    return decompileSimpleFusedRing(fusedRing, indent, nextVar);
  }

  // The first component at depth 0 should be our main fused ring
  return { code, finalVar: components[0].finalVar };
}

/**
 * Decompile a FusedRing node
 */
function decompileFusedRing(fusedRing, indent, nextVar) {
  /* eslint-disable no-underscore-dangle */
  const hasComplexStructure = fusedRing._sequentialRings && fusedRing._sequentialRings.length > 0;
  /* eslint-enable no-underscore-dangle */

  if (hasComplexStructure) {
    return decompileComplexFusedRing(fusedRing, indent, nextVar);
  }

  return decompileSimpleFusedRing(fusedRing, indent, nextVar);
}

/**
 * Decompile a Molecule node
 */
function decompileMolecule(molecule, indent, nextVar) {
  const lines = [];
  const componentFinalVars = [];

  // Create components
  molecule.components.forEach((component) => {
    // eslint-disable-next-line no-use-before-define
    const { code: componentCode, finalVar } = decompileNode(component, indent, nextVar);
    lines.push(componentCode);
    componentFinalVars.push(finalVar);
  });

  // Create molecule using the final variable names
  const finalVarName = nextVar();
  const componentsStr = componentFinalVars.join(', ');
  lines.push(`${indent}const ${finalVarName} = Molecule([${componentsStr}]);`);

  return { code: lines.join('\n'), finalVar: finalVarName };
}

/**
 * Internal dispatcher
 */
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
 */
export function decompile(node, options = {}) {
  const { indent = 0, varName = 'v' } = options;
  const indentStr = '  '.repeat(indent);
  const nextVar = createCounter(varName);

  const { code } = decompileNode(node, indentStr, nextVar);

  // Always use export const
  return code.replace(/^(\s*)const /gm, '$1export const ');
}
