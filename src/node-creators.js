/**
 * Internal factory functions for creating AST nodes
 */

import { ASTNodeType } from './ast.js';
import { computeFusedRingPositions, applyRingBranchDepthsToFusedRing } from './layout/index.js';
import {
  attachSmilesGetter,
  attachRingMethods,
  attachLinearMethods,
  attachFusedRingMethods,
  attachMoleculeMethods,
} from './method-attachers.js';

export function createRingNode(
  atoms,
  size,
  ringNumber,
  offset,
  subs,
  attachments,
  bonds = [],
  branchDepths = null,
) {
  const node = {
    type: ASTNodeType.RING,
    atoms,
    size,
    ringNumber,
    offset,
    substitutions: { ...subs },
    attachments: { ...attachments },
    bonds: [...bonds],
  };
  // branchDepths tracks which ring positions are inside branches
  // Used for branch-crossing rings like C1CCC(CC1)(CC(=O)O)CN
  if (branchDepths) {
    node.metaBranchDepths = [...branchDepths];
  }
  attachSmilesGetter(node);
  attachRingMethods(node);
  return node;
}

export function createLinearNode(atoms, bonds, attachments = {}) {
  const node = {
    type: ASTNodeType.LINEAR,
    atoms: [...atoms],
    bonds: [...bonds],
    attachments: { ...attachments },
  };
  attachSmilesGetter(node);
  attachLinearMethods(node);
  return node;
}

export function createFusedRingNode(rings, options = {}) {
  // Create base node
  const node = {
    type: ASTNodeType.FUSED_RING,
    rings: rings.map((r) => ({ ...r })),
  };

  // Store leading bond if provided (for connecting to previous component in molecule)
  if (options.leadingBond) {
    node.metaLeadingBond = options.leadingBond;
  }

  // Apply metadata if provided (for decompiler-generated code)
  if (options.metadata) {
    const { metadata } = options;
    if (metadata.allPositions) node.metaAllPositions = [...metadata.allPositions];
    if (metadata.branchDepthMap) node.metaBranchDepthMap = new Map(metadata.branchDepthMap);
    if (metadata.atomValueMap) node.metaAtomValueMap = new Map(metadata.atomValueMap);
    if (metadata.bondMap) node.metaBondMap = new Map(metadata.bondMap);
    if (metadata.ringOrderMap) node.metaRingOrderMap = new Map(metadata.ringOrderMap);
    if (metadata.sequentialRings) node.metaSequentialRings = [...metadata.sequentialRings];
    if (metadata.seqAtomAttachments) {
      node.metaSeqAtomAttachments = new Map(metadata.seqAtomAttachments);
    }
    if (metadata.leadingBond) node.metaLeadingBond = metadata.leadingBond;

    // Apply per-ring metadata
    if (metadata.ringMetadata) {
      metadata.ringMetadata.forEach((ringMeta, idx) => {
        if (ringMeta && node.rings[idx]) {
          if (ringMeta.positions) node.rings[idx].metaPositions = [...ringMeta.positions];
          if (ringMeta.start !== undefined) node.rings[idx].metaStart = ringMeta.start;
          if (ringMeta.end !== undefined) node.rings[idx].metaEnd = ringMeta.end;
        }
      });
    }
  }

  // Only compute position metadata if not already present from parser or options
  // Parser-generated rings have metaPositions, API-created rings don't
  // Also skip if explicitly requested via options
  const hasParserPositions = node.rings.some((r) => r.metaPositions);
  const hasMetadata = options.metadata !== undefined;
  const skipComputation = options.skipPositionComputation || false;

  if (!hasParserPositions && !hasMetadata && !skipComputation) {
    // Compute interleaved position metadata for proper SMILES generation
    // This is needed when rings are created via API (not parser)
    computeFusedRingPositions(node);

    // Apply branch depths from constituent rings if they have metaBranchDepths
    applyRingBranchDepthsToFusedRing(node);
  }

  attachSmilesGetter(node);
  attachFusedRingMethods(node);
  return node;
}

export function createMoleculeNode(components) {
  const node = {
    type: ASTNodeType.MOLECULE,
    components: [...components],
  };
  attachSmilesGetter(node);
  attachMoleculeMethods(node);
  return node;
}
