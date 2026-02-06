# Execution Plan

Unified step-by-step todo combining READABLE_GENERATED_CODE.md and REFACTOR_PLAN.md into a dependency-aware execution order. Each step includes what to do, what files to touch, and when to run tests.

---

## Phase 1: Safe Mechanical Cleanup (no behavior change)

These steps reduce noise and make subsequent work easier. All are low-risk, no behavior change.

### Step 1: Delete dead duplicates from smiles-parser-core.js

**What**: Delete the 9 duplicated functions from `smiles-parser-core.js` and import from utility files instead.

**Files**:
- `src/parser/smiles-parser-core.js` — delete duplicated functions, add imports
- `src/parser/ring-utils.js` — may need to export functions that were only used internally
- `src/parser/branch-utils.js` — same
- `src/parser/ring-node-builder.js` — same

**Functions to delete from smiles-parser-core.js**:
1. `findNextSeqAtom()` (lines 26-33) → import from branch-utils.js
2. `isInSameBranchContext()` (lines 39-60) → import from ring-utils.js
3. `collectRingPath()` (lines 83-157) → import from ring-utils.js
4. `collectBranchChain()` (lines 162-189) → import from branch-utils.js
5. `ringsShareAtoms()` (lines 194-197) → import from ring-utils.js
6. `groupFusedRings()` (lines 203-241) → import from ring-utils.js
7. `calculateOffset()` (lines 246-256) → import from ring-utils.js
8. `buildLinearNodeSimpleInternal` (lines 282-332) → import from ring-node-builder.js
9. `buildSingleRingNodeWithContext()` (lines 343-529) → import from ring-node-builder.js

**Verify**: Check that the utility file versions have the same signatures. If the smiles-parser-core.js versions have extra parameters or different behavior, reconcile before deleting.

**Test**: Run full test suite. Every existing test must pass unchanged.

**Expected result**: ~400 fewer lines in smiles-parser-core.js.

---

### Step 2: Eliminate forward declarations

**What**: Replace `let xxxInternal` forward declaration pattern with parameter passing.

**Files**:
- `src/codegen/smiles-codegen-core.js` — remove `let buildSMILESInternal`, pass `buildSMILES` as parameter to `buildRingSMILES`, `buildLinearSMILES`, `buildMoleculeSMILES`, `buildFusedRingSMILES`
- `src/decompiler.js` — remove `let decompileNodeInternal`, pass `decompile` as parameter
- `src/parser/ring-node-builder.js` — remove `let buildLinearNodeSimpleInternal`, pass as parameter
- `src/parser/smiles-parser-core.js` — remove `let buildBranchWithRingsInternal` and `let buildLinearNodeSimpleInternal` (if not already removed in Step 1), pass as parameters

**Pattern**: The codegen files (`interleaved-fused-ring.js`, `branch-crossing-ring.js`) already use this pattern — they receive `buildSMILES` as a parameter. Apply consistently everywhere.

**Test**: Run full test suite.

---

### Step 3: Create metadata contract (src/metadata.js)

**What**: Create `src/metadata.js` with named constants for all 18 meta* property keys. Don't replace usages yet — just create the file as documentation.

**Files**:
- `src/metadata.js` — new file with constants

**Note**: Replacing `node.metaPositions` with `node[META_POSITIONS]` across the codebase is a separate, optional step. For now just create the constants file as a reference. We'll use the constants in new code going forward.

**Test**: No test needed (new file only, no imports yet).

---

## Phase 2: Structural Splits (no behavior change)

These split large files into smaller ones. Pure code moves, no logic changes.

### Step 4: Break up computeFusedRingPositions() into src/layout/

**What**: Extract the 704-line `computeFusedRingPositions()` from constructors.js into a `src/layout/` directory with one file per fusion topology.

**Files to create**:
- `src/layout/index.js` — orchestrator (~80 lines)
- `src/layout/classify-rings.js` — classifyInnerRings()
- `src/layout/build-fusion-graph.js` — buildFusionGraph()
- `src/layout/traverse-inside.js` — traverseInsideFusion()
- `src/layout/traverse-extending.js` — traverseExtendingFusion()
- `src/layout/traverse-endpoint.js` — traverseEndpointFusion()
- `src/layout/traverse-start-sharing.js` — traverseStartSharingFusion()
- `src/layout/traverse-spiro.js` — traverseSpiroFusion()
- `src/layout/traverse-chained.js` — traverseChainedRing()
- `src/layout/build-ring-order-map.js` — buildRingOrderMap()
- `src/layout/apply-branch-depths.js` — applyRingBranchDepthsToFusedRing()

**Files to modify**:
- `src/constructors.js` — delete computeFusedRingPositions() and applyRingBranchDepthsToFusedRing(), import from layout/

**Test**: Run full test suite after each sub-extraction if needed. All existing tests must pass.

---

### Step 5: Split constructors.js into focused modules

**What**: Extract the remaining concerns from constructors.js into separate files.

**Files to create**:
- `src/clone-utils.js` — cloneAttachments, cloneSubstitutions, deepCloneRing, etc. (~50 lines)
- `src/method-attachers.js` — attachSmilesGetter, attachRingMethods, attachLinearMethods, etc. (~180 lines)
- `src/node-creators.js` — createRingNode, createLinearNode, createFusedRingNode, createMoleculeNode (~80 lines)

**Files to modify**:
- `src/constructors.js` — becomes thin public API (~120 lines): Ring(), Linear(), FusedRing(), Molecule(), RawFragment() importing from the above

**Test**: Run full test suite.

---

### Step 6: Consolidate codegen's duplicate branch-depth tracking

**What**: Extract shared branch-depth walking logic from `interleaved-fused-ring.js` and `branch-crossing-ring.js` into a shared utility.

**Files to create**:
- `src/codegen/branch-walker.js` — `walkPositionsWithBranching()` utility

**Files to modify**:
- `src/codegen/interleaved-fused-ring.js` — use branch-walker
- `src/codegen/branch-crossing-ring.js` — use branch-walker

**Test**: Run full test suite. Round-trip tests are critical here.

**Expected result**: ~150 fewer lines of duplicated depth-tracking.

---

## Phase 3: The layout() Feature (behavior change — new API)

This is the READABLE_GENERATED_CODE plan. Depends on Phase 2 (layout/ directory exists).

### Step 7: Enhance layout to compute atom-level maps

**What**: Extend `computeFusedRingPositions()` (now in `src/layout/index.js`) to also compute:
- `metaAtomValueMap` — derive from ring atoms + substitutions
- `metaBondMap` — derive from ring bonds
- `metaRingOrderMap` — derive from ring numbers at shared positions

Currently it only computes position-level metadata (metaPositions, metaStart, metaEnd, metaAllPositions, metaBranchDepthMap). The interleaved codegen also needs atom-level maps.

**Files**:
- `src/layout/index.js` — add atom/bond/ring-order map computation
- May need new files in `src/layout/` for the map-building logic

**Test**: Write new unit tests for the enhanced layout. Verify that for every molecule in the test suite, the layout-computed maps match what the parser produces.

---

### Step 8: Add addSequentialRings() API method

**What**: Add a method to FusedRing that accepts sequential continuation rings and recomputes layout.

**API**:
```javascript
fusedRing.addSequentialRings(rings, options)
// rings: Ring[] — sequential continuation rings
// options.atomAttachments: { position: [node] } — attachments on non-ring atoms
// Returns: new FusedRing with metaSequentialRings set and layout recomputed
```

**Files**:
- `src/method-attachers.js` (or `src/constructors.js`) — add the method
- `src/layout/index.js` — handle sequential rings in layout computation

**Test**: New tests. Parse molecules with sequential rings, call addSequentialRings() to rebuild, verify SMILES output matches.

---

### Step 9: Add addSequentialAtomAttachment() API method

**What**: Add a method for attaching nodes to non-ring atoms in the sequential part of a fused ring system.

**API**:
```javascript
fusedRing.addSequentialAtomAttachment(position, attachment)
// Returns: new FusedRing with attachment added and layout recomputed
```

**Files**:
- `src/method-attachers.js` (or `src/constructors.js`) — add the method

**Test**: New tests. Verify that attachments on sequential atoms produce correct SMILES.

---

### Step 10: Update decompiler to emit new API calls

**What**: Change the decompiler to emit `addSequentialRings()` and `addSequentialAtomAttachment()` instead of raw meta* assignments. Collapse the 4 fused ring decompilation paths into one.

**Files**:
- `src/decompiler.js` — rewrite fused ring decompilation
  - Delete `decompileSimpleFusedRing()`, `decompileComplexFusedRing()`, `decompileInterleavedFusedRing()`, `decompileFusedRingWithInjection()`
  - Replace with single `decompileFusedRing()` that:
    1. Decompiles each ring (substitutions + attachments)
    2. Emits `.fuse()` call
    3. If sequential rings: emits `.addSequentialRings()`
    4. If seq atom attachments: emits `.addSequentialAtomAttachment()`
    5. No meta* assignments

**Test**: Run full test suite. Update all integration test snapshots (generated code will be shorter). Verify round-trip fidelity: parse → toCode → eval → .smiles must match original.

**Expected result**: Decompiler drops from ~917 lines to ~400 lines.

---

### Step 11: Remove simple-fused-ring codegen path (if possible)

**What**: Once all fused rings have position data (because layout() always runs), `buildSimpleFusedRingSMILES` may be unnecessary. All fused rings can go through the interleaved builder.

**Files**:
- `src/codegen/simple-fused-ring.js` — delete if no longer needed
- `src/codegen/smiles-codegen-core.js` — remove fallback to simple builder

**Test**: Run full test suite. If any tests fail, keep the simple path for those cases.

---

## Phase 4: Parser Cleanup (highest risk, do last)

### Step 12: Split smiles-parser-core.js into focused modules

**What**: After Step 1 removed duplicates, split the remaining ~1,000 lines into:
- `src/parser/smiles-parser-core.js` — parse() + buildAtomList() (~200 lines)
- `src/parser/ast-builder.js` — buildAST() + buildBranchWithRings() (~200 lines)
- `src/parser/ring-group-builder.js` — buildRingGroupNodeWithContext() (~300 lines)

**Files to create**:
- `src/parser/ast-builder.js`
- `src/parser/ring-group-builder.js`

**Files to modify**:
- `src/parser/smiles-parser-core.js` — keep only parse() + buildAtomList()
- `src/parser/index.js` — update re-exports if needed

**Test**: Run full test suite. Parser is the most fragile part — run every test after each extraction.

---

### Step 13: Break up buildRingGroupNodeWithContext() (405 lines)

**What**: Split the 405-line function into focused sub-functions:
- `separateFusedFromSequential()` — classify which rings are truly fused vs sequential
- `collectAllPositions()` — iterative loop finding sequential continuation atoms
- `buildMetadataMaps()` — build branchDepthMap, atomValueMap, bondMap, etc.
- `buildFusedRingNode()` — assemble final FusedRing from rings + metadata

**Files**:
- `src/parser/ring-group-builder.js` — split into sub-functions (can stay in same file or extract)

**Test**: Run full test suite after each extraction.

---

## Checkpoint Summary

| Phase | Steps | Risk | Lines Removed | New Capability |
|-------|-------|------|--------------|----------------|
| 1: Mechanical cleanup | 1-3 | Very low | ~400 | Cleaner imports, no forward decls |
| 2: Structural splits | 4-6 | Low | ~150 duplication | Focused modules, testable units |
| 3: layout() feature | 7-11 | Medium | ~500 from decompiler | Readable generated code |
| 4: Parser cleanup | 12-13 | Medium-high | 0 (reorganization) | Maintainable parser |

**Total estimated reduction**: ~1,050 lines removed, ~10 new focused files created, generated code goes from 34 lines to 16 lines for Telmisartan.

---

## Rules

1. **Run tests after every step**. No exceptions.
2. **Commit after every step**. Each step should be a clean, revertible commit.
3. **Don't combine steps**. If something breaks, you need to know exactly which step caused it.
4. **Phase 3 depends on Phase 2**. Phase 4 is independent but riskiest, so do it last.
5. **Phase 1 steps are independent** of each other and can be done in any order.
