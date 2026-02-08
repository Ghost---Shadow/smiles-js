/**
 * FusedRing manipulation examples
 * Demonstrates working with fused ring systems
 */

import { Ring, Linear } from '../src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

log('=== FusedRing Manipulation Examples ===\n');

// Create a simple fused ring (naphthalene-like structure)
const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const naphthalene = ring1.fuse(2, ring2);

log('Original fused ring:');
log('  Type:', naphthalene.type);
log('  Rings:', naphthalene.rings.length);
log('  Ring 1 size:', naphthalene.rings[0].size);
log('  Ring 2 size:', naphthalene.rings[1].size);
log('  SMILES:', naphthalene.smiles);
log();

// Add a third ring to the system
log('=== addRing() - Expand the system ===');
const ring3 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
const expanded = naphthalene.addRing(8, ring3);

log('After adding ring 3:');
log('  Rings:', expanded.rings.length);
log('  Ring 3 size:', expanded.rings[2].size);
log('  Ring 3 offset:', expanded.rings[2].offset);
log();

// Substitute in a specific ring
log('=== substituteInRing() - Modify specific ring ===');
const withSubstitution = naphthalene.substituteInRing(2, 3, 'N');

log('After substituting N at position 3 in ring 2:');
log('  Ring 2 substitutions:', withSubstitution.rings[1].substitutions);
log('  Original unchanged:', naphthalene.rings[1].substitutions);
log();

// Attach to a specific ring
log('=== attachToRing() - Attach to specific ring ===');
const methyl = Linear(['C']);
const withAttachment = naphthalene.attachToRing(2, 4, methyl);

log('After attaching methyl to ring 2, position 4:');
log('  Ring 2 has attachment:', Object.keys(withAttachment.rings[1].attachments).length > 0);
log('  Attachment at position 4:', withAttachment.rings[1].attachments[4] !== undefined);
log('  Original unchanged:', Object.keys(naphthalene.rings[1].attachments).length === 0);
log();

// Get a specific ring
log('=== getRing() - Retrieve specific ring ===');
const retrievedRing = naphthalene.getRing(2);

log('Retrieved ring 2:');
log('  Ring number:', retrievedRing.ringNumber);
log('  Size:', retrievedRing.size);
log('  Offset:', retrievedRing.offset);
log();

// Renumber rings
log('=== renumber() - Renumber rings sequentially ===');
const ring4 = Ring({ atoms: 'C', size: 6, ringNumber: 5 });
const ring5 = Ring({ atoms: 'C', size: 6, ringNumber: 7 });
const messyNumbers = ring4.fuse(2, ring5);

log('Before renumbering:');
log('  Ring numbers:', messyNumbers.rings.map((r) => r.ringNumber));

const renumbered = messyNumbers.renumber();
log('After renumbering (default start = 1):');
log('  Ring numbers:', renumbered.rings.map((r) => r.ringNumber));

const renumberedCustom = messyNumbers.renumber(10);
log('After renumbering (start = 10):');
log('  Ring numbers:', renumberedCustom.rings.map((r) => r.ringNumber));
log();

// Concatenate with other structures
log('=== concat() - Create molecule from fused ring ===');
const propyl = Linear(['C', 'C', 'C']);
const molecule = naphthalene.concat(propyl);

log('After concatenating propyl chain:');
log('  Type:', molecule.type);
log('  Components:', molecule.components.length);
log('  Component 0 type:', molecule.components[0].type);
log('  Component 1 type:', molecule.components[1].type);
log();

// Clone
log('=== clone() - Deep copy ===');
const cloned = naphthalene.clone();

log('Cloned fused ring:');
log('  Equal to original:', JSON.stringify(cloned) === JSON.stringify(naphthalene));
log('  Different object:', cloned !== naphthalene);
log('  Different rings array:', cloned.rings !== naphthalene.rings);
log();

// Chaining operations
log('=== Chaining Operations ===');
const complex = ring1.fuse(2, ring2)
  .substituteInRing(1, 5, 'N')
  .substituteInRing(2, 3, 'N')
  .attachToRing(2, 4, Linear(['C', 'C']))
  .renumber();

log('After chaining multiple operations:');
log('  Rings:', complex.rings.length);
log('  Ring 1 substitutions:', complex.rings[0].substitutions);
log('  Ring 2 substitutions:', complex.rings[1].substitutions);
log('  Ring 2 attachments:', Object.keys(complex.rings[1].attachments));
log('  Ring numbers:', complex.rings.map((r) => r.ringNumber));
log();

log('=== All operations are immutable ===');
log('Original naphthalene unchanged:');
log('  Rings:', naphthalene.rings.length);
log('  Ring 1 substitutions:', naphthalene.rings[0].substitutions);
log('  Ring 2 substitutions:', naphthalene.rings[1].substitutions);
log('  Ring 2 attachments:', naphthalene.rings[1].attachments);
