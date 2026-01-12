import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { test } from 'node:test';
import assert from 'node:assert';

test('Playground HTML contains required structure', () => {
  const html = readFileSync('./index.html', 'utf-8');

  assert.ok(html.includes('SMILES-JS Playground'), 'Should have title');
  assert.ok(html.includes('codemirror'), 'Should load CodeMirror');
  assert.ok(html.includes('smiles-drawer'), 'Should load smiles-drawer');
  assert.ok(html.includes('cdn.jsdelivr.net/gh/Ghost---Shadow/smiles-js@main'), 'Should load smiles-js from CDN');
});

test('Playground HTML has correct DOM structure', () => {
  const html = readFileSync('./index.html', 'utf-8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  assert.ok(document.getElementById('editor'), 'Should have editor element');
  assert.ok(document.getElementById('output'), 'Should have output element');
  assert.ok(document.getElementById('runBtn'), 'Should have run button');
  assert.ok(document.getElementById('clearBtn'), 'Should have clear button');
  assert.ok(document.getElementById('exampleBtn'), 'Should have example button');
  assert.ok(document.getElementById('status'), 'Should have status element');
});

test('Playground HTML contains SVG rendering logic', () => {
  const html = readFileSync('./index.html', 'utf-8');

  assert.ok(html.includes('function drawMolecule'), 'Should have drawMolecule function');
  assert.ok(html.includes('function renderMolecule'), 'Should have renderMolecule function');
  assert.ok(html.includes('molecule-svg-'), 'Should generate SVG IDs');
  assert.ok(html.includes('SmilesDrawer'), 'Should use SmilesDrawer for rendering');
});

test('Playground HTML has molecule output structure', () => {
  const html = readFileSync('./index.html', 'utf-8');

  assert.ok(html.includes('result.smiles'), 'Should check for SMILES in results');
  assert.ok(html.includes('molecule-viewer'), 'Should have molecule viewer container');
  assert.ok(html.includes('2D STRUCTURE'), 'Should have 2D structure section');
});

test('Playground HTML intercepts console.log for molecules', () => {
  const html = readFileSync('./index.html', 'utf-8');

  assert.ok(html.includes('window.console'), 'Should override console');
  assert.ok(html.includes('moleculeResults.push'), 'Should collect molecule results');
  assert.ok(html.includes('arg.smiles'), 'Should detect molecules by smiles property');
});

test('Playground HTML renders collected molecules', () => {
  const html = readFileSync('./index.html', 'utf-8');

  assert.ok(html.includes('moleculeResults.forEach'), 'Should iterate over results');
  assert.ok(html.includes('renderMolecule(result.smiles'), 'Should render each molecule');
});
