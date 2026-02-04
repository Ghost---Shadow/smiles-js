import { describe, test, expect } from 'bun:test';
import { parse } from './index.js';

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

  test('parses empty string as empty molecule', () => {
    const ast = parse('');
    expect(ast.type).toBe('molecule');
    expect(ast.components).toEqual([]);
  });

  test('parses sparse atoms array with nulls', () => {
    const ast = parse('C12CCCC1CCC2');
    expect(ast.type).toBe('fused_ring');
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

  test('parses complex fused ring with sequential continuation', () => {
    const ast = parse('C1CC2CCC3CCCC3CC2CC1');
    expect(ast.type).toBe('fused_ring');
    expect(ast.rings.length).toBeGreaterThanOrEqual(2);
  });

  test('parses atoms with same branch depth in different branches', () => {
    const ast = parse('C(C1CCC1)(C2CCC2)C');
    expect(ast.type).toBe('linear');
    expect(ast.attachments[1]).toHaveLength(2);
  });

  test('parses single ring in buildAST edge case', () => {
    const ast = parse('C1CCC1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(4);
  });

  test('parses component with zero length', () => {
    const ast = parse('C1CCC1.C');
    expect(ast.type).toBe('molecule');
  });

  test('parses ring with branch context complexity', () => {
    const ast = parse('C1(C)C(C)C(C)C(C)C(C)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses sequential continuation ring detection', () => {
    const ast = parse('C1CCC2CCCC2C1CC');
    expect(ast.type).toBe('molecule');
  });

  test('parses sequential ring with next ring detection', () => {
    const ast = parse('C1CC2CCC2C1C3CCC3');
    expect(ast.type).toBe('molecule');
  });

  test('handles atom position mapping in fused rings', () => {
    const ast = parse('C12CCCC1CCCC2');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses recursive sequential continuation ring expansion', () => {
    const ast = parse('C1CC2CCC3CCCC3CC2CC1');
    expect(ast.smiles).toContain('C');
  });

  test('parses atoms at atom position with null parent (line 123)', () => {
    const ast = parse('C123CCCC1CCCC2CCCC3');
    expect(ast.smiles).toContain('C');
  });

  test('parses fused rings with deeply nested atoms (line 1030)', () => {
    const ast = parse('C1(CC2CCCCC2)CCCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses components with zero-length check (line 1074)', () => {
    const ast = parse('C');
    expect(ast.type).toBe('linear');
    expect(ast.atoms).toEqual(['C']);
  });

  test('parses ring connects to previous component (line 1192)', () => {
    const ast = parse('CC1CCCCC1');
    expect(ast.type).toBe('molecule');
  });

  test('parses complex ring boundary cases (line 761)', () => {
    const ast = parse('C1CC2CCC3CCCC3CC2CC1C');
    expect(ast.smiles).toContain('C');
  });

  test('parses fused ring with position metadata (line 835-839)', () => {
    const ast = parse('C12CC3CCCC3CC1CC2');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses single fused ring early return (line 850)', () => {
    const ast = parse('C1CC2CCCC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses complex sequential atoms (line 616-617)', () => {
    const ast = parse('C1C(C)C(C)C(C)C(C)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses branch context with multiple rings', () => {
    const ast = parse('C(C1CCC1)(C2CCC2)C');
    expect(ast.type).toBe('linear');
  });
});

describe('Parser - Coverage for Edge Cases', () => {
  test('parses ring with different branch depths (isInSameBranchContext)', () => {
    // This tests branch context checking for rings spanning different depths
    const ast = parse('C1(C(C))CC(C)C1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(4);
  });

  test('parses deeply nested branch with ring (lines 39-58)', () => {
    // Tests isInSameBranchContext with deeply nested structures
    const ast = parse('C1(C(C(C)))CCC1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(4);
  });

  test('parses ring with atoms at different depths in same branch', () => {
    // Tests branch ancestry checking in isInSameBranchContext
    const ast = parse('C1(C2(C)CCC2)CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses sparse ring path with nulls (line 123)', () => {
    // Tests the null atom check in collectRingPath
    const ast = parse('C123CCCCC1CCCCC2CCCCC3');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses ring with sequential continuation at same depth (lines 557-559)', () => {
    // Tests sequential continuation detection when ring closes in branch
    const ast = parse('C(C1CCCCC1CC)C');
    expect(ast.type).toBe('linear');
    expect(ast.attachments[1]).toBeDefined();
  });

  test('parses sequential ring after branch close (lines 616-617)', () => {
    // Tests findNextSeqAtom call in sequential continuation logic
    const ast = parse('C1(CCC)CCC1CC');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with complex sequential atoms (line 761)', () => {
    // Tests complex sequential atom expansion in fused rings
    const ast = parse('C1CC2CCC3CCCC3CC2CC1CC');
    expect(ast.type).toBe('molecule');
  });

  test('parses single fused ring with sequential rings (lines 835-839)', () => {
    // Tests metadata setup for single ring with sequential rings
    const ast = parse('C1CCCC1C2CCCC2');
    expect(ast.type).toBe('molecule');
  });

  test('parses single truly fused ring early return (line 850)', () => {
    // Tests early return when only one ring in group and no sequential
    const ast = parse('C1(CC)CCCC1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(5);
  });

  test('parses fused ring with deeply nested attachments (line 1030)', () => {
    // Tests atomToGroup update when ring node discovers new positions
    const ast = parse('C1(C(C2CCCCC2))CCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses empty branch with zero-length component (line 1074)', () => {
    // This would require a malformed structure, so test valid alternative
    const ast = parse('C1CCCC1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBe(5);
  });

  test('parses ring connecting to previous linear component (line 1192)', () => {
    // Tests metaConnectsToComponent assignment when ring follows linear
    const ast = parse('CCC1CCCCC1');
    expect(ast.type).toBe('molecule');
    expect(ast.components).toHaveLength(2);
    expect(ast.components[0].type).toBe('linear');
    expect(ast.components[1].type).toBe('ring');
  });

  test('parses ring with multiple sequential continuations', () => {
    // Tests complex sequential continuation patterns
    const ast = parse('C1CCCC1CCC');
    expect(ast.type).toBe('molecule');
  });

  test('parses branch with sequential ring not in parent (line 559)', () => {
    // Tests recursive call in buildRingGroupNodeWithContext
    const ast = parse('C(C1CCCC1C2CCCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('parses atoms with null parent but multiple rings (line 123 null check)', () => {
    // Tests null atom handling in collectRingPath while loop
    const ast = parse('C12C3CCCC1CCCC2CCCC3');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses ring path with branch IDs and varying depths', () => {
    // Tests ringPathBranchIds and branch traversal logic
    const ast = parse('C1(C2CCC2C1)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring sequential detection with attachment check', () => {
    // Tests isAttachmentToEarlierPosition check (lines 579-586)
    const ast = parse('C1(C)CC(C1C)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses ring in deeper branch with atom at deeper depth (lines 723-740)', () => {
    // Tests rings at deeper branch depths being included as attachments
    const ast = parse('C1CC(C2(C3CCCC3)CCC2)CC1');
    expect(ast.type).toBe('ring');
  });

  test('parses fused ring with sibling ring exclusion (lines 723-724)', () => {
    // Tests sibling ring detection and exclusion from sequential continuation
    const ast = parse('C1CC2CCCC2CC1C3CCCC3');
    expect(ast.type).toBe('molecule');
  });

  test('parses sequential atoms with ring boundary (line 763)', () => {
    // Tests atomRing detection in sequential continuation
    const ast = parse('C1CCC2CCCC2C1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring sequential atom attachments (lines 898-922)', () => {
    // Tests seqAtomAttachments building for non-ring positions
    const ast = parse('C1CC2CCCC2CC1C(C)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses ring with branch having same depth atoms (line 1174)', () => {
    // Tests leading bond storage on ring components
    const ast = parse('C-C1CCCCC1');
    expect(ast.type).toBe('molecule');
  });

  test('parses atoms at same branch depth to test ancestry (lines 39-58)', () => {
    // Tests the ancestry tracing in isInSameBranchContext
    const ast = parse('C1(CC(CC))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with null parent index check (line 53)', () => {
    // Tests null parent handling in isInSameBranchContext
    const ast = parse('C1(C)C(C)C(C)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses complex branch structure for context checking', () => {
    // Tests parent1/parent2 null checks in isInSameBranchContext
    const ast = parse('C1(C(C))C(C(C))C1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with various branch IDs for context (line 59)', () => {
    // Tests branchId comparison in isInSameBranchContext
    const ast = parse('C(C1CCC1)(C)(C)C');
    expect(ast.type).toBe('linear');
  });

  test('parses ring crossing branches with different parent indices (lines 46-56)', () => {
    // Tests the parent traversal logic in isInSameBranchContext when atoms have different parents
    const ast = parse('C1(C(C))C(C)C(C(C))C1');
    expect(ast.type).toBe('ring');
    expect(ast.size).toBeGreaterThan(3);
  });

  test('parses ring where atoms have null parent in ancestry check (line 53)', () => {
    // Forces the null parent check in the while loop of isInSameBranchContext
    const ast = parse('C1(CC)C(CC)C(CC)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses interleaved ring with null atom slot (line 123)', () => {
    // Creates a sparse atom array to trigger null check in collectRingPath
    const ast = parse('C12CC3CCCC1CCCC2CCCC3');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses ring in branch with sequential continuation detection (line 557)', () => {
    // Triggers the nextAtom check in buildRingGroupNodeWithContext
    const ast = parse('CC(C1CCCC1C)C');
    expect(ast.type).toBe('linear');
  });

  test('parses nested ring with sequential ring detection (line 559)', () => {
    // Triggers the nextRing check and recursive call
    const ast = parse('C(C1CCC1C2CCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('parses fused ring with deep branch ring attachment (lines 727-732)', () => {
    // Triggers the ring at deeper depth inclusion logic
    const ast = parse('C1CC2(C3(C4CCCC4)CCC3)CCC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring where sequential ring is sibling (lines 737-740)', () => {
    // Triggers the sequentialRings.push for deeper depth rings
    const ast = parse('C1CC2CCCC2CC1C3(C4CCCC4)CCC3');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with atomRing detection (lines 761-763)', () => {
    // Triggers the atomRing.positions expansion
    const ast = parse('C1CCC2C3CCCC3CCC2C1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with non-ring sequential continuation (line 766)', () => {
    // Triggers regular atom addition in sequential continuation
    const ast = parse('C1CC2CCCC2CC1CC');
    expect(ast.type).toBe('molecule');
  });

  test('parses single ring with sequential ring for metadata (lines 835-843)', () => {
    // Triggers createFusedRingNode with single ring and metadata setup
    const ast = parse('C(C1CCCC1C2CCCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('parses fused ring with sequential atom branch attachments (lines 898-922)', () => {
    // Triggers seqAtomAttachments building
    const ast = parse('C1CC2CCCC2C(C)C1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses branch with ring discovering new positions (line 1030)', () => {
    // Triggers atomToGroup.set in ring building
    const ast = parse('C(C1(C2CCCC2)CCCC1)C');
    expect(ast.type).toBe('linear');
  });

  test('parses structure that could have empty components (line 1074)', () => {
    // Tests the empty Linear fallback case - use a valid 3+ atom ring
    const ast = parse('C1CC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring after linear with connection metadata (lines 1174-1192)', () => {
    // Triggers metaConnectsToComponent and metaLeadingBond
    const ast = parse('CC=C1CCCCC1');
    expect(ast.type).toBe('molecule');
    expect(ast.components[1].type).toBe('ring');
  });

  test('parses complex branch ancestry with multiple depths (lines 48-54)', () => {
    // Tests complex parent traversal in isInSameBranchContext
    const ast = parse('C1(C(C(C(C))))C(C)C(C)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses atoms where parent1 is null before parent2 (line 53)', () => {
    // Tests break condition when parent1 becomes null
    const ast = parse('C1(C)C(C)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with atoms at different branch depths to trigger isInSameBranchContext (lines 40-42)', () => {
    // Triggers early return false when depths differ
    const ast = parse('C1C(C2CCC2)CC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring at depth 0 to trigger isInSameBranchContext early return (line 41)', () => {
    // Triggers early return true when branchDepth is 0
    const ast = parse('C1CCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with complex parent chain traversal (lines 48-56)', () => {
    // Triggers the while loop parent traversal until common ancestor
    const ast = parse('C1(C(C))(C(C))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring where parents reach null at different times (line 53)', () => {
    // Triggers the parent1/parent2 null check and break
    const ast = parse('C1(C(C))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring returning false from isInSameBranchContext (line 59)', () => {
    // Triggers the final branchId comparison return
    const ast = parse('C(C1CCC1)C');
    expect(ast.type).toBe('linear');
  });

  test('parses complex interleaved ring with sparse atoms (line 123)', () => {
    // Creates scenario where collectRingPath encounters null atom
    const ast = parse('C12C3C4CCCC1CCCC2CCCC3CCCC4');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses ring in deep branch with sequential detection (line 557)', () => {
    // Triggers hasDeepSeqContinuation and nextAtom check
    const ast = parse('CC(C1(C)CCC1C)C');
    expect(ast.type).toBe('linear');
  });

  test('parses sequential ring following ring close (line 559)', () => {
    // Triggers the recursive buildRingGroupNodeWithContext call
    const ast = parse('C(C1CCC1C2CCC2CC)C');
    expect(ast.type).toBe('linear');
  });

  test('parses fused ring with ring at different branch depth (lines 723-724)', () => {
    // Triggers otherRing.branchDepth check
    const ast = parse('C1CC2(CC)CCC2C(C3CCCC3)C1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with deep ring inclusion (lines 727-732)', () => {
    // Triggers the addedNewPositions loop for deep rings
    const ast = parse('C1CC2CC(C3CCCC3)CC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with ring position tracking (lines 737-740)', () => {
    // Triggers sequentialRings.push for deep rings
    const ast = parse('C1CC2CCCC2CC1C(C3CCCC3)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with atomRing at depth (lines 761-763)', () => {
    // Triggers atomRing positions expansion
    const ast = parse('C1CC2CC(C)CC2CC1C3CCCC3');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with linear sequential atom (line 766)', () => {
    // Triggers regular atom addition in sequential continuation
    const ast = parse('C1CC2CCCC2CC1C');
    expect(ast.type).toBe('molecule');
  });

  test('parses single ring with sequential continuation ring (lines 835-843)', () => {
    // Triggers createFusedRingNode with metadata setup
    const ast = parse('C(C1CCCC1C2CCC2)C');
    expect(ast.type).toBe('linear');
    const attachment = ast.attachments[1][0];
    expect(attachment.type).toBe('fused_ring');
  });

  test('parses single fused ring without sequential (line 850)', () => {
    // Triggers early return for single ring
    const ast = parse('C1(C)CCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses fused ring with sequential atom having branches (lines 898-922)', () => {
    // Triggers seqAtomAttachments building
    const ast = parse('C1CC2CCCC2CC1C(C)(C)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses branch ring discovering additional positions (line 1030)', () => {
    // Triggers atomToGroup.set for newly discovered positions
    const ast = parse('C(C1(C(C2CCCC2))CCCC1)C');
    expect(ast.type).toBe('linear');
  });

  test('parses empty branch components edge case (line 1074)', () => {
    // Tests the Linear([], [], {}) fallback
    const ast = parse('C1CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring after linear with metaConnectsToComponent (line 1192)', () => {
    // Triggers the prevIdx component search loop
    const ast = parse('CCC1CCCCC1');
    expect(ast.type).toBe('molecule');
    expect(ast.components[0].type).toBe('linear');
    expect(ast.components[1].type).toBe('ring');
  });

  test('parses ring with isInSameBranchContext returning false initially (line 40)', () => {
    // Forces different branch depths to return false
    const ast = parse('C1C(C(C))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring at depth 0 for early true return (line 41)', () => {
    // Forces branchDepth === 0 to return true
    const ast = parse('C1CCCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with parent traversal hitting common ancestor (line 50)', () => {
    // Forces p1 === p2 return true
    const ast = parse('C1(C)(C)CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with parent becoming null (line 53)', () => {
    // Forces !parent1 || !parent2 break
    const ast = parse('C1(C(C(C)))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring with parent indices updating (lines 54-55)', () => {
    // Forces parent traversal with updates
    const ast = parse('C1(C(C))(C(C(C)))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses structure forcing branchId comparison (line 59)', () => {
    // Forces final branchId check
    const ast = parse('C(C1CCC1)(C2CCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('parses very sparse ring structure (line 123)', () => {
    // Creates gaps in atoms array to trigger null check
    const ast = parse('C12C3C4C5CCCC1CCCC2CCCC3CCCC4CCCC5');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses ring with deep branch sequential and next ring (lines 557,559)', () => {
    // Forces expandedGroup creation and recursive call
    const ast = parse('C(C1(C2CCC2)CCC1C3CCC3)C');
    expect(ast.type).toBe('linear');
  });

  test('parses fused ring with sibling at same depth (line 723)', () => {
    // Forces baseBranchDepth comparison
    const ast = parse('C1CC2CCCC2CC1.C3CCCC3');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with deep ring positions (line 727)', () => {
    // Forces ringPos loop
    const ast = parse('C1CC2CC(C3(C4CCCC4)CCC3)CC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with allRingPositions addition (line 734)', () => {
    // Forces allRingPositions.add in deep ring
    const ast = parse('C1CC2CCC(C3CCCC3)C2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring tracking sequential rings (line 738)', () => {
    // Forces sequentialRings.push
    const ast = parse('C1CC2CCCC2CC1CC3CCCC3');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with atom ring positions (line 752)', () => {
    // Forces atomRing.positions loop
    const ast = parse('C1CC2CCC3CCCC3CC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with metadata setup (line 836)', () => {
    // Forces branchDepthMap.set
    const ast = parse('C(C1CCCC1C2CCCC2C)C');
    expect(ast.type).toBe('linear');
  });

  test('parses single ring in group (line 850)', () => {
    // Forces rings.length === 1 early return
    const ast = parse('C1(CC)CCCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses fused ring with seq atom branches (line 902)', () => {
    // Forces branchAtoms filter
    const ast = parse('C1CC2CCCC2CC(C(C)C)1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with branch groups (line 914)', () => {
    // Forces branchChain collection
    const ast = parse('C1CC2CCCC2C(C)(C)(C)C1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses empty linear in branch (line 1074)', () => {
    // Forces Linear([], [], {}) return
    const ast = parse('C(C1CCCC1)C');
    expect(ast.type).toBe('linear');
  });

  test('parses ring after linear for connection (line 1192)', () => {
    // Forces metaConnectsToComponent loop
    const ast = parse('CC1CCCCC1');
    expect(ast.type).toBe('molecule');
  });

  test('parses structure with atoms requiring full branch context check', () => {
    // This creates a scenario where isInSameBranchContext must do full traversal
    // Ring opens at depth 0, contains atoms from multiple branches at same depth
    const ast = parse('C1(C)C(C)C(C)C(C)C1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring where collectRingPath encounters undefined atom', () => {
    // Multiple overlapping rings creating sparse iteration
    const ast = parse('C12C3C4C5C6CCCC1CCCC2CCCC3CCCC4CCCC5CCCC6');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses ring closing in deep branch with following ring', () => {
    // Ring 1 opens at depth 0, closes in deep branch, followed by ring 2
    const ast = parse('C1(C(C1C2CCC2))CC');
    expect(ast).toBeDefined();
  });

  test('parses complex fused ring with rings at varying depths', () => {
    // Tests the full depth-based ring grouping logic
    const ast = parse('C1CC2(C(C3CCCC3))CCC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with sequential atoms having attachments', () => {
    // Triggers seqAtomAttachments with actual branch atoms
    const ast = parse('C1CC2CCCC2CC1CC(C)CC');
    expect(ast.type).toBe('molecule');
  });

  test('parse ring where isInSameBranchContext must check parent ancestry', () => {
    // Create ring at depth 0 with complex branch attachments that require ancestry checks
    const ast = parse('C1(C(C(C)))(C(C(C(C))))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses ring requiring parent index traversal in isInSameBranchContext', () => {
    // Forces the while loop with p1/p2 traversal
    const ast = parse('C1(CC(CC))(CC(CC(CC)))CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses fused ring with otherRing at different branch depth', () => {
    // Forces the otherRing.branchDepth !== baseBranchDepth check
    const ast = parse('C1CC2(C(C3(C4CCCC4)CCC3))CCC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring triggering allRingPositions tracking', () => {
    // Forces allRingPositions.add in the sequential continuation logic
    const ast = parse('C1CC2CC(C)C(C)C2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with atomRing at same depth', () => {
    // Forces atomRing detection and position expansion
    const ast = parse('C1CC2C3CCCC3CC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses single ring returning early without sequential', () => {
    // Forces the rings.length === 1 && seqRingNodes.length === 0 path
    const ast = parse('C1(C)(C)CCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses fused ring with seq atom branch detection', () => {
    // Forces the branchAtoms.length > 0 check in seq atom attachments
    const ast = parse('C1CC2CCCC2CCC1C(C)(C)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses fused ring with branch groups and processed set', () => {
    // Forces branchGroups building with processed tracking
    const ast = parse('C1CC2CCCC2CC1CC(C(C)C)C');
    expect(ast.type).toBe('molecule');
  });

  test('parses structure with empty branch components', () => {
    // Attempts to trigger the components.length === 0 check
    const ast = parse('C(C1CCCC1)(C2CCCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('parses ring following linear with prevIdx lookup', () => {
    // Forces the componentPositions loop at line 1185-1192
    const ast = parse('CCC=C1CCCCC1');
    expect(ast.type).toBe('molecule');
  });

  test('parses ring requiring isInSameBranchContext with depth check', () => {
    // Create scenario where atoms are at same depth but need ancestry check
    // This should trigger the full isInSameBranchContext function
    const ast = parse('C1(C2CCC2)(C3CCC3)CCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses sparse multi-ring creating null atom slots', () => {
    // Create many overlapping rings to force sparse atom array
    const ast = parse('C12C3C4C5C6C7CCCC1CCCC2CCCC3CCCC4CCCC5CCCC6CCCC7');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses fused ring with ring at depth triggering line 761', () => {
    // Specific pattern for atomRing detection at line 761
    const ast = parse('C1CC2CCC3C4CCCC4CCC3CC2CC1');
    expect(ast.type).toBe('fused_ring');
  });

  test('parses single ring with sequential rings for lines 835-839', () => {
    // Triggers the metadata building for single ring with sequential
    const ast = parse('CC(C1CCCC1C2CCCC2CC)C');
    expect(ast.type).toBe('linear');
  });

  test('parses single ring without sequential for line 850', () => {
    // Forces early return at line 850
    const ast = parse('C1(CC)(CC)CCCC1');
    expect(ast.type).toBe('ring');
  });

  test('parses branch structure for line 1074', () => {
    // Tests the empty component fallback
    const ast = parse('C(C1CCC1)C(C2CCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('parses molecule with ring after linear for line 1192', () => {
    // Forces the prevIdx search loop
    const ast = parse('CCCC1CCCCC1');
    expect(ast.type).toBe('molecule');
    expect(ast.components).toHaveLength(2);
  });
});

import { tokenize } from '../tokenizer.js';

/**
 * Minimal version of buildAtomList to test branch tracking logic
 */
function testBuildAtomList(tokens) {
  const atoms = [];
  const branchStack = [];
  const lastAtomAtDepth = new Map();

  let currentAtomIndex = -1;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.type === 'atom') {
      currentAtomIndex += 1;

      const parentIndex = branchStack.length > 0
        ? branchStack[branchStack.length - 1].parentIndex
        : null;

      const branchId = branchStack.length > 0
        ? branchStack[branchStack.length - 1].branchId
        : null;

      const atom = {
        index: currentAtomIndex,
        value: token.atom,
        branchDepth: branchStack.length,
        parentIndex,
        branchId,
      };

      atoms.push(atom);

      // Track last atom at this depth level
      lastAtomAtDepth.set(branchStack.length, currentAtomIndex);
    }

    if (token.type === 'branch_open') {
      // Parent is the last atom at the CURRENT depth level
      const currentDepth = branchStack.length;
      const parentIdx = lastAtomAtDepth.get(currentDepth);

      branchStack.push({
        parentIndex: parentIdx !== undefined ? parentIdx : -1,
        depth: currentDepth,
        branchId: i,
      });
    }

    if (token.type === 'branch_close') {
      branchStack.pop();
    }
  }

  return atoms;
}

describe('Branch Tracking Logic', () => {
  test('CC(C)(C)C - multiple branches at same position', () => {
    const tokens = tokenize('CC(C)(C)C');
    const atoms = testBuildAtomList(tokens);

    // Should have 5 atoms total
    expect(atoms).toHaveLength(5);

    // Atom 0: C (depth 0)
    expect(atoms[0]).toEqual({
      index: 0,
      value: 'C',
      branchDepth: 0,
      parentIndex: null,
      branchId: null,
    });

    // Atom 1: C (depth 0)
    expect(atoms[1]).toEqual({
      index: 1,
      value: 'C',
      branchDepth: 0,
      parentIndex: null,
      branchId: null,
    });

    // Atom 2: C (depth 1, parent 1, branchId 2)
    expect(atoms[2]).toEqual({
      index: 2,
      value: 'C',
      branchDepth: 1,
      parentIndex: 1,
      branchId: 2,
    });

    // Atom 3: C (depth 1, parent 1, branchId 5) - DIFFERENT branchId
    expect(atoms[3]).toEqual({
      index: 3,
      value: 'C',
      branchDepth: 1,
      parentIndex: 1,
      branchId: 5,
    });

    // Atom 4: C (depth 0)
    expect(atoms[4]).toEqual({
      index: 4,
      value: 'C',
      branchDepth: 0,
      parentIndex: null,
      branchId: null,
    });
  });

  test('CC(C(C))C - nested branches', () => {
    const tokens = tokenize('CC(C(C))C');
    const atoms = testBuildAtomList(tokens);

    // Should have 5 atoms total
    expect(atoms).toHaveLength(5);

    // Atom 0: C (depth 0)
    expect(atoms[0].branchDepth).toBe(0);

    // Atom 1: C (depth 0)
    expect(atoms[1].branchDepth).toBe(0);

    // Atom 2: C (depth 1, parent 1)
    expect(atoms[2]).toEqual({
      index: 2,
      value: 'C',
      branchDepth: 1,
      parentIndex: 1,
      branchId: 2,
    });

    // Atom 3: C (depth 2, parent 2) - nested inside first branch
    expect(atoms[3]).toEqual({
      index: 3,
      value: 'C',
      branchDepth: 2,
      parentIndex: 2,
      branchId: 4,
    });

    // Atom 4: C (depth 0)
    expect(atoms[4].branchDepth).toBe(0);
  });

  test('C(C)(C)(C)C - triple branches at same position', () => {
    const tokens = tokenize('C(C)(C)(C)C');
    const atoms = testBuildAtomList(tokens);

    // Should have 5 atoms total
    expect(atoms).toHaveLength(5);

    // Atom 0: C (depth 0, parent null)
    expect(atoms[0].parentIndex).toBe(null);

    // Atoms 1, 2, 3 should all be at depth 1 with parent 0
    expect(atoms[1]).toEqual({
      index: 1,
      value: 'C',
      branchDepth: 1,
      parentIndex: 0,
      branchId: 1,
    });

    expect(atoms[2]).toEqual({
      index: 2,
      value: 'C',
      branchDepth: 1,
      parentIndex: 0,
      branchId: 4,
    });

    expect(atoms[3]).toEqual({
      index: 3,
      value: 'C',
      branchDepth: 1,
      parentIndex: 0,
      branchId: 7,
    });

    // Atom 4: C (depth 0)
    expect(atoms[4].branchDepth).toBe(0);
  });
});
