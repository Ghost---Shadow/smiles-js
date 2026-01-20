import { validateSMILES } from './validator.js';
import {
  countAtoms, countRings, calculateFormula, calculateMolecularWeight,
} from './properties.js';
import { findUsedRingNumbers, getNextRingNumber } from './utils.js';
import { parse } from './parse.js';

export function Fragment(smiles) {
  const validation = validateSMILES(smiles);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Parse the SMILES to build AST
  const ast = parse(smiles);

  const createFragment = (currentSmiles, currentAst) => {
    const fragment = function fragmentFunction(...branches) {
      let result = currentSmiles;

      branches.forEach((branch) => {
        const branchSmiles = typeof branch === 'function' ? branch.smiles : String(branch);

        const usedInParent = findUsedRingNumbers(result);
        const usedInBranch = findUsedRingNumbers(branchSmiles);

        let remappedBranch = branchSmiles;
        usedInBranch.forEach((ringNum) => {
          if (usedInParent.has(ringNum)) {
            const newNum = getNextRingNumber(result + remappedBranch);
            remappedBranch = remappedBranch.replaceAll(ringNum, newNum.replace('%', ''));
          }
        });

        result += `(${remappedBranch})`;
      });

      // Re-parse after adding branches
      const newAst = parse(result);
      return createFragment(result, newAst);
    };

    fragment.smiles = currentSmiles;
    fragment.ast = currentAst; // Store AST separately from meta
    fragment.atoms = countAtoms(currentSmiles);
    fragment.rings = countRings(currentSmiles);
    fragment.formula = calculateFormula(currentSmiles);
    fragment.molecularWeight = calculateMolecularWeight(currentSmiles);
    fragment.toString = () => currentSmiles;
    fragment[Symbol.toPrimitive] = () => currentSmiles;

    // Concat method for combining fragments linearly
    fragment.concat = function concatFunction(other) {
      const otherSmiles = typeof other === 'function' ? other.smiles : String(other);

      // Handle ring number conflicts
      const usedInCurrent = findUsedRingNumbers(currentSmiles);
      const usedInOther = findUsedRingNumbers(otherSmiles);

      let remappedOther = otherSmiles;
      usedInOther.forEach((ringNum) => {
        if (usedInCurrent.has(ringNum)) {
          const newNum = getNextRingNumber(currentSmiles + remappedOther);
          remappedOther = remappedOther.replaceAll(ringNum, newNum.replace('%', ''));
        }
      });

      const newSmiles = currentSmiles + remappedOther;
      const newAst = parse(newSmiles);
      return createFragment(newSmiles, newAst);
    };

    // Fuse method - only available for rings created with FusedRing
    fragment.fuse = function fuseFunction() {
      throw new Error('Only rings created with FusedRing can be fused. This fragment does not have ring metadata.');
    };

    return fragment;
  };

  return createFragment(smiles, ast);
}

Fragment.validate = validateSMILES;

// Static concat method for convenience: Fragment.concat(a, b)
Fragment.concat = function concatStatic(a, b) {
  const fragmentA = typeof a === 'string' ? Fragment(a) : a;
  return fragmentA.concat(b);
};
