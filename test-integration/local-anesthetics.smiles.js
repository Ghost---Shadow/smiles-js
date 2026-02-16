// Local Anesthetics and Topical Analgesics
// Pain relief through nerve block or topical application

import { Fragment } from 'smiles-js';
import { Ring, Linear, Molecule } from 'smiles-js';

// === LIDOCAINE ===
// Amide-type local anesthetic (first of this class)
// SMILES: CCN(CC)CC(=O)NC1=C(C)C=CC=C1C

export const lidocaine = Fragment('CCN(CC)CC(=O)NC1=C(C)C=CC=C1C');

// === BUPIVACAINE ===
// Long-acting amide anesthetic
// SMILES: CCCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C

export const bupivacaine = Fragment('CCCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C');

// Refactored from bupivacaine:
export const bupivacaine1 = Linear(['C', 'C', 'C', 'C']);
export const bupivacaine2 = Ring({ atoms: 'C', size: 6 });
export const bupivacaine3 = bupivacaine2.substitute(1, 'N');
export const bupivacaine4 = Linear(['C', 'N']);
export const bupivacaine5 = Linear(['O'], ['=']);
export const bupivacaine6 = bupivacaine4.attach(1, bupivacaine5);
export const bupivacaine7 = Ring({
  atoms: 'C', size: 6, ringNumber: 2, bonds: ['=', null, '=', null, '=', null],
});
export const bupivacaine8 = Linear(['C']);
export const bupivacaine9 = bupivacaine7.attach(2, bupivacaine8);
export const bupivacaine10 = Linear(['C']);
export const bupivacaine11 = Molecule([
  bupivacaine1, bupivacaine3, bupivacaine6, bupivacaine9, bupivacaine10,
]);

// Refactored from bupivacaine:
export const b1 = Fragment('CCCC');
export const b2 = Fragment('C1CCCCC1');
export const b3 = Fragment('N1CCCCC1');
export const b4 = Fragment('CN');
export const b5 = Linear(['O'], ['=']);
export const b6 = b4.attach(1, b5);
export const b7 = Fragment('C2=CC=CC=C2');
export const b8 = Fragment('C');
export const b9 = b7.attach(2, b8);
export const b10 = Fragment('C');
export const b11 = Molecule([
  b1, b3, b6, b9, b10,
]);

// === ROPIVACAINE ===
// Similar to bupivacaine but with n-propyl instead of n-butyl
// SMILES: CCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C
// Less cardiotoxic than bupivacaine

export const ropivacaine = Fragment('CCCN1CCCCC1C(=O)NC2=C(C)C=CC=C2C');

// === MEPIVACAINE ===
// Intermediate-duration amide anesthetic
// SMILES: CN1CCCCC1C(=O)NC2=C(C)C=CC=C2C

export const mepivacaine = Fragment('CN1CCCCC1C(=O)NC2=C(C)C=CC=C2C');

// === PRILOCAINE ===
// Amide anesthetic with lower toxicity
// SMILES: CCCNC(C)C(=O)NC1=CC=CC=C1C

export const prilocaine = Fragment('CCCNC(C)C(=O)NC1=CC=CC=C1C');

// === BENZOCAINE ===
// Ester-type topical anesthetic (no systemic use due to poor water solubility)
// SMILES: CCOC(=O)C1=CC=C(C=C1)N

export const benzocaine = Fragment('CCOC(=O)C1=CC=C(C=C1)N');

// === TETRACAINE ===
// Long-acting ester anesthetic
// SMILES: CCCCNC1=CC=C(C=C1)C(=O)OCCN(C)C

export const tetracaine = Fragment('CCCCNC1=CC=C(C=C1)C(=O)OCCN(C)C');

// === PROCAINE ===
// Classic ester anesthetic (Novocain)
// SMILES: CCN(CC)CCOC(=O)C1=CC=C(C=C1)N

export const procaine = Fragment('CCN(CC)CCOC(=O)C1=CC=C(C=C1)N');
