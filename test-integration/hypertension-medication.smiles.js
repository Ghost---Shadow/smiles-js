// Hypertension Medications - Angiotensin II Receptor Blockers (ARBs)
// Medications that block angiotensin II receptors, used to treat high blood pressure

import { Fragment, FusedRings, Ring } from 'smiles-js';

// === TELMISARTAN ===
// Angiotensin II receptor blocker with unique bis-benzimidazole structure
// SMILES: CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C
// Used for hypertension, acts as partial PPAR-γ agonist

export const benzene = Ring('c', 6);
export const carboxylicAcid = Fragment('C(=O)O');
export const todo2 = benzene.attachAt(1, carboxylicAcid);
export const todo3 = todo2.attachAt(6, benzene);
export const todo1 = FusedRings([6, 5], 'c', { hetero: { 4: 'n', 6: '[nH]' } });
// export const todo4 = todo1
// .attachAt([1, 4], 'C')
// .attachAt([2, 1], 'CCC')
// .attachAt([2, 2], todo3, {at: [0, 2]});
// export const todo5 = todo1.attachAt([2, 1], todo4).attachAt([2, 2], 'C');
export const telmisartan = Fragment('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C');

// === LOSARTAN ===
// First FDA-approved angiotensin II receptor blocker
// SMILES: CCCCC1=NC(Cl)=C(CO)N1CC2=CC=C(C=C2)C3=CC=CC=C3C4=NNN=N4
// Used for hypertension and diabetic nephropathy

export const losartan = Fragment('CCCCC1=NC(Cl)=C(CO)N1CC2=CC=C(C=C2)C3=CC=CC=C3C4=NNN=N4');

// === VALSARTAN ===
// Angiotensin II receptor blocker with pentanoyl side chain
// SMILES: CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C(=O)O
// Used for hypertension and heart failure

export const valsartan = Fragment('CCCCC(=O)N(CC1=CC=C(C=C1)C2=CC=CC=C2C3=NNN=N3)C(C(C)C)C(=O)O');

// === IRBESARTAN ===
// Angiotensin II receptor blocker with spirocyclopentane structure
// SMILES: CCCCC1=NC2(CCCC2)C(=O)N1CC3=CC=C(C=C3)C4=CC=CC=C4C5=NNN=N5
// Used for hypertension and diabetic nephropathy

export const irbesartan = Fragment('CCCCC1=NC2(CCCC2)C(=O)N1CC3=CC=C(C=C3)C4=CC=CC=C4C5=NNN=N5');
