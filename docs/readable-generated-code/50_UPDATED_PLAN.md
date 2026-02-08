# Updated Plan: Readable Generated Code

## The Core Insight

The codegen has two paths for fused rings:

```javascript
// smiles-codegen-core.js line 213-225
function buildFusedRingSMILES(fusedRing) {
  if (rings.some(r => r.metaPositions) && fusedRing.metaAllPositions) {
    return buildInterleavedFusedRingSMILES(fusedRing, buildSMILES);  // needs ALL meta
  }
  return buildSimpleFusedRingSMILES(fusedRing, buildSMILES);  // needs ZERO meta
}
```

The **simple path** (`buildSimpleFusedRingSMILES`) uses only `offset`, `size`, `atoms`, `substitutions`, `attachments`, and `bonds` — all structural properties that exist on the Ring node already. It computes positions arithmetically from offsets. No metadata needed.

The **interleaved path** (`buildInterleavedFusedRingSMILES`) reads `metaAllPositions`, `metaBranchDepthMap`, `metaSequentialRings`, `metaAtomValueMap`, `metaBondMap`, `metaRingOrderMap`, `metaSeqAtomAttachments` — 7 metadata properties that only the parser knows.

The decompiler dumps meta because it assumes the codegen will use the interleaved path. But if we could make generated code go through the **simple path** instead, no metadata is needed.

## Why Generated Code Can't Use the Simple Path Today

The simple path fails for two reasons:

1. **It doesn't handle branch depths.** When a ring's atom traversal crosses branch boundaries (e.g., ring 2 in `CC2=CC=C(C=C2)`), the simple path doesn't emit the parentheses for branch nesting. The interleaved path does, because it reads `metaBranchDepthMap`.

2. **It doesn't handle sequential rings.** When a fused ring system has continuation rings after the base rings (like Telmisartan's 6-ring system), the simple path doesn't know about them.

But wait — for problem #1, there's already a separate codegen path: `buildBranchCrossingRingSMILES`. This handles branch depths for **individual rings** using `metaBranchDepths` (a simple array on the ring). The decompiler already emits `branchDepths` in the Ring constructor options for these cases.

## The Strategy: Make Everything Go Through the Simple Path

Instead of trying to make `layout()` reproduce the parser's exact metadata, **eliminate the need for the interleaved path entirely for generated code**.

### What the simple path needs to handle everything

The simple path today handles:
- ✅ Multiple rings with offsets
- ✅ Substitutions on ring atoms
- ✅ Attachments on ring atoms (as branches)
- ✅ Bond types between atoms

What it's missing:
- ❌ Sequential rings (continuation rings after the fused group)
- ❌ Non-ring atoms between ring positions (sequential linear atoms)
- ❌ Ring ordering when multiple rings close at the same position

### The fix: Extend the simple path instead of patching the interleaved one

**Key realization**: The simple path and `buildBranchCrossingRingSMILES` together already handle branch depths correctly using only structural info + `branchDepths` arrays. The only things truly missing are sequential rings and non-ring atoms.

For generated code, we can handle these by converting them to structural equivalents that the simple path already supports:

1. **Sequential rings** → convert to attachments on the last ring position
2. **Non-ring atoms** → convert to linear attachments
3. **Ring order at shared positions** → already deterministic from ring number ordering

---

## Implementation Plan

### Step 1: Make `layout()` skip when not needed

**Problem**: `fuse()` calls `computeFusedRingPositions()` which sets `metaPositions` on all rings. Once `metaPositions` exists, the codegen switches to the interleaved path. This is why even simple `.fuse()` calls end up in the interleaved codegen — and then the decompiler has to dump all the metadata.

**Fix**: `computeFusedRingPositions()` should NOT set `metaPositions` on rings when the fusion is simple enough for the offset-based codegen. Or better: the codegen dispatcher should check for a different condition than just `metaPositions` existing.

**Change in `smiles-codegen-core.js`**:
```javascript
function buildFusedRingSMILES(fusedRing) {
  // Use interleaved only if explicitly marked (parser-created with complex structure)
  if (fusedRing.metaUseInterleavedCodegen) {
    return buildInterleavedFusedRingSMILES(fusedRing, buildSMILES);
  }
  return buildSimpleFusedRingSMILES(fusedRing, buildSMILES);
}
```

The parser sets `metaUseInterleavedCodegen = true`. The API constructors don't. Generated code from the decompiler never emits it.

**Files**: `src/codegen/smiles-codegen-core.js`, `src/parser/ring-group-builder.js`

**Test**: Run full suite. Any fused ring that was previously going through simple path still works. Parser-created fused rings still go through interleaved.

---

### Step 2: Extend simple-fused-ring.js to handle branch-crossing positions

**Problem**: The simple path doesn't emit parentheses when a ring's traversal crosses branch boundaries.

**Fix**: Read `branchDepths` from each ring (already set by the Ring constructor when `branchDepths` option is provided). When walking positions, track depth and emit `(` / `)` for depth changes — same logic as `branch-walker.js` but operating on the offset-based positions.

This is essentially merging `buildBranchCrossingRingSMILES` logic into `buildSimpleFusedRingSMILES`. The individual `branchDepths` arrays on each ring provide per-atom depth information that lets us compute the fused ring's branch depth map at codegen time.

**Files**: `src/codegen/simple-fused-ring.js`

**Test**: Run full suite. Test specifically with molecules that have branch-crossing rings in fused systems (e.g., Rosuvastatin's pyrimidine ring).

---

### Step 3: Extend simple-fused-ring.js to handle ring ordering at shared positions

**Problem**: When two rings share an atom (the fusion point), the simple path needs to know which ring's closure marker to emit first. Currently it emits opens before closes but doesn't order the closes.

**Fix**: At shared positions (where multiple rings close), sort close markers by ring number (ascending). This is already deterministic from the ring structure. The parser's `metaRingOrderMap` encodes the same thing but using parser-discovered ordering — for generated code, ring-number ordering is sufficient and produces valid SMILES.

The generated SMILES won't be byte-identical to the parser's original SMILES, but it will be chemically equivalent and will stabilize on round-trip.

**Files**: `src/codegen/simple-fused-ring.js`

**Test**: Run full suite. Some integration test snapshots will change (different but equivalent SMILES). Round-trip tests must still pass (stabilize).

---

### Step 4: Handle sequential rings via `addSequentialRings` properly

**Problem**: `addSequentialRings` stores sequential rings in `metaSequentialRings` but currently the only codegen that knows about sequential rings is the interleaved path.

**Fix**: Two options:

**Option A (preferred)**: Make `addSequentialRings` convert sequential rings into structural attachments that the simple codegen already handles. A sequential ring is just a ring that's attached after the last atom of the fused system — structurally it's an attachment.

When `addSequentialRings` is called:
1. Don't store as `metaSequentialRings`
2. Instead, attach each sequential ring as an attachment on the appropriate position of the last base ring
3. The simple codegen naturally emits attachments as branches `(...)`

**Option B**: Extend `buildSimpleFusedRingSMILES` to also walk sequential rings after the base rings, using their offsets to compute positions.

Option A is cleaner because it means the codegen doesn't need to change at all.

**Files**: `src/manipulation.js` (fusedRingAddSequentialRings), `src/method-attachers.js`

**Test**: Parse Telmisartan, regenerate code, execute, verify round-trip stabilizes.

---

### Step 5: Handle non-ring atoms (sequential linear atoms)

**Problem**: Some fused ring systems have atoms between ring positions that aren't part of any ring (e.g., a carbon bridge). The interleaved path handles these via `metaSeqAtomAttachments`.

**Fix**: Same approach as Step 4 — convert non-ring atoms to structural attachments during `addSequentialRings` or `addSequentialAtomAttachment`. These atoms become Linear attachments on the nearest ring position.

The decompiler's `decompileFusedRingWithInjection` already does this conceptually (it calls `injectSequentialAtomsAsAttachments`). The fix is to do this at the API level instead of the decompiler level.

**Files**: `src/manipulation.js`, `src/method-attachers.js`

**Test**: Full suite. Molecules with non-ring atoms in fused systems must round-trip correctly.

---

### Step 6: Update the decompiler — collapse to 2 paths

**After steps 1-5**, the decompiler can be simplified:

1. **Parser-created fused rings** → Use `decompileInterleavedFusedRing` (keep as-is, metadata comes from parser)
2. **Everything else** → Use `decompileSimpleFusedRing` (no metadata)

Delete `decompileComplexFusedRing` and `decompileFusedRingWithInjection`. The complex/injection cases are now handled by the simple path because `addSequentialRings` converts sequential rings to structural attachments.

For the simple path, the decompiler emits:
```javascript
const v1 = Ring({ atoms: 'C', size: 5, bonds: [...], branchDepths: [...] });
const v2 = v1.substitute(2, 'N');
const v3 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, ... });
const v4 = v2.fuse(2, v3);
```

No meta. The `branchDepths` option on Ring is structural (it's an input to the constructor, not computed metadata).

**Files**: `src/decompiler.js`

**Test**: Full suite. All integration test snapshots will change. Round-trip tests must pass.

---

### Step 7: Relax round-trip test assertions for generated code

**Problem**: Integration tests assert `reconstructed.smiles === ORIGINAL_SMILES` (exact match). Since the simple codegen may produce different (but equivalent) atom ordering, some molecules won't have exact round-trip anymore.

**Fix**: Change the codegen round-trip assertion from exact match to stabilization:

```javascript
// Before
expect(reconstructed.smiles).toBe(TELMISARTAN_SMILES);

// After
const rt2 = parse(reconstructed.smiles);
expect(rt2.smiles).toBe(reconstructed.smiles);  // stabilizes
```

This still verifies the generated code produces valid, consistent SMILES. It just doesn't require it to be the exact same atom ordering as the original. The original exact-match test on `ast.smiles` (parse round-trip) remains unchanged.

**Files**: `test-integration/*.test.js`

**Test**: Full suite must pass with new assertions.

---

### Step 8: Update snapshots and verify

**What**: Delete all old snapshots, regenerate them. Review the new generated code to confirm it's readable.

**Expected outcome for Telmisartan**:
```javascript
export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 1, 1, 2, 2] });
export const v6 = v4.fuse(2, v5);
// sequential rings become attachments or are added via addSequentialRings
// ...
// NO META LINES
export const vN = Molecule([v1, ..., vM]);
```

**Files**: `test-integration/__snapshots__/*.snap`

---

## What This Plan Does NOT Do

- **Does not change how the parser works.** The parser still creates full metadata. Parser-created ASTs still go through the interleaved codegen for exact SMILES reproduction.
- **Does not change `layout()`.** The existing `computeFusedRingPositions` stays as-is. It's used by the API constructors to set up position data for the simple codegen.
- **Does not guarantee byte-identical SMILES from generated code.** Generated code produces valid, stabilizing SMILES that may differ in atom ordering from the parser's output. This is acceptable because the generated code is meant to be read and modified by humans — exact byte fidelity to the original SMILES is not a goal.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Simple codegen produces incorrect SMILES for complex fusions | Every integration test verifies round-trip stabilization. If any molecule fails, we know immediately. |
| Sequential ring → attachment conversion loses information | Compare `ast.smiles` from both paths for every test molecule. They must be chemically equivalent. |
| branchDepths on Ring constructor not always correct | branchDepths already works for branch-crossing rings. Extending to fused rings uses the same mechanism. |
| Some molecules genuinely need the interleaved path | Keep the interleaved path for parser-created ASTs. Only generated code (from decompiler) uses the simple path. |

## Summary

The previous plan tried to make `layout()` reproduce the parser's exact metadata so the interleaved codegen could work without manual meta assignments. That approach failed because the metadata encodes parse order, not structure.

This plan takes the opposite approach: **don't use the interleaved codegen for generated code at all.** Instead:
1. Make the simple codegen handle branch depths and ring ordering
2. Convert sequential rings to structural attachments
3. Let the decompiler emit only structural API calls (Ring, fuse, substitute, attach)
4. Accept that generated SMILES may differ from parsed SMILES (but must be valid and stabilizing)

The result: zero meta lines in generated code.
