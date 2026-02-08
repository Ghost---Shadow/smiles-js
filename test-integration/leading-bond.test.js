import { describe, test, expect } from 'bun:test';
import { parse } from '../src/parser/index.js';
import { Ring } from '../src/constructors.js';
import { codegenRoundTrip } from './utils.js';

describe('Leading Bond Tests', () => {
  test('Ring constructor preserves leadingBond', () => {
    const ring = Ring({
      atoms: 'c', size: 6, ringNumber: 2, leadingBond: '-',
    });
    expect(ring.metaLeadingBond).toBe('-');
    expect(ring.smiles).toBe('-c2ccccc2');
  });

  test('Simple ring attachment with leading bond - AST', () => {
    const smiles = 'c1c(-c2ccccc2)cccc1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('Simple ring attachment with leading bond - codegen', () => {
    const smiles = 'c1c(-c2ccccc2)cccc1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('Two ring attachments with leading bonds - AST', () => {
    const smiles = 'c1c(-c2ccccc2)c(-c2ccccc2)cc1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('Two ring attachments with leading bonds - codegen', () => {
    const smiles = 'c1c(-c2ccccc2)c(-c2ccccc2)cc1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('Atorvastatin pyrrole ring structure - AST', () => {
    const smiles = 'c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1';
    const ast = parse(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  test('Atorvastatin pyrrole ring structure - codegen', () => {
    const smiles = 'c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1';
    const reconstructed = codegenRoundTrip(smiles);
    expect(reconstructed.smiles).toBe(smiles);
  });

  test('Debug: check generated code for pyrrole structure', () => {
    const smiles = 'c1c(C(=O)Nc2ccccc2)c(-c2ccccc2)c(-c2ccc(F)cc2)n1';
    const ast = parse(smiles);
    const code = ast.toCode('v');

    // Check that both Ring creations have leadingBond
    const ringCreations = code.match(/Ring\({[^}]+leadingBond[^}]+}\)/g);
    expect(ringCreations).toBeTruthy();
    expect(ringCreations.length).toBeGreaterThanOrEqual(2);

    // Both should have leadingBond: '-'
    ringCreations.forEach((creation) => {
      expect(creation).toContain("leadingBond: '-'");
    });
  });

  test('Manual construction with two ring attachments', () => {
    const ring1 = Ring({ atoms: 'c', size: 5 });
    const ring2 = Ring({
      atoms: 'c', size: 6, ringNumber: 2, leadingBond: '-',
    });
    const ring3 = Ring({
      atoms: 'c', size: 6, ringNumber: 2, leadingBond: '-',
    });

    const withFirst = ring1.attach(3, ring2);
    const withBoth = withFirst.attach(4, ring3);

    const { smiles } = withBoth;
    expect(smiles).toContain('-c2ccccc2');

    // Count how many times the leading bond appears
    const leadingBondCount = (smiles.match(/-c2/g) || []).length;
    expect(leadingBondCount).toBe(2);
  });
});
