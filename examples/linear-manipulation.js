/**
 * Linear manipulation examples
 * Demonstrates working with linear chains
 */

import { Linear, Ring } from '../src/index.js';

console.log('=== Linear Manipulation Examples ===\n');

// Create a simple linear chain
const propyl = Linear(['C', 'C', 'C']);

console.log('Original linear chain:');
console.log('  Type:', propyl.type);
console.log('  Atoms:', propyl.atoms);
console.log('  SMILES:', propyl.smiles);
console.log();

// Attach a single branch
console.log('=== attach() - Add single branch ===');
const methyl = Linear(['C']);
const branched = propyl.attach(methyl, 2);

console.log('After attaching methyl to position 2:');
console.log('  Has attachment:', Object.keys(branched.attachments).length > 0);
console.log('  Attachment at position 2:', branched.attachments[2] !== undefined);
console.log('  Attachment count:', branched.attachments[2].length);
console.log();

// Attach multiple branches to same position
console.log('=== attach() - Multiple branches at same position ===');
const methyl2 = Linear(['C']);
const doubleBranched = propyl.attach(methyl, 2).attach(methyl2, 2);

console.log('After attaching two methyls to position 2:');
console.log('  Attachment count at position 2:', doubleBranched.attachments[2].length);
console.log();

// Use branch() for multiple branches at once
console.log('=== branch() - Add multiple branches at once ===');
const ethyl = Linear(['C', 'C']);
const multiBranched = propyl.branch(2, methyl, ethyl);

console.log('After branching at position 2 with methyl and ethyl:');
console.log('  Attachment count at position 2:', multiBranched.attachments[2].length);
console.log('  First branch atoms:', multiBranched.attachments[2][0].atoms);
console.log('  Second branch atoms:', multiBranched.attachments[2][1].atoms);
console.log();

// Use branchAt() for multiple positions
console.log('=== branchAt() - Add branches at multiple positions ===');
const complexBranched = propyl.branchAt({
  1: methyl,
  2: ethyl,
  3: methyl,
});

console.log('After branching at positions 1, 2, and 3:');
console.log('  Positions with attachments:', Object.keys(complexBranched.attachments));
console.log('  Attachment at position 1:', complexBranched.attachments[1].length);
console.log('  Attachment at position 2:', complexBranched.attachments[2].length);
console.log('  Attachment at position 3:', complexBranched.attachments[3].length);
console.log();

// Use branchAt() with arrays for multiple branches
console.log('=== branchAt() - Multiple branches per position ===');
const veryComplex = propyl.branchAt({
  2: [methyl, ethyl, methyl2],
});

console.log('After adding 3 branches to position 2:');
console.log('  Attachment count at position 2:', veryComplex.attachments[2].length);
console.log();

// Concatenate linear chains
console.log('=== concat() - Join linear chains ===');
const pentyl = propyl.concat(ethyl);

console.log('After concatenating propyl with ethyl:');
console.log('  Type:', pentyl.type);
console.log('  Atoms:', pentyl.atoms);
console.log('  SMILES:', pentyl.smiles);
console.log();

// Concatenate with ring
console.log('=== concat() - Create molecule from linear + ring ===');
const benzene = Ring({ atoms: 'c', size: 6 });
const molecule = propyl.concat(benzene);

console.log('After concatenating propyl with benzene:');
console.log('  Type:', molecule.type);
console.log('  Components:', molecule.components.length);
console.log('  Component 0 type:', molecule.components[0].type);
console.log('  Component 1 type:', molecule.components[1].type);
console.log();

// Clone
console.log('=== clone() - Deep copy ===');
const cloned = branched.clone();

console.log('Cloned linear:');
console.log('  Equal to original:', JSON.stringify(cloned) === JSON.stringify(branched));
console.log('  Different object:', cloned !== branched);
console.log('  Different attachments object:', cloned.attachments !== branched.attachments);
console.log();

// Chaining operations
console.log('=== Chaining Operations ===');
const chained = Linear(['C', 'C', 'C', 'C'])
  .attach(Linear(['C']), 2)
  .attach(Linear(['C', 'C']), 3)
  .attach(Linear(['C']), 3);

console.log('After chaining multiple attach operations:');
console.log('  Positions with attachments:', Object.keys(chained.attachments));
console.log('  Attachments at position 2:', chained.attachments[2].length);
console.log('  Attachments at position 3:', chained.attachments[3].length);
console.log();

console.log('=== All operations are immutable ===');
console.log('Original propyl unchanged:');
console.log('  Atoms:', propyl.atoms);
console.log('  Attachments:', propyl.attachments);
