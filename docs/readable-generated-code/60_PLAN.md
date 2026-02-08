# Plan: Zero Meta Lines in All Generated Code

## Core Invariant

The codegen round-trip verifies **AST integrity**, not just SMILES strings:

```
SMILES → parse() → AST → toCode() → JavaScript → execute → AST → .smiles → must equal original SMILES
```

The generated JavaScript code is constructed from the **AST** (not from the SMILES string directly). This means the round-trip validates that the AST faithfully represents the molecule, and that the structural API calls (Ring, fuse, addSequentialRings, substitute, attach) correctly reconstruct it. The exact-match assertion `expect(reconstructed.smiles).toBe(originalSmiles)` is sacred and must never be weakened — it is the proof that the AST round-trips correctly.

## Where We Are

The previous work (50_UPDATED_PLAN) partially succeeded:
- Molecules with linear ring chains (cortisone, prednisone, simvastatin) now route through `decompileSimpleFusedRing` and produce zero meta lines
- Molecules with interleaved/sequential rings (telmisartan, naphthalene, hydrocortisone, budesonide) still route through `decompileComplexFusedRing` which dumps ~20 lines of metadata

**But there are two problems:**

1. **32 failing tests.** The simple path produces different SMILES than the original for some molecules. The round-trip assertions are exact match (`expect(reconstructed.smiles).toBe(originalSmiles)`) and they catch this. These assertions are sacred and must not be weakened.

2. **The complex path still dumps metadata.** Telmisartan's generated code has 15 lines of structural API calls and 20 lines of `meta*` assignments. The user's target is the same 15 structural lines with zero meta.

## The Two Problems Are Different

### Problem 1: Simple path produces wrong SMILES (32 failures)

The simple codegen uses offsets to lay out ring atoms. For some molecules, the computed offsets from `computeOffsetsFromPositions` produce a different atom ordering than the original SMILES. The SMILES may be valid but it's not the same molecule in all cases, or it's the same molecule with different atom ordering.

**Root cause**: `computeOffsetsFromPositions` maps parser positions to linear offsets. When Ring 0 in the parser wraps around Ring 1 (Ring 0 has positions [0,1,6,7,8,9] while Ring 1 has [1,2,3,4,5,6]), the computed offset for Ring 0 is 0 and Ring 1 is 1. But the simple codegen with offset 1 creates 5 shared atoms (size-offset=6-1=5), while the parser had only 2 shared atoms. This is a fundamentally different ring system.

**The fix**: For molecules where the simple path produces incorrect SMILES, route them back through the complex path. The `needsInterleavedCodegen` check already catches some of these, but it misses cases where offsets are technically computable but produce wrong ring overlap.

The correct check: after computing offsets, verify that `offset + size` for each ring pair gives the correct overlap count (matching the parser's shared positions). If not, the molecule needs the complex path.

### Problem 2: Complex path still dumps metadata (telmisartan etc.)

Even for molecules that correctly go through the complex path, the generated code should not have meta lines. The target output for Telmisartan is:

```javascript
export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null], branchDepths: [0, 0, 0, 2, 2] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 1, 1, 2, 2] });
export let v6 = v4.fuse(2, v5);
export const v7 = Ring({ atoms: 'C', size: 5, ringNumber: 5, bonds: ['=', null, '=', null, null] });
export const v8 = v7.substitute(2, 'N');
export const v9 = v8.substitute(5, 'N');
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null], branchDepths: [2, 2, 2, 2, 3, 3] });
export const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 6, bonds: ['=', null, '=', null, '=', null] });
export const v12 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, '=', null, '=', null] });
export const v13 = Linear(['O'], ['=']);
v6 = v6.addSequentialRings([v9, v10, v11, v12], { atomAttachments: { 25: [v13] } });
export const v14 = Linear(['C']);
export const v15 = Molecule([v1, v6, v14]);
```

This means `.addSequentialRings()` must work **without** the 20 lines of metadata being set afterward. The SMILES codegen must produce correct output from just the structural calls.

**Root cause**: The SMILES codegen (`buildInterleavedFusedRingSMILES`) reads `metaAllPositions`, `metaBranchDepthMap`, `metaAtomValueMap`, `metaBondMap` to walk the fused ring in the correct order. Without these, it falls through to the simple path which produces wrong SMILES.

**The fix**: `addSequentialRings` (in `manipulation.js`) must compute all necessary metadata internally so the codegen works without any manual meta assignments. Right now it copies metadata from the source fused ring and extends it. The decompiler then re-dumps all of it as assignments. Instead, `addSequentialRings` should compute everything from scratch using the structural information (ring sizes, offsets, positions, bonds, atoms, substitutions, attachments).

## Implementation Steps

### Step 1: Fix the 32 failing round-trip tests

Tighten the `needsInterleavedCodegen` check so that any molecule where the simple path would produce incorrect SMILES goes through the complex path instead.

The check should verify: for each pair of adjacent rings, the overlap computed from offsets (`ring[i].size - offset[i+1]`) matches the actual overlap from metaPositions (number of shared positions between rings i and i+1).

**Outcome**: All 1631 tests pass. Some molecules that were routed to the simple path go back to the complex path. No test assertions change.

**Files**: `src/decompiler.js` (update `needsInterleavedCodegen`)

### Step 2: Make `addSequentialRings` compute metadata internally

Currently `addSequentialRings` preserves metadata from the input fused ring. After calling it, the decompiler dumps all metadata as assignments.

Change `addSequentialRings` so it computes `metaAllPositions`, `metaBranchDepthMap`, `metaAtomValueMap`, `metaBondMap`, ring-level `metaPositions`/`metaStart`/`metaEnd`, and sequential ring positions — all from the structural information already present on the rings.

This is the core of the work. The function has access to:
- Base rings with their atoms, sizes, offsets, bonds, substitutions, attachments, branchDepths
- Sequential rings with their atoms, sizes, bonds, substitutions, branchDepths
- The atom attachments map

From these, it should be able to compute every metadata property the interleaved codegen needs.

**Outcome**: `addSequentialRings` returns a fused ring node with all metadata populated. Code like `v6 = v6.addSequentialRings([v9, v10, v11, v12], { atomAttachments: { 25: [v13] } })` produces a fully-metadata'd node without any manual assignments.

**Files**: `src/manipulation.js`

### Step 3: Make `fuse()` produce metadata the interleaved codegen can use

Same as Step 2 but for the base `.fuse()` call. When `v4.fuse(2, v5)` is called, the resulting fused ring should have enough metadata for the interleaved codegen to work. Currently `computeFusedRingPositions` sets `metaPositions` on rings but doesn't set all the maps the interleaved codegen needs.

Extend `computeFusedRingPositions` (or add a post-processing step) to also compute `metaAllPositions`, `metaBranchDepthMap`, `metaAtomValueMap`, `metaBondMap` from the structural ring data.

**Outcome**: `v4.fuse(2, v5)` returns a fused ring with complete metadata. The interleaved codegen works on it without any manual meta assignments.

**Files**: `src/layout/index.js` or `src/node-creators.js`

### Step 4: Strip all meta emissions from `decompileComplexFusedRing`

Once Steps 2-3 ensure that `fuse()` and `addSequentialRings()` compute all metadata internally, the decompiler no longer needs to emit any `meta*` assignments.

Remove all metadata emission from `decompileComplexFusedRing`:
- Remove `metaUseInterleavedCodegen` assignment
- Remove `metaPositions`/`metaStart`/`metaEnd` assignments on rings
- Remove `metaAllPositions` assignment
- Remove `metaBranchDepthMap` assignment
- Remove `metaAtomValueMap` assignment
- Remove `metaBondMap` assignment

**Outcome**: Telmisartan's generated code is 15 lines of structural API calls, zero meta lines. All molecules produce clean generated code.

**Files**: `src/decompiler.js`

### Step 5: Verify all round-trips pass with exact match

Run the full test suite. Every codegen round-trip test must pass with exact match assertions:

```javascript
expect(reconstructed.smiles).toBe(originalSmiles);
```

If any fail, the metadata computation in Steps 2-3 is wrong and needs fixing. Do not weaken the assertions.

**Files**: No changes — verification only.

### Step 6: Clean up

- Remove `decompileComplexFusedRingSingleRing` if no longer needed
- Remove `metaUseInterleavedCodegen` flag from parser/manipulation (it's set but never meaningfully read)
- Update snapshots
- Verify line count reduction in snapshots

**Files**: `src/decompiler.js`, `src/parser/ring-group-builder.js`, `src/manipulation.js`, snapshots

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| `fuse()` can't compute all metadata from structure alone | High | The layout engine already computes positions. Extending to maps is mechanical — iterate positions, look up atom/bond values from the rings. |
| `addSequentialRings` metadata computation breaks some molecule | High | 32+ integration tests with exact-match round-trips cover all molecule categories. Any breakage is caught immediately. |
| Some metadata genuinely requires parse-order info, not just structure | Medium | If a specific map can't be computed structurally, keep emitting just that one. Goal is to minimize meta, not necessarily reach absolute zero. |
| Performance regression from computing metadata on every API call | Low | Metadata computation is O(total atoms) which is tiny. The parser already does this. |

## Non-Goals

- **Not changing the parser.** Parser-created ASTs still set metadata during parsing.
- **Not changing the codegen paths.** Both interleaved and simple codegen stay as-is. The change is in making the API calls (`fuse`, `addSequentialRings`) produce the metadata the codegen needs, so the decompiler doesn't have to dump it.
- **Not relaxing round-trip assertions.** All round-trips remain exact match.
