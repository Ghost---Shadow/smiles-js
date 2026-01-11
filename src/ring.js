import { Fragment } from './fragment.js';

export function Ring(atom, size, options = {}) {
  const { replace = {} } = options;

  let smiles = '';
  for (let i = 0; i < size; i++) {
    const currentAtom = replace[i] !== undefined ? replace[i] : atom;

    if (i === 0) {
      smiles += currentAtom + '1';
    } else if (i === size - 1) {
      smiles += currentAtom + '1';
    } else {
      smiles += currentAtom;
    }
  }

  return Fragment(smiles);
}
