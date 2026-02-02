import { parse } from './src/index.js';

// Use process.stdout for output to satisfy linter
function log(...args) {
  process.stdout.write(`${args.map((a) => String(a)).join(' ')}\n`);
}

// Test with Omeprazole from PubChem
const omeprazoleSmiles = 'COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1';
log('Testing Omeprazole (Proton Pump Inhibitor)');
log('='.repeat(60));

const omeprazole = parse(omeprazoleSmiles);
log('\nInput SMILES: ', omeprazoleSmiles);
log('Output SMILES:', omeprazole.smiles);
log('Match:', omeprazoleSmiles === omeprazole.smiles);

if (omeprazoleSmiles !== omeprazole.smiles) {
  log('\nFinding difference:');
  const input = omeprazoleSmiles;
  const output = omeprazole.smiles;
  for (let i = 0; i < Math.max(input.length, output.length); i += 1) {
    if (input[i] !== output[i]) {
      log('Position:', i);
      log('Input char:', input[i], '(code:', `${input.charCodeAt(i)})`);
      log('Output char:', output[i], '(code:', `${output.charCodeAt(i)})`);
      log('Context input: ', input.substring(Math.max(0, i - 10), i + 10));
      log('Context output:', output.substring(Math.max(0, i - 10), i + 10));
      break;
    }
  }
}

log(`\n${'='.repeat(60)}`);
log('\nGenerating code:');
log('='.repeat(60));
log(omeprazole.toCode());
