import { parse } from './src/index.js';

// Atorvastatin (Lipitor) - HMG-CoA reductase inhibitor
// PubChem CID: 60823
const atorvastatinSmiles = 'CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O';

console.log('Atorvastatin (Lipitor) - Cholesterol Medication');
console.log('='.repeat(70));
console.log('SMILES:', atorvastatinSmiles);
console.log();

const atorvastatin = parse(atorvastatinSmiles);
console.log('Parsed successfully:', atorvastatin.smiles.length > 0);
console.log('Round-trip check:', atorvastatinSmiles === atorvastatin.smiles);
console.log();

// Generate code
const code = atorvastatin.toCode();
console.log('Generated Construction Code:');
console.log('='.repeat(70));
console.log(code);
