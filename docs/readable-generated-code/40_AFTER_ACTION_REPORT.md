# After Action Report

## What We Set Out To Do

Two goals:
1. **READABLE_GENERATED_CODE** — Make `toCode()` output readable by eliminating raw `meta*` assignments
2. **REFACTOR_PLAN** — Clean up the codebase (delete duplicates, split god objects, etc.)

## What Actually Happened

The refactoring (goal 2) was largely successful. The codebase is cleaner:
- Dead duplicates deleted from smiles-parser-core.js
- Forward declarations eliminated
- `computeFusedRingPositions` extracted to `src/layout/`
- `constructors.js` split into focused modules
- Codegen branch-depth duplication consolidated
- Parser split into focused modules
- Metadata constants file created

But the primary goal — **readable generated code** — was NOT achieved. The `toCode()` output is still full of unreadable `meta*` assignments.

## The Numbers

**680 `.meta` lines** across 72 toCode snapshots. Every single one is noise that a human reading the generated code has to skip over.

### What "readable" was supposed to look like (from the plan)

```javascript
export const v1 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v2 = v1.substitute(2, 'N');
export const v3 = v2.substitute(5, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2 });
export const v5 = v3.fuse(2, v4);
```

Done. No meta. The `fuse()` call computes everything internally via `layout()`.

### What we actually get (Telmisartan, 43 lines)

```javascript
// 14 lines of readable API calls (good)
export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, ... });
// ...
export let v6 = v4.fuse(2, v5);
// ...
v6 = v6.addSequentialRings([v9, v10, v11, v12], { atomAttachments: { 25: [v13] } });

// 29 lines of unreadable garbage (bad)
v6.rings[0].metaPositions = [3, 4, 5, 10, 11];
v6.rings[0].metaStart = 3;
v6.rings[0].metaEnd = 11;
v6.rings[1].metaPositions = [5, 6, 7, 8, 9, 10];
// ... 25 more lines of Maps and arrays
```

### What steroids look like (Cortisone, 38 lines)

```javascript
// 17 lines of Ring/Linear/attach calls
export const v1 = Linear(['C']);
export const v2 = Ring({ atoms: 'C', size: 6, ... });
// ...
export const v17 = FusedRing([v2, v4, v6, v12], { skipPositionComputation: true });

// 21 lines of raw metadata dumped on v17
v17.metaTotalAtoms = 17;
v17.metaAllPositions = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15, 17, 22, 23, 24];
v17.metaSequentialRings = [];
v17.metaBranchDepthMap = new Map([[1, 0], [2, 0], ...]);
v17.metaParentIndexMap = new Map([[1, null], [2, null], ...]);
v17.metaAtomValueMap = new Map([[1, 'C'], [2, 'C'], ...]);
v17.metaBondMap = new Map([[1, null], [2, null], ...]);
v17.metaRingOrderMap = new Map([[1, [1, 2, 1, 2]], ...]);
v17.metaSeqAtomAttachments = new Map();
```

### Breakdown by molecule category

| Category | Molecules | meta lines | meta lines/molecule |
|----------|-----------|------------|---------------------|
| Steroids | 14 | 297 | 21.2 |
| Opioids | 7 | 96 | 13.7 |
| Cholesterol drugs | 10 | 57 | 5.7 |
| Adjuvant analgesics | 6 | 52 | 8.7 |
| Hypertension meds | 4 | 48 | 12.0 |
| Prescription NSAIDs | 9 | 48 | 5.3 |
| Endocannabinoids | 6 | 36 | 6.0 |
| OTC NSAIDs | 5 | 25 | 5.0 |
| Dexamethasone | 1 | 21 | 21.0 |
| Acetaminophen | 2 | 0 | 0.0 |
| Local anesthetics | 8 | 0 | 0.0 |

Steroids are the worst — every steroid molecule dumps ~21 lines of metadata because they all have 4-ring fused systems that go through the `decompileInterleavedFusedRing` path. Acetaminophen and local anesthetics are clean because they're simple molecules (linear chains and single rings) that never hit the fused ring decompiler.

## Why It Didn't Work

The plan said: `layout()` computes all metadata automatically, so the decompiler doesn't need to dump it.

What actually happened: `addSequentialRings()` was implemented and the decompiler emits it (good), but then **immediately dumps all the meta properties on top of it anyway**. The decompiler still has 4 separate fused ring paths, and all 4 dump raw metadata.

### The decompiler still has 4 paths (was supposed to collapse to 1)

| Path | Lines | When used | Dumps meta? |
|------|-------|-----------|-------------|
| `decompileSimpleFusedRing` | 35 | Simple 2-ring fuse, no metadata | No |
| `decompileComplexFusedRing` | 125 | Has sequential rings | Yes — dumps ring positions, allPositions, branchDepthMap, atomValueMap, bondMap |
| `decompileInterleavedFusedRing` | 150 | Interleaved/complex parsed | Yes — dumps ALL metadata including ringOrderMap, parentIndexMap, seqAtomAttachments |
| `decompileFusedRingWithInjection` | 76 | Sequential linear atoms | No (injects as attachments) |

The plan said all 4 would collapse into 1 path with zero meta dumps. That didn't happen.

### Root cause: `layout()` doesn't compute enough

The `computeFusedRingPositions` function in `src/layout/` was enhanced (Step 7 of the execution plan), but it still can't compute everything the codegen needs. Specifically:

1. **metaRingOrderMap** — the order in which ring closure markers appear at each position. This depends on the original parse order, not just the structure.
2. **metaParentIndexMap** — parent atom indices from the parser.
3. **metaAtomValueMap for interleaved rings** — when rings share atoms and have substitutions, the atom value depends on which ring "owns" the position.
4. **metaBranchDepthMap for complex topologies** — the branch depth depends on the original SMILES layout, not just the ring structure.

The fundamental problem remains: **these metadata properties encode the serialization order, not the chemical structure**. Two valid SMILES for the same molecule can have completely different position numbering, branch depths, and ring orders. `layout()` can compute *a* valid layout, but not necessarily *the same* layout the parser produced.

### The decompiler works around this by dumping the parser's exact values

The decompiler says: "I don't trust `layout()` to reproduce the parser's exact positions, so I'll just dump the parser's values as raw assignments."

This is correct behavior for round-trip fidelity (parse → toCode → eval → .smiles must match), but it defeats the readability goal.

## What Clean Molecules Look Like

Not everything is bad. Simple molecules produce perfectly readable code:

**Acetaminophen (0 meta lines)**:
```javascript
export const v1 = Linear(['C', 'C', 'N']);
export const v2 = Ring({ atoms: 'c', size: 6 });
export const v3 = v2.attach(3, v1);
export const v4 = Linear(['O']);
export const v5 = v3.attach(1, v4);
export const v6 = Molecule([v5]);
```

**Atorvastatin (0 meta lines)** — a complex molecule with 3 rings, but they're attached as siblings, not fused:
```javascript
export const v4 = Ring({ atoms: 'c', size: 5 });
export const v5 = v4.substitute(5, 'n');
// ... attach rings as branches, not fused ...
export const v25 = Molecule([v3, v17, v24]);
```

**Fenofibrate (0 meta lines)** — rings connected via molecule components:
```javascript
export const v10 = Ring({ atoms: 'c', size: 6, branchDepths: [0, 0, 0, 0, 1, 1] });
export const v14 = Ring({ atoms: 'c', size: 6, ringNumber: 2 });
export const v17 = Molecule([v9, v10, v13, v16]);
```

The pattern is clear: **any molecule that goes through `decompileSimpleFusedRing` or doesn't have fused rings at all produces clean, readable code.** The problem is specifically in the interleaved and complex fused ring paths.

## What Needs To Happen Next

### Option A: Make layout() authoritative (hard, correct)

Make `layout()` the single source of truth for all metadata. This means:
1. `layout()` must produce positions, atomValueMaps, bondMaps, branchDepthMaps, and ringOrderMaps that the codegen can use
2. The codegen must work with whatever layout `layout()` produces (not just the parser's exact layout)
3. The decompiler stops dumping meta — it trusts `layout()` to compute everything at eval time
4. Round-trip test changes from "exact SMILES match" to "chemically equivalent SMILES"

This is the right fix but it's hard because the codegen currently assumes the parser's exact position numbering.

### Option B: Hide meta behind a single opaque call (medium, pragmatic)

Instead of dumping 20 individual meta assignments, serialize all metadata into a single `fromLayout()` or `withMetadata()` call:

```javascript
export const v17 = FusedRing([v2, v4, v6, v12]).withMetadata({
  positions: [[1,2,3,4,6,7], [1,2,3,4,6,7,8,9,10,11], ...],
  totalAtoms: 17,
  // ... everything else
});
```

This is still opaque but at least it's one line instead of 21. The reader knows "this is internal metadata, skip it" without having to scan past 21 separate assignments.

### Option C: Accept the status quo for fused rings (easy, unsatisfying)

Simple molecules already produce clean code. Fused rings are inherently complex. Accept that the generated code for steroids and complex fused systems will have metadata, and focus on making the *non-meta* lines as clear as possible.

## Summary

| Goal | Status | Notes |
|------|--------|-------|
| Delete dead duplicates | Done | ~400 lines removed |
| Eliminate forward declarations | Done | 5 eliminated |
| Create metadata constants | Done | src/metadata.js |
| Extract layout/ | Done | computeFusedRingPositions extracted |
| Split constructors.js | Done | 4 focused modules |
| Consolidate codegen duplication | Done | branch-walker.js |
| Split parser | Done | 3 focused modules |
| addSequentialRings API | Done | Works, decompiler emits it |
| **Eliminate meta from generated code** | **Not done** | 680 meta lines remain across 72 snapshots |
| **Collapse decompiler to 1 path** | **Not done** | Still 4 paths |

The codebase is cleaner. The generated code is not.
