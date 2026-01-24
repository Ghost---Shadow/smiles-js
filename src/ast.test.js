const {
  ASTNodeType,
  isRingNode,
  isMoleculeNode,
  isLinearNode,
  isFusedRingNode,
  isAtomNode,
  isASTNode,
} = require('./ast');

describe('AST Type Constants', () => {
  test('ASTNodeType constants are defined', () => {
    expect(ASTNodeType.MOLECULE).toBe('molecule');
    expect(ASTNodeType.LINEAR).toBe('linear');
    expect(ASTNodeType.RING).toBe('ring');
    expect(ASTNodeType.FUSED_RING).toBe('fused_ring');
    expect(ASTNodeType.ATOM).toBe('atom');
  });
});

describe('Type Checking Utilities', () => {
  describe('isRingNode', () => {
    test('returns true for ring node', () => {
      const ringNode = { type: 'ring', size: 6 };
      expect(isRingNode(ringNode)).toBe(true);
    });

    test('returns false for non-ring node', () => {
      expect(isRingNode({ type: 'linear' })).toBe(false);
      expect(isRingNode({})).toBe(false);
      expect(isRingNode(null)).toBe(false);
      expect(isRingNode(undefined)).toBe(false);
    });
  });

  describe('isMoleculeNode', () => {
    test('returns true for molecule node', () => {
      const moleculeNode = { type: 'molecule', components: [] };
      expect(isMoleculeNode(moleculeNode)).toBe(true);
    });

    test('returns false for non-molecule node', () => {
      expect(isMoleculeNode({ type: 'ring' })).toBe(false);
      expect(isMoleculeNode({})).toBe(false);
      expect(isMoleculeNode(null)).toBe(false);
    });
  });

  describe('isLinearNode', () => {
    test('returns true for linear node', () => {
      const linearNode = { type: 'linear', atoms: ['C', 'C'] };
      expect(isLinearNode(linearNode)).toBe(true);
    });

    test('returns false for non-linear node', () => {
      expect(isLinearNode({ type: 'ring' })).toBe(false);
      expect(isLinearNode({})).toBe(false);
      expect(isLinearNode(null)).toBe(false);
    });
  });

  describe('isFusedRingNode', () => {
    test('returns true for fused_ring node', () => {
      const fusedRingNode = { type: 'fused_ring', rings: [] };
      expect(isFusedRingNode(fusedRingNode)).toBe(true);
    });

    test('returns false for non-fused_ring node', () => {
      expect(isFusedRingNode({ type: 'ring' })).toBe(false);
      expect(isFusedRingNode({})).toBe(false);
      expect(isFusedRingNode(null)).toBe(false);
    });
  });

  describe('isAtomNode', () => {
    test('returns true for atom node', () => {
      const atomNode = { type: 'atom', element: 'C' };
      expect(isAtomNode(atomNode)).toBe(true);
    });

    test('returns false for non-atom node', () => {
      expect(isAtomNode({ type: 'ring' })).toBe(false);
      expect(isAtomNode({})).toBe(false);
      expect(isAtomNode(null)).toBe(false);
    });
  });

  describe('isASTNode', () => {
    test('returns true for any valid AST node type', () => {
      expect(isASTNode({ type: 'molecule' })).toBe(true);
      expect(isASTNode({ type: 'linear' })).toBe(true);
      expect(isASTNode({ type: 'ring' })).toBe(true);
      expect(isASTNode({ type: 'fused_ring' })).toBe(true);
      expect(isASTNode({ type: 'atom' })).toBe(true);
    });

    test('returns false for invalid node types', () => {
      expect(isASTNode({ type: 'invalid' })).toBe(false);
      expect(isASTNode({})).toBe(false);
      expect(isASTNode(null)).toBe(false);
      expect(isASTNode(undefined)).toBe(false);
    });
  });
});
