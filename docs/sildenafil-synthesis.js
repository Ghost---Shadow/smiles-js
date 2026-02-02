/**
 * Sildenafil (Viagra) - Programmatic Synthesis
 *
 * PDE5 inhibitor used for erectile dysfunction and pulmonary hypertension
 * PubChem CID: 5281023
 * SMILES: CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC
 */

import {
  Ring, Linear, parse,
} from './src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

// First, let's parse and verify the structure
const sildenafilSmiles = 'CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC';
const parsed = parse(sildenafilSmiles);

log('Sildenafil (Viagra) - PDE5 Inhibitor');
log('='.repeat(70));
log('Input SMILES: ', sildenafilSmiles);
log('Output SMILES:', parsed.smiles);
log('Round-trip:   ', sildenafilSmiles === parsed.smiles ? '✅ Perfect' : '⚠️  Issue detected');
log();

// Now let's build it programmatically with proper chemical names
log('Building structure programmatically with chemical names...');
log('='.repeat(70));
log();

// Propyl substituent on pyrazole
const propyl = Linear(['C', 'C', 'C']);
log('1. Propyl group:', propyl.smiles);

// Pyrazole ring (5-membered with 2 nitrogens)
const pyrazoleRing = Ring({ atoms: 'c', size: 5 });
const pyrazole = pyrazoleRing.substitute(2, 'n').substitute(3, 'n');
log('2. Pyrazole ring:', pyrazole.smiles);

// Methyl on pyrazole nitrogen
const methylSubstituent = Linear(['C']);
const nMethylPyrazole = pyrazole.attach(methylSubstituent, 3);
log('3. N-methyl pyrazole:', nMethylPyrazole.smiles);

// Fused pyrimidine ring
const pyrimidineRing = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
const pyrimidine = pyrimidineRing.substitute(2, 'n').substitute(4, 'n');
log('4. Pyrimidine ring:', pyrimidine.smiles);

// Piperazine ring (6-membered with 2 nitrogens)
const piperazineRing = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
const piperazine = piperazineRing.substitute(1, 'N').substitute(4, 'N');
log('5. Piperazine ring:', piperazine.smiles);

// N-ethyl group on piperazine
const ethyl = Linear(['C', 'C']);
const nEthylPiperazine = piperazine.attach(ethyl, 4);
log('6. N-ethyl piperazine:', nEthylPiperazine.smiles);

// Ethyl ester group
const esterLinker = Linear(['C', 'O', 'C', 'C']);
const carbonylOxygen = Linear(['O'], ['=']);
const ethylEster = esterLinker.attach(carbonylOxygen, 1);
log('7. Ethyl ester:', ethylEster.smiles);

log();
log('Auto-generated code:');
log('='.repeat(70));
log(parsed.toCode());
