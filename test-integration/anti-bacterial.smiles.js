// Anti-Bacterial Drugs (Antibiotics)
// Diverse classes: beta-lactams, macrolides, fluoroquinolones, tetracyclines, aminoglycosides, etc.

import { Fragment } from 'smiles-js';

// === PENICILLIN G ===
// Beta-lactam antibiotic (narrow-spectrum)
// Trade names: Pfizerpen, Bicillin
// Uses: Streptococcal infections, syphilis, meningitis
// SMILES: CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O

export const penicillinG = Fragment('CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O');

// === AMOXICILLIN ===
// Aminopenicillin (broad-spectrum)
// Trade names: Amoxil, Trimox
// Uses: Ear infections, pneumonia, UTI, H. pylori
// SMILES: CC1(C)SC2C(NC(=O)C(N)c3ccc(O)cc3)C(=O)N2C1C(=O)O

export const amoxicillin = Fragment('CC1(C)SC2C(NC(=O)C(N)c3ccc(O)cc3)C(=O)N2C1C(=O)O');

// === AMPICILLIN ===
// Aminopenicillin
// Trade names: Principen, Omnipen
// Uses: Meningitis, endocarditis, UTI
// SMILES: CC1(C)SC2C(NC(=O)C(N)c3ccccc3)C(=O)N2C1C(=O)O

export const ampicillin = Fragment('CC1(C)SC2C(NC(=O)C(N)c3ccccc3)C(=O)N2C1C(=O)O');

// === CEPHALEXIN ===
// First-generation cephalosporin
// Trade names: Keflex, Daxbia
// Uses: Skin infections, UTI, respiratory tract infections
// SMILES: CC1=C(N2C(C(C2=O)NC(=O)C(C3=CC=CC=C3)N)SC1)C(=O)O

export const cephalexin = Fragment('CC1=C(N2C(C(C2=O)NC(=O)C(C3=CC=CC=C3)N)SC1)C(=O)O');

// === CEFTRIAXONE ===
// Third-generation cephalosporin
// Trade names: Rocephin
// Uses: Meningitis, gonorrhea, sepsis, pneumonia
// SMILES: CON=C(C(=O)NC1C(=O)N2C(C(=O)O)=C(CSc3nc(=O)c(=O)[nH]n3C)CSC12)c1csc(N)n1

export const ceftriaxone = Fragment('CON=C(C(=O)NC1C(=O)N2C(C(=O)O)=C(CSc3nc(=O)c(=O)[nH]n3C)CSC12)c1csc(N)n1');

// === CIPROFLOXACIN ===
// Fluoroquinolone
// Trade names: Cipro, Ciproxin
// Uses: UTI, anthrax, pneumonia, GI infections
// SMILES: O=C(O)c1cn(C2CC2)c2cc(N3CCNCC3)c(F)cc2c1=O

export const ciprofloxacin = Fragment('O=C(O)c1cn(C2CC2)c2cc(N3CCNCC3)c(F)cc2c1=O');

// === LEVOFLOXACIN ===
// Fluoroquinolone (L-isomer of ofloxacin)
// Trade names: Levaquin, Tavanic
// Uses: Pneumonia, sinusitis, UTI, anthrax
// SMILES: CC1COc2c(N3CCN(C)CC3)c(F)cc3c(=O)c(C(=O)O)cn1c23

export const levofloxacin = Fragment('CC1COc2c(N3CCN(C)CC3)c(F)cc3c(=O)c(C(=O)O)cn1c23');

// === TETRACYCLINE ===
// Tetracycline antibiotic
// Trade names: Sumycin, Tetracyn
// Uses: Acne, respiratory infections, Lyme disease, chlamydia
// SMILES: CC1(C2CC3C(C(=O)C(=C(C3(C(=O)C2=C(C4=C1C=CC=C4O)O)O)O)C(=O)N)N(C)C)O

export const tetracycline = Fragment('CC1(C2CC3C(C(=O)C(=C(C3(C(=O)C2=C(C4=C1C=CC=C4O)O)O)O)C(=O)N)N(C)C)O');

// === DOXYCYCLINE ===
// Second-generation tetracycline
// Trade names: Vibramycin, Doryx
// Uses: Acne, Lyme disease, malaria prophylaxis, chlamydia
// SMILES: CN(C)C1C2CC3C(=C(O)c4c(O)cccc43)C(=O)C2(O)C(=O)C1O

export const doxycycline = Fragment('CN(C)C1C2CC3C(=C(O)c4c(O)cccc43)C(=O)C2(O)C(=O)C1O');

// === MINOCYCLINE ===
// Third-generation tetracycline
// Trade names: Minocin, Dynacin
// Uses: Acne, MRSA skin infections, rheumatoid arthritis
// SMILES: CN(C)C1C2CC3CC4=C(C=CC(=C4C(=C3C(=O)C2(C(=C(C1=O)C(=O)N)O)O)O)O)N(C)C

export const minocycline = Fragment('CN(C)C1C2CC3CC4=C(C=CC(=C4C(=C3C(=O)C2(C(=C(C1=O)C(=O)N)O)O)O)O)N(C)C');

// === ERYTHROMYCIN ===
// Macrolide antibiotic
// Trade names: Erythrocin, E-Mycin
// Uses: Respiratory infections, STIs, skin infections (penicillin-allergic patients)
// SMILES: CCC1C(C(C(C(=O)C(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)
//         OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)O)(C)O

export const erythromycin = Fragment('CCC1C(C(C(C(=O)C(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)O)(C)O');

// === AZITHROMYCIN ===
// Azalide macrolide
// Trade names: Zithromax, Z-Pack
// Uses: Community-acquired pneumonia, STIs, MAC infections
// SMILES: CCC1C(C(C(N(CC(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)
//         OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)C)O)(C)O

export const azithromycin = Fragment('CCC1C(C(C(N(CC(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)C)O)(C)O');

// === CLARITHROMYCIN ===
// Macrolide (6-O-methylerythromycin)
// Trade names: Biaxin
// Uses: H. pylori eradication, MAC, respiratory infections
// SMILES: CCC1C(C(C(C(=O)C(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)
//         OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)O)(C)OC

export const clarithromycin = Fragment('CCC1C(C(C(C(=O)C(CC(C(C(C(C(C(=O)O1)C)OC2CC(C(C(O2)C)O)(C)OC)C)OC3C(C(CC(O3)C)N(C)C)O)(C)O)C)C)O)(C)OC');

// === TRIMETHOPRIM ===
// Diaminopyrimidine (DHFR inhibitor)
// Trade names: Primsol, Proloprim
// Uses: UTI, Pneumocystis pneumonia (with sulfamethoxazole)
// SMILES: COc1cc(Cc2cnc(N)nc2N)cc(OC)c1OC

export const trimethoprim = Fragment('COc1cc(Cc2cnc(N)nc2N)cc(OC)c1OC');

// === SULFAMETHOXAZOLE ===
// Sulfonamide (DHPS inhibitor)
// Trade names: Gantanol (often combined as TMP-SMX / Bactrim)
// Uses: UTI, Pneumocystis pneumonia, toxoplasmosis
// SMILES: Cc1cc(NS(=O)(=O)c2ccc(N)cc2)no1

export const sulfamethoxazole = Fragment('Cc1cc(NS(=O)(=O)c2ccc(N)cc2)no1');

// === METRONIDAZOLE ===
// Nitroimidazole
// Trade names: Flagyl, Metrogel
// Uses: Anaerobic bacterial infections, C. diff, H. pylori, BV
// SMILES: Cc1ncc([N+](=O)[O-])n1CCO

export const metronidazole = Fragment('Cc1ncc([N+](=O)[O-])n1CCO');

// === VANCOMYCIN ===
// Glycopeptide antibiotic
// Trade names: Vancocin
// Uses: MRSA, C. diff, serious gram-positive infections
// Simplified SMILES representation of the heptapeptide core with biaryl ether crosslinks
// SMILES: O=C(O)C1NC(=O)C(Cc2cc(Cl)c(Oc3cc4cc(Cl)c(O)c(C(=O)NC(CC(N)=O)C(=O)O)
//         c4cc3O)cc2)NC(=O)C(NC(=O)c2ccc(O)c(c2)-c2cc(CC(NC(=O)C(N)Cc3ccc(O)cc3)
//         C(=O)N1)ccc2O)Cc2ccc(O)cc2

export const vancomycin = Fragment('O=C(O)C1NC(=O)C(Cc2cc(Cl)c(Oc3cc4cc(Cl)c(O)c(C(=O)NC(CC(N)=O)C(=O)O)c4cc3O)cc2)NC(=O)C(NC(=O)c2ccc(O)c(c2)-c2cc(CC(NC(=O)C(N)Cc3ccc(O)cc3)C(=O)N1)ccc2O)Cc2ccc(O)cc2');

// === LINEZOLID ===
// Oxazolidinone
// Trade names: Zyvox
// Uses: MRSA, VRE, drug-resistant gram-positive infections
// SMILES: CC(=O)NCC1CN(C(=O)O1)C2=CC(=C(C=C2)N3CCOCC3)F

export const linezolid = Fragment('CC(=O)NCC1CN(C(=O)O1)C2=CC(=C(C=C2)N3CCOCC3)F');

// === CLINDAMYCIN ===
// Lincosamide
// Trade names: Cleocin, Dalacin
// Uses: Anaerobic infections, MRSA skin infections, dental infections
// SMILES: CCCC1CC(N(C1)C)C(=O)NC(C2C(C(C(C(O2)SC)O)O)O)C(C)Cl

export const clindamycin = Fragment('CCCC1CC(N(C1)C)C(=O)NC(C2C(C(C(C(O2)SC)O)O)O)C(C)Cl');

// === RIFAMPICIN (RIFAMPIN) ===
// Rifamycin
// Trade names: Rifadin, Rimactane
// Uses: Tuberculosis, leprosy, meningococcal prophylaxis
// SMILES: COC1=C2NC(=O)C3=CC(=O)C(OC)=CC3=C2C=C(C)C(O)=C1OC(=O)
//         C=CC=CC=CC=CC(C)C(O)C(C)C(O)C1(C)OCC(=O)N1

export const rifampicin = Fragment('COC1=C2NC(=O)C3=CC(=O)C(OC)=CC3=C2C=C(C)C(O)=C1OC(=O)C=CC=CC=CC=CC(C)C(O)C(C)C(O)C1(C)OCC(=O)N1');
export const rifampin = rifampicin;

// === ISONIAZID ===
// Pyridine hydrazide (anti-TB)
// Trade names: Nydrazid, Laniazid
// Uses: Tuberculosis (first-line), TB prophylaxis
// SMILES: NNC(=O)c1ccncc1

export const isoniazid = Fragment('NNC(=O)c1ccncc1');

// === NITROFURANTOIN ===
// Nitrofuran
// Trade names: Macrobid, Macrodantin
// Uses: Uncomplicated UTI
// SMILES: OC1CN=NC1=Cc1ccc([N+](=O)[O-])o1

export const nitrofurantoin = Fragment('OC1CN=NC1=Cc1ccc([N+](=O)[O-])o1');

// === MEROPENEM ===
// Carbapenem (broad-spectrum, last-resort)
// Trade names: Merrem
// Uses: Serious gram-negative infections, febrile neutropenia
// SMILES: CC1C2CC(SC3CN4CCCC4C3NC(=O)C(=C)N)C(=O)N2C(=C1)C(=O)O

export const meropenem = Fragment('CC1C2CC(SC3CN4CCCC4C3NC(=O)C(=C)N)C(=O)N2C(=C1)C(=O)O');

// === DAPTOMYCIN ===
// Lipopeptide (cyclic)
// Trade names: Cubicin
// Uses: MRSA bacteremia, VRE, skin infections
// Simplified core SMILES
// SMILES: CCCCCCCCCC(=O)NC(CC(N)=O)C(=O)NC(CC(O)=O)C(=O)NC(Cc1ccccc1)
//         C(=O)NC(CC(N)=O)C(=O)NC(CC(O)=O)C(=O)NC(CO)C(=O)O

export const daptomycin = Fragment('CCCCCCCCCC(=O)NC(CC(N)=O)C(=O)NC(CC(O)=O)C(=O)NC(Cc1ccccc1)C(=O)NC(CC(N)=O)C(=O)NC(CC(O)=O)C(=O)NC(CO)C(=O)O');
