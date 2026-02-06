import { describe, test, expect } from 'bun:test';
import { Ring, FusedRing, Linear } from './constructors.js';

describe('addSequentialRings', () => {
  test('adds sequential rings to a fused ring', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const result = fused.addSequentialRings([seqRing]);

    expect(result.metaSequentialRings).toHaveLength(1);
    expect(result.metaSequentialRings[0].size).toBe(5);
    expect(result.metaSequentialRings[0].metaPositions).toBeDefined();
    expect(result.metaSequentialRings[0].metaStart).toBeDefined();
    expect(result.metaSequentialRings[0].metaEnd).toBeDefined();
  });

  test('extends allPositions to include sequential ring positions', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const originalPositionCount = fused.metaAllPositions.length;
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const result = fused.addSequentialRings([seqRing]);

    expect(result.metaAllPositions.length).toBe(originalPositionCount + 5);
  });

  test('preserves existing ring metadata', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const originalRing1Positions = [...fused.rings[0].metaPositions];
    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const result = fused.addSequentialRings([seqRing]);

    expect(result.rings[0].metaPositions).toEqual(originalRing1Positions);
  });

  test('supports atomAttachments option', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const attachment = Linear(['O', 'H']);
    const result = fused.addSequentialRings([seqRing], {
      atomAttachments: { 11: [attachment] },
    });

    expect(result.metaSeqAtomAttachments.get(11)).toHaveLength(1);
  });

  test('returns immutable result', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const result = fused.addSequentialRings([seqRing]);

    // Original should not have sequential rings
    expect(fused.metaSequentialRings).toBeUndefined();
    expect(result.metaSequentialRings).toHaveLength(1);
  });
});

describe('addSequentialAtomAttachment', () => {
  test('adds attachment to sequential atom position', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const withSeq = fused.addSequentialRings([seqRing]);

    const attachment = Linear(['O', 'H']);
    const result = withSeq.addSequentialAtomAttachment(11, attachment);

    expect(result.metaSeqAtomAttachments.get(11)).toHaveLength(1);
  });

  test('accumulates multiple attachments at same position', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const withSeq = fused.addSequentialRings([seqRing]);

    const att1 = Linear(['O', 'H']);
    const att2 = Linear(['N', 'H', 'H']);
    const result1 = withSeq.addSequentialAtomAttachment(11, att1);
    const result2 = result1.addSequentialAtomAttachment(11, att2);

    expect(result2.metaSeqAtomAttachments.get(11)).toHaveLength(2);
  });

  test('returns immutable result', () => {
    const ring1 = Ring({ atoms: 'C', size: 6, ringNumber: 1, offset: 0 });
    const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 3 });
    const fused = FusedRing([ring1, ring2]);

    const seqRing = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
    const withSeq = fused.addSequentialRings([seqRing]);

    const attachment = Linear(['O', 'H']);
    const result = withSeq.addSequentialAtomAttachment(11, attachment);

    expect(withSeq.metaSeqAtomAttachments.size).toBe(0);
    expect(result.metaSeqAtomAttachments.get(11)).toHaveLength(1);
  });
});
