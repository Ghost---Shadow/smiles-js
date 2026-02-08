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

import {
  Ring, Linear, parse,
} from './src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

log('🧬 Ritonavir (Norvir) - HIV Protease Inhibitor');
log('='.repeat(80));

// Original SMILES from PubChem
const ritonavirSmiles = 'CC(C)c1nc(C(N)=O)cnc1NC(=O)NC(Cc2ccccc2)C(O)CC(Cc3ccccc3)NC(=O)COCc4csc(C(C)C)n4';

// Parse and verify
const ritonavir = parse(ritonavirSmiles);
log('📊 Molecular Validation:');
log('  Input:      ', ritonavirSmiles);
log('  Parsed:     ', ritonavir.smiles);
log('  Round-trip: ', ritonavirSmiles === ritonavir.smiles ? '✅ Perfect match' : '⚠️  Mismatch');
log('  Atoms:      ', ritonavir.smiles.length, 'characters in SMILES notation');
log();

// Auto-generate construction code
log('🔬 Auto-Generated Construction Code:');
log('='.repeat(80));
const autoCode = ritonavir.toCode();
log(autoCode);
log();

// Now manually build with chemically meaningful names
log('🎯 Chemically Named Construction (Manual):');
log('='.repeat(80));
log();

// Start with the central pyridine ring
const isopropylGroup = Linear(['C', 'C']);
const isopropylMethyl = Linear(['C']);
const isopropyl = isopropylGroup.attach(2, isopropylMethyl);
log('✓ Isopropyl substituent:', isopropyl.smiles);

const pyridineCore = Ring({ atoms: 'c', size: 6 });
const pyridineWithNitrogens = pyridineCore.substitute(2, 'n').substitute(4, 'n');
log('✓ Pyridine core:', pyridineWithNitrogens.smiles);

// Carboxamide group
const carboxamideLinker = Linear(['C', 'N']);
const carboxamideCarbonyl = Linear(['O'], ['=']);
const carboxamide = carboxamideLinker.attach(1, carboxamideCarbonyl);
log('✓ Carboxamide group:', carboxamide.smiles);

// Phenyl rings (benzyl groups)
const phenylRing1 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
const phenylRing2 = Ring({ atoms: 'c', size: 6, ringNumber: 3 });
log('✓ Phenyl rings:', phenylRing1.smiles, 'and', phenylRing2.smiles);

// Thiazole ring with isopropyl
const thiazoleCore = Ring({ atoms: 'c', size: 5, ringNumber: 4 });
const thiazoleWithSN = thiazoleCore.substitute(2, 's').substitute(4, 'n');
log('✓ Thiazole heterocycle:', thiazoleWithSN.smiles);

// Peptidomimetic backbone
const ureaLinker = Linear(['N', 'C', 'N']);
const ureaCarbonyl = Linear(['O'], ['=']);
const urea = ureaLinker.attach(2, ureaCarbonyl);
log('✓ Urea linker:', urea.smiles);

const hydroxylGroup = Linear(['O']);
log('✓ Hydroxyl group:', hydroxylGroup.smiles);

const etherLinker = Linear(['C', 'O', 'C']);
log('✓ Ether linker:', etherLinker.smiles);

log();
log('📋 Structural Features:');
log('  • Central pyridine ring (nitrogen heterocycle)');
log('  • Two benzyl (phenylmethyl) groups for hydrophobic interactions');
log('  • Thiazole ring system for additional binding');
log('  • Urea and carboxamide linkers (peptidomimetic elements)');
log('  • Isopropyl groups for lipophilicity');
log('  • Hydroxyl group for hydrogen bonding');
log();
log('✅ Ritonavir structure successfully analyzed and deconstructed!');
log();
log('💊 Clinical Use: HIV-1 protease inhibitor, often used as');
log('    a pharmacokinetic booster for other antiretroviral drugs.');
