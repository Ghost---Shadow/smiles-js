/**
 * Decompiler demonstration
 * Shows how to convert AST nodes back to JavaScript constructor code
 */

import {
  Ring, Linear, Molecule, parse,
} from '../src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

log('=== Decompiler Examples ===\n');

// Example 1: Simple ring
log('1. Simple Ring:');
const benzene = Ring({ atoms: 'c', size: 6 });
log('Code:', benzene.toCode('benzene'));
log();

// Example 2: Linear chain
log('2. Linear Chain:');
const propane = Linear(['C', 'C', 'C']);
log('Code:', propane.toCode('propane'));
log();

// Example 3: Linear with bonds
log('3. Linear with Bonds:');
const ethene = Linear(['C', 'C'], ['=']);
log('Code:', ethene.toCode('ethene'));
log();

// Example 4: Molecule
log('4. Molecule (propylbenzene):');
const propyl = Linear(['C', 'C', 'C']);
const phenyl = Ring({ atoms: 'c', size: 6 });
const propylbenzene = Molecule([propyl, phenyl]);
log('Code:');
log(propylbenzene.toCode('propylbenzene'));
log();

// Example 5: Fused ring (naphthalene-like)
log('5. Fused Ring System:');
const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const fusedRing = ring1.fuse(ring2, 2);
log('Code:');
log(fusedRing.toCode('naphthalene'));
log();

// Example 6: Parse SMILES and decompile
log('6. Round-trip (SMILES → AST → Code):');
const smiles = 'CCCc1ccccc1';
const ast = parse(smiles);
log('Input SMILES:', smiles);
log('Decompiled Code:');
log(ast.toCode('compound'));
log();

// Example 7: Parse with branches
log('7. Branches (SMILES → AST → Code):');
const acetone = parse('CC(=O)C');
log('Input SMILES: CC(=O)C');
log('Decompiled Code:');
log(acetone.toCode('acetone'));
log();

log('=== All examples complete ===');
