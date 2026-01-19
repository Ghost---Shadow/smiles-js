import { Fragment } from './fragment.js';
import { Ring } from './ring.js';
import { FusedRings } from './fused-ring/index.js';

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

export const benzene = Ring('c', 6);
export const cyclohexane = Ring('C', 6);
export const pyridine = Ring('c', 6, { replace: { 0: 'n' } });
export const pyrrole = Ring('c', 5, { replace: { 0: '[nH]' } });
export const furan = Ring('c', 5, { replace: { 0: 'o' } });
export const thiophene = Ring('c', 5, { replace: { 0: 's' } });

export const naphthalene = FusedRings([6, 6], 'c');
export const indole = FusedRings([6, 5], 'c', { hetero: { 4: '[nH]' } });
export const quinoline = FusedRings([6, 6], 'c', { hetero: { 0: 'n' } });
