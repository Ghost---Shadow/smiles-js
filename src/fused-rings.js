import { Fragment } from './fragment.js';

export function FusedRings(sizes, atom, options = {}) {
  const { hetero = {} } = options;

  if (sizes.length !== 2) {
    throw new Error('FusedRings currently only supports 2 rings');
  }

  let smiles = '';
  let atomPosition = 0;

  smiles += `${hetero[atomPosition] !== undefined ? hetero[atomPosition] : atom}1`;
  atomPosition++;

  const firstRingMiddleAtoms = sizes[0] - 4;
  for (let i = 0; i < firstRingMiddleAtoms; i++) {
    smiles += (hetero[atomPosition] !== undefined ? hetero[atomPosition] : atom);
    atomPosition++;
  }

  smiles += `${hetero[atomPosition] !== undefined ? hetero[atomPosition] : atom}2`;
  atomPosition++;

  const ringSize = sizes[1];
  const middleAtoms = ringSize - 2;
  for (let i = 0; i < middleAtoms; i++) {
    smiles += (hetero[atomPosition] !== undefined ? hetero[atomPosition] : atom);
    atomPosition++;
  }

  smiles += `${hetero[atomPosition] !== undefined ? hetero[atomPosition] : atom}2`;
  atomPosition++;

  smiles += `${hetero[atomPosition] !== undefined ? hetero[atomPosition] : atom}1`;

  return Fragment(smiles);
}
