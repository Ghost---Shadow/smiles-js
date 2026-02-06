import { describe, test, expect } from 'bun:test';
import { parse } from '../parser/index.js';
import { Ring, FusedRing } from '../constructors.js';

describe('layout atom-level maps', () => {
  test('computes metaAtomValueMap for API-created fused ring with substitution', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 3,
      substitutions: { 4: 'N' },
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaAtomValueMap).toBeInstanceOf(Map);
    // The substituted N should appear in the atom value map
    const values = [...fused.metaAtomValueMap.values()];
    expect(values).toContain('N');
  });

  test('computes metaBondMap for API-created fused ring with bonds', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 3,
      bonds: ['', '=', '', '', ''],
    });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaBondMap).toBeInstanceOf(Map);
    const values = [...fused.metaBondMap.values()];
    expect(values).toContain('=');
  });

  test('parser-produced maps are present on parsed fused rings', () => {
    // Naphthalene
    const ast = parse('c1ccc2ccccc2c1');
    expect(ast.metaAtomValueMap).toBeInstanceOf(Map);
    expect(ast.metaBondMap).toBeInstanceOf(Map);
  });

  test('API-created fused ring produces both maps', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'c', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaAtomValueMap).toBeInstanceOf(Map);
    expect(fused.metaBondMap).toBeInstanceOf(Map);
  });

  test('metaRingOrderMap is computed for API-created fused rings', () => {
    const ring1 = Ring({ atoms: 'c', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'c', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    expect(fused.metaRingOrderMap).toBeInstanceOf(Map);
  });
});
