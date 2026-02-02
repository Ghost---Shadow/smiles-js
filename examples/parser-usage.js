/**
 * Parser usage examples - converting SMILES strings to AST
 */

import { parse } from '../src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

log('=== Parser Examples ===\n');

// Simple linear chains
log('Linear Chains:');
const propane = parse('CCC');
log('CCC ->', propane);
log('  Type:', propane.type);
log('  Atoms:', propane.atoms);
log('  SMILES:', propane.smiles);
log();

const ethanol = parse('CCO');
log('CCO ->', ethanol);
log('  Type:', ethanol.type);
log('  Atoms:', ethanol.atoms);
log('  SMILES:', ethanol.smiles);
log();

// Simple rings
log('Simple Rings:');
const benzene = parse('c1ccccc1');
log('c1ccccc1 ->', benzene);
log('  Type:', benzene.type);
log('  Size:', benzene.size);
log('  Base atom:', benzene.atoms);
log('  SMILES:', benzene.smiles);
log();

const cyclopentane = parse('C1CCCC1');
log('C1CCCC1 ->', cyclopentane);
log('  Type:', cyclopentane.type);
log('  Size:', cyclopentane.size);
log('  SMILES:', cyclopentane.smiles);
log();

// Ring with substitutions
log('Ring Substitutions:');
const pyridine = parse('n1ccccc1');
log('n1ccccc1 ->', pyridine);
log('  Type:', pyridine.type);
log('  Size:', pyridine.size);
log('  Base atom:', pyridine.atoms);
log('  Substitutions:', pyridine.substitutions);
log('  SMILES:', pyridine.smiles);
log();

const triazine = parse('n1cncnc1');
log('n1cncnc1 ->', triazine);
log('  Type:', triazine.type);
log('  Base atom:', triazine.atoms);
log('  Substitutions:', triazine.substitutions);
log('  SMILES:', triazine.smiles);
log();

// Molecules with multiple components
log('Molecules (Multiple Components):');
const toluene = parse('Cc1ccccc1');
log('Cc1ccccc1 ->', toluene);
log('  Type:', toluene.type);
log('  Components:', toluene.components.length);
log('  Component 0 (Linear):', toluene.components[0]);
log('  Component 1 (Ring):', toluene.components[1]);
log('  SMILES:', toluene.smiles);
log();

const propylbenzene = parse('CCCc1ccccc1');
log('CCCc1ccccc1 ->', propylbenzene);
log('  Type:', propylbenzene.type);
log('  Components:', propylbenzene.components.length);
log('  SMILES:', propylbenzene.smiles);
log();

// Two-letter atoms
log('Two-Letter Atoms:');
const chloroethane = parse('CCl');
log('CCl ->', chloroethane);
log('  Atoms:', chloroethane.atoms);
log('  SMILES:', chloroethane.smiles);
log();

// Bracketed atoms
log('Bracketed Atoms:');
const ammonium = parse('[NH3+]');
log('[NH3+] ->', ammonium);
log('  Atoms:', ammonium.atoms);
log('  SMILES:', ammonium.smiles);
log();

// Round-trip demonstration
log('Round-Trip Examples:');
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
  log(`${match} ${smiles} -> ${regenerated}`);
});
