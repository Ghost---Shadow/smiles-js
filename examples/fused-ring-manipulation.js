/**
 * FusedRing manipulation examples
 * Demonstrates working with fused ring systems
 */

import { Ring, Linear } from '../src/index.js';

console.log('=== FusedRing Manipulation Examples ===\n');

// Create a simple fused ring (naphthalene-like structure)
const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const naphthalene = ring1.fuse(ring2, 2);

console.log('Original fused ring:');
console.log('  Type:', naphthalene.type);
console.log('  Rings:', naphthalene.rings.length);
console.log('  Ring 1 size:', naphthalene.rings[0].size);
console.log('  Ring 2 size:', naphthalene.rings[1].size);
console.log('  SMILES:', naphthalene.smiles);
console.log();

// Add a third ring to the system
console.log('=== addRing() - Expand the system ===');
const ring3 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
const expanded = naphthalene.addRing(ring3, 8);

console.log('After adding ring 3:');
console.log('  Rings:', expanded.rings.length);
console.log('  Ring 3 size:', expanded.rings[2].size);
console.log('  Ring 3 offset:', expanded.rings[2].offset);
console.log();

// Substitute in a specific ring
console.log('=== substituteInRing() - Modify specific ring ===');
const withSubstitution = naphthalene.substituteInRing(2, 3, 'N');

console.log('After substituting N at position 3 in ring 2:');
console.log('  Ring 2 substitutions:', withSubstitution.rings[1].substitutions);
console.log('  Original unchanged:', naphthalene.rings[1].substitutions);
console.log();

// Attach to a specific ring
console.log('=== attachToRing() - Attach to specific ring ===');
const methyl = Linear(['C']);
const withAttachment = naphthalene.attachToRing(2, methyl, 4);

console.log('After attaching methyl to ring 2, position 4:');
console.log('  Ring 2 has attachment:', Object.keys(withAttachment.rings[1].attachments).length > 0);
console.log('  Attachment at position 4:', withAttachment.rings[1].attachments[4] !== undefined);
console.log('  Original unchanged:', Object.keys(naphthalene.rings[1].attachments).length === 0);
console.log();

// Get a specific ring
console.log('=== getRing() - Retrieve specific ring ===');
const retrievedRing = naphthalene.getRing(2);

console.log('Retrieved ring 2:');
console.log('  Ring number:', retrievedRing.ringNumber);
console.log('  Size:', retrievedRing.size);
console.log('  Offset:', retrievedRing.offset);
console.log();

// Renumber rings
console.log('=== renumber() - Renumber rings sequentially ===');
const ring4 = Ring({ atoms: 'C', size: 6, ringNumber: 5 });
const ring5 = Ring({ atoms: 'C', size: 6, ringNumber: 7 });
const messyNumbers = ring4.fuse(ring5, 2);

console.log('Before renumbering:');
console.log('  Ring numbers:', messyNumbers.rings.map((r) => r.ringNumber));

const renumbered = messyNumbers.renumber();
console.log('After renumbering (default start = 1):');
console.log('  Ring numbers:', renumbered.rings.map((r) => r.ringNumber));

const renumberedCustom = messyNumbers.renumber(10);
console.log('After renumbering (start = 10):');
console.log('  Ring numbers:', renumberedCustom.rings.map((r) => r.ringNumber));
console.log();

// Concatenate with other structures
console.log('=== concat() - Create molecule from fused ring ===');
const propyl = Linear(['C', 'C', 'C']);
const molecule = naphthalene.concat(propyl);

console.log('After concatenating propyl chain:');
console.log('  Type:', molecule.type);
console.log('  Components:', molecule.components.length);
console.log('  Component 0 type:', molecule.components[0].type);
console.log('  Component 1 type:', molecule.components[1].type);
console.log();

// Clone
console.log('=== clone() - Deep copy ===');
const cloned = naphthalene.clone();

console.log('Cloned fused ring:');
console.log('  Equal to original:', JSON.stringify(cloned) === JSON.stringify(naphthalene));
console.log('  Different object:', cloned !== naphthalene);
console.log('  Different rings array:', cloned.rings !== naphthalene.rings);
console.log();

// Chaining operations
console.log('=== Chaining Operations ===');
const complex = ring1.fuse(ring2, 2)
  .substituteInRing(1, 5, 'N')
  .substituteInRing(2, 3, 'N')
  .attachToRing(2, Linear(['C', 'C']), 4)
  .renumber();

console.log('After chaining multiple operations:');
console.log('  Rings:', complex.rings.length);
console.log('  Ring 1 substitutions:', complex.rings[0].substitutions);
console.log('  Ring 2 substitutions:', complex.rings[1].substitutions);
console.log('  Ring 2 attachments:', Object.keys(complex.rings[1].attachments));
console.log('  Ring numbers:', complex.rings.map((r) => r.ringNumber));
console.log();

console.log('=== All operations are immutable ===');
console.log('Original naphthalene unchanged:');
console.log('  Rings:', naphthalene.rings.length);
console.log('  Ring 1 substitutions:', naphthalene.rings[0].substitutions);
console.log('  Ring 2 substitutions:', naphthalene.rings[1].substitutions);
console.log('  Ring 2 attachments:', naphthalene.rings[1].attachments);
