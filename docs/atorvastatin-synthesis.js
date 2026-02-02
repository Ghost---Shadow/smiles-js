import { parse } from './src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

// Atorvastatin (Lipitor) - HMG-CoA reductase inhibitor
// PubChem CID: 60823
const atorvastatinSmiles = 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O';

log('Atorvastatin (Lipitor) - Cholesterol Medication');
log('='.repeat(70));
log('SMILES:', atorvastatinSmiles);
log();

const atorvastatin = parse(atorvastatinSmiles);
log('Parsed successfully:', atorvastatin.smiles.length > 0);
log('Round-trip check:', atorvastatinSmiles === atorvastatin.smiles);
log();

// Generate code
const code = atorvastatin.toCode();
log('Generated Construction Code:');
log('='.repeat(70));
log(code);
