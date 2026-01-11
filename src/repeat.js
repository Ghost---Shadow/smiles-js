import { Fragment } from './fragment.js';

export function Repeat(fragment, count) {
  const smiles = typeof fragment === 'function' ? fragment.smiles : String(fragment);
  const repeated = smiles.repeat(count);
  return Fragment(repeated);
}
