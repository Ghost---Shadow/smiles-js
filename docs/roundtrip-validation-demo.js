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

console.log('🔄 SMILES Round-Trip Validation Demo');
console.log('═'.repeat(80));
console.log();

// Example 1: Perfect round-trip
console.log('📊 Example 1: Perfect Round-Trip (Atorvastatin)');
console.log('─'.repeat(80));
const atorvastatin = 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O';

console.log('Input:', atorvastatin);
console.log('Quick check:', isValidRoundTrip(atorvastatin) ? '✅ Perfect' : '⚠️  Imperfect');

const result1 = validateRoundTrip(atorvastatin);
console.log('\nDetailed validation:');
console.log('  Status:', result1.status);
console.log('  Perfect:', result1.perfect);
console.log('  Stabilizes:', result1.stabilizes);
console.log('  Recommendation:', result1.recommendation);
console.log();

// Example 2: Stabilizing molecule
console.log('📊 Example 2: Stabilizing Molecule (Omeprazole)');
console.log('─'.repeat(80));
const omeprazole = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';

console.log('Input:', omeprazole);
console.log('Quick check:', isValidRoundTrip(omeprazole) ? '✅ Perfect' : '⚠️  Imperfect');
console.log('Stabilizes:', stabilizes(omeprazole) ? '✅ Yes' : '❌ No');

const result2 = validateRoundTrip(omeprazole);
console.log('\nDetailed validation:');
console.log('  Status:', result2.status);
console.log('  Original:', result2.original);
console.log('  After 1st parse:', result2.firstRoundTrip);
console.log('  After 2nd parse:', result2.secondRoundTrip);
console.log('  Stabilized:', result2.firstRoundTrip === result2.secondRoundTrip ? '✅' : '❌');
console.log('  Recommendation:', result2.recommendation);
console.log();

// Example 3: Using normalize()
console.log('📊 Example 3: Automatic Normalization');
console.log('─'.repeat(80));
const normalized = normalize(omeprazole);
console.log('Original: ', omeprazole, `(${omeprazole.length} chars)`);
console.log('Normalized:', normalized, `(${normalized.length} chars)`);
console.log('Difference:', omeprazole.length - normalized.length, 'character(s)');
console.log();

// Verify normalization is idempotent
const normalized2 = normalize(normalized);
console.log('Normalize again:', normalized2);
console.log('Idempotent:', normalized === normalized2 ? '✅ Yes' : '❌ No');
console.log();

// Example 4: Using parseWithValidation()
console.log('📊 Example 4: Parse with Automatic Validation');
console.log('─'.repeat(80));
console.log('Parsing omeprazole with warnings...');
const ast1 = parseWithValidation(omeprazole);
console.log('✅ Parsed successfully (warnings shown above)');
console.log('   AST type:', ast1.type);
console.log('   AST smiles:', ast1.smiles);
console.log();

console.log('Parsing omeprazole in silent mode...');
parseWithValidation(omeprazole, { silent: true });
console.log('✅ Parsed successfully (warnings suppressed)');
console.log();

// Example 5: Batch validation
console.log('📊 Example 5: Batch Validation');
console.log('─'.repeat(80));

const molecules = [
  { name: 'Benzene', smiles: 'c1ccccc1' },
  { name: 'Atorvastatin', smiles: 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O' },
  { name: 'Sildenafil', smiles: 'CCCc1nn(C)c2c1nc(nc2NC3CCN(CC3)CC)C(=O)OCC' },
  { name: 'Omeprazole', smiles: 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1' },
  { name: 'Esomeprazole', smiles: 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1' },
];

console.log('Checking round-trip fidelity for multiple molecules:\n');

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

  console.log(`  ${status.padEnd(15)} ${name}`);
});

console.log();
console.log('═'.repeat(80));
console.log('✅ Round-Trip Validation Demo Complete');
console.log();
console.log('💡 Key Takeaways:');
console.log('   1. Use isValidRoundTrip() for quick boolean checks');
console.log('   2. Use validateRoundTrip() for detailed analysis');
console.log('   3. Use normalize() to get stabilized SMILES forms');
console.log('   4. Use parseWithValidation() for automatic warnings');
console.log('   5. Perfect round-trips need no action');
console.log('   6. Stabilizing molecules should use normalized form');
console.log('   7. Unstable molecules should be reported as bugs');
