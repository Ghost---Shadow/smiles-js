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
  // If rings is an object with metadata, it's the new format: FusedRing({ metadata: {...} })
  if (rings && typeof rings === 'object' && !Array.isArray(rings) && rings.metadata) {
    // eslint-disable-next-line no-param-reassign
    options = rings;
    // eslint-disable-next-line no-param-reassign
    rings = null;
  }

  // Create base node
  const node = {
    type: ASTNodeType.FUSED_RING,
    rings: rings ? rings.map((r) => ({ ...r })) : [],
  };

  // Store leading bond if provided (for connecting to previous component in molecule)
  if (options.leadingBond) {
    node.metaLeadingBond = options.leadingBond;
  }

  // Apply metadata if provided (for decompiler-generated code)
  if (options.metadata) {
    const { metadata } = options;

    // Support hierarchical rings format (new format with atoms nested in rings)
    if (metadata.rings) {
      const allPositions = [];
      const branchDepthMap = new Map();
      const atomValueMap = new Map();
      const bondMap = new Map();
      const ringOrderMap = new Map();

      // Extract ring nodes from metadata
      const extractedRings = metadata.rings.map((ringMeta) => ringMeta.ring);
      node.rings = extractedRings.map((r) => ({ ...r }));

      // Process each ring and its atoms
      metadata.rings.forEach((ringMeta, idx) => {
        if (ringMeta && node.rings[idx]) {
          // Set ring-level metadata
          if (ringMeta.start !== undefined) node.rings[idx].metaStart = ringMeta.start;
          if (ringMeta.end !== undefined) node.rings[idx].metaEnd = ringMeta.end;

          // Collect positions from this ring
          const positions = [];

          // Process atoms in this ring
          if (ringMeta.atoms) {
            ringMeta.atoms.forEach((atom) => {
              positions.push(atom.position);

              // Add to global collections if not already present
              if (!allPositions.includes(atom.position)) {
                allPositions.push(atom.position);
              }

              if (atom.depth !== undefined) branchDepthMap.set(atom.position, atom.depth);
              if (atom.value !== undefined) atomValueMap.set(atom.position, atom.value);
              if (atom.bond !== undefined) bondMap.set(atom.position, atom.bond);
              if (atom.rings !== undefined) ringOrderMap.set(atom.position, atom.rings);
            });
          }

          node.rings[idx].metaPositions = positions;
        }
      });

      node.metaAllPositions = allPositions;
      node.metaBranchDepthMap = branchDepthMap;
      node.metaAtomValueMap = atomValueMap;
      node.metaBondMap = bondMap;
      if (ringOrderMap.size > 0) node.metaRingOrderMap = ringOrderMap;
    }

    // Support colocated atoms format (intermediate format with flat atoms array)
    if (metadata.atoms) {
      const allPositions = [];
      const branchDepthMap = new Map();
      const atomValueMap = new Map();
      const bondMap = new Map();
      const ringOrderMap = new Map();

      metadata.atoms.forEach((atom) => {
        allPositions.push(atom.position);
        if (atom.depth !== undefined) branchDepthMap.set(atom.position, atom.depth);
        if (atom.value !== undefined) atomValueMap.set(atom.position, atom.value);
        if (atom.bond !== undefined) bondMap.set(atom.position, atom.bond);
        if (atom.ringOrder !== undefined) ringOrderMap.set(atom.position, atom.ringOrder);
      });

      node.metaAllPositions = allPositions;
      node.metaBranchDepthMap = branchDepthMap;
      node.metaAtomValueMap = atomValueMap;
      node.metaBondMap = bondMap;
      if (ringOrderMap.size > 0) node.metaRingOrderMap = ringOrderMap;
    }

    // Support legacy format (separate arrays/maps)
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

    // Apply per-ring metadata (legacy format)
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
