import { spawnSync } from 'child_process';
const result = spawnSync('bun', ['test', '--coverage'], { encoding: 'utf-8' });
const output = (result.stdout || '') + (result.stderr || '');
const line = output.split('\n').find(l => l.includes('All files'));
if (line) {
  const pct = line.split('|')[2].trim();
  console.log(`${pct}%`);
}
