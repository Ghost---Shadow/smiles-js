// AST Node Type Constants
const ASTNodeType = {
  MOLECULE: 'molecule',
  LINEAR: 'linear',
  RING: 'ring',
  FUSED_RING: 'fused_ring',
  ATOM: 'atom',
};

// Type-checking utilities
function isRingNode(node) {
  return !!(node && node.type === ASTNodeType.RING);
}

function isMoleculeNode(node) {
  return !!(node && node.type === ASTNodeType.MOLECULE);
}

function isLinearNode(node) {
  return !!(node && node.type === ASTNodeType.LINEAR);
}

function isFusedRingNode(node) {
  return !!(node && node.type === ASTNodeType.FUSED_RING);
}

function isAtomNode(node) {
  return !!(node && node.type === ASTNodeType.ATOM);
}

function isASTNode(node) {
  return !!(node && Object.values(ASTNodeType).includes(node.type));
}

module.exports = {
  ASTNodeType,
  isRingNode,
  isMoleculeNode,
  isLinearNode,
  isFusedRingNode,
  isAtomNode,
  isASTNode,
};
