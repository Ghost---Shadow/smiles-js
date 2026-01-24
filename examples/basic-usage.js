/**
 * Basic usage examples for smiles-js programmatic API
 */

import {
  Ring, Linear, FusedRing, Molecule,
} from '../src/index.js';

// ============================================
// BASIC RING CONSTRUCTION
// ============================================

console.log('=== Basic Ring Construction ===\n');

// Create benzene
const benzene = Ring({ atoms: 'c', size: 6 });
console.log('Benzene:', benzene.smiles);
// Output: c1ccccc1

// ============================================
// RING SUBSTITUTIONS
// ============================================

console.log('\n=== Ring Substitutions ===\n');

// Create pyridine (benzene with one nitrogen)
const pyridine = benzene.substitute(1, 'n');
console.log('Pyridine:', pyridine.smiles);
// Output: n1ccccc1

// Create multiple substitutions
const triazine = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });
console.log('Triazine:', triazine.smiles);
// Output: n1cncnc1

// ============================================
// RING ATTACHMENTS
// ============================================

console.log('\n=== Ring Attachments ===\n');

// Create toluene (benzene with methyl group)
const methyl = Linear(['C']);
const toluene = benzene.attach(methyl, 1);
console.log('Toluene:', toluene.smiles);
// Output: c1(C)ccccc1

// Multiple attachments
const ethyl = Linear(['C', 'C']);
const ethylbenzene = benzene.attach(ethyl, 1);
console.log('Ethylbenzene:', ethylbenzene.smiles);
// Output: c1(CC)ccccc1

// ============================================
// LINEAR CHAINS
// ============================================

console.log('\n=== Linear Chains ===\n');

// Simple chain
const propane = Linear(['C', 'C', 'C']);
console.log('Propane:', propane.smiles);
// Output: CCC

// Chain with double bond
const ethene = Linear(['C', 'C'], ['=']);
console.log('Ethene:', ethene.smiles);
// Output: C=C

// Concatenate chains
const hexane = propane.concat(propane);
console.log('Hexane:', hexane.smiles);
// Output: CCCCCC

// ============================================
// FUSED RINGS
// ============================================

console.log('\n=== Fused Rings ===\n');

// Create naphthalene (two fused benzene rings)
const ring1 = Ring({
  atoms: 'C', size: 10, offset: 0, ringNumber: 1,
});
const ring2 = Ring({
  atoms: 'C', size: 6, offset: 2, ringNumber: 2,
});
const naphthalene = FusedRing([ring1, ring2]);
console.log('Naphthalene:', naphthalene.smiles);
// Output: C1CC2CCCCC2CC1

// Alternative: Use fuse method
const naphthalene2 = ring1.fuse(ring2, 2);
console.log('Naphthalene (via fuse):', naphthalene2.smiles);
// Output: C1CC2CCCCC2CC1

// ============================================
// MOLECULES (MULTIPLE COMPONENTS)
// ============================================

console.log('\n=== Molecules ===\n');

// Propylbenzene
const propylbenzene = Molecule([propane, benzene]);
console.log('Propylbenzene:', propylbenzene.smiles);
// Output: CCCc1ccccc1

// Can also use concat
const propylbenzene2 = propane.concat(benzene);
console.log('Propylbenzene (via concat):', propylbenzene2.smiles);
// Output: CCCc1ccccc1

// ============================================
// CHAINING OPERATIONS
// ============================================

console.log('\n=== Chaining Operations ===\n');

// Build complex molecule step by step
const molecule = Ring({ atoms: 'c', size: 6 })
  .substitute(1, 'n')
  .substitute(3, 'n')
  .attach(Linear(['C']), 2);

console.log('Complex molecule:', molecule.smiles);
// Output: n1c(C)nccc1

// ============================================
// IMMUTABILITY
// ============================================

console.log('\n=== Immutability ===\n');

const original = Ring({ atoms: 'c', size: 6 });
console.log('Original:', original.smiles); // c1ccccc1

const modified = original.substitute(1, 'n');
console.log('Modified:', modified.smiles); // n1ccccc1
console.log('Original unchanged:', original.smiles); // c1ccccc1
// Original remains benzene, modified is pyridine

// ============================================
// BUILDING REALISTIC MOLECULES
// ============================================

console.log('\n=== Realistic Molecules ===\n');

// Caffeine-like structure (simplified)
const imidazole = Ring({ atoms: 'C', size: 5 })
  .substitute(2, 'N')
  .substitute(4, 'N');

const pyrimidine = Ring({ atoms: 'C', size: 6 })
  .substitute(1, 'N')
  .substitute(3, 'N');

const fusedCore = imidazole.fuse(pyrimidine, 3);
console.log('Fused heterocycle:', fusedCore.smiles);
