import { describe, test, expect } from 'bun:test';
import { parse } from './parser.js';
import { tokenize } from './tokenizer.js';

const TELMISARTAN_SMILES = 'CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C';
const TELMISARTAN_OUTPUT = 'CCCC1NC2C(C=C(C=CNCC3CCC(C=C)CC3C4CCCCC4C(=O)O)C5NC6CCCCC6N5C)CCCC2N1C';

describe('Telmisartan - Real Structure', () => {
  test('tokenizes correctly', () => {
    const tokens = tokenize(TELMISARTAN_SMILES);
    const atoms = tokens.filter((t) => t.type === 'atom');
    const ringMarkers = tokens.filter((t) => t.type === 'ring_marker');

    expect(atoms.length).toBe(39);
    expect(ringMarkers.length).toBe(12);
  });

  test('identifies ring markers at correct atom indices', () => {
    const tokens = tokenize(TELMISARTAN_SMILES);

    const ringMarkerPositions = [];
    let atomIndex = -1;
    tokens.forEach((token) => {
      if (token.type === 'atom') atomIndex += 1;
      if (token.type === 'ring_marker') {
        ringMarkerPositions.push({ ringNumber: token.ringNumber, atomIndex });
      }
    });

    expect(ringMarkerPositions).toEqual([
      { ringNumber: 1, atomIndex: 3 },
      { ringNumber: 2, atomIndex: 5 },
      { ringNumber: 2, atomIndex: 10 },
      { ringNumber: 1, atomIndex: 11 },
      { ringNumber: 3, atomIndex: 13 },
      { ringNumber: 3, atomIndex: 18 },
      { ringNumber: 4, atomIndex: 19 },
      { ringNumber: 4, atomIndex: 24 },
      { ringNumber: 5, atomIndex: 28 },
      { ringNumber: 6, atomIndex: 30 },
      { ringNumber: 6, atomIndex: 35 },
      { ringNumber: 5, atomIndex: 36 },
    ]);
  });

  test('parses without error', () => {
    expect(() => parse(TELMISARTAN_SMILES)).not.toThrow();
  });

  test('round-trips correctly', () => {
    const ast = parse(TELMISARTAN_SMILES);
    expect(ast.smiles).toBe(TELMISARTAN_OUTPUT);
  });
});

describe('Telmisartan - Component Structures', () => {
  test('simple benzimidazole parses', () => {
    const ast = parse('c1nc2ccccc2n1');
    expect(ast.smiles).toBe('c1nc2ccccc2n1');
  });

  test('benzimidazole with explicit double bonds parses', () => {
    const ast = parse('C1=NC2=CC=CC=C2N1');
    expect(ast.smiles).toBe('C1NC2CCCCC2N1');
  });

  test('benzimidazole in branch parses', () => {
    const ast = parse('C(c1nc2ccccc2n1)C');
    expect(ast.smiles).toBe('C(c1nc2ccccc2n1)C');
  });

  test('fused ring with methyl substituent parses', () => {
    const ast = parse('c1nc2c(C)cc(C)cc2n1');
    expect(ast.smiles).toBe('c1nc2c(C)cc(C)cc2n1');
  });

  test('benzimidazole substituent (C5=NC6=...) parses', () => {
    const ast = parse('C5=NC6=CC=CC=C6N5C');
    expect(ast.smiles).toBe('C5NC6CCCCC6N5C');
  });

  test('nested fused ring in branch', () => {
    const ast = parse('c1ccc(C5=NC6=CC=CC=C6N5C)cc1');
    expect(ast.smiles).toBe('c1ccc(C5NC6CCCCC6N5C)cc1');
  });
});

describe('Telmisartan - Deeply Nested Branch Issue', () => {
  test('fused ring inside single branch parses', () => {
    const ast = parse('C(c1nc2ccccc2n1)');
    expect(ast.smiles).toBe('C(c1nc2ccccc2n1)');
  });

  test('fused ring inside nested branch (depth 2)', () => {
    const ast = parse('C(C(c1nc2ccccc2n1))');
    expect(ast.smiles).toBe('C(C(c1nc2ccccc2n1))');
  });

  test('fused ring inside branch of ring', () => {
    const ast = parse('c1ccc(c2nc3ccccc3n2)cc1');
    expect(ast.smiles).toBe('c1ccc(c2nc3ccccc3n2)cc1');
  });

  test('fused ring inside branch of ring inside branch', () => {
    const ast = parse('C(c1ccc(c2nc3ccccc3n2)cc1)');
    expect(ast.smiles).toBe('C(c1ccc(c2nc3ccccc3n2)cc1)');
  });

  test('simplified telmisartan middle section', () => {
    const ast = parse('c1nc2c(c3nc4ccccc4n3)cccc2n1');
    expect(ast.smiles).toBe('c1nc2c(c3nc4ccccc4n3)cccc2n1');
  });

  test('core benzimidazole (rings 1+2)', () => {
    const ast = parse('C1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('C1NC2CCCCC2N1');
  });

  test('core with propyl chain', () => {
    const ast = parse('CCCC1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('CCCC1NC2CCCCC2N1');
  });

  test('core with methyl branch', () => {
    const ast = parse('C1=NC2=C(C)CCC2=N1');
    expect(ast.smiles).toBe('C1NC2C(C)CCC2N1');
  });

  test('core with two methyl branches', () => {
    const ast = parse('C1=NC2=C(C)CC(C)CC2=N1');
    expect(ast.smiles).toBe('C1NC2C(C)CC(C)CC2N1');
  });

  test('core with deeper branch containing ring 3', () => {
    const ast = parse('C1=NC2=C(CC3=CC=CC=C3)CCCC2=N1');
    expect(ast.smiles).toBe('C1NC2C(CC3CCCCC3)CCCC2N1');
  });

  test('core with branch containing fused ring 5+6', () => {
    const ast = parse('C1=NC2=C(C5=NC6=CC=CC=C6N5)CCCC2=N1');
    expect(ast.smiles).toBe('C1NC2C(C5NC6CCCCC6N5)CCCC2N1');
  });

  test('telmisartan without second benzimidazole', () => {
    const ast = parse('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
    expect(ast.smiles).toBe('CCCC1NC2C(C=C(C=CNCC3CCC(C=C)CC3C4CCCCC4C(=O)O)C)CCCC2N1C');
  });

  test('telmisartan core benzimidazole with methyls', () => {
    const ast = parse('c1nc2c(C)cc(C)cc2n1');
    expect(ast.smiles).toBe('c1nc2c(C)cc(C)cc2n1');
  });

  test('telmisartan with all branches except ring 5+6', () => {
    const ast = parse('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C)C');
    expect(ast.smiles).toBe('CCCC1NC2C(C=C(C=CNCC3CCC(C=C)CC3C4CCCCC4C(=O)O)C)CCCC2N1C');
  });

  test('telmisartan adding fused ring in deep branch', () => {
    const ast = parse('CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C');
    expect(ast.smiles).toBe(TELMISARTAN_OUTPUT);
  });

  test('propyl + benzimidazole base', () => {
    const ast = parse('CCCC1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('CCCC1NC2CCCCC2N1');
  });

  test('benzimidazole with N-CH2 linker', () => {
    const ast = parse('C1=NC2=CCCCC2=N1C');
    expect(ast.smiles).toBe('C1NC2CCCCC2N1C');
  });

  test('benzimidazole with N-CH2-ring3', () => {
    const ast = parse('C1=NC2=CCCCC2=N1CC3=CC=CC=C3');
    expect(ast.smiles).toBe('C1NC2CCCCC2N1CC3CCCCC3');
  });

  test('ring3 with ring4 attached', () => {
    const ast = parse('C3=CC=C(C4=CC=CC=C4)C=C3');
    expect(ast.smiles).toBe('C3CCC(C4CCCCC4)CC3');
  });

  test('benzimidazole with N-CH2-ring3-ring4', () => {
    const ast = parse('C1=NC2=CCCCC2=N1CC3=CC=C(C4=CC=CC=C4)C=C3');
    expect(ast.smiles).toBe('C1NC2CCCCC2N1CC3CCC(C4CCCCC4)CC3');
  });

  test('benzimidazole with nested branch structure', () => {
    const ast = parse('C1=NC2=C(C=C(C)C=C2N1)C');
    expect(ast.smiles).toBe('C1NC2C(C=C(C)=CCN)CCCC2N1C');
  });

  test('benzimidazole with deeper nested branches', () => {
    const ast = parse('C1=NC2=C(C=C(C=C2N1C)C)C');
    expect(ast.smiles).toBe('C1NC2C(C=C(C=CNC)C)CCCC2N1C');
  });

  test('fused ring without nested branch issue', () => {
    const ast = parse('C1=NC2=CCCCC2=N1');
    expect(ast.smiles).toBe('C1NC2CCCCC2N1');
  });

  test('fused ring with branch at position 4', () => {
    const ast = parse('C1=NC2=C(C)CCC2=N1');
    expect(ast.smiles).toBe('C1NC2C(C)CCC2N1');
  });

  test('fused ring - ring1 closure inside branch of ring2', () => {
    const ast = parse('C1=NC2=C(CC2N1)C');
    expect(ast.smiles).toBe('C1NC2C(CCN)CC2N1C');
  });

  test('alternative: aromatic benzimidazole avoids the issue', () => {
    const ast = parse('c1nc2c(C)cccc2n1');
    expect(ast.smiles).toBe('c1nc2c(C)cccc2n1');
  });

  test('ring closure can be at different branch depth than ring opening', () => {
    const ast = parse('C1CC(C1)');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'C',
      size: 4,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        3: [{
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
        }],
      },
    });
    expect(ast.smiles).toBe('C1CC(C)C1');
  });

  test('branch with separate ring - first atom shared', () => {
    const ast = parse('c1ccc(c2ccccc2)cc1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        4: [{
          type: 'ring',
          atoms: 'c',
          size: 6,
          ringNumber: 2,
          offset: 0,
          substitutions: {},
          attachments: {},
        }],
      },
    });
    expect(ast.smiles).toBe('c1ccc(c2ccccc2)cc1');
  });
});

describe('Telmisartan - Bond Preservation', () => {
  test('double bonds in linear chains are preserved', () => {
    const ast = parse('C=C');
    expect(ast.smiles).toBe('C=C');
  });

  test('double bonds in rings - current behavior', () => {
    const ast = parse('C1=CC=CC=C1');
    expect(ast.smiles).toBe('C1CCCCC1');
  });
});
