/**
 * Parser usage examples - converting SMILES strings to AST
 */

import { parse } from '../src/index.js';

console.log('=== Parser Examples ===\n');

// Simple linear chains
console.log('Linear Chains:');
const propane = parse('CCC');
console.log('CCC ->', propane);
console.log('  Type:', propane.type);
console.log('  Atoms:', propane.atoms);
console.log('  SMILES:', propane.smiles);
console.log();

const ethanol = parse('CCO');
console.log('CCO ->', ethanol);
console.log('  Type:', ethanol.type);
console.log('  Atoms:', ethanol.atoms);
console.log('  SMILES:', ethanol.smiles);
console.log();

// Simple rings
console.log('Simple Rings:');
const benzene = parse('c1ccccc1');
console.log('c1ccccc1 ->', benzene);
console.log('  Type:', benzene.type);
console.log('  Size:', benzene.size);
console.log('  Base atom:', benzene.atoms);
console.log('  SMILES:', benzene.smiles);
console.log();

const cyclopentane = parse('C1CCCC1');
console.log('C1CCCC1 ->', cyclopentane);
console.log('  Type:', cyclopentane.type);
console.log('  Size:', cyclopentane.size);
console.log('  SMILES:', cyclopentane.smiles);
console.log();

// Ring with substitutions
console.log('Ring Substitutions:');
const pyridine = parse('n1ccccc1');
console.log('n1ccccc1 ->', pyridine);
console.log('  Type:', pyridine.type);
console.log('  Size:', pyridine.size);
console.log('  Base atom:', pyridine.atoms);
console.log('  Substitutions:', pyridine.substitutions);
console.log('  SMILES:', pyridine.smiles);
console.log();

const triazine = parse('n1cncnc1');
console.log('n1cncnc1 ->', triazine);
console.log('  Type:', triazine.type);
console.log('  Base atom:', triazine.atoms);
console.log('  Substitutions:', triazine.substitutions);
console.log('  SMILES:', triazine.smiles);
console.log();

// Molecules with multiple components
console.log('Molecules (Multiple Components):');
const toluene = parse('Cc1ccccc1');
console.log('Cc1ccccc1 ->', toluene);
console.log('  Type:', toluene.type);
console.log('  Components:', toluene.components.length);
console.log('  Component 0 (Linear):', toluene.components[0]);
console.log('  Component 1 (Ring):', toluene.components[1]);
console.log('  SMILES:', toluene.smiles);
console.log();

const propylbenzene = parse('CCCc1ccccc1');
console.log('CCCc1ccccc1 ->', propylbenzene);
console.log('  Type:', propylbenzene.type);
console.log('  Components:', propylbenzene.components.length);
console.log('  SMILES:', propylbenzene.smiles);
console.log();

// Two-letter atoms
console.log('Two-Letter Atoms:');
const chloroethane = parse('CCl');
console.log('CCl ->', chloroethane);
console.log('  Atoms:', chloroethane.atoms);
console.log('  SMILES:', chloroethane.smiles);
console.log();

// Bracketed atoms
console.log('Bracketed Atoms:');
const ammonium = parse('[NH3+]');
console.log('[NH3+] ->', ammonium);
console.log('  Atoms:', ammonium.atoms);
console.log('  SMILES:', ammonium.smiles);
console.log();

// Round-trip demonstration
console.log('Round-Trip Examples:');
const examples = [
  'C',
  'CCC',
  'CCO',
  'c1ccccc1',
  'n1ccccc1',
  'n1cncnc1',
  'Cc1ccccc1',
  'CCCc1ccccc1',
];

examples.forEach((smiles) => {
  const ast = parse(smiles);
  const regenerated = ast.smiles;
  const match = smiles === regenerated ? '✓' : '✗';
  console.log(`${match} ${smiles} -> ${regenerated}`);
});
