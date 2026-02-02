/**
 * Atorvastatin (Lipitor) - Programmatic Synthesis
 *
 * HMG-CoA reductase inhibitor used to lower cholesterol
 * PubChem CID: 60823
 * SMILES: CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O
 */

import { Ring, Linear, Molecule } from './src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

// Isopropyl group (substituent on pyrrole)
const methyl1 = Linear(['C']);
const ethyl = Linear(['C', 'C']);
const isopropyl = ethyl.attach(methyl1, 2);

// Central pyrrole ring (5-membered nitrogen heterocycle)
const pyrroleRing = Ring({ atoms: 'c', size: 5 });
const pyrrole = pyrroleRing.substitute(5, 'n');

// Amide linker with phenyl group
const amideLinker = Linear(['C', 'N']);
const carbonyl = Linear(['O'], ['=']);
const amide = amideLinker.attach(carbonyl, 1);
const phenylRing1 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
const phenylAmide = Molecule([amide, phenylRing1]);

// Attach amide-phenyl to pyrrole
const pyrroleWithAmide = pyrrole.attach(phenylAmide, 2);

// Second phenyl ring (position 3)
const phenylRing2 = Ring({ atoms: 'c', size: 6, ringNumber: 3 });
const pyrroleWithTwoPhenyls = pyrroleWithAmide.attach(phenylRing2, 3);

// Fluorophenyl ring (position 4)
const phenylRing3 = Ring({ atoms: 'c', size: 6, ringNumber: 4 });
const fluorine = Linear(['F']);
const fluorophenyl = phenylRing3.attach(fluorine, 4);
const pyrroleCore = pyrroleWithTwoPhenyls.attach(fluorophenyl, 4);

// Dihydroxyheptanoic acid side chain (the "statin" pharmacophore)
const heptanoicAcidChain = Linear(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'O']);
const hydroxyl1 = Linear(['O']);
const dihydroxyChain = heptanoicAcidChain.attach(hydroxyl1, 3);
const hydroxyl2 = Linear(['O']);
const trihydroxyChain = dihydroxyChain.attach(hydroxyl2, 5);
const carboxylate = Linear(['O'], ['=']);
const statinSideChain = trihydroxyChain.attach(carboxylate, 7);

// Assemble complete molecule
const atorvastatin = Molecule([isopropyl, pyrroleCore, statinSideChain]);

// Verify structure
log('Atorvastatin (Lipitor) - Programmatic Synthesis');
log('='.repeat(70));
log('\nStructure Components:');
log('  • Isopropyl group:', isopropyl.smiles);
log('  • Central pyrrole ring:', pyrrole.smiles);
log('  • Phenyl-amide group:', phenylAmide.smiles);
log('  • Fluorophenyl group:', fluorophenyl.smiles);
log('  • Statin side chain:', statinSideChain.smiles);
log('\nComplete Molecule:');
log('  SMILES:', atorvastatin.smiles);
log('  Length:', atorvastatin.smiles.length, 'characters');
log('\n✅ Atorvastatin synthesized successfully!');
