import { Fragment } from './fragment.js';
import { FusedRing } from './fused-ring.js';

export const methyl = Fragment('C');
export const ethyl = Fragment('CC');
export const propyl = Fragment('CCC');
export const isopropyl = Fragment('C(C)C');
export const butyl = Fragment('CCCC');
export const tbutyl = Fragment('C(C)(C)C');

export const hydroxyl = Fragment('O');
export const amino = Fragment('N');
export const carboxyl = Fragment('C(=O)O');
export const carbonyl = Fragment('C=O');
export const nitro = Fragment('[N+](=O)[O-]');
export const cyano = Fragment('C#N');

export const fluoro = Fragment('F');
export const chloro = Fragment('Cl');
export const bromo = Fragment('Br');
export const iodo = Fragment('I');

export const benzene = FusedRing([{ type: 'c', size: 6 },
]);
export const cyclohexane = FusedRing([{ type: 'C', size: 6 },
]);
export const pyridine = FusedRing([{ type: 'c', size: 6, substitutions: { 1: 'n' } },
]);
export const pyrrole = FusedRing([{ type: 'c', size: 5, substitutions: { 1: '[nH]' } },
]);
export const furan = FusedRing([{ type: 'c', size: 5, substitutions: { 1: 'o' } },
]);
export const thiophene = FusedRing([{ type: 'c', size: 5, substitutions: { 1: 's' } },
]);

export const naphthalene = FusedRing([
  { type: 'c', size: 6 },
  { type: 'c', size: 6, offset: 3 },
]);
export const indole = FusedRing([
  { type: 'c', size: 6 },
  {
    type: 'c', size: 5, offset: 3, substitutions: { 2: '[nH]' },
  },
]);
export const quinoline = FusedRing([
  { type: 'c', size: 6, substitutions: { 1: 'n' } },
  { type: 'c', size: 6, offset: 3 },
]);
