/**
 * Layout computation for fused ring position metadata.
 * Extracted from constructors.js
 */

/**
 * Compute position metadata for fused rings
 * This enables proper interleaved SMILES generation
 *
 * The algorithm handles multi-ring systems with different fusion topologies:
 *
 * 1. Amitriptyline-type: Base ring with multiple inside/endpoint fusions
 *    - All inner rings fuse directly with the base ring
 *    - Inner rings are fully contained within base ring traversal
 *
 * 2. Carbamazepine-type: "Extending" fusion where inner ring extends beyond base
 *    - Ring B fuses with ring A but extends beyond A's end
 *    - Ring A's remaining atoms must be output as a BRANCH
 *    - Ring C may fuse with ring B (chained fusion)
 */
export function computeFusedRingPositions(fusedRingNodeParam) {
  const target = { node: fusedRingNodeParam };
  const { rings } = target.node;

  const sortedRings = [...rings].sort((a, b) => a.offset - b.offset);
  const baseRing = sortedRings[0];
  const innerRings = sortedRings.slice(1);

  // Build fusion graph
  const fusionGraph = buildFusionGraph(sortedRings, innerRings, baseRing);

  // Classify inner rings
  const classification = classifyInnerRings(innerRings, sortedRings, baseRing, fusionGraph);
  const {
    insideRings, extendingRings, startSharingRings, endpointRings, chainedRings, spiroRings,
  } = classification;

  // Build chained ring info
  const chainedRingInfo = buildChainedRingInfo(chainedRings, sortedRings, fusionGraph);

  // Build lookup maps
  const insideRingAtOffset = new Map();
  insideRings.forEach((ring) => insideRingAtOffset.set(ring.offset, ring));

  const extendingRingAtOffset = new Map();
  extendingRings.forEach((ring) => extendingRingAtOffset.set(ring.offset, ring));

  const startSharingRingAtOffset = new Map();
  startSharingRings.forEach((ring) => startSharingRingAtOffset.set(ring.offset, ring));

  const endpointRingAtOffset = new Map();
  endpointRings.forEach((ring) => endpointRingAtOffset.set(ring.offset, ring));

  const spiroRingAtOffset = new Map();
  spiroRings.forEach((ring) => spiroRingAtOffset.set(ring.offset, ring));

  // Traverse and build positions
  const innerRingData = new Map();
  innerRings.forEach((ring) => {
    innerRingData.set(ring, { positions: [], start: -1, end: -1 });
  });

  const result = traverseBaseRing(
    baseRing,
    innerRingData,
    chainedRings,
    chainedRingInfo,
    insideRingAtOffset,
    extendingRingAtOffset,
    startSharingRingAtOffset,
    endpointRingAtOffset,
    spiroRingAtOffset,
  );

  const { allPositions, baseRingPositions, branchDepthMap, totalAtoms } = result;

  // Store position metadata
  sortedRings[0].metaPositions = baseRingPositions;
  sortedRings[0].metaStart = 0;
  sortedRings[0].metaEnd = baseRingPositions[baseRingPositions.length - 1];

  innerRings.forEach((innerRing, idx) => {
    const data = innerRingData.get(innerRing);
    if (data && data.positions.length > 0) {
      sortedRings[idx + 1].metaPositions = data.positions;
      sortedRings[idx + 1].metaStart = data.start;
      sortedRings[idx + 1].metaEnd = data.end;
    }
  });

  target.node.metaAllPositions = allPositions;
  target.node.metaTotalAtoms = totalAtoms;
  target.node.metaBranchDepthMap = branchDepthMap;

  // Build ring order map
  const ringOrderMap = buildRingOrderMap(
    baseRing,
    innerRings,
    innerRingData,
    totalAtoms,
    chainedRings,
    endpointRings,
  );
  target.node.metaRingOrderMap = ringOrderMap;

  // Build atom-level maps from ring data
  const { atomValueMap, bondMap } = buildAtomLevelMaps(sortedRings);
  target.node.metaAtomValueMap = atomValueMap;
  target.node.metaBondMap = bondMap;
}

/**
 * Apply branch depths from constituent rings to fused ring's branchDepthMap
 */
export function applyRingBranchDepthsToFusedRing(node) {
  const branchDepthMap = node.metaBranchDepthMap;
  if (!branchDepthMap) return;

  node.rings.forEach((ring) => {
    const ringBranchDepths = ring.metaBranchDepths;
    const ringPositions = ring.metaPositions;

    if (ringBranchDepths && ringPositions && ringBranchDepths.length === ringPositions.length) {
      ringPositions.forEach((pos, idx) => {
        const depth = ringBranchDepths[idx];
        const currentDepth = branchDepthMap.get(pos) || 0;
        if (depth > currentDepth) {
          branchDepthMap.set(pos, depth);
        }
      });
    }
  });
}

// --- Internal helpers ---

function buildFusionGraph(sortedRings, innerRings, baseRing) {
  const fusionGraph = new Map();
  for (let i = 0; i < sortedRings.length; i += 1) {
    fusionGraph.set(i, new Set());
  }

  for (let i = 1; i < sortedRings.length; i += 1) {
    const ring = sortedRings[i];
    if (ring.offset > 0) {
      fusionGraph.get(0).add(i);
      fusionGraph.get(i).add(0);
    }
  }

  const offsetZeroInnerRings = innerRings.filter((r) => r.offset === 0);
  if (offsetZeroInnerRings.length === 1 && innerRings.length === 1) {
    const ring = offsetZeroInnerRings[0];
    const ringIndex = sortedRings.indexOf(ring);
    fusionGraph.get(0).add(ringIndex);
    fusionGraph.get(ringIndex).add(0);
  } else if (offsetZeroInnerRings.length > 0 && innerRings.length > 1) {
    const firstOffsetZero = offsetZeroInnerRings[0];
    const firstIndex = sortedRings.indexOf(firstOffsetZero);
    fusionGraph.get(0).add(firstIndex);
    fusionGraph.get(firstIndex).add(0);

    for (let i = 1; i < offsetZeroInnerRings.length; i += 1) {
      const ring = offsetZeroInnerRings[i];
      const ringIndex = sortedRings.indexOf(ring);
      const prevRing = offsetZeroInnerRings[i - 1];
      const prevIndex = sortedRings.indexOf(prevRing);
      fusionGraph.get(prevIndex).add(ringIndex);
      fusionGraph.get(ringIndex).add(prevIndex);
    }
  }

  return fusionGraph;
}

function classifyInnerRings(innerRings, sortedRings, baseRing, fusionGraph) {
  const insideRings = [];
  const extendingRings = [];
  const startSharingRings = [];
  const endpointRings = [];
  const chainedRings = [];
  const spiroRings = [];

  innerRings.forEach((ring) => {
    const ringIndex = sortedRings.indexOf(ring);
    const fusesWithBase = fusionGraph.get(ringIndex).has(0);

    if (!fusesWithBase) {
      chainedRings.push(ring);
    } else {
      const innerEnd = ring.offset + ring.size - 1;
      const baseEnd = baseRing.size - 1;

      if (ring.offset === 0 && innerEnd > baseEnd) {
        startSharingRings.push(ring);
      } else if (innerEnd > baseEnd) {
        extendingRings.push(ring);
      } else if (innerEnd === baseEnd) {
        endpointRings.push(ring);
      } else {
        insideRings.push(ring);
      }
    }
  });

  // Detect spiro rings
  innerRings.forEach((ring) => {
    const bd = ring.metaBranchDepths;
    if (bd && bd.length >= 2 && bd[0] === 0 && bd.slice(1).every((d) => d > 0)) {
      // Remove from insideRings
      const idx = insideRings.indexOf(ring);
      if (idx !== -1) insideRings.splice(idx, 1);
      spiroRings.push(ring);
    }
  });

  return {
    insideRings, extendingRings, startSharingRings, endpointRings, chainedRings, spiroRings,
  };
}

function buildChainedRingInfo(chainedRings, sortedRings, fusionGraph) {
  const chainedRingInfo = new Map();
  chainedRings.forEach((ring) => {
    const ringIndex = sortedRings.indexOf(ring);
    const fusionPartners = fusionGraph.get(ringIndex);

    let hostRing = null;
    fusionPartners.forEach((partnerIndex) => {
      if (partnerIndex !== 0) {
        const partner = sortedRings[partnerIndex];
        if (!hostRing || partner.offset > hostRing.offset) {
          hostRing = partner;
        }
      }
    });

    if (hostRing) {
      const hostInnerAtoms = hostRing.size - 2;
      const hostOffset = hostInnerAtoms - 3;
      chainedRingInfo.set(ring, { hostRing, hostOffset });
    }
  });
  return chainedRingInfo;
}

function traverseStartSharing(
  baseRing, startSharingRing, innerRingData, chainedRings, chainedRingInfo,
  allPositions, baseRingPositions, branchDepthMap, currentPosRef, currentDepth,
) {
  const data = innerRingData.get(startSharingRing);
  let currentPos = currentPosRef.value;

  // Shared starting atom
  allPositions.push(currentPos);
  baseRingPositions.push(currentPos);
  data.positions.push(currentPos);
  data.start = currentPos;
  branchDepthMap.set(currentPos, currentDepth);
  currentPos += 1;

  if (baseRing.attachments && baseRing.attachments[1]) {
    currentPos += baseRing.attachments[1].length;
  }

  for (let i = 1; i < baseRing.size; i += 1) {
    allPositions.push(currentPos);
    baseRingPositions.push(currentPos);
    data.positions.push(currentPos);
    branchDepthMap.set(currentPos, currentDepth);
    currentPos += 1;

    const atomPosition = i + 1;
    if (baseRing.attachments && baseRing.attachments[atomPosition]) {
      currentPos += baseRing.attachments[atomPosition].length;
    }
  }

  const uniqueAtoms = startSharingRing.size - baseRing.size;
  let innerIdx = 0;
  while (innerIdx < uniqueAtoms) {
    let chainedRingHere = null;
    const positionsRemaining = uniqueAtoms - innerIdx;
    if (positionsRemaining === 2) {
      for (let cr = 0; cr < chainedRings.length; cr += 1) {
        const chainedRing = chainedRings[cr];
        const info = chainedRingInfo.get(chainedRing);
        if (info && info.hostRing === startSharingRing) {
          chainedRingHere = chainedRing;
          break;
        }
      }
    }

    if (chainedRingHere) {
      allPositions.push(currentPos);
      data.positions.push(currentPos);
      const chainedData = innerRingData.get(chainedRingHere);
      chainedData.start = currentPos;
      chainedData.positions.push(currentPos);
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;
      innerIdx += 1;

      allPositions.push(currentPos);
      data.positions.push(currentPos);
      chainedData.positions.push(currentPos);
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;
      innerIdx += 1;

      const chainedInnerAtoms = chainedRingHere.size - 2;
      for (let j = 0; j < chainedInnerAtoms; j += 1) {
        let nestedChainedRing = null;
        const hostRemainingAtoms = chainedInnerAtoms - j;

        for (let cr = 0; cr < chainedRings.length; cr += 1) {
          const possibleNested = chainedRings[cr];
          if (possibleNested === chainedRingHere) continue;
          const info = chainedRingInfo.get(possibleNested);
          if (info && info.hostRing === chainedRingHere) {
            if (possibleNested.size === hostRemainingAtoms) {
              nestedChainedRing = possibleNested;
              break;
            }
            const nestedHostInnerAtoms = chainedRingHere.size - 2;
            const nestedHostOffset = nestedHostInnerAtoms - 3;
            if (j === nestedHostOffset) {
              nestedChainedRing = possibleNested;
              break;
            }
          }
        }

        if (nestedChainedRing) {
          const nestedData = innerRingData.get(nestedChainedRing);
          const hostRemaining = chainedInnerAtoms - j;

          if (nestedChainedRing.size === hostRemaining) {
            nestedData.start = currentPos;
            for (let k = 0; k < hostRemaining; k += 1) {
              allPositions.push(currentPos);
              chainedData.positions.push(currentPos);
              nestedData.positions.push(currentPos);
              branchDepthMap.set(currentPos, currentDepth);
              currentPos += 1;
            }
            nestedData.end = currentPos - 1;
            chainedData.end = currentPos - 1;
            break;
          } else {
            allPositions.push(currentPos);
            chainedData.positions.push(currentPos);
            nestedData.start = currentPos;
            nestedData.positions.push(currentPos);
            branchDepthMap.set(currentPos, currentDepth);
            currentPos += 1;

            allPositions.push(currentPos);
            chainedData.positions.push(currentPos);
            nestedData.positions.push(currentPos);
            branchDepthMap.set(currentPos, currentDepth);
            currentPos += 1;

            for (let k = 2; k < nestedChainedRing.size; k += 1) {
              allPositions.push(currentPos);
              nestedData.positions.push(currentPos);
              branchDepthMap.set(currentPos, currentDepth);
              currentPos += 1;
            }

            nestedData.end = currentPos - 1;
            chainedData.end = nestedData.positions[1];
            break;
          }
        } else {
          allPositions.push(currentPos);
          chainedData.positions.push(currentPos);
          branchDepthMap.set(currentPos, currentDepth);
          currentPos += 1;
        }
      }

      if (chainedData.end === undefined || chainedData.end === -1) {
        chainedData.end = currentPos - 1;
      }

      data.end = data.positions[data.positions.length - 1];
      break;
    } else {
      allPositions.push(currentPos);
      data.positions.push(currentPos);
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      const atomPosition = baseRing.size + innerIdx + 1;
      if (startSharingRing.attachments && startSharingRing.attachments[atomPosition]) {
        currentPos += startSharingRing.attachments[atomPosition].length;
      }

      innerIdx += 1;
    }
  }

  if (data.end === undefined || data.end === -1) {
    data.end = currentPos - 1;
  }

  currentPosRef.value = currentPos;
}

function traverseSpiro(
  spiroRing, innerRingData, allPositions, baseRingPositions, branchDepthMap,
  currentPosRef, currentDepth,
) {
  const data = innerRingData.get(spiroRing);
  const spiroBranchDepths = spiroRing.metaBranchDepths || [];
  let currentPos = currentPosRef.value;

  allPositions.push(currentPos);
  baseRingPositions.push(currentPos);
  data.positions.push(currentPos);
  data.start = currentPos;
  branchDepthMap.set(currentPos, currentDepth);
  currentPos += 1;

  for (let i = 1; i < spiroRing.size; i += 1) {
    allPositions.push(currentPos);
    data.positions.push(currentPos);
    const ringDepth = spiroBranchDepths[i] || 0;
    branchDepthMap.set(currentPos, currentDepth + ringDepth);
    currentPos += 1;
  }

  data.end = data.positions[data.positions.length - 1];
  currentPosRef.value = currentPos;
}

function traverseInside(
  insideRing, innerRingData, chainedRings, chainedRingInfo,
  allPositions, baseRingPositions, branchDepthMap, currentPosRef, currentDepth,
) {
  const data = innerRingData.get(insideRing);
  let currentPos = currentPosRef.value;

  allPositions.push(currentPos);
  baseRingPositions.push(currentPos);
  data.positions.push(currentPos);
  data.start = currentPos;
  branchDepthMap.set(currentPos, currentDepth);
  currentPos += 1;

  for (let i = 1; i < insideRing.size - 1; i += 1) {
    allPositions.push(currentPos);
    data.positions.push(currentPos);
    branchDepthMap.set(currentPos, currentDepth);
    currentPos += 1;

    for (let cr = 0; cr < chainedRings.length; cr += 1) {
      const chainedRing = chainedRings[cr];
      const info = chainedRingInfo.get(chainedRing);
      if (info && info.hostRing === insideRing && i === info.hostOffset) {
        const chainedData = innerRingData.get(chainedRing);
        chainedData.start = currentPos - 1;
        chainedData.positions.push(currentPos - 1);

        for (let j = 1; j < chainedRing.size - 1; j += 1) {
          allPositions.push(currentPos);
          chainedData.positions.push(currentPos);
          branchDepthMap.set(currentPos, currentDepth);
          currentPos += 1;
        }

        chainedData.end = currentPos;
        chainedData.positions.push(currentPos);
      }
    }
  }

  allPositions.push(currentPos);
  baseRingPositions.push(currentPos);
  data.positions.push(currentPos);
  data.end = currentPos;
  branchDepthMap.set(currentPos, currentDepth);
  currentPos += 1;

  currentPosRef.value = currentPos;
}

function traverseExtending(
  baseRing, extendingRing, innerRingData, chainedRings, chainedRingInfo,
  allPositions, baseRingPositions, branchDepthMap, currentPosRef, currentDepthRef,
) {
  const data = innerRingData.get(extendingRing);
  let currentPos = currentPosRef.value;
  let currentDepth = currentDepthRef.value;

  let hasChainedRings = false;
  chainedRings.forEach((chainedRing) => {
    const info = chainedRingInfo.get(chainedRing);
    if (info && info.hostRing === extendingRing) {
      hasChainedRings = true;
    }
  });

  allPositions.push(currentPos);
  baseRingPositions.push(currentPos);
  data.positions.push(currentPos);
  data.start = currentPos;
  branchDepthMap.set(currentPos, currentDepth);
  currentPos += 1;

  if (hasChainedRings) {
    allPositions.push(currentPos);
    baseRingPositions.push(currentPos);
    data.positions.push(currentPos);
    branchDepthMap.set(currentPos, currentDepth);
    currentPos += 1;

    const remainingBaseAtoms = baseRing.size - (extendingRing.offset + 2);
    if (remainingBaseAtoms > 0) {
      currentDepth += 1;
      for (let i = 0; i < remainingBaseAtoms; i += 1) {
        allPositions.push(currentPos);
        baseRingPositions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
      }
      currentDepth -= 1;
    }

    const extendingInnerAtoms = extendingRing.size - 3;
    let innerIdx = 0;
    while (innerIdx < extendingInnerAtoms) {
      let chainedRingHere = null;
      for (let cr = 0; cr < chainedRings.length; cr += 1) {
        const chainedRing = chainedRings[cr];
        const info = chainedRingInfo.get(chainedRing);
        if (info && info.hostRing === extendingRing && innerIdx === info.hostOffset) {
          chainedRingHere = chainedRing;
        }
      }

      if (chainedRingHere) {
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        const chainedData = innerRingData.get(chainedRingHere);
        chainedData.start = currentPos;
        chainedData.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
        innerIdx += 1;

        for (let j = 1; j < chainedRingHere.size - 1; j += 1) {
          allPositions.push(currentPos);
          chainedData.positions.push(currentPos);
          branchDepthMap.set(currentPos, currentDepth);
          currentPos += 1;
        }

        allPositions.push(currentPos);
        data.positions.push(currentPos);
        chainedData.positions.push(currentPos);
        chainedData.end = currentPos;
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
        innerIdx += 1;
      } else {
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
        innerIdx += 1;
      }
    }

    allPositions.push(currentPos);
    data.positions.push(currentPos);
    data.end = currentPos;
    branchDepthMap.set(currentPos, currentDepth);
    currentPos += 1;
  } else {
    const baseRemainingAfterFirstFusion = baseRing.size - (extendingRing.offset + 1);
    const isCompactFusion = baseRemainingAfterFirstFusion === 1;

    if (isCompactFusion) {
      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      data.positions.push(currentPos);
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      for (let i = 2; i < extendingRing.size; i += 1) {
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
      }

      data.end = currentPos - 1;
    } else {
      for (let i = 1; i < extendingRing.size - 1; i += 1) {
        allPositions.push(currentPos);
        data.positions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
      }

      allPositions.push(currentPos);
      baseRingPositions.push(currentPos);
      data.positions.push(currentPos);
      data.end = currentPos;
      branchDepthMap.set(currentPos, currentDepth);
      currentPos += 1;

      const remainingBaseAtoms = baseRing.size - (extendingRing.offset + 2);
      for (let i = 0; i < remainingBaseAtoms; i += 1) {
        allPositions.push(currentPos);
        baseRingPositions.push(currentPos);
        branchDepthMap.set(currentPos, currentDepth);
        currentPos += 1;
      }
    }
  }

  currentPosRef.value = currentPos;
  currentDepthRef.value = currentDepth;
}

function traverseEndpoint(
  endpointRing, innerRingData, allPositions, baseRingPositions, branchDepthMap,
  currentPosRef, currentDepth,
) {
  const data = innerRingData.get(endpointRing);
  let currentPos = currentPosRef.value;
  data.start = currentPos;

  for (let i = 0; i < endpointRing.size; i += 1) {
    allPositions.push(currentPos);
    baseRingPositions.push(currentPos);
    data.positions.push(currentPos);
    branchDepthMap.set(currentPos, currentDepth);
    currentPos += 1;
  }

  data.end = currentPos - 1;
  currentPosRef.value = currentPos;
}

function traverseBaseRing(
  baseRing, innerRingData, chainedRings, chainedRingInfo,
  insideRingAtOffset, extendingRingAtOffset, startSharingRingAtOffset,
  endpointRingAtOffset, spiroRingAtOffset,
) {
  const allPositions = [];
  const baseRingPositions = [];
  const branchDepthMap = new Map();

  const currentPosRef = { value: 0 };
  const currentDepthRef = { value: 0 };
  let basePos = 0;

  while (basePos < baseRing.size) {
    const insideRing = insideRingAtOffset.get(basePos);
    const extendingRing = extendingRingAtOffset.get(basePos);
    const startSharingRing = startSharingRingAtOffset.get(basePos);
    const endpointRing = endpointRingAtOffset.get(basePos);
    const spiroRing = spiroRingAtOffset.get(basePos);

    if (startSharingRing) {
      traverseStartSharing(
        baseRing, startSharingRing, innerRingData, chainedRings, chainedRingInfo,
        allPositions, baseRingPositions, branchDepthMap, currentPosRef, currentDepthRef.value,
      );
      basePos = baseRing.size;
    } else if (spiroRing) {
      traverseSpiro(
        spiroRing, innerRingData, allPositions, baseRingPositions, branchDepthMap,
        currentPosRef, currentDepthRef.value,
      );
      basePos += 1;
    } else if (insideRing) {
      traverseInside(
        insideRing, innerRingData, chainedRings, chainedRingInfo,
        allPositions, baseRingPositions, branchDepthMap, currentPosRef, currentDepthRef.value,
      );
      basePos += 2;
    } else if (extendingRing) {
      traverseExtending(
        baseRing, extendingRing, innerRingData, chainedRings, chainedRingInfo,
        allPositions, baseRingPositions, branchDepthMap, currentPosRef, currentDepthRef,
      );
      basePos = baseRing.size;
    } else if (endpointRing) {
      traverseEndpoint(
        endpointRing, innerRingData, allPositions, baseRingPositions, branchDepthMap,
        currentPosRef, currentDepthRef.value,
      );
      basePos += endpointRing.size;
    } else {
      allPositions.push(currentPosRef.value);
      baseRingPositions.push(currentPosRef.value);
      branchDepthMap.set(currentPosRef.value, currentDepthRef.value);
      currentPosRef.value += 1;
      basePos += 1;
    }
  }

  return {
    allPositions,
    baseRingPositions,
    branchDepthMap,
    totalAtoms: currentPosRef.value,
  };
}

function buildRingOrderMap(baseRing, innerRings, innerRingData, totalAtoms, chainedRings, endpointRings) {
  const ringOrderMap = new Map();
  const closePositions = new Map();

  [baseRing, ...innerRings].forEach((ring) => {
    const data = innerRingData.get(ring);
    const endPos = data ? data.end : (totalAtoms - 1);
    if (endPos >= 0) {
      if (!closePositions.has(endPos)) {
        closePositions.set(endPos, []);
      }
      closePositions.get(endPos).push(ring.ringNumber);
    }
  });

  closePositions.forEach((ringNumbers, pos) => {
    if (ringNumbers.length > 1) {
      const chainedRingNumbers = chainedRings.map((r) => r.ringNumber);
      const endpointRingNumbers = endpointRings.map((r) => r.ringNumber);
      const sorted = [...ringNumbers].sort((a, b) => {
        const aIsChained = chainedRingNumbers.includes(a);
        const bIsChained = chainedRingNumbers.includes(b);
        const aIsEndpoint = endpointRingNumbers.includes(a);
        const bIsEndpoint = endpointRingNumbers.includes(b);

        if (aIsChained && !bIsChained) return 1;
        if (!aIsChained && bIsChained) return -1;
        if (aIsEndpoint && !bIsEndpoint) return 1;
        if (!aIsEndpoint && bIsEndpoint) return -1;
        return a - b;
      });
      ringOrderMap.set(pos, sorted);
    }
  });

  return ringOrderMap;
}

function buildAtomLevelMaps(sortedRings) {
  const atomValueMap = new Map();
  const bondMap = new Map();

  sortedRings.forEach((ring) => {
    const positions = ring.metaPositions || [];
    const { atoms, substitutions = {}, bonds = [] } = ring;

    positions.forEach((pos, idx) => {
      const relativePos = idx + 1;
      const atomValue = substitutions[relativePos] || atoms;

      // Only store if different from base atom (substituted)
      if (substitutions[relativePos] && !atomValueMap.has(pos)) {
        atomValueMap.set(pos, atomValue);
      }

      // Store bond before this atom (for atoms after the first in the ring)
      if (idx > 0 && bonds[idx - 1] && !bondMap.has(pos)) {
        bondMap.set(pos, bonds[idx - 1]);
      }
    });
  });

  return { atomValueMap, bondMap };
}
