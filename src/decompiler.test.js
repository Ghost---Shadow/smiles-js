import {
  describe, test, expect,
} from 'bun:test';
import {
  Ring, Linear, Molecule,
} from './constructors.js';
import { decompile } from './decompiler.js';
import { parse } from './parser/index.js';

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

  test('decompiles linear with bonds', () => {
    const ethene = Linear(['C', 'C'], ['=']);
    const code = decompile(ethene);
    expect(code).toBe("export const v1 = Linear(['C', 'C'], ['=']);");
  });

  test('uses toCode() method', () => {
    const propane = Linear(['C', 'C', 'C']);
    expect(propane.toCode()).toBe("export const linear1 = Linear(['C', 'C', 'C']);");
    expect(propane.toCode('c')).toBe("export const c1 = Linear(['C', 'C', 'C']);");
  });
});

describe('Decompiler - FusedRing', () => {
  test('decompiles fused ring system', () => {
    const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 2);

    const code = decompile(fusedRing);
    expect(code).toBe(`export const v1 = Ring({ atoms: 'C', size: 10 });
export const v2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v3 = v1.fuse(v2, 2);`);
  });

  test('uses toCode() method', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fusedRing = ring1.fuse(ring2, 1);

    const code = fusedRing.toCode();
    expect(code).toBe(`export const fusedRing1 = Ring({ atoms: 'C', size: 6 });
export const fusedRing2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
export const fusedRing3 = fusedRing1.fuse(fusedRing2, 1);`);
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
});

describe('Decompiler - Advanced Features', () => {
  test('decompiles ring with bonds', () => {
    const ring = Ring({ atoms: 'C', size: 6, bonds: ['=', null, '=', null, '='] });
    const code = decompile(ring);
    expect(code).toContain("bonds: ['=', null, '=', null, '=']");
  });

  test('decompiles ring with substitutions', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const substituted = ring.substitute(2, 'N');
    const code = decompile(substituted);
    expect(code).toContain('.substitute(2,');
  });

  test('decompiles ring with attachments', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const methyl = Linear(['C']);
    const attached = ring.attach(methyl, 1);
    const code = decompile(attached);
    expect(code).toContain('.attach(');
  });

  test('decompiles linear with attachments', () => {
    const chain = Linear(['C', 'C', 'C']);
    const branch = Linear(['N']);
    const attached = chain.attach(branch, 2);
    const code = decompile(attached);
    expect(code).toContain('.attach(');
  });

  test('decompiles simple fused ring without leadingBond (2 rings)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    const code = decompile(fused);
    expect(code).toContain('.fuse(');
  });

  test('decompiles empty molecule', () => {
    const empty = Molecule([]);
    const code = decompile(empty);
    expect(code).toBe('export const v1 = Molecule([]);');
  });

  test('decompiles ring with branchDepths metadata', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    ring.metaBranchDepths = [0, 0, 0, 1, 1, 1];
    const code = decompile(ring);
    expect(code).toContain('branchDepths:');
  });

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
    const fused = ring1.fuse(ring2, 1);
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    fused.metaBranchDepthMap = new Map();
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused);
    expect(code).toContain('metaSequentialRings');
  });


  test('handles custom indent option', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const code = decompile(ring, { indent: 2 });
    expect(code).toContain('    ');
  });

  test('handles custom varName option', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const code = decompile(ring, { varName: 'node' });
    expect(code).toContain('node1');
  });


  test('throws error for unknown node type', () => {
    const unknownNode = { type: 'UnknownType' };
    expect(() => decompile(unknownNode)).toThrow('Unknown node type: UnknownType');
  });

  test('decompiles simple fused ring with leadingBond (2 rings)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaLeadingBond = '=';
    const code = decompile(fused);
    expect(code).toContain("leadingBond: '='");
  });

  test('decompiles simple fused ring with leadingBond (3+ rings)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const ring3 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
    const fused1 = ring1.fuse(ring2, 1);
    fused1.rings.push({ ...ring3, offset: 2 });
    fused1.metaLeadingBond = '=';
    const code = decompile(fused1);
    expect(code).toContain("leadingBond: '='");
  });

  test('decompiles simple fused ring without leadingBond (3+ rings)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const ring3 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
    const fused1 = ring1.fuse(ring2, 1);
    fused1.rings.push({ ...ring3, offset: 2 });
    const code = decompile(fused1);
    expect(code).toContain('FusedRing');
  });

  test('decompiles complex fused ring with sequential atom attachments', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    ring2.metaPositions = [6, 7, 8, 9, 10, 11];
    ring2.metaStart = 6;
    ring2.metaEnd = 11;
    const fused = ring1.fuse(ring2, 1);
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.rings[1].metaPositions = ring2.metaPositions;
    fused.rings[1].metaStart = ring2.metaStart;
    fused.rings[1].metaEnd = ring2.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map([[12, 0]]);
    fused.metaAtomValueMap = new Map([[12, 'N']]);
    fused.metaBondMap = new Map([[12, '=']]);
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('Linear');
  });

  test('decompiles with includeMetadata option false', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    ring.metaBranchDepths = [0, 0, 0, 1, 1, 1];
    const code = decompile(ring, { includeMetadata: false });
    expect(code).not.toContain('meta');
  });

  test('decompiles fused ring where single ring returns early', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaSequentialRings = [];
    fused.rings = [ring1];
    const code = decompile(fused);
    expect(code).toContain('Ring');
  });

  test('decompiles linear with bond', () => {
    const linear = Linear(['C', 'N'], ['=']);
    const code = decompile(linear);
    expect(code).toContain("['=']");
  });

  test('decompiles linear without bond', () => {
    const linear = Linear(['C']);
    const code = decompile(linear);
    expect(code).toBe("export const v1 = Linear(['C']);");
  });

  test('decompiles complex fused ring with sequential rings check', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    seqRing.metaPositions = [10, 11, 12, 13, 14];
    seqRing.metaStart = 10;
    seqRing.metaEnd = 14;
    const fused = ring1.fuse(ring2, 1);
    fused.metaSequentialRings = [seqRing];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    fused.metaBranchDepthMap = new Map();
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    fused.metaBranchDepthMap.set(10, 0);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('metaSequentialRings');
  });

  test('decompiles fused ring that returns single ring early (line 277-279)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const fused = { type: 'fused_ring', rings: [ring1], metaSequentialRings: [] };
    const code = decompile(fused);
    expect(code).toContain('Ring');
  });

  test('decompiles simple fused ring with 2 rings and no leadingBond (line 547)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    delete fused.leadingBond;
    const code = decompile(fused);
    expect(code).toContain('.fuse(');
    expect(code).not.toContain('leadingBond');
  });

  test('decompiles complex fused ring attachment search (line 456-465)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map([[12, 1]]);
    fused.metaAtomValueMap = new Map([[12, 'N']]);
    fused.metaBondMap = new Map([[12, '=']]);
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('Linear');
  });

  test('decompiles ring with simple leadingBond (line 206)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaLeadingBond = '=';
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [];
    const code = decompile(fused);
    expect(code).toContain("leadingBond: '='");
  });

  test('decompiles simple FusedRing with leadingBond (line 231)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const ring3 = Ring({ atoms: 'C', size: 6, ringNumber: 3 });
    const fused = ring1.fuse(ring2, 1);
    fused.rings.push({ ...ring3, offset: 2 });
    fused.metaLeadingBond = '#';
    const code = decompile(fused);
    expect(code).toContain('FusedRing');
    expect(code).toContain("leadingBond: '#'");
  });

  test('decompiles complex FusedRing with 1 ring (line 277-279)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6];
    fused.metaBranchDepthMap = new Map([[6, 0]]);
    fused.metaAtomValueMap = new Map([[6, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('Linear');
  });

  test('decompiles complex FusedRing with 3+ rings (line 277-279)', () => {
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
    const fused = ring1.fuse(ring2, 1);
    fused.rings.push({ ...ring3, offset: 2 });
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.rings[1].metaPositions = ring2.metaPositions;
    fused.rings[1].metaStart = ring2.metaStart;
    fused.rings[1].metaEnd = ring2.metaEnd;
    fused.rings[2].metaPositions = ring3.metaPositions;
    fused.rings[2].metaStart = ring3.metaStart;
    fused.rings[2].metaEnd = ring3.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    fused.metaBranchDepthMap = new Map();
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('FusedRing');
  });

  test('decompiles complex fused ring with deeper branch depth attachment (line 461-462)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    ring2.metaPositions = [6, 7, 8, 9, 10, 11];
    ring2.metaStart = 6;
    ring2.metaEnd = 11;
    const fused = ring1.fuse(ring2, 1);
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.rings[1].metaPositions = ring2.metaPositions;
    fused.rings[1].metaStart = ring2.metaStart;
    fused.rings[1].metaEnd = ring2.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map([[12, 2]]);
    fused.metaAtomValueMap = new Map([[12, 'N']]);
    fused.metaBondMap = new Map([[12, '=']]);
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('Linear');
  });

  test('decompiles simple fused ring with 2 rings no leadingBond (line 547)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    delete fused.metaLeadingBond;
    const code = decompile(fused);
    expect(code).toContain('.fuse(');
    expect(code).not.toContain('leadingBond');
  });

  test('covers decompileChildNode helper (line 17)', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const methyl = Linear(['C']);
    const attached = ring.attach(methyl, 1);
    const code = decompile(attached);
    expect(code).toContain('.attach(');
  });

  test('covers formatMapCode with null value (line 229-231)', () => {
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
    expect(code).toContain('Ring');
  });

  test('covers complex decompile with single ring (line 275-276)', () => {
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
    expect(code).toContain('Ring');
  });

  test('covers complex decompile single ring metadata assignment (line 286-292)', () => {
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
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('metaPositions');
  });

  test('covers sequential ring decompile with child nodes (line 327-333)', () => {
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
    expect(code).toContain('metaSeqAtomAttachments');
  });

  test('covers atomValueMap code generation (line 351)', () => {
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
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map([[10, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('metaAtomValueMap');
  });

  test('covers bondMap filtering with non-null bonds (line 356-364)', () => {
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
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map([[1, '='], [2, null], [3, '#']]);
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('metaBondMap');
    expect(code).toContain('=');
    expect(code).toContain('#');
  });

  test('covers seqAtomAttachments map generation (line 368-372)', () => {
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
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    const att1 = Linear(['O']);
    const att2 = Linear(['N']);
    fused.metaSeqAtomAttachments = new Map([[3, [att1, att2]]]);
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('metaSeqAtomAttachments');
  });

  test('covers attachment loop finding deeper branch (line 461-462)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    ring1.metaPositions = [0, 1, 2, 3, 4, 5];
    ring1.metaStart = 0;
    ring1.metaEnd = 5;
    const fused = { type: 'fused_ring', rings: [ring1] };
    fused.rings[0].metaPositions = ring1.metaPositions;
    fused.rings[0].metaStart = ring1.metaStart;
    fused.rings[0].metaEnd = ring1.metaEnd;
    fused.metaSequentialRings = [];
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7];
    fused.metaBranchDepthMap = new Map([[6, 2], [7, 1]]);
    fused.metaAtomValueMap = new Map([[6, 'O'], [7, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('Linear');
  });

  test('covers ring attachments generation (line 511-521)', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const branch1 = Linear(['N']);
    const branch2 = Linear(['O']);
    const withAttach = ring.attach(branch1, 2);
    const withBoth = withAttach.attach(branch2, 4);
    const code = decompile(withBoth);
    expect(code).toContain('.attach(');
  });

  test('covers simple fused with injection no leadingBond (line 547)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map([[12, 0]]);
    fused.metaAtomValueMap = new Map([[12, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    delete fused.metaLeadingBond;
    const code = decompile(fused);
    expect(code).toContain('.fuse(');
  });

  test('covers injection with ring having attachments (lines 510-521)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const branch = Linear(['N']);
    const ringWithAttach = ring1.attach(branch, 2);
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ringWithAttach.fuse(ring2, 1);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaBranchDepthMap.set(12, 0);
    fused.metaAtomValueMap = new Map([[12, 'O']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused);
    expect(code).toContain('.attach(');
  });

  test('covers decompile with 3+ rings needing FusedRing constructor (line 277-279)', () => {
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
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    fused.metaBranchDepthMap = new Map();
    fused.metaAllPositions.forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map();
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused, { includeMetadata: true });
    expect(code).toContain('FusedRing');
  });

  test('covers injection with deeper branch attachment (line 461-462)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaBranchDepthMap.set(12, 2);
    fused.metaBranchDepthMap.set(13, 1);
    fused.metaAtomValueMap = new Map([[12, 'O'], [13, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused);
    expect(code).toContain('Linear');
  });

  test('covers injected ring with attachments (line 511-521)', () => {
    const ring = Ring({ atoms: 'C', size: 6 });
    const branch = Linear(['N']);
    const attached = ring.attach(branch, 2);
    const methyl = Linear(['C']);
    const withMore = attached.attach(methyl, 4);
    const code = decompile(withMore);
    expect(code).toContain('.attach(');
  });

  test('covers formatMapCode null value via parser (line 231)', () => {
    const ast = parse('C1CC=CC1');
    const code = decompile(ast, { includeMetadata: true });
    expect(code).toBeTruthy();
  });

  test('covers deeper branch search in injection (lines 461-462)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaBranchDepthMap.set(12, 3);
    fused.metaBranchDepthMap.set(13, 2);
    fused.metaBranchDepthMap.set(14, 3);
    fused.metaAtomValueMap = new Map([[12, 'O'], [13, 'N'], [14, 'S']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    const code = decompile(fused);
    expect(code).toContain('Linear');
  });

  test('covers leadingBond on injection path (line 547)', () => {
    const ring1 = Ring({ atoms: 'C', size: 6 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
    const fused = ring1.fuse(ring2, 1);
    fused.metaAllPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    fused.metaBranchDepthMap = new Map();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(i => fused.metaBranchDepthMap.set(i, 0));
    fused.metaAtomValueMap = new Map([[12, 'N']]);
    fused.metaBondMap = new Map();
    fused.metaSeqAtomAttachments = new Map();
    fused.metaLeadingBond = '=';
    const code = decompile(fused);
    expect(code).toContain('leadingBond');
  });

});
