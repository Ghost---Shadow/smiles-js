/**
 * Named constants for all meta* property keys used on AST nodes.
 * These are parser-internal metadata that flow from parser → codegen → decompiler.
 *
 * Ring-level metadata (set on individual Ring nodes):
 */
export const META_POSITIONS = 'metaPositions';
export const META_START = 'metaStart';
export const META_END = 'metaEnd';
export const META_BRANCH_DEPTHS = 'metaBranchDepths';
export const META_PARENT_INDICES = 'metaParentIndices';
export const META_LEADING_BOND = 'metaLeadingBond';
export const META_IS_SIBLING = 'metaIsSibling';

/**
 * FusedRing-level metadata (set on FusedRing nodes):
 */
export const META_ALL_POSITIONS = 'metaAllPositions';
export const META_TOTAL_ATOMS = 'metaTotalAtoms';
export const META_BRANCH_DEPTH_MAP = 'metaBranchDepthMap';
export const META_PARENT_INDEX_MAP = 'metaParentIndexMap';
export const META_ATOM_VALUE_MAP = 'metaAtomValueMap';
export const META_BOND_MAP = 'metaBondMap';
export const META_RING_ORDER_MAP = 'metaRingOrderMap';
export const META_SEQUENTIAL_RINGS = 'metaSequentialRings';
export const META_SEQ_ATOM_ATTACHMENTS = 'metaSeqAtomAttachments';

/**
 * Molecule-level metadata (set on ring/fused ring components within a Molecule):
 */
export const META_CONNECTS_TO_COMPONENT = 'metaConnectsToComponent';
export const META_CONNECTS_AT_POSITION = 'metaConnectsAtPosition';
