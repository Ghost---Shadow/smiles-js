import { describe, test, expect } from 'bun:test';
import { parse, buildAtomList } from './smiles-parser-core.js';
import { tokenize } from '../tokenizer.js';

describe('Parser Core - Edge Cases', () => {
  test('covers isInSameBranchContext with different depths (lines 39-58)', () => {
    const ast = parse('C(C)C');
    expect(ast.type).toBe('linear');
  });

  test('covers collectRingPath with null atom (line 123)', () => {
    const ast = parse('C1CCCCC1');
    expect(ast.type).toBe('ring');
  });

  test('covers empty ring closure (lines 723-724)', () => {
    expect(() => parse('C1CC')).toThrow('Unclosed rings: 1');
  });

  test('covers ring at deeper branch depth detection (lines 727-732)', () => {
    const ast = parse('C1CC(C1)C');
    expect(ast.type).toBe('molecule');
  });

  test('covers sibling ring exclusion (lines 734-740)', () => {
    const ast = parse('C1CCC1C2CCC2');
    expect(ast.type).toBe('molecule');
  });

  test('covers ring attachment at deeper depth (line 761)', () => {
    const ast = parse('C1CC(C2CCC2)CC1');
    expect(ast.type).toBe('ring');
    expect(ast.attachments[3]).toBeDefined();
  });

  test('covers sequential ring detection (lines 835-839)', () => {
    const ast = parse('C1CCC1C2CCC2');
    expect(ast.type).toBe('molecule');
  });

  test('covers single ring early return (line 850)', () => {
    const ast = parse('C1CCCCC1');
    expect(ast.type).toBe('ring');
  });

  test('covers sequential atom attachment search (lines 898-922)', () => {
    const ast = parse('C1CC(C1C2CCC2)C');
    expect(ast).toBeDefined();
  });

  test('covers empty branch result (line 1074)', () => {
    const ast = parse('C(C)C(C)C');
    expect(ast.type).toBe('linear');
  });

  test('covers ring connection metadata (line 1192)', () => {
    const ast = parse('CCC1CCCCC1');
    expect(ast.type).toBe('molecule');
  });

  test('covers deep branch ring path collection', () => {
    const ast = parse('C1CC(C1)C');
    expect(ast).toBeDefined();
  });

  test('covers ring closing in branch with sequential continuation', () => {
    const ast = parse('C(C1CCCCC1C)C');
    expect(ast.type).toBe('linear');
  });

  test('covers attachment to earlier ring position check', () => {
    const ast = parse('C1(C)CC(C1)C');
    expect(ast).toBeDefined();
  });

  test('covers branch atom collection with null checks', () => {
    const ast = parse('C(C(C(C)))C');
    expect(ast.type).toBe('linear');
  });

  test('covers ring with sequential linear atoms following closure', () => {
    const ast = parse('C1CCC1CCC');
    expect(ast.type).toBe('molecule');
  });

  test('covers fused ring sequential atom detection', () => {
    const ast = parse('C12CCC1CCC2');
    expect(ast.type).toBe('fused_ring');
  });

  test('covers branch close tracking', () => {
    const tokens = tokenize('C(C)C');
    const { atoms } = buildAtomList(tokens);
    expect(atoms.length).toBe(3);
  });

  test('covers ring opening and closing at different depths', () => {
    const ast = parse('C1CC(C1)C');
    expect(ast.type).toBe('molecule');
  });

  test('covers complex nested branches with rings', () => {
    const ast = parse('C1CC(C(C1)C)C');
    expect(ast).toBeDefined();
  });

  test('covers ring with multiple attachments at same position', () => {
    const ast = parse('C1CC(C)(N)CC1');
    expect(ast.type).toBe('ring');
    expect(ast.attachments[3].length).toBe(2);
  });

  test('covers ring closure inside deep branch', () => {
    const ast = parse('C1CC(C(C(C1)))CC');
    expect(ast).toBeDefined();
  });

  test('covers sequential rings at different branch depths', () => {
    const ast = parse('C1CCC1(C2CCC2)');
    expect(ast).toBeDefined();
  });

  test('covers branch with afterBranchClose flag', () => {
    const tokens = tokenize('C(C)CC');
    const { atoms } = buildAtomList(tokens);
    expect(atoms[2].afterBranchClose).toBe(true);
  });

  test('covers ring positions with varying branch IDs', () => {
    const ast = parse('C1CC(C)C(C1)C');
    expect(ast).toBeDefined();
  });

  test('covers ring with sequential atoms and branches', () => {
    const ast = parse('C1=CC(C)=CC=C1');
    expect(ast.type).toBe('ring');
  });

  test('covers interleaved fused rings', () => {
    const ast = parse('C12C3CC1CC2CC3');
    expect(ast.type).toBe('fused_ring');
  });

  test('covers ring traversing into branches (lines 727-740)', () => {
    const ast = parse('C1(C2CCC2)CCC1');
    expect(ast).toBeDefined();
  });

  test('covers sequential linear atom following ring', () => {
    const ast = parse('C1CCCCC1N');
    expect(ast.type).toBe('molecule');
  });

  test('covers branch atoms with prevAtomIndex null', () => {
    const tokens = tokenize('C(N)C');
    const { atoms } = buildAtomList(tokens);
    expect(atoms[1].prevAtomIndex).toBeNull();
  });

  test('covers ring with afterBranchClose sequential continuation', () => {
    const ast = parse('C(C1CCC1)CC');
    expect(ast.type).toBe('linear');
  });

  test('covers fused ring with varying branch depths', () => {
    const ast = parse('C12CCC(C1)CC2');
    expect(ast.type).toBe('fused_ring');
  });

  test('covers ring positions tracing back parent chain', () => {
    const ast = parse('C1CC(C(C1)C)C');
    expect(ast).toBeDefined();
  });

  test('covers ring with bridge rings at different depths', () => {
    const ast = parse('C12C3C1C2C3');
    expect(ast.type).toBe('fused_ring');
  });

  test('covers empty linear chain in branch context', () => {
    const ast = parse('C()C');
    expect(ast.type).toBe('linear');
  });

  test('covers null atom check in ring path collection (line 123)', () => {
    const tokens = tokenize('C1CCCCC1');
    const { atoms, ringBoundaries } = buildAtomList(tokens);
    expect(ringBoundaries.length).toBe(1);
  });

  test('covers isInSameBranchContext with shared ancestry (lines 39-58)', () => {
    const ast = parse('C(C(C)C)C');
    expect(ast.type).toBe('linear');
  });

  test('covers ring at original branch depth check (line 132)', () => {
    const ast = parse('C1CC(C)CC1');
    expect(ast.type).toBe('ring');
  });

  test('covers ring with attachment to earlier position (lines 578-587)', () => {
    const ast = parse('C1(C)CCC(C1)C');
    expect(ast).toBeDefined();
  });

  test('covers sequential ring in deeper branch (lines 540-562)', () => {
    const ast = parse('C(C1CCC1C2CCC2)C');
    expect(ast.type).toBe('linear');
  });

  test('covers molecule with sequential atoms following ring (lines 612-630)', () => {
    const ast = parse('C1CCC1CCC');
    expect(ast.type).toBe('molecule');
    expect(ast.components.length).toBe(2);
  });

  test('covers ring shares atoms with base ring (lines 651-658)', () => {
    const ast = parse('C12CCC1CCC2');
    expect(ast.type).toBe('fused_ring');
  });

  test('covers sequential ring does not share atoms (lines 651-658)', () => {
    const ast = parse('C1CCC1C2CCC2');
    expect(ast.type).toBe('molecule');
  });

  test('covers other ring at same branch depth exclusion (lines 723-724)', () => {
    const ast = parse('C1CCC1C2CCC2C');
    expect(ast.type).toBe('molecule');
  });

  test('covers sibling ring at deeper depth inclusion (lines 727-732)', () => {
    const ast = parse('C1CC(C2CCC2)CC1');
    expect(ast.type).toBe('ring');
  });

  test('covers ring at base branch depth check (lines 734-735)', () => {
    const ast = parse('C1CCC1');
    expect(ast.type).toBe('ring');
  });

  test('covers sequential ring tracking (lines 737-740)', () => {
    const ast = parse('C1CCCCC1C2CCCCC2');
    expect(ast.type).toBe('molecule');
  });

  test('covers fused ring with seq linear atoms but no seq rings (line 761)', () => {
    const ast = parse('C12CCCCC1CCC2C');
    expect(ast.type).toBe('molecule');
  });

  test('covers ring single return (line 850)', () => {
    const ast = parse('C1CCCC1');
    expect(ast.type).toBe('ring');
  });

  test('covers sequential atom attachments in fused ring (lines 894-924)', () => {
    const ast = parse('C12CCC1CCC2(C)');
    expect(ast).toBeDefined();
  });

  test('covers empty branch result (line 1074)', () => {
    const ast = parse('C1CC()CC1');
    expect(ast.type).toBe('ring');
  });

  test('covers ring connection to previous component (lines 1182-1194)', () => {
    const ast = parse('CCCC1CCCCC1');
    expect(ast.type).toBe('molecule');
  });

  test('covers main chain with no linear atoms (line 1220)', () => {
    const ast = parse('C1CCCCC1');
    expect(ast.type).toBe('ring');
  });

  test('covers branch with ring closure at start (lines 898-922)', () => {
    const ast = parse('C1(C2CCC2)CCC1');
    expect(ast.type).toBe('ring');
  });

  test('covers sequential ring with different starting positions', () => {
    const ast = parse('CC1CCC1C2CCC2');
    expect(ast.type).toBe('molecule');
  });

  test('covers ring with attachment followed by sequential linear (line 761)', () => {
    const ast = parse('C1CC(N)CC1C');
    expect(ast.type).toBe('molecule');
  });

  test('covers isInSameBranchContext with null parent check (lines 53-54)', () => {
    const ast = parse('C(C)(C)C');
    expect(ast.type).toBe('linear');
  });
});
