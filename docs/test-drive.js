import { parse } from './src/index.js';

// Test with Omeprazole from PubChem
const omeprazoleSmiles = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
console.log('Testing Omeprazole (Proton Pump Inhibitor)');
console.log('='.repeat(60));

const omeprazole = parse(omeprazoleSmiles);
console.log('\nInput SMILES: ', omeprazoleSmiles);
console.log('Output SMILES:', omeprazole.smiles);
console.log('Match:', omeprazoleSmiles === omeprazole.smiles);

if (omeprazoleSmiles !== omeprazole.smiles) {
  console.log('\nFinding difference:');
  const input = omeprazoleSmiles;
  const output = omeprazole.smiles;
  for (let i = 0; i < Math.max(input.length, output.length); i += 1) {
    if (input[i] !== output[i]) {
      console.log('Position:', i);
      console.log('Input char:', input[i], '(code:', `${input.charCodeAt(i)})`);
      console.log('Output char:', output[i], '(code:', `${output.charCodeAt(i)})`);
      console.log('Context input: ', input.substring(Math.max(0, i - 10), i + 10));
      console.log('Context output:', output.substring(Math.max(0, i - 10), i + 10));
      break;
    }
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log('\nGenerating code:');
console.log('='.repeat(60));
console.log(omeprazole.toCode());
