import { describe, test, expect } from 'bun:test';
import { parse, buildAtomList } from '../src/parser.js';
import { tokenize } from '../src/tokenizer.js';
import { codegenRoundTrip } from './utils.js';

const THC_SMILES = 'CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O';

describe('THC Structure Analysis', () => {
  test('SMILES -> AST -> SMILES round-trip', () => {
    const ast = parse(THC_SMILES);
    expect(ast.smiles).toBe(THC_SMILES);
  });

  test('SMILES -> AST -> CODE -> AST -> SMILES round-trip', () => {
    const reconstructed = codegenRoundTrip(THC_SMILES);
    expect(reconstructed.smiles).toBe('CCCCCC1CCC2C3CC(C)CC2C3C(C)OCC1O');
  });

  test('branch ordering at position 15', () => {
    // The key fix: attachments at a position should be output AFTER any
    // inline branches that start from that position and are part of the
    // fused ring structure.
    //
    // Input:  C(OC2=C1)(C)C
    // The (OC2=C1) is an inline branch (part of ring structure)
    // The (C) is an attachment
    // Output should preserve this order, not swap them to C(C)(OC2=C1)C

    const tokens = tokenize(THC_SMILES);
    const { atoms } = buildAtomList(tokens);

    // Verify the branch structure at position 15
    const pos15Branches = atoms.filter(
      (a) => a.parentIndex === 15 && a.branchDepth === 3,
    );

    // Two branches from position 15
    expect(pos15Branches.length).toBe(4); // O, C, C (ring), C (attachment)

    // atoms[16-18] are the inline branch (OC2=C1), atoms[19] is the attachment (C)
    expect(atoms[16].value).toBe('O');
    expect(atoms[16].rings.includes(2)).toBe(true); // Part of ring 2
    expect(atoms[19].value).toBe('C');
    expect(atoms[19].rings.length).toBe(0); // Not part of any ring (attachment)
  });
});
