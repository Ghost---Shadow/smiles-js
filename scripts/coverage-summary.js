import { spawnSync } from 'child_process';
const result = spawnSync('bun', ['test', '--coverage'], { encoding: 'utf-8' });
const output = (result.stdout || '') + (result.stderr || '');
const lines = output.split('\n');

const covLine = lines.find((l) => l.includes('All files'));
const passLine = lines.find((l) => /\d+ pass/.test(l));

const coverage = covLine ? covLine.split('|')[2].trim() : 'unknown';
const passing = passLine ? passLine.match(/(\d+) pass/)[1] : '0';

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ passing, coverage }));
} else {
  console.log(`${passing} passing, ${coverage}% coverage`);
}
