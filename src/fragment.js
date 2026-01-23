import { validateSMILES } from './validator.js';
import {
  countAtoms, countRings, calculateFormula, calculateMolecularWeight,
} from './properties.js';
import { findUsedRingNumbers, getNextRingNumber } from './utils.js';
import { parse } from './parse.js';
import { FusedRing } from './fused-ring.js';
import { MetaList } from './meta-list.js';

class FragmentClass {
  constructor(smiles) {
    const validation = validateSMILES(smiles);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Parse to check if it contains rings
    const parsed = parse(smiles);
    const hasRings = parsed.some((item) => item.type !== 'linear');

    if (hasRings) {
      // Use FusedRing.parse for molecules with rings (proper parentheses handling)
      const fusedParsed = FusedRing.parse(smiles);

      // If FusedRing.parse produces different output, check if we're losing information
      if (fusedParsed.smiles !== smiles) {
        // Check if original has content after ring closures that would be lost
        // Patterns: c1ccccc1(C) or C1CCC1CC
        const hasTrailingContent = (/\d\(/.test(smiles) || /\d[A-Za-z]/.test(smiles))
          && fusedParsed.smiles.length < smiles.length;

        if (hasTrailingContent) {
          // Preserve original SMILES to avoid losing trailing content
          this.smiles = smiles;
          this.meta = fusedParsed.meta;
        } else {
          this.smiles = fusedParsed.smiles;
          this.meta = fusedParsed.meta;
        }
      } else {
        this.smiles = fusedParsed.smiles;
        this.meta = fusedParsed.meta;
      }
    } else {
      // No rings, use original SMILES and parse result as-is
      this.smiles = smiles;
      this.meta = MetaList.from(parsed);
    }

    this.atoms = countAtoms(this.smiles);
    this.rings = countRings(this.smiles);
    this.formula = calculateFormula(this.smiles);
    this.molecularWeight = calculateMolecularWeight(this.smiles);
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
