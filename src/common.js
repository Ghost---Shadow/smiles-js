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
export const tert_butyl = Fragment('C(C)(C)C');

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
export const benzene = Ring('c', 6);
export const cyclohexane = Ring('C', 6);
export const cyclopentane = Ring('C', 5);
export const pyridine = Ring({ atoms: 'ccncc', bonds: '=::=:' });
export const furan = Ring({ atoms: 'ccoc', bonds: '=::=' });
export const pyrrole = Ring({ atoms: 'ccnc', bonds: '=::=' });
export const imidazole = Ring({ atoms: 'cncc', bonds: ':=::' });

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
