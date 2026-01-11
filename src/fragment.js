import { validateSMILES } from './validator.js';
import { countAtoms, countRings, calculateFormula, calculateMolecularWeight } from './properties.js';

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
        result += `(${branchSmiles})`;
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

    return fragment;
  };

  return createFragment(smiles);
}

Fragment.validate = validateSMILES;
