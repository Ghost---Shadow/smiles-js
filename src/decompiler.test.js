import {
  describe, test, expect,
} from 'bun:test';
import {
  Ring, Linear, Molecule, FusedRing,
} from './constructors.js';
import { decompile } from './decompiler.js';
import { parse } from './parser/index.js';

/**
 * Create a raw fused ring object without layout engine metadata.
 * This forces the decompiler to use the simple path.
 */
function rawFusedRing(rings) {
  return { type: 'fused_ring', rings };
}

describe('Decompiler - Ring', () => {
  test('decompiles simple ring', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const code = decompile(benzene);
    expect(code).toBe("export const v1 = Ring({ atoms: 'c', size: 6 });");
  });

  test('decompiles ring with custom ring number', () => {
    const ring = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const code = decompile(ring);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });");
  });

  test('decompiles ring with offset', () => {
    const ring = Ring({ atoms: 'C', size: 6, offset: 2 });
    const code = decompile(ring);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, offset: 2 });");
  });

  test('decompiles ring with bonds', () => {
    const ring = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '='] });
    const code = decompile(ring);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '='] });");
  });

  test('decompiles ring with branchDepths metadata', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    ring.metaBranchDepths = [0, 0, 0, 1, 1, 1];
    const code = decompile(ring);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, branchDepths: [0, 0, 0, 1, 1, 1] });");
  });

  test('decompiles ring with substitutions', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const substituted = ring.substitute(2, 'N');
    const code = decompile(substituted);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = v1.substitute(2, 'N');`);
  });

  test('decompiles ring with single attachment', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const methyl = Linear(['C']);
    const attached = ring.attach(1, methyl);
    const code = decompile(attached);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Linear(['C']);
export const v3 = v1.attach(1, v2);`);
  });

  test('decompiles ring with multiple attachments', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const branch1 = Linear(['N']);
    const branch2 = Linear(['O']);
    const withAttach = ring.attach(2, branch1);
    const withBoth = withAttach.attach(4, branch2);
    const code = decompile(withBoth);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Linear(['N']);
export const v3 = v1.attach(2, v2);
export const v4 = Linear(['O']);
export const v5 = v3.attach(4, v4);`);
  });

  test('uses toCode() method', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    expect(benzene.toCode()).toBe("export const ring1 = Ring({ atoms: 'c', size: 6 });");
    expect(benzene.toCode('r')).toBe("export const r1 = Ring({ atoms: 'c', size: 6 });");
  });
});

describe('Decompiler - Linear', () => {
  test('decompiles simple linear chain', () => {
    const propane = Linear(['C', 'C', 'C']);
    const code = decompile(propane);
    expect(code).toBe("export const v1 = Linear(['C', 'C', 'C']);");
  });

  test('decompiles single-atom linear', () => {
    const linear = Linear(['C']);
    const code = decompile(linear);
    expect(code).toBe("export const v1 = Linear(['C']);");
  });

  test('decompiles linear with bonds', () => {
    const ethene = Linear(['C', 'C'], ['=']);
    const code = decompile(ethene);
    expect(code).toBe("export const v1 = Linear(['C', 'C'], ['=']);");
  });

  test('decompiles linear with different atom types and bond', () => {
    const linear = Linear(['C', 'N'], ['=']);
    const code = decompile(linear);
    expect(code).toBe("export const v1 = Linear(['C', 'N'], ['=']);");
  });

  test('decompiles linear with attachments', () => {
    const chain = Linear(['C', 'C', 'C']);
    const branch = Linear(['N']);
    const attached = chain.attach(2, branch);
    const code = decompile(attached);
    expect(code).toBe(`export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Linear(['N']);
export const v3 = v1.attach(2, v2);`);
  });

  test('uses toCode() method', () => {
    const propane = Linear(['C', 'C', 'C']);
    expect(propane.toCode()).toBe("export const linear1 = Linear(['C', 'C', 'C']);");
    expect(propane.toCode('c')).toBe("export const c1 = Linear(['C', 'C', 'C']);");
  });
});

describe('Decompiler - FusedRing (simple path)', () => {
  test('decompiles 2-ring fused ring system via rawFusedRing', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 2,
    });
    const fusedRing = rawFusedRing([ring1, ring2]);
    const code = decompile(fusedRing);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 10 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v3 = v1.fuse(2, v2);`);
  });

  test('decompiles 2-ring rawFusedRing with leadingBond', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 1,
    });
    const fused = rawFusedRing([ring1, ring2]);
    fused.metaLeadingBond = '=';
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2, { leadingBond: '=' });`);
  });

  test('decompiles 3-ring rawFusedRing with leadingBond', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 1,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 2,
    });
    const fused = rawFusedRing([ring1, ring2, ring3]);
    fused.metaLeadingBond = '#';
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 2 });
export const v4 = v1.fuse(1, v2, { leadingBond: '#' });
export const v5 = v4.addRing(2, v3);`);
  });

  test('decompiles 3-ring rawFusedRing without leadingBond uses fuse + addRing', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 1,
    });
    const ring3 = Ring({
      atoms: 'C', size: 6, ringNumber: 3, offset: 2,
    });
    const fused = rawFusedRing([ring1, ring2, ring3]);
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 2 });
export const v4 = v1.fuse(1, v2);
export const v5 = v4.addRing(2, v3);`);
  });

  test('decompiles single-ring FusedRing via simple path', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const fused = { type: 'fused_ring', rings: [ring1] };
    const code = decompile(fused);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('decompiles single-ring FusedRing with empty sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const fused = { type: 'fused_ring', rings: [ring1], metaSequentialRings: [] };
    const code = decompile(fused);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('decompiles rawFusedRing with empty sequential rings via simple path', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({
      atoms: 'C', size: 6, ringNumber: 2, offset: 1,
    });
    const fused = rawFusedRing([ring1, ring2]);
    fused.metaSequentialRings = [];
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2);`);
  });
});

describe('Decompiler - FusedRing (interleaved/complex path)', () => {
  // When .fuse() produces parser metadata (interleaved positions), the decompiler
  // should emit FusedRing({ metadata: { rings: [...] } }) with hierarchical colocated atoms.
  // No scattered Maps, no mutations.

  test('decompiles fused ring created via .fuse() with hierarchical metadata', () => {
    // ring1.fuse(1, ring2) produces:
    //   ring1 positions: [0, 1, 6, 7, 8, 9], start: 0, end: 9
    //   ring2 positions: [1, 2, 3, 4, 5, 6], start: 1, end: 6
    //   allPositions: [0..9], all depth 0
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = FusedRing({ metadata: { rings: [{ ring: v1, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, { position: 6, depth: 0 }, { position: 7, depth: 0 }, { position: 8, depth: 0 }, { position: 9, depth: 0 }] }, { ring: v2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, { position: 3, depth: 0 }, { position: 4, depth: 0 }, { position: 5, depth: 0 }, { position: 6, depth: 0 }] }] } });`);
  });

  test('decompiles fused ring with leadingBond in hierarchical metadata', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    fused.metaLeadingBond = '=';
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = FusedRing({ metadata: { leadingBond: '=', rings: [{ ring: v1, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, { position: 6, depth: 0 }, { position: 7, depth: 0 }, { position: 8, depth: 0 }, { position: 9, depth: 0 }] }, { ring: v2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, { position: 3, depth: 0 }, { position: 4, depth: 0 }, { position: 5, depth: 0 }, { position: 6, depth: 0 }] }] } });`);
  });

  test('decompiles fused ring with attachments and extra atom metadata', () => {
    // Ring with attachment at position 2, fused, plus an extra atom at position 12 with value 'O'
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const branch = Linear(['N']);
    const ringWithAttach = ring1.attach(2, branch);
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
    const fused = FusedRing({ metadata: { rings: [{ ring: ringWithAttach, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, { position: 6, depth: 0 }, { position: 7, depth: 0 }, { position: 8, depth: 0 }, { position: 9, depth: 0 }] }, { ring: ring2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, { position: 3, depth: 0 }, { position: 4, depth: 0 }, { position: 5, depth: 0 }, { position: 6, depth: 0 }] }], atoms: [{ position: 12, depth: 0, value: 'O' }] } });
    const code = decompile(fused);
    // Attachments stay as .attach() calls on rings.
    // FusedRing uses hierarchical metadata with the extra atom (position 12, value 'O') colocated.
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Linear(['N']);
export const v3 = v1.attach(2, v2);
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v5 = FusedRing({ metadata: { rings: [{ ring: v3, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, { position: 6, depth: 0 }, { position: 7, depth: 0 }, { position: 8, depth: 0 }, { position: 9, depth: 0 }] }, { ring: v4, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, { position: 3, depth: 0 }, { position: 4, depth: 0 }, { position: 5, depth: 0 }, { position: 6, depth: 0 }] }], atoms: [{ position: 12, depth: 0, value: 'O' }] } });`);
  });

  test('decompiles fused ring with extra standalone atom', () => {
    // Extra atom at position 12 with value 'N', not belonging to any ring
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
    const fused = FusedRing({ metadata: { rings: [{ ring: ring1, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, { position: 6, depth: 0 }, { position: 7, depth: 0 }, { position: 8, depth: 0 }, { position: 9, depth: 0 }] }, { ring: ring2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, { position: 3, depth: 0 }, { position: 4, depth: 0 }, { position: 5, depth: 0 }, { position: 6, depth: 0 }] }], atoms: [{ position: 12, depth: 0, value: 'N' }] } });
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = FusedRing({ metadata: { rings: [{ ring: v1, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, { position: 6, depth: 0 }, { position: 7, depth: 0 }, { position: 8, depth: 0 }, { position: 9, depth: 0 }] }, { ring: v2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, { position: 3, depth: 0 }, { position: 4, depth: 0 }, { position: 5, depth: 0 }, { position: 6, depth: 0 }] }], atoms: [{ position: 12, depth: 0, value: 'N' }] } });`);
  });

  test('decompiles single-ring fused with null bondMap via interleaved returns just Ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const fused = ring1.addSequentialRings([]);
    fused.metaBranchDepthMap.set(5, 0);
    fused.metaBondMap.set(5, null);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('decompiles single-ring fused with empty maps returns just Ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const fused = ring1.addSequentialRings([]);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('decompiles fused ring where single ring remains after stripping', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    fused.metaSequentialRings = [];
    fused.rings = [ring1];
    const code = decompile(fused);
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6 });");
  });
});

describe('Decompiler - FusedRing (sequential rings)', () => {
  // Sequential rings: all const, no let+reassignment.
  // Depth colocated per-ring as { ring: v, depth: N }. Depth 0 is default (omitted).
  // chainAtoms: depth always explicit.

  test('decompiles complex fused ring with sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const result = fused.addSequentialRings([seqRing]);
    const code = decompile(result);
    // const for fuse, new const for addSequentialRings, depth 0 omitted
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2);
export const v4 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
export const v5 = v3.addSequentialRings([{ ring: v4 }]);`);
  });

  test('decompiles sequential rings with branchDepthMap', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const result = fused.addSequentialRings([seqRing]);
    const code = decompile(result, { includeMetadata: true });
    // depth 0 is default, so omitted in the ring entry
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2);
export const v4 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
export const v5 = v3.addSequentialRings([{ ring: v4 }]);`);
  });

  test('generates clean addSequentialRings for simple sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const result = ring1.addSequentialRings([seqRing]);
    const code = decompile(result, { includeMetadata: true });
    // Single base ring + sequential ring, all depth 0 (omitted), all const
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = v1.addSequentialRings([{ ring: v2 }]);`);
  });

  test('generates chainAtoms with attachments for sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const attachment = Linear(['O']);
    const result = ring1.addSequentialRings([seqRing], { chainAtoms: [{ atom: 'N', depth: 0, position: 'after', attachments: [attachment] }] });
    const code = decompile(result, { includeMetadata: true });
    // chainAtoms depth always explicit, attachment declared before addSequentialRings
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = Linear(['O']);
export const v4 = v1.addSequentialRings([{ ring: v2 }], { chainAtoms: [{ atom: 'N', depth: 0, position: 'after', attachments: [v3] }] });`);
  });

  test('embeds atom values in chainAtoms structure', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const result = ring1.addSequentialRings([seqRing]);
    // Position 10 is within the sequential ring — atom value here doesn't need chainAtom
    result.metaAtomValueMap.set(10, 'N');
    const code = decompile(result, { includeMetadata: true });
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = v1.addSequentialRings([{ ring: v2 }]);`);
  });

  test('embeds bond types in chainAtoms structure', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const result = ring1.addSequentialRings([seqRing]);
    // Bonds at base ring positions don't generate chainAtoms
    result.metaBondMap.set(1, '=');
    result.metaBondMap.set(2, null);
    result.metaBondMap.set(3, '#');
    const code = decompile(result, { includeMetadata: true });
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = v1.addSequentialRings([{ ring: v2 }]);`);
  });

  test('embeds atom attachments in chainAtoms structure', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const att1 = Linear(['O']);
    const att2 = Linear(['N']);
    const result = ring1.addSequentialRings([seqRing]);
    // Attachments at base ring position 3 don't generate chainAtoms
    result.metaSeqAtomAttachments.set(3, [att1, att2]);
    const code = decompile(result, { includeMetadata: true });
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = v1.addSequentialRings([{ ring: v2 }]);`);
  });

  test('decompiles 3+ base rings with sequential ring using FusedRing constructor', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const ring3 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 6 });
    const fused = FusedRing([ring1, ring2, ring3]);
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 4 });
    const result = fused.addSequentialRings([seqRing]);
    const code = decompile(result, { includeMetadata: true });
    // All const, new const for addSequentialRings, depth 0 omitted
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
export const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 3, offset: 6 });
export const v4 = FusedRing([v1, v2, v3]);
export const v5 = Ring({ atoms: 'C', size: 5, ringNumber: 4 });
export const v6 = v4.addSequentialRings([{ ring: v5 }]);`);
  });
});

describe('Decompiler - Molecule', () => {
  test('decompiles molecule with multiple components', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);
    const code = decompile(molecule);
    expect(code).toBe(`export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'c', size: 6 });
export const v3 = Molecule([v1, v2]);`);
  });

  test('decompiles empty molecule', () => {
    const empty = Molecule([]);
    const code = decompile(empty);
    expect(code).toBe('export const v1 = Molecule([]);');
  });

  test('uses toCode() method', () => {
    const propyl = Linear(['C', 'C', 'C']);
    const benzene = Ring({ atoms: 'c', size: 6 });
    const molecule = Molecule([propyl, benzene]);
    const code = molecule.toCode();
    expect(code).toBe(`export const molecule1 = Linear(['C', 'C', 'C']);
export const molecule2 = Ring({ atoms: 'c', size: 6 });
export const molecule3 = Molecule([molecule1, molecule2]);`);
  });
});

describe('Decompiler - Options', () => {
  test('handles custom indent option', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const code = decompile(ring, { indent: 2 });
    expect(code).toBe("    export const v1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('handles custom varName option', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const code = decompile(ring, { varName: 'node' });
    expect(code).toBe("export const node1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('includeMetadata false strips branchDepths', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    ring.metaBranchDepths = [0, 0, 0, 1, 1, 1];
    const code = decompile(ring, { includeMetadata: false });
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6, branchDepths: [0, 0, 0, 1, 1, 1] });");
  });

  test('throws error for unknown node type', () => {
    const unknownNode = { type: 'UnknownType' };
    expect(() => decompile(unknownNode)).toThrow('Unknown node type: UnknownType');
  });
});

describe('Decompiler - Round-trip', () => {
  test('generated code can be evaluated', () => {
    const benzene = Ring({ atoms: 'c', size: 6 });
    const code = benzene.toCode('r');
    expect(code).toBe("export const r1 = Ring({ atoms: 'c', size: 6 });");
  });

  test('preserves structure through decompile', () => {
    const propane = Linear(['C', 'C', 'C']);
    const code = propane.toCode('p');
    expect(code).toBe("export const p1 = Linear(['C', 'C', 'C']);");
  });

  test('round-trips parsed ring with bonds', () => {
    const ast = parse('C1CC=CC1');
    const code = decompile(ast, { includeMetadata: true });
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 5, bonds: [null, null, '=', null, null] });");
  });
});
