/**
 * Linear manipulation examples
 * Demonstrates working with linear chains
 */

import { Linear, Ring } from '../src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

log('=== Linear Manipulation Examples ===\n');

// Create a simple linear chain
const propyl = Linear(['C', 'C', 'C']);

log('Original linear chain:');
log('  Type:', propyl.type);
log('  Atoms:', propyl.atoms);
log('  SMILES:', propyl.smiles);
log();

// Attach a single branch
log('=== attach() - Add single branch ===');
const methyl = Linear(['C']);
const branched = propyl.attach(methyl, 2);

log('After attaching methyl to position 2:');
log('  Has attachment:', Object.keys(branched.attachments).length > 0);
log('  Attachment at position 2:', branched.attachments[2] !== undefined);
log('  Attachment count:', branched.attachments[2].length);
log();

// Attach multiple branches to same position
log('=== attach() - Multiple branches at same position ===');
const methyl2 = Linear(['C']);
const doubleBranched = propyl.attach(methyl, 2).attach(methyl2, 2);

log('After attaching two methyls to position 2:');
log('  Attachment count at position 2:', doubleBranched.attachments[2].length);
log();

// Use branch() for multiple branches at once
log('=== branch() - Add multiple branches at once ===');
const ethyl = Linear(['C', 'C']);
const multiBranched = propyl.branch(2, methyl, ethyl);

log('After branching at position 2 with methyl and ethyl:');
log('  Attachment count at position 2:', multiBranched.attachments[2].length);
log('  First branch atoms:', multiBranched.attachments[2][0].atoms);
log('  Second branch atoms:', multiBranched.attachments[2][1].atoms);
log();

// Use branchAt() for multiple positions
log('=== branchAt() - Add branches at multiple positions ===');
const complexBranched = propyl.branchAt({
  1: methyl,
  2: ethyl,
  3: methyl,
});

log('After branching at positions 1, 2, and 3:');
log('  Positions with attachments:', Object.keys(complexBranched.attachments));
log('  Attachment at position 1:', complexBranched.attachments[1].length);
log('  Attachment at position 2:', complexBranched.attachments[2].length);
log('  Attachment at position 3:', complexBranched.attachments[3].length);
log();

// Use branchAt() with arrays for multiple branches
log('=== branchAt() - Multiple branches per position ===');
const veryComplex = propyl.branchAt({
  2: [methyl, ethyl, methyl2],
});

log('After adding 3 branches to position 2:');
log('  Attachment count at position 2:', veryComplex.attachments[2].length);
log();

// Concatenate linear chains
log('=== concat() - Join linear chains ===');
const pentyl = propyl.concat(ethyl);

log('After concatenating propyl with ethyl:');
log('  Type:', pentyl.type);
log('  Atoms:', pentyl.atoms);
log('  SMILES:', pentyl.smiles);
log();

// Concatenate with ring
log('=== concat() - Create molecule from linear + ring ===');
const benzene = Ring({ atoms: 'c', size: 6 });
const molecule = propyl.concat(benzene);

log('After concatenating propyl with benzene:');
log('  Type:', molecule.type);
log('  Components:', molecule.components.length);
log('  Component 0 type:', molecule.components[0].type);
log('  Component 1 type:', molecule.components[1].type);
log();

// Clone
log('=== clone() - Deep copy ===');
const cloned = branched.clone();

log('Cloned linear:');
log('  Equal to original:', JSON.stringify(cloned) === JSON.stringify(branched));
log('  Different object:', cloned !== branched);
log('  Different attachments object:', cloned.attachments !== branched.attachments);
log();

// Chaining operations
log('=== Chaining Operations ===');
const chained = Linear(['C', 'C', 'C', 'C'])
  .attach(Linear(['C']), 2)
  .attach(Linear(['C', 'C']), 3)
  .attach(Linear(['C']), 3);

log('After chaining multiple attach operations:');
log('  Positions with attachments:', Object.keys(chained.attachments));
log('  Attachments at position 2:', chained.attachments[2].length);
log('  Attachments at position 3:', chained.attachments[3].length);
log();

log('=== All operations are immutable ===');
log('Original propyl unchanged:');
log('  Atoms:', propyl.atoms);
log('  Attachments:', propyl.attachments);
