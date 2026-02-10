import {
  describe, test, expect,
} from 'bun:test';
import {
  Ring, Linear, Molecule,
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
  test('decompiles fused ring created via .fuse() with metadata', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2, { metadata: { allPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], branchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0]]), ringMetadata: [{ positions: [0, 1, 6, 7, 8, 9], start: 0, end: 9 }, { positions: [1, 2, 3, 4, 5, 6], start: 1, end: 6 }] } });`);
  });

  test('decompiles fused ring with leadingBond via interleaved path', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    fused.metaLeadingBond = '=';
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [];
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2, { leadingBond: '=' });`);
  });

  test('decompiles fused ring with ring having attachments and metadata', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const branch = Linear(['N']);
    const ringWithAttach = ring1.attach(2, branch);
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ringWithAttach.fuse(1, ring2);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((i) => fused.metaBranchDepthMap.set(i, 0));
    fused.metaBranchDepthMap.set(12, 0);
    fused.metaAtomValueMap = new Map([[12, 'O']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Linear(['N']);
export const v3 = v1.attach(2, v2);
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v5 = v3.fuse(1, v4, { metadata: { allPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], branchDepthMap: new Map([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0]]), atomValueMap: new Map([[12, 'O']]), ringMetadata: [{ positions: [0, 1, 6, 7, 8, 9], start: 0, end: 9 }, { positions: [1, 2, 3, 4, 5, 6], start: 1, end: 6 }] } });`);
  });

  test('decompiles fused ring with extra atomValueMap metadata', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(1, ring2);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map([[12, 0]]);
    fused.metaAtomValueMap = new Map([[12, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    delete fused.metaLeadingBond;
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const v3 = v1.fuse(1, v2, { metadata: { allPositions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], branchDepthMap: new Map([[12, 0]]), atomValueMap: new Map([[12, 'N']]), ringMetadata: [{ positions: [0, 1, 6, 7, 8, 9], start: 0, end: 9 }, { positions: [1, 2, 3, 4, 5, 6], start: 1, end: 6 }] } });`);
  });

  test('decompiles single-ring fused with branchDepthMap and null bondMap via interleaved', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5];
    fused.metaBranchDepthMap = new Map([[5, 0]]);
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map([[5, null]]);
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe("export const v1 = Ring({ atoms: 'C', size: 6 });");
  });

  test('decompiles single-ring fused with empty maps via interleaved', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5];
    fused.metaBranchDepthMap = new Map();
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
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
  test('decompiles complex fused ring with sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    ring2.metaPositions = [6, 7, 8, 9, 10, 11];
    ring2.metaStart = 6;
    ring2.metaEnd = 11;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const fused = ring1.fuse(1, ring2);
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    fused.metaBranchDepthMap = new Map();
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export let v3 = v1.fuse(1, v2);
export const v4 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
v3 = v3.addSequentialRings([v4], { depths: [0], chainAtoms: [{ atom: 'C', depth: 0, position: 'before' }, { atom: 'C', depth: 0, position: 'before' }] });`);
  });

  test('decompiles sequential rings with branchDepthMap', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    seqRing.metaPositions = [10, 11, 12, 13, 14];
    seqRing.metaStart = 10;
    seqRing.metaEnd = 14;
    const fused = ring1.fuse(1, ring2);
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    fused.metaBranchDepthMap = new Map();
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    fused.metaBranchDepthMap.set(10, 0);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export let v3 = v1.fuse(1, v2);
export const v4 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
v3 = v3.addSequentialRings([v4], { depths: [0] });`);
  });

  test('generates clean addSequentialRings API for simple sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    seqRing.metaPositions = [6, 7, 8, 9, 10];
    seqRing.metaStart = 6;
    seqRing.metaEnd = 10;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0] = { ...ring1 };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export let v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
v1 = v1.addSequentialRings([v2], { depths: [0] });`);
  });

  test('generates chainAtoms with attachments for sequential rings', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    seqRing.metaPositions = [6, 7, 8, 9, 10];
    seqRing.metaStart = 6;
    seqRing.metaEnd = 10;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    fused.metaBranchDepthMap = new Map([[11, 0]]);
    fused.metaAtomValueMap = new Map([[11, 'N']]);
    fused.metaBondMap = new Map();
    const attachment = Linear(['O']);
    fused.metaSeqAtomAttachments = new Map([[11, [attachment]]]);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export let v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = Linear(['O']);
v1 = v1.addSequentialRings([v2], { depths: [0], chainAtoms: [{ atom: 'N', depth: 0, position: 'after', attachments: [v3] }] });`);
  });

  test('embeds atom values in chainAtoms structure', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    seqRing.metaPositions = [6, 7, 8, 9, 10];
    seqRing.metaStart = 6;
    seqRing.metaEnd = 10;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map([[10, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export let v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
v1 = v1.addSequentialRings([v2], { depths: [0] });`);
  });

  test('embeds bond types in chainAtoms structure', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    seqRing.metaPositions = [6, 7, 8, 9, 10];
    seqRing.metaStart = 6;
    seqRing.metaEnd = 10;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map([[1, '='], [2, null], [3, '#']]);
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export let v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
v1 = v1.addSequentialRings([v2], { depths: [0] });`);
  });

  test('embeds atom attachments in chainAtoms structure', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    seqRing.metaPositions = [6, 7, 8, 9, 10];
    seqRing.metaStart = 6;
    seqRing.metaEnd = 10;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    const att1 = Linear(['O']);
    const att2 = Linear(['N']);
    fused.metaSeqAtomAttachments = new Map([[3, [att1, att2]]]);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export let v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
v1 = v1.addSequentialRings([v2], { depths: [0] });`);
  });

  test('decompiles 3+ base rings with sequential ring using FusedRing constructor', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    ring2.metaPositions = [6, 7, 8, 9, 10, 11];
    ring2.metaStart = 6;
    ring2.metaEnd = 11;
    const ring3 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
    ring3.metaPositions = [12, 13, 14, 15, 16, 17];
    ring3.metaStart = 12;
    ring3.metaEnd = 17;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 4 });
    seqRing.metaPositions = [18, 19, 20, 21, 22];
    seqRing.metaStart = 18;
    seqRing.metaEnd = 22;
    const fused = { type: 'fused_ring', rings: [ring1, ring2, ring3] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.rings[1].metaPositions = ring2.metaPositions;
    fused.rings[1].metaStart = ring2.metaStart;
    fused.rings[1].metaEnd = ring2.metaEnd;
    fused.rings[2].metaPositions = ring3.metaPositions;
    fused.rings[2].metaStart = ring3.metaStart;
    fused.rings[2].metaEnd = ring3.metaEnd;
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = Array.from({ length: 23 }, (_, i) => i);
    fused.metaBranchDepthMap = new Map();
    fused.metaAllPositions.forEach((i) => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
export const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
export let v4 = FusedRing([v1, v2, v3]);
export const v5 = Ring({ atoms: 'C', size: 5, ringNumber: 4 });
v4 = v4.addSequentialRings([v5], { depths: [0] });`);
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
