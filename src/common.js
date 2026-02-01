/**
 * Common molecular fragments and functional groups
 * Pre-built fragments for frequently used chemical structures
 */

import { Fragment, Ring } from './index.js';

// Common functional groups
export const methyl = Fragment('C');
export const ethyl = Fragment('CC');
export const propyl = Fragment('CCC');
export const isopropyl = Fragment('C(C)C');
export const butyl = Fragment('CCCC');
export const tertButyl = Fragment('C(C)(C)C');

export const hydroxyl = Fragment('O');
export const amino = Fragment('N');
export const carboxyl = Fragment('C(=O)O');
export const carbonyl = Fragment('C=O');
export const ester = Fragment('C(=O)O');
export const ether = Fragment('O');
export const aldehyde = Fragment('C=O');
export const ketone = Fragment('C(=O)C');

export const phenyl = Fragment('c1ccccc1');
export const benzyl = Fragment('Cc1ccccc1');

// Common rings
export const benzene = Ring({ atoms: 'c', size: 6 });
export const cyclohexane = Ring({ atoms: 'C', size: 6 });
export const cyclopentane = Ring({ atoms: 'C', size: 5 });
export const pyridine = Ring({ atoms: 'c', size: 6, substitutions: { 3: 'n' } });
export const furan = Ring({ atoms: 'c', size: 5, substitutions: { 3: 'o' } });
export const pyrrole = Ring({ atoms: 'c', size: 5, substitutions: { 3: '[nH]' } });
export const imidazole = Ring({ atoms: 'c', size: 5, substitutions: { 2: 'n', 4: '[nH]' } });

// Halides
export const fluoro = Fragment('F');
export const chloro = Fragment('Cl');
export const bromo = Fragment('Br');
export const iodo = Fragment('I');

// Other common groups
export const nitro = Fragment('N(=O)=O');
export const cyano = Fragment('C#N');
export const sulfhydryl = Fragment('S');
export const sulfonyl = Fragment('S(=O)(=O)');
export const phosphate = Fragment('P(=O)(O)O');
