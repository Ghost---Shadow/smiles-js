/**
 * Round-Trip Validation Demo
 *
 * Demonstrates automatic SMILES round-trip validation
 * and stabilization detection.
 */

import {
  validateRoundTrip,
  parseWithValidation,
  isValidRoundTrip,
  normalize,
  stabilizes,
} from '../src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

log('🔄 SMILES Round-Trip Validation Demo');
log('═'.repeat(80));
log();

// Example 1: Perfect round-trip
log('📊 Example 1: Perfect Round-Trip (Atorvastatin)');
log('─'.repeat(80));
const atorvastatin = 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O';

log('Input:', atorvastatin);
log('Quick check:', isValidRoundTrip(atorvastatin) ? '✅ Perfect' : '⚠️  Imperfect');

const result1 = validateRoundTrip(atorvastatin);
log('\nDetailed validation:');
log('  Status:', result1.status);
log('  Perfect:', result1.perfect);
log('  Stabilizes:', result1.stabilizes);
log('  Recommendation:', result1.recommendation);
log();

// Example 2: Stabilizing molecule
log('📊 Example 2: Stabilizing Molecule (Omeprazole)');
log('─'.repeat(80));
const omeprazole = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';

log('Input:', omeprazole);
log('Quick check:', isValidRoundTrip(omeprazole) ? '✅ Perfect' : '⚠️  Imperfect');
log('Stabilizes:', stabilizes(omeprazole) ? '✅ Yes' : '❌ No');

const result2 = validateRoundTrip(omeprazole);
log('\nDetailed validation:');
log('  Status:', result2.status);
log('  Original:', result2.original);
log('  After 1st parse:', result2.firstRoundTrip);
log('  After 2nd parse:', result2.secondRoundTrip);
log('  Stabilized:', result2.firstRoundTrip === result2.secondRoundTrip ? '✅' : '❌');
log('  Recommendation:', result2.recommendation);
log();

// Example 3: Using normalize()
log('📊 Example 3: Automatic Normalization');
log('─'.repeat(80));
const normalized = normalize(omeprazole);
log('Original: ', omeprazole, `(${omeprazole.length} chars)`);
log('Normalized:', normalized, `(${normalized.length} chars)`);
log('Difference:', omeprazole.length - normalized.length, 'character(s)');
log();

// Verify normalization is idempotent
const normalized2 = normalize(normalized);
log('Normalize again:', normalized2);
log('Idempotent:', normalized === normalized2 ? '✅ Yes' : '❌ No');
log();

// Example 4: Using parseWithValidation()
log('📊 Example 4: Parse with Automatic Validation');
log('─'.repeat(80));
log('Parsing omeprazole with warnings...');
const ast1 = parseWithValidation(omeprazole);
log('✅ Parsed successfully (warnings shown above)');
log('   AST type:', ast1.type);
log('   AST smiles:', ast1.smiles);
log();

log('Parsing omeprazole in silent mode...');
parseWithValidation(omeprazole, { silent: true });
log('✅ Parsed successfully (warnings suppressed)');
log();

// Example 5: Batch validation
log('📊 Example 5: Batch Validation');
log('─'.repeat(80));

const molecules = [
  { name: 'Benzene', smiles: 'c1ccccc1' },
  { name: 'Atorvastatin', smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O' },
  { name: 'Sildenafil', smiles: 'CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC' },
  { name: 'Omeprazole', smiles: 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1' },
  { name: 'Esomeprazole', smiles: 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1' },
];

log('Checking round-trip fidelity for multiple molecules:\n');

molecules.forEach(({ name, smiles }) => {
  const perfect = isValidRoundTrip(smiles);
  const stable = stabilizes(smiles);

  let status;
  if (perfect) {
    status = '✅ Perfect';
  } else if (stable) {
    status = '⚠️  Stabilizes';
  } else {
    status = '❌ Unstable';
  }

  log(`  ${status.padEnd(15)} ${name}`);
});

log();
log('═'.repeat(80));
log('✅ Round-Trip Validation Demo Complete');
log();
log('💡 Key Takeaways:');
log('   1. Use isValidRoundTrip() for quick boolean checks');
log('   2. Use validateRoundTrip() for detailed analysis');
log('   3. Use normalize() to get stabilized SMILES forms');
log('   4. Use parseWithValidation() for automatic warnings');
log('   5. Perfect round-trips need no action');
log('   6. Stabilizing molecules should use normalized form');
log('   7. Unstable molecules should be reported as bugs');
