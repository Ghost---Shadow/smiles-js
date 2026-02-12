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

export function createLinearNode(atoms, bonds, attachments = {}, leadingBond) {
  const node = {
    type: ASTNodeType.LINEAR,
    atoms: [...atoms],
    bonds: [...bonds],
    attachments: { ...attachments },
  };
  if (leadingBond !== undefined) {
    node.metaLeadingBond = leadingBond;
  }
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
      const branchIdMap = new Map();

      // Extract ring nodes from metadata - only extract core data fields, not methods
      const extractedRings = metadata.rings.map((ringMeta) => ringMeta.ring);
      node.rings = extractedRings.map((r) => {
        // Deep copy attachments (copy both the object and the arrays inside)
        const attachments = {};
        if (r.attachments) {
          Object.keys(r.attachments).forEach((key) => {
            attachments[key] = [...r.attachments[key]];
          });
        }

        // Deep copy substitutions
        const substitutions = r.substitutions ? { ...r.substitutions } : {};

        return {
          type: r.type,
          atoms: r.atoms,
          size: r.size,
          ringNumber: r.ringNumber,
          offset: r.offset,
          bonds: r.bonds ? [...r.bonds] : [],
          attachments,
          substitutions,
          // Preserve branch depth metadata if present
          ...(r.metaBranchDepths && { metaBranchDepths: [...r.metaBranchDepths] }),
        };
      });

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
              if (atom.branchId !== undefined) branchIdMap.set(atom.position, atom.branchId);
            });
          }

          node.rings[idx].metaPositions = positions;
        }
      });

      // Add positions from seqAtomAttachments if present
      if (metadata.seqAtomAttachments) {
        metadata.seqAtomAttachments.forEach((attachments, pos) => {
          if (!allPositions.includes(pos)) {
            allPositions.push(pos);
          }
        });
      }

      // Sort allPositions numerically for correct SMILES generation
      node.metaAllPositions = allPositions.sort((a, b) => a - b);
      node.metaBranchDepthMap = branchDepthMap;
      node.metaAtomValueMap = atomValueMap;
      node.metaBondMap = bondMap;
      if (ringOrderMap.size > 0) node.metaRingOrderMap = ringOrderMap;
      if (branchIdMap.size > 0) node.metaBranchIdMap = branchIdMap;
    }

    // Support standalone atoms format (atoms that are not part of any ring)
    // This is used together with hierarchical rings format to include chain atoms
    if (metadata.atoms && !metadata.rings) {
      // Legacy flat atoms format (all atoms in one array)
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
    } else if (metadata.atoms && metadata.rings) {
      // Hierarchical format with standalone atoms
      // metadata.rings was already processed above, now merge in standalone atoms
      metadata.atoms.forEach((atom) => {
        if (!node.metaAllPositions.includes(atom.position)) {
          node.metaAllPositions.push(atom.position);
        }
        if (atom.depth !== undefined) node.metaBranchDepthMap.set(atom.position, atom.depth);
        if (atom.value !== undefined) node.metaAtomValueMap.set(atom.position, atom.value);
        if (atom.bond !== undefined) node.metaBondMap.set(atom.position, atom.bond);
        if (atom.branchId !== undefined) {
          if (!node.metaBranchIdMap) node.metaBranchIdMap = new Map();
          node.metaBranchIdMap.set(atom.position, atom.branchId);
        }
        if (atom.attachments) {
          if (!node.metaSeqAtomAttachments) node.metaSeqAtomAttachments = new Map();
          node.metaSeqAtomAttachments.set(atom.position, atom.attachments);
        }
      });
      // Re-sort allPositions after adding standalone atoms
      node.metaAllPositions.sort((a, b) => a - b);
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
