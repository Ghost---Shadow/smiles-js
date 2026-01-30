/**
 * Sildenafil (Viagra) - Programmatic Synthesis
 *
 * PDE5 inhibitor used for erectile dysfunction and pulmonary hypertension
 * PubChem CID: 5281023
 * SMILES: CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC
 */

import { Ring, Linear, Molecule, parse } from './src/index.js';

// First, let's parse and verify the structure
const sildenafilSmiles = 'CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC';
const parsed = parse(sildenafilSmiles);

console.log('Sildenafil (Viagra) - PDE5 Inhibitor');
console.log('='.repeat(70));
console.log('Input SMILES: ', sildenafilSmiles);
console.log('Output SMILES:', parsed.smiles);
console.log('Round-trip:   ', sildenafilSmiles === parsed.smiles ? '✅ Perfect' : '⚠️  Issue detected');
console.log();

// Now let's build it programmatically with proper chemical names
console.log('Building structure programmatically with chemical names...');
console.log('='.repeat(70));
console.log();

// Propyl substituent on pyrazole
const propyl = Linear(['C', 'C', 'C']);
console.log('1. Propyl group:', propyl.smiles);

// Pyrazole ring (5-membered with 2 nitrogens)
const pyrazoleRing = Ring({ atoms: 'c', size: 5 });
const pyrazole = pyrazoleRing.substitute(2, 'n').substitute(3, 'n');
console.log('2. Pyrazole ring:', pyrazole.smiles);

// Methyl on pyrazole nitrogen
const methylSubstituent = Linear(['C']);
const nMethylPyrazole = pyrazole.attach(methylSubstituent, 3);
console.log('3. N-methyl pyrazole:', nMethylPyrazole.smiles);

// Fused pyrimidine ring
const pyrimidineRing = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
const pyrimidine = pyrimidineRing.substitute(2, 'n').substitute(4, 'n');
console.log('4. Pyrimidine ring:', pyrimidine.smiles);

// Piperazine ring (6-membered with 2 nitrogens)
const piperazineRing = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
const piperazine = piperazineRing.substitute(1, 'N').substitute(4, 'N');
console.log('5. Piperazine ring:', piperazine.smiles);

// N-ethyl group on piperazine
const ethyl = Linear(['C', 'C']);
const nEthylPiperazine = piperazine.attach(ethyl, 4);
console.log('6. N-ethyl piperazine:', nEthylPiperazine.smiles);

// Ethyl ester group
const esterLinker = Linear(['C', 'O', 'C', 'C']);
const carbonylOxygen = Linear(['O'], ['=']);
const ethylEster = esterLinker.attach(carbonylOxygen, 1);
console.log('7. Ethyl ester:', ethylEster.smiles);

console.log();
console.log('Auto-generated code:');
console.log('='.repeat(70));
console.log(parsed.toCode());
