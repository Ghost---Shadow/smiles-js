/**
 * Decompiler demonstration
 * Shows how to convert AST nodes back to JavaScript constructor code
 */

import {
  Ring, Linear, Molecule, parse,
} from '../src/index.js';

console.log('=== Decompiler Examples ===\n');

// Example 1: Simple ring
console.log('1. Simple Ring:');
const benzene = Ring({ atoms: 'c', size: 6 });
console.log('Code:', benzene.toCode('benzene'));
console.log();

// Example 2: Linear chain
console.log('2. Linear Chain:');
const propane = Linear(['C', 'C', 'C']);
console.log('Code:', propane.toCode('propane'));
console.log();

// Example 3: Linear with bonds
console.log('3. Linear with Bonds:');
const ethene = Linear(['C', 'C'], ['=']);
console.log('Code:', ethene.toCode('ethene'));
console.log();

// Example 4: Molecule
console.log('4. Molecule (propylbenzene):');
const propyl = Linear(['C', 'C', 'C']);
const phenyl = Ring({ atoms: 'c', size: 6 });
const propylbenzene = Molecule([propyl, phenyl]);
console.log('Code:');
console.log(propylbenzene.toCode('propylbenzene'));
console.log();

// Example 5: Fused ring (naphthalene-like)
console.log('5. Fused Ring System:');
const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const fusedRing = ring1.fuse(ring2, 2);
console.log('Code:');
console.log(fusedRing.toCode('naphthalene'));
console.log();

// Example 6: Parse SMILES and decompile
console.log('6. Round-trip (SMILES → AST → Code):');
const smiles = 'CCCc1ccccc1';
const ast = parse(smiles);
console.log('Input SMILES:', smiles);
console.log('Decompiled Code:');
console.log(ast.toCode('compound'));
console.log();

// Example 7: Parse with branches
console.log('7. Branches (SMILES → AST → Code):');
const acetone = parse('CC(=O)C');
console.log('Input SMILES: CC(=O)C');
console.log('Decompiled Code:');
console.log(acetone.toCode('acetone'));
console.log();

console.log('=== All examples complete ===');
