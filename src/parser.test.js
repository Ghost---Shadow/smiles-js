import { describe, test, expect } from 'bun:test';
import { parse } from './parser/index.js';

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

describe('Parser - Ring Attachments', () => {
  test('parses ring with single attachment', () => {
    const ast = parse('C1CCC(C)CC1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'C',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        4: [
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null], // Bonds array preserves positional info
            attachments: {},
          },
        ],
      },
      bonds: [null, null, null, null, null, null],
    });
  });

  test('round-trip for ring with attachment', () => {
    const smiles = 'C1CCC(C)CC1';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses ring with multiple attachments', () => {
    const ast = parse('C1(C)CC(C)CC1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'C',
      size: 5,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        1: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
        3: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
      },
      bonds: [null, null, null, null, null],
    });
  });

  test('round-trip for ring with multiple attachments', () => {
    const smiles = 'C1(C)CC(C)CC1';
    expect(parse(smiles).smiles).toBe(smiles);
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
  test('parses naphthalene-like interleaved fused rings', () => {
    const ast = parse('C1CC2CCCCC2CC1');
    expect(ast.type).toBe('fused_ring');
    expect(ast.rings).toHaveLength(2);

    // Both rings are 6-membered (they share 2 atoms at the fusion point)
    const ring1 = ast.rings.find((r) => r.ringNumber === 1);
    expect(ring1.size).toBe(6);

    const ring2 = ast.rings.find((r) => r.ringNumber === 2);
    expect(ring2.size).toBe(6);

    // Check round-trip
    expect(ast.smiles).toBe('C1CC2CCCCC2CC1');
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
    expect(ast.atoms).toEqual(['[NH3+]']);
  });

  test('parses isotope notation', () => {
    const ast = parse('[13C]');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['[13C]']);
  });
});

describe('Parser - Branches', () => {
  test('parses simple branch', () => {
    const ast = parse('C(C)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C'],
      bonds: [null], // Bonds array preserves positional info
      attachments: {
        1: [
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
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
      bonds: [null, null], // Bonds array preserves positional info
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

  test('parses multiple branches at same position', () => {
    const ast = parse('CC(C)(C)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C'],
      bonds: [null, null], // Bonds array preserves positional info
      attachments: {
        2: [
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
            attachments: {},
          },
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
            attachments: {},
          },
        ],
      },
    });
  });

  test('round-trip for multiple branches', () => {
    const smiles = 'CC(C)(C)C';
    expect(parse(smiles).smiles).toBe(smiles);
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

describe('Parser - Complex Molecules', () => {
  test('parses aromatic ring with attachment', () => {
    const ast = parse('c1ccc(C)cc1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        4: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
      },
      bonds: [null, null, null, null, null, null],
    });
  });

  test('round-trips aromatic ring with attachment', () => {
    const smiles = 'c1ccc(C)cc1';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses ring followed by linear chain', () => {
    const ast = parse('c1ccccc1C');
    expect(ast.type).toBe('molecule');
    expect(ast.components).toHaveLength(2);
    expect(ast.components[0].type).toBe('ring');
    expect(ast.components[1].type).toBe('linear');
  });

  test('round-trips ring followed by linear', () => {
    const smiles = 'c1ccccc1C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses multiple attachments on ring', () => {
    const ast = parse('c1c(C)c(C)c(C)cc1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: {},
      attachments: {
        2: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
        3: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
        4: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
      },
      bonds: [null, null, null, null, null, null],
    });
  });

  test('round-trips multiple attachments on ring', () => {
    const smiles = 'c1c(C)c(C)c(C)cc1';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses nested branches', () => {
    const ast = parse('CC(C(C))C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C'],
      bonds: [null, null],
      attachments: {
        2: [{
          type: 'linear',
          atoms: ['C'],
          bonds: [null],
          attachments: {
            1: [{
              type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
            }],
          },
        }],
      },
    });
  });

  test('round-trips nested branches', () => {
    const smiles = 'CC(C(C))C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses triple branches at same position', () => {
    const ast = parse('C(C)(C)(C)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C'],
      bonds: [null], // Bonds array preserves positional info
      attachments: {
        1: [
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
            attachments: {},
          },
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
            attachments: {},
          },
          {
            type: 'linear',
            atoms: ['C'],
            bonds: [null],
            attachments: {},
          },
        ],
      },
    });
  });

  test('round-trips triple branches', () => {
    const smiles = 'C(C)(C)(C)C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses ring with substitution and attachment', () => {
    const ast = parse('n1ccc(C)cc1');
    expect(ast.toObject()).toEqual({
      type: 'ring',
      atoms: 'c',
      size: 6,
      ringNumber: 1,
      offset: 0,
      substitutions: { 1: 'n' },
      attachments: {
        4: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
      },
      bonds: [null, null, null, null, null, null],
    });
  });

  test('round-trips ring with substitution and attachment', () => {
    const smiles = 'n1ccc(C)cc1';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses branches with double bonds', () => {
    const ast = parse('CC(=O)CC(=O)C');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C', 'C', 'C', 'C', 'C']);
    expect(ast.attachments[2][0].bonds).toEqual(['=']);
    expect(ast.attachments[4][0].bonds).toEqual(['=']);
  });

  test('round-trips branches with double bonds', () => {
    const smiles = 'CC(=O)CC(=O)C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses linear with branches at multiple positions', () => {
    const ast = parse('CC(C)CC(C)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C', 'C'],
      bonds: [null, null, null, null],
      attachments: {
        2: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
        4: [{
          type: 'linear', atoms: ['C'], bonds: [null], attachments: {},
        }],
      },
    });
  });

  test('round-trips linear with multiple branches', () => {
    const smiles = 'CC(C)CC(C)C';
    expect(parse(smiles).smiles).toBe(smiles);
  });
});

describe('Parser - Rings Inside Branches', () => {
  test('parses ring inside branch', () => {
    const ast = parse('C(c1ccccc1)C');
    expect(ast.toObject()).toEqual({
      type: 'linear',
      atoms: ['C', 'C'],
      bonds: [null], // Bonds array preserves positional info
      attachments: {
        1: [
          {
            type: 'ring',
            atoms: 'c',
            size: 6,
            ringNumber: 1,
            offset: 0,
            substitutions: {},
            attachments: {},
            bonds: [null, null, null, null, null, null],
          },
        ],
      },
    });
  });

  test('round-trips ring inside branch', () => {
    const smiles = 'C(c1ccccc1)C';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses biphenyl in branch', () => {
    const ast = parse('Cc1ccc(c2ccccc2)cc1');
    expect(ast.toObject()).toEqual({
      type: 'molecule',
      components: [
        {
          type: 'linear', atoms: ['C'], bonds: [], attachments: {},
        },
        {
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
              bonds: [null, null, null, null, null, null],
            }],
          },
          bonds: [null, null, null, null, null, null],
        },
      ],
    });
  });

  test('round-trips biphenyl in branch', () => {
    const smiles = 'Cc1ccc(c2ccccc2)cc1';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses ring with ring attachment having substitution', () => {
    const ast = parse('c1ccc(n2ccccc2)cc1');
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
          substitutions: { 1: 'n' },
          attachments: {},
          bonds: [null, null, null, null, null, null],
        }],
      },
      bonds: [null, null, null, null, null, null],
    });
  });

  test('round-trips ring with ring attachment having substitution', () => {
    const smiles = 'c1ccc(n2ccccc2)cc1';
    expect(parse(smiles).smiles).toBe(smiles);
  });

  test('parses nested ring attachments', () => {
    const ast = parse('c1ccc(c2ccc(c3ccccc3)cc2)cc1');
    expect(ast.type).toBe('ring');
    expect(ast.attachments[4][0].type).toBe('ring');
    expect(ast.attachments[4][0].attachments[4][0].type).toBe('ring');
  });

  test('round-trips nested ring attachments', () => {
    const smiles = 'c1ccc(c2ccc(c3ccccc3)cc2)cc1';
    expect(parse(smiles).smiles).toBe(smiles);
  });
});

describe('Parser - Interleaved Fused Rings', () => {
  test('parses interleaved fused rings (naphthalene-like)', () => {
    const ast = parse('C1CC2CCCCC2CC1');
    expect(ast.type).toBe('fused_ring');
    expect(ast.rings).toHaveLength(2);

    // Ring 2 closes first, should be 6-membered
    const ring2 = ast.rings.find((r) => r.ringNumber === 2);
    expect(ring2.size).toBe(6);

    // Ring 1 closes second, should also be 6-membered (uses shortcut through ring 2)
    const ring1 = ast.rings.find((r) => r.ringNumber === 1);
    expect(ring1.size).toBe(6);
  });

  test('ring 2 has correct offset in interleaved fused rings', () => {
    const ast = parse('C1CC2CCCCC2CC1');
    const ring1 = ast.rings.find((r) => r.ringNumber === 1);
    const ring2 = ast.rings.find((r) => r.ringNumber === 2);

    // Ring 1 is the base ring (offset 0)
    // Ring 2 starts at position 2 of ring 1's path
    expect(ring1.offset).toBe(0);
    expect(ring2.offset).toBe(2);
  });

  test('round-trips interleaved fused rings', () => {
    const smiles = 'C1CC2CCCCC2CC1';
    expect(parse(smiles).smiles).toBe(smiles);
  });
});
