import { validateSMILES } from './validator.js';
import { countAtoms, countRings, calculateFormula, calculateMolecularWeight } from './properties.js';
import { findUsedRingNumbers, getNextRingNumber } from './utils.js';

export function Fragment(smiles) {
  const validation = validateSMILES(smiles);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const createFragment = (currentSmiles) => {
    const fragment = function(...branches) {
      let result = currentSmiles;

      for (const branch of branches) {
        const branchSmiles = typeof branch === 'function' ? branch.smiles : String(branch);

        const usedInParent = findUsedRingNumbers(result);
        const usedInBranch = findUsedRingNumbers(branchSmiles);

        let remappedBranch = branchSmiles;
        for (const ringNum of usedInBranch) {
          if (usedInParent.has(ringNum)) {
            const newNum = getNextRingNumber(result + remappedBranch);
            remappedBranch = remappedBranch.replaceAll(ringNum, newNum.replace('%', ''));
          }
        }

        result += `(${remappedBranch})`;
      }

      return createFragment(result);
    };

    fragment.smiles = currentSmiles;
    fragment.atoms = countAtoms(currentSmiles);
    fragment.rings = countRings(currentSmiles);
    fragment.formula = calculateFormula(currentSmiles);
    fragment.molecularWeight = calculateMolecularWeight(currentSmiles);
    fragment.toString = () => currentSmiles;
    fragment[Symbol.toPrimitive] = () => currentSmiles;
    
    // Concat method for combining fragments linearly
    fragment.concat = function(other) {
      const otherSmiles = typeof other === 'function' ? other.smiles : String(other);
      
      // Handle ring number conflicts
      const usedInCurrent = findUsedRingNumbers(currentSmiles);
      const usedInOther = findUsedRingNumbers(otherSmiles);
      
      let remappedOther = otherSmiles;
      for (const ringNum of usedInOther) {
        if (usedInCurrent.has(ringNum)) {
          const newNum = getNextRingNumber(currentSmiles + remappedOther);
          remappedOther = remappedOther.replaceAll(ringNum, newNum.replace('%', ''));
        }
      }
      
      return createFragment(currentSmiles + remappedOther);
    };

    return fragment;
  };

  return createFragment(smiles);
}

Fragment.validate = validateSMILES;

// Static concat method for convenience: Fragment.concat(a, b)
Fragment.concat = function(a, b) {
  const fragmentA = typeof a === 'string' ? Fragment(a) : a;
  return fragmentA.concat(b);
};
