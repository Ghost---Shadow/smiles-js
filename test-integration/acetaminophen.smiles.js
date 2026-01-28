// Acetaminophen and Related Compounds
// Non-NSAID analgesics and antipyretics

import { Fragment, Ring } from '../src/fragment';

// === FRAGMENTS ===

// Acetamido: CH3-C(=O)-NH- -> CC(=O)N
export const acetamidoLeft = Fragment('CC(=O)N');
export const acetamidoRight = Fragment('NC(=O)C');
export const acetamido = acetamidoLeft;

export const benzene = Ring('c', 6);

// === ACETAMINOPHEN ===
// SMILES: CC(=O)NC1=CC=C(O)C=C1

export const acetaminophen = Fragment('CC(=O)Nc1ccc(O)cc1');
export const acetaminophenNonCannon = benzene.attachAt(1, acetamidoRight).attachAt(4, 'O');
export const paracetamol = Fragment('CC(=O)Nc1ccc(O)cc1');

// === PHENACETIN ===
// SMILES: CC(=O)NC1=CC=C(OCC)C=C1

export const ethoxy = Fragment('OCC');
export const phenacetin = Fragment('CC(=O)Nc1ccc(OCC)cc1');
export const phenacetinNonCannon = benzene.attachAt(1, acetamidoRight).attachAt(4, ethoxy);
