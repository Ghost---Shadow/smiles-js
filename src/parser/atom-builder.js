/**
 * Atom list building functions for SMILES parser
 * Pass 1: Linear scan with ring and branch tracking
 */

import { TokenType } from '../tokenizer.js';
import { collectRingPath } from './ring-utils.js';

/**
 * Create an atom object with branch and ring metadata
 */
export function createAtom(
  currentAtomIndex,
  token,
  currentBond,
  branchStack,
  lastAtomAtDepth,
  branchClosedSinceLastAtom,
) {
  const parentIndex = branchStack.length > 0
    ? branchStack[branchStack.length - 1].parentIndex
    : null;

  const branchId = branchStack.length > 0
    ? branchStack[branchStack.length - 1].branchId
    : null;

  const prevAtomAtDepth = lastAtomAtDepth.get(branchStack.length);
  const hadBranchClose = branchClosedSinceLastAtom.get(branchStack.length) || false;

  return {
    index: currentAtomIndex,
    value: token.atom,
    rawValue: token.value,
    bond: currentBond,
    rings: [],
    branchDepth: branchStack.length,
    parentIndex,
    branchId,
    prevAtomIndex: prevAtomAtDepth !== undefined ? prevAtomAtDepth : null,
    afterBranchClose: hadBranchClose,
  };
}

/**
 * Handle ring marker token (open or close ring)
 */
export function handleRingMarker(
  token,
  currentAtomIndex,
  ringStacks,
  atoms,
  closedRings,
  ringBoundaries,
  branchStack,
) {
  const { ringNumber } = token;

  if (ringStacks.has(ringNumber)) {
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

    ringPositions.forEach((pos) => {
      atoms[pos].rings.push(ringNumber);
    });

    ringStacks.delete(ringNumber);
  } else {
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
}

/**
 * Build a flat list of atoms with metadata about rings and branches
 */
export function buildAtomList(tokens) {
  const atoms = [];
  const ringStacks = new Map();
  const ringBoundaries = [];
  const closedRings = [];
  const branchStack = [];
  const branches = [];
  const lastAtomAtDepth = new Map();
  const branchClosedSinceLastAtom = new Map();

  let currentAtomIndex = -1;
  let currentBond = null;
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === TokenType.ATOM) {
      currentAtomIndex += 1;
      const atom = createAtom(
        currentAtomIndex,
        token,
        currentBond,
        branchStack,
        lastAtomAtDepth,
        branchClosedSinceLastAtom,
      );
      atoms.push(atom);
      lastAtomAtDepth.set(branchStack.length, currentAtomIndex);
      branchClosedSinceLastAtom.set(branchStack.length, false);
      currentBond = null;
    } else if (token.type === TokenType.BOND) {
      currentBond = token.value;
    } else if (token.type === TokenType.RING_MARKER) {
      handleRingMarker(
        token,
        currentAtomIndex,
        ringStacks,
        atoms,
        closedRings,
        ringBoundaries,
        branchStack,
      );
    } else if (token.type === TokenType.BRANCH_OPEN) {
      const currentDepth = branchStack.length;
      const parentIdx = lastAtomAtDepth.get(currentDepth);

      branchStack.push({
        parentIndex: parentIdx !== undefined ? parentIdx : -1,
        depth: currentDepth,
        branchId: i,
      });

      lastAtomAtDepth.delete(currentDepth + 1);
    } else if (token.type === TokenType.BRANCH_CLOSE) {
      branchStack.pop();
      branchClosedSinceLastAtom.set(branchStack.length, true);
    }

    i += 1;
  }

  if (ringStacks.size > 0) {
    const unclosed = Array.from(ringStacks.keys()).join(', ');
    throw new Error(`Unclosed rings: ${unclosed}`);
  }

  return { atoms, ringBoundaries, branches };
}
