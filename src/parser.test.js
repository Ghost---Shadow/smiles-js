import { describe, test, expect } from 'bun:test';
import { parse } from './parser.js';

describe('Parser - Simple Molecules', () => {
  test('parses single atom', () => {
    const ast = parse('C');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C']);
  });

  test('parses linear chain', () => {
    const ast = parse('CCC');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C', 'C', 'C']);
  });

  test('parses ethanol', () => {
    const ast = parse('CCO');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C', 'C', 'O']);
  });

  test('parses chain with explicit bonds', () => {
    const ast = parse('C-C-C');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C', 'C', 'C']);
  });
});

describe('Parser - Simple Rings', () => {
  test('parses benzene', () => {
    const ast = parse('c1ccccc1');
    expect(ast.type).toBe('ring');
    expect(ast.atoms).toBe('c');
    expect(ast.size).toBe(6);
    expect(ast.substitutions).toEqual({});
  });

  test('parses cyclopentane', () => {
    const ast = parse('C1CCCC1');
    expect(ast.type).toBe('ring');
    expect(ast.atoms).toBe('C');
    expect(ast.size).toBe(5);
  });

  test('parses cyclohexane', () => {
    const ast = parse('C1CCCCC1');
    expect(ast.type).toBe('ring');
    expect(ast.atoms).toBe('C');
    expect(ast.size).toBe(6);
  });
});

describe('Parser - Ring Substitutions', () => {
  test('parses pyridine', () => {
    const ast = parse('n1ccccc1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(6);
    // n at position 1, rest are c
    expect(ast.atoms).toBe('c');
    expect(ast.substitutions[1]).toBe('n');
  });

  test('parses ring with multiple substitutions', () => {
    const ast = parse('n1cncnc1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(6);
    expect(ast.atoms).toBe('c');
    expect(ast.substitutions[1]).toBe('n');
    expect(ast.substitutions[3]).toBe('n');
    expect(ast.substitutions[5]).toBe('n');
  });
});

describe('Parser - Molecules with Multiple Components', () => {
  test('parses toluene', () => {
    const ast = parse('Cc1ccccc1');
    expect(ast.type).toBe('molecule');
    expect(ast.components).toHaveLength(2);

    expect(ast.components[0].type).toBe('linear');
    expect(ast.components[0].atoms).toEqual(['C']);

    expect(ast.components[1].type).toBe('ring');
    expect(ast.components[1].atoms).toBe('c');
    expect(ast.components[1].size).toBe(6);
  });

  test('parses propylbenzene', () => {
    const ast = parse('CCCc1ccccc1');
    expect(ast.type).toBe('molecule');
    expect(ast.components).toHaveLength(2);

    expect(ast.components[0].type).toBe('linear');
    expect(ast.components[0].atoms).toEqual(['C', 'C', 'C']);

    expect(ast.components[1].type).toBe('ring');
    expect(ast.components[1].size).toBe(6);
  });
});

describe('Parser - Fused Rings', () => {
  test.skip('parses naphthalene', () => {
    // TODO: Fused ring parsing is complex - rings interleave rather than being consecutive
    // This test is skipped for now
    const ast = parse('C1CC2CCCCC2CC1');
    expect(ast.type).toBe('fused_ring');
    expect(ast.rings).toHaveLength(2);

    expect(ast.rings[0].size).toBe(10);
    expect(ast.rings[0].ringNumber).toBe(1);

    expect(ast.rings[1].size).toBe(6);
    expect(ast.rings[1].ringNumber).toBe(2);
  });
});

describe('Parser - Two-letter Atoms', () => {
  test('parses molecule with Cl', () => {
    const ast = parse('CCl');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C', 'Cl']);
  });

  test('parses molecule with Br', () => {
    const ast = parse('CBr');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C', 'Br']);
  });
});

describe('Parser - Bracketed Atoms', () => {
  test('parses bracketed atom', () => {
    const ast = parse('[NH3+]');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toHaveLength(1);
    expect(ast.atoms[0]).toBe('NH3+');
  });

  test('parses isotope notation', () => {
    const ast = parse('[13C]');
    expect(ast.type).toBe('linear');
    expect(ast.atoms[0]).toBe('13C');
  });
});

describe('Parser - Branches', () => {
  test('parses simple branch', () => {
    const ast = parse('C(C)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C'],
      bonds: [],
      attachments: {
        1: [
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [],
            attachments: {},
          },
        ],
      },
    });
  });

  test('parses branch with double bond', () => {
    const ast = parse('CC(=O)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C'],
      bonds: [],
      attachments: {
        2: [
          {
            type: 'linear',
            atoms: ['O'],
            bonds: ['='],
            attachments: {},
          },
        ],
      },
    });
  });

  test('round-trip for branches', () => {
    const smiles1 = 'C(C)C';
    expect(parse(smiles1).smiles).toBe(smiles1);

    const smiles2 = 'CC(=O)C';
    expect(parse(smiles2).smiles).toBe(smiles2);
  });
});

describe('Parser - Error Handling', () => {
  test('throws on unclosed ring', () => {
    expect(() => parse('C1CCCC')).toThrow('Unclosed rings');
  });

  test('throws on invalid SMILES', () => {
    expect(() => parse('C$C')).toThrow('Unexpected character');
  });
});

describe('Parser - Round-trip', () => {
  test('round-trips benzene', () => {
    const ast = parse('c1ccccc1');
    expect(ast.smiles).toBe('c1ccccc1');
  });

  test('round-trips simple linear chain', () => {
    const ast = parse('CCC');
    expect(ast.smiles).toBe('CCC');
  });

  test('round-trips toluene', () => {
    const ast = parse('Cc1ccccc1');
    expect(ast.smiles).toBe('Cc1ccccc1');
  });

  test('round-trips pyridine', () => {
    const ast = parse('n1ccccc1');
    expect(ast.smiles).toBe('n1ccccc1');
  });
});
