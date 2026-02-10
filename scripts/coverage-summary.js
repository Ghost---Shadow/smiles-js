import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the project root (parent of scripts directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const result = spawnSync('bun', ['test', '--coverage'], {
  encoding: 'utf-8',
  cwd: projectRoot
});

const output = (result.stdout || '') + (result.stderr || '');
const lines = output.split('\n');

// Find the "All files" line and extract coverage percentage
const covLine = lines.find((l) => l.includes('All files'));
let coverage = 'unknown';
if (covLine) {
  // Extract percentage from format like: "All files | 97.17 | 97.37 |"
  // We want the first percentage (statement coverage)
  const match = covLine.match(/\|\s*(\d+\.\d+)\s*\|/);
  if (match) {
    coverage = match[1];
  }
}

// Find the passing tests line
const passLine = lines.find((l) => /\d+ pass/.test(l));
const passing = passLine ? passLine.match(/(\d+) pass/)[1] : '0';

// Output results
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ passing, coverage }));
} else {
  console.log(`${passing} passing, ${coverage}% coverage`);
}

// Exit with error if tests failed
if (result.status !== 0) {
  process.exit(1);
}
