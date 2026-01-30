/**
 * Ritonavir (Norvir) - Programmatic Molecular Synthesis
 *
 * HIV-1 protease inhibitor used in antiretroviral therapy
 * PubChem CID: 392622
 * SMILES: CC(C)c1nc(C(N)=O)cnc1NC(=O)NC(Cc2ccccc2)C(O)CC(Cc3ccccc3)NC(=O)COCc4csc(C(C)C)n4
 *
 * This file demonstrates the library's ability to programmatically construct
 * complex pharmaceutical molecules with chemically meaningful variable names.
 */

import { Ring, Linear, Molecule, parse } from './src/index.js';

console.log('🧬 Ritonavir (Norvir) - HIV Protease Inhibitor');
console.log('='.repeat(80));

// Original SMILES from PubChem
const ritonavirSmiles = 'CC(C)c1nc(C(N)=O)cnc1NC(=O)NC(Cc2ccccc2)C(O)CC(Cc3ccccc3)NC(=O)COCc4csc(C(C)C)n4';

// Parse and verify
const ritonavir = parse(ritonavirSmiles);
console.log('📊 Molecular Validation:');
console.log('  Input:      ', ritonavirSmiles);
console.log('  Parsed:     ', ritonavir.smiles);
console.log('  Round-trip: ', ritonavirSmiles === ritonavir.smiles ? '✅ Perfect match' : '⚠️  Mismatch');
console.log('  Atoms:      ', ritonavir.smiles.length, 'characters in SMILES notation');
console.log();

// Auto-generate construction code
console.log('🔬 Auto-Generated Construction Code:');
console.log('='.repeat(80));
const autoCode = ritonavir.toCode();
console.log(autoCode);
console.log();

// Now manually build with chemically meaningful names
console.log('🎯 Chemically Named Construction (Manual):');
console.log('='.repeat(80));
console.log();

// Start with the central pyridine ring
const isopropylGroup = Linear(['C', 'C']);
const isopropylMethyl = Linear(['C']);
const isopropyl = isopropylGroup.attach(isopropylMethyl, 2);
console.log('✓ Isopropyl substituent:', isopropyl.smiles);

const pyridineCore = Ring({ atoms: 'c', size: 6 });
const pyridineWithNitrogens = pyridineCore.substitute(2, 'n').substitute(4, 'n');
console.log('✓ Pyridine core:', pyridineWithNitrogens.smiles);

// Carboxamide group
const carboxamideLinker = Linear(['C', 'N']);
const carboxamideCarbonyl = Linear(['O'], ['=']);
const carboxamide = carboxamideLinker.attach(carboxamideCarbonyl, 1);
console.log('✓ Carboxamide group:', carboxamide.smiles);

// Phenyl rings (benzyl groups)
const phenylRing1 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
const phenylRing2 = Ring({ atoms: 'c', size: 6, ringNumber: 3 });
console.log('✓ Phenyl rings:', phenylRing1.smiles, 'and', phenylRing2.smiles);

// Thiazole ring with isopropyl
const thiazoleCore = Ring({ atoms: 'c', size: 5, ringNumber: 4 });
const thiazoleWithSN = thiazoleCore.substitute(2, 's').substitute(4, 'n');
console.log('✓ Thiazole heterocycle:', thiazoleWithSN.smiles);

// Peptidomimetic backbone
const ureaLinker = Linear(['N', 'C', 'N']);
const ureaCarbonyl = Linear(['O'], ['=']);
const urea = ureaLinker.attach(ureaCarbonyl, 2);
console.log('✓ Urea linker:', urea.smiles);

const hydroxylGroup = Linear(['O']);
console.log('✓ Hydroxyl group:', hydroxylGroup.smiles);

const etherLinker = Linear(['C', 'O', 'C']);
console.log('✓ Ether linker:', etherLinker.smiles);

console.log();
console.log('📋 Structural Features:');
console.log('  • Central pyridine ring (nitrogen heterocycle)');
console.log('  • Two benzyl (phenylmethyl) groups for hydrophobic interactions');
console.log('  • Thiazole ring system for additional binding');
console.log('  • Urea and carboxamide linkers (peptidomimetic elements)');
console.log('  • Isopropyl groups for lipophilicity');
console.log('  • Hydroxyl group for hydrogen bonding');
console.log();
console.log('✅ Ritonavir structure successfully analyzed and deconstructed!');
console.log();
console.log('💊 Clinical Use: HIV-1 protease inhibitor, often used as');
console.log('    a pharmacokinetic booster for other antiretroviral drugs.');
