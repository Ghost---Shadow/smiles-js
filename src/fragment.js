import { validateSMILES } from './validator.js';
import {
  countAtoms, countRings, calculateFormula, calculateMolecularWeight,
} from './properties.js';
import { findUsedRingNumbers, getNextRingNumber } from './utils.js';
import { parse } from './parse.js';

class FragmentClass {
  constructor(smiles) {
    const validation = validateSMILES(smiles);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.smiles = smiles;
    this.meta = parse(smiles);
    this.atoms = countAtoms(smiles);
    this.rings = countRings(smiles);
    this.formula = calculateFormula(smiles);
    this.molecularWeight = calculateMolecularWeight(smiles);
  }

  // Make fragment callable for branching
  call(...branches) {
    let result = this.smiles;

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

    // eslint-disable-next-line no-use-before-define
    return Fragment(result);
  }

  concat(other) {
    const otherSmiles = typeof other === 'function' ? other.smiles : String(other);

    const usedInCurrent = findUsedRingNumbers(this.smiles);
    const usedInOther = findUsedRingNumbers(otherSmiles);

    let remappedOther = otherSmiles;
    usedInOther.forEach((ringNum) => {
      if (usedInCurrent.has(ringNum)) {
        const newNum = getNextRingNumber(this.smiles + remappedOther);
        remappedOther = remappedOther.replaceAll(ringNum, newNum.replace('%', ''));
      }
    });

    const newSmiles = this.smiles + remappedOther;
    // eslint-disable-next-line no-use-before-define
    return Fragment(newSmiles);
  }

  fuse() {
    // Intentionally throws error - this.smiles not used but method needs to be instance method
    throw new Error(`Only rings created with FusedRing can be fused. This fragment (${this.smiles}) does not have ring metadata.`);
  }

  toString() {
    return this.smiles;
  }

  [Symbol.toPrimitive]() {
    return this.smiles;
  }
}

export function Fragment(smiles) {
  const instance = new FragmentClass(smiles);

  // Make the instance callable by wrapping it in a function
  const callable = function fragmentFunction(...branches) {
    return instance.call(...branches);
  };

  // Copy properties to the callable function
  Object.setPrototypeOf(callable, Object.getPrototypeOf(instance));
  Object.assign(callable, instance);

  return callable;
}

Fragment.validate = validateSMILES;

Fragment.concat = function concatStatic(a, b) {
  const fragmentA = typeof a === 'string' ? Fragment(a) : a;
  return fragmentA.concat(b);
};
