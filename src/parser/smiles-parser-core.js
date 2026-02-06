/**
 * SMILES Parser (Phase 2)
 * Converts token stream into hierarchical AST
 * Uses two-pass strategy: linear scan + AST building
 */

import {
  tokenize,
  TokenType,
} from '../tokenizer.js';
import {
  collectRingPath,
} from './ring-utils.js';
import { buildAST } from './ast-builder.js';

/**
 * Pass 1: Linear scan with ring and branch tracking
 * Builds a flat list of atoms with metadata about rings and branches
 */
export function buildAtomList(tokens) {
  const atoms = [];
  // Track open rings: ringNumber -> startIndex
  const ringStacks = new Map();
  // Final ring boundaries: { ringNumber, start, end, positions }
  const ringBoundaries = [];
  // Track closed rings for interleaved fused ring handling
  const closedRings = [];
  // Stack of branch points: { parentIndex, depth, branchId }
  const branchStack = [];
  // Branch info: { parentIndex, tokens, depth }
  const branches = [];
  // Track last atom index at each depth level
  const lastAtomAtDepth = new Map(); // depth -> atomIndex

  let currentAtomIndex = -1;
  let currentBond = null;
  let i = 0;
  // Track if a branch closed since the last atom at each depth (for sequential detection)
  const branchClosedSinceLastAtom = new Map(); // depth -> boolean

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === TokenType.ATOM) {
      currentAtomIndex += 1;

      const parentIndex = branchStack.length > 0
        ? branchStack[branchStack.length - 1].parentIndex
        : null;

      const branchId = branchStack.length > 0
        ? branchStack[branchStack.length - 1].branchId
        : null;

      // Track the previous atom at this depth for sequential bonding
      const prevAtomAtDepth = lastAtomAtDepth.get(branchStack.length);

      // Check if a branch closed between the previous atom at this depth and now
      const hadBranchClose = branchClosedSinceLastAtom.get(branchStack.length) || false;

      const atom = {
        index: currentAtomIndex,
        value: token.atom,
        rawValue: token.value,
        bond: currentBond,
        rings: [], // Ring numbers this atom participates in
        branchDepth: branchStack.length,
        parentIndex,
        branchId, // Unique ID of the branch this atom belongs to
        // Previous atom in sequence at same depth (for finding attachments after ring closures)
        prevAtomIndex: prevAtomAtDepth !== undefined ? prevAtomAtDepth : null,
        // Whether a branch closed between previous atom at this depth and this atom
        // Used to distinguish "N1C" (immediate) from "C(...)C" (after branch close)
        afterBranchClose: hadBranchClose,
      };

      atoms.push(atom);

      // Track last atom at this depth level
      lastAtomAtDepth.set(branchStack.length, currentAtomIndex);
      // Reset branch close flag for this depth
      branchClosedSinceLastAtom.set(branchStack.length, false);

      currentBond = null;
    } else if (token.type === TokenType.BOND) {
      currentBond = token.value;
    } else if (token.type === TokenType.RING_MARKER) {
      const { ringNumber } = token;

      if (ringStacks.has(ringNumber)) {
        // Close ring - build the full ring atom sequence
        const ringData = ringStacks.get(ringNumber);
        const { startIndex, branchDepth: ringBranchDepth, branchId: ringBranchId } = ringData;

        const ringPositions = collectRingPath(
          startIndex,
          currentAtomIndex,
          atoms,
          ringBranchDepth,
          ringBranchId,
          closedRings,
        );

        // Record this ring as closed
        closedRings.push({
          ringNumber,
          start: startIndex,
          end: currentAtomIndex,
        });

        ringBoundaries.push({
          ringNumber,
          start: startIndex,
          end: currentAtomIndex,
          positions: ringPositions,
          branchDepth: ringBranchDepth,
          branchId: ringBranchId,
        });

        // Mark atoms as part of this ring
        ringPositions.forEach((pos) => {
          atoms[pos].rings.push(ringNumber);
        });

        ringStacks.delete(ringNumber);
      } else {
        // Open ring - record current depth and branch context
        const currentDepth = branchStack.length;
        const stackTop = branchStack[branchStack.length - 1];
        const currentBranchId = branchStack.length > 0 ? stackTop.branchId : null;

        ringStacks.set(ringNumber, {
          startIndex: currentAtomIndex,
          branchDepth: currentDepth,
          branchId: currentBranchId,
        });
        atoms[currentAtomIndex].rings.push(ringNumber);
      }
    } else if (token.type === TokenType.BRANCH_OPEN) {
      const currentDepth = branchStack.length;
      const parentIdx = lastAtomAtDepth.get(currentDepth);

      branchStack.push({
        parentIndex: parentIdx !== undefined ? parentIdx : -1,
        depth: currentDepth,
        branchId: i, // Use token position as unique ID
      });

      // Clear lastAtomAtDepth for the new depth level
      lastAtomAtDepth.delete(currentDepth + 1);
    } else if (token.type === TokenType.BRANCH_CLOSE) {
      branchStack.pop();
      branchClosedSinceLastAtom.set(branchStack.length, true);
    }
    // DOT and unknown tokens - just skip

    i += 1;
  }

  // Check for unclosed rings
  if (ringStacks.size > 0) {
    const unclosed = Array.from(ringStacks.keys()).join(', ');
    throw new Error(`Unclosed rings: ${unclosed}`);
  }

  return { atoms, ringBoundaries, branches };
}

/**
 * Parse a SMILES string into an AST
 * @param {string} smiles - SMILES string to parse
 * @returns {Object} AST node (Ring, Linear, FusedRing, or Molecule)
 */
export function parse(smiles) {
  const tokens = tokenize(smiles);

  // Pass 1: Build linear atom list with ring tracking
  const { atoms, ringBoundaries } = buildAtomList(tokens);

  // Pass 2: Build hierarchical AST from atoms and ring info
  const ast = buildAST(atoms, ringBoundaries);

  return ast;
}
