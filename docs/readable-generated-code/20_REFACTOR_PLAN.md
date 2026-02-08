# Codebase Refactor Plan

## Current State

~4,400 lines of source code across 19 files. The codebase works and has good test coverage, but has grown organically and accumulated significant complexity in a few places.

### Headline numbers
- **constructors.js**: 1,249 lines (one function alone is 704 lines)
- **smiles-parser-core.js**: 1,430 lines (5 functions over 100 lines each)
- **decompiler.js**: 917 lines (3 different fused ring decompilation paths)
- **5 forward declarations** for mutual recursion across 4 files
- **18 different `meta*` properties** accessed by string name with no formal contract
- **6+ functions duplicated** between smiles-parser-core.js and the utility files

---

## Refactor 1: Delete Dead Duplicates in smiles-parser-core.js

### Problem

`smiles-parser-core.js` contains full copies of functions that were extracted into utility files but never deleted from the original. Both copies are used by different callers.

| Function | In smiles-parser-core.js | In utility file |
|----------|-------------------------|-----------------|
| `isInSameBranchContext()` | lines 39-60 | ring-utils.js:9-26 |
| `collectRingPath()` | lines 83-157 | ring-utils.js:81-126 |
| `collectBranchChain()` | lines 162-189 | branch-utils.js:20-44 |
| `ringsShareAtoms()` | lines 194-197 | ring-utils.js:131-134 |
| `groupFusedRings()` | lines 203-241 | ring-utils.js:139-174 |
| `calculateOffset()` | lines 246-256 | ring-utils.js:179-188 |
| `findNextSeqAtom()` | lines 26-33 | branch-utils.js:8-15 |
| `buildSingleRingNodeWithContext()` | lines 343-529 | ring-node-builder.js:114-200 |
| `buildLinearNodeSimpleInternal` | lines 282-332 | ring-node-builder.js:64-107 |

### Fix

1. Delete the duplicated functions from `smiles-parser-core.js`
2. Import them from `ring-utils.js`, `branch-utils.js`, and `ring-node-builder.js`
3. The utility file versions are cleaner (smaller, better decomposed) -- use those

This alone should cut ~400 lines from `smiles-parser-core.js`.

---

## Refactor 2: Break Up `computeFusedRingPositions()` (704 lines)

### Problem

`constructors.js` lines 338-1042 is a single function that handles every possible fused ring topology: inside, extending, endpoint, chained, spiro, and start-sharing fusions. It's deeply nested (8+ levels) and nearly impossible to reason about.

### Fix

Extract each fusion type into its own function:

```
src/layout/
  index.js                    - computeFusedRingPositions() orchestrator (~80 lines)
  classify-rings.js           - classifyInnerRings(): inside/extending/endpoint/chained/spiro (~50 lines)
  build-fusion-graph.js       - buildFusionGraph(): ring adjacency graph (~40 lines)
  traverse-inside.js          - traverseInsideFusion(): handle inside rings (~60 lines)
  traverse-extending.js       - traverseExtendingFusion(): handle extending rings (~120 lines)
  traverse-endpoint.js        - traverseEndpointFusion(): handle endpoint rings (~30 lines)
  traverse-start-sharing.js   - traverseStartSharingFusion(): handle start-sharing (~100 lines)
  traverse-spiro.js           - traverseSpiroFusion(): handle spiro rings (~30 lines)
  traverse-chained.js         - traverseChainedRing(): handle chained rings (~80 lines)
  build-ring-order-map.js     - buildRingOrderMap(): ring closure ordering (~40 lines)
  apply-branch-depths.js      - applyRingBranchDepthsToFusedRing() (~20 lines)
```

Each file handles one concern. The orchestrator calls them in order. This turns one 704-line monster into ~10 focused functions averaging 60 lines each.

---

## Refactor 3: Split `constructors.js` Into Focused Modules

### Problem

`constructors.js` (1,249 lines) does 5 unrelated things:
1. Clone utilities (lines 43-89)
2. SMILES getter + method attachment (lines 95-267)
3. Internal node creators (lines 273-1110) -- includes the 704-line `computeFusedRingPositions`
4. Public constructors: Ring, Linear, FusedRing, Molecule (lines 1114-1210)
5. RawFragment (lines 1226-1248)

### Fix

```
src/
  constructors.js             - Public API: Ring(), Linear(), FusedRing(), Molecule(), RawFragment() (~120 lines)
  node-creators.js            - createRingNode, createLinearNode, createFusedRingNode, createMoleculeNode (~80 lines)
  method-attachers.js         - attachSmilesGetter, attachRingMethods, attachLinearMethods, etc. (~180 lines)
  clone-utils.js              - cloneAttachments, cloneSubstitutions, deepCloneRing, etc. (~50 lines)
  layout/                     - (from Refactor 2)
```

`constructors.js` becomes a thin public API file that imports from the others. The circular dependency between constructors.js and decompiler.js (constructors imports decompile for toCode()) becomes cleaner since only method-attachers.js needs the decompile import.

---

## Refactor 4: Define a Metadata Contract

### Problem

18 `meta*` properties are accessed by string name across 12 files with no formal contract. Adding, renaming, or removing a property requires grep-and-pray. The parser sets them, the codegen reads them, the decompiler dumps them -- but there's no single place that defines what exists.

### Fix

Create `src/metadata.js` with:

1. **Named constants** for all meta property keys
2. **Getter/setter helpers** that use the constants
3. **JSDoc types** documenting the shape

```javascript
// src/metadata.js

// Ring-level metadata keys
export const META_POSITIONS = 'metaPositions';
export const META_START = 'metaStart';
export const META_END = 'metaEnd';
export const META_BRANCH_DEPTHS = 'metaBranchDepths';
export const META_LEADING_BOND = 'metaLeadingBond';
export const META_PARENT_INDICES = 'metaParentIndices';
export const META_IS_SIBLING = 'metaIsSibling';

// FusedRing-level metadata keys
export const META_ALL_POSITIONS = 'metaAllPositions';
export const META_TOTAL_ATOMS = 'metaTotalAtoms';
export const META_BRANCH_DEPTH_MAP = 'metaBranchDepthMap';
export const META_ATOM_VALUE_MAP = 'metaAtomValueMap';
export const META_BOND_MAP = 'metaBondMap';
export const META_PARENT_INDEX_MAP = 'metaParentIndexMap';
export const META_RING_ORDER_MAP = 'metaRingOrderMap';
export const META_SEQUENTIAL_RINGS = 'metaSequentialRings';
export const META_SEQ_ATOM_ATTACHMENTS = 'metaSeqAtomAttachments';

// Inter-component metadata keys
export const META_CONNECTS_TO_COMPONENT = 'metaConnectsToComponent';
export const META_CONNECTS_AT_POSITION = 'metaConnectsAtPosition';
```

Then replace all string-based access (`node.metaPositions`) with constant-based access (`node[META_POSITIONS]`). This enables:
- Find-all-references in IDEs
- Compile-time checks if we ever move to TypeScript
- A single source of truth for what metadata exists

**Note**: This is not an urgent refactor. It's mechanical and can be done incrementally. The main value is documentation -- having one file that lists every meta property with its type and purpose.

---

## Refactor 5: Consolidate Decompiler's 3 FusedRing Paths

### Problem

The decompiler has 3 separate functions for decompiling fused rings, with significant overlap:

1. `decompileSimpleFusedRing()` - 36 lines - no sequential rings, no interleaving
2. `decompileComplexFusedRing()` - 136 lines - has sequential rings
3. `decompileInterleavedFusedRing()` - 152 lines - has interleaved/branch-crossing patterns

Plus `decompileFusedRingWithInjection()` (76 lines) for a 4th variant.

All 4 share the same pattern: create rings, add substitutions, add attachments, set metadata, fuse. The differences are which metadata to emit and how.

### Fix

This is mostly subsumed by the READABLE_GENERATED_CODE plan. Once the `layout()` method exists and the decompiler emits API calls instead of raw metadata, all 4 paths collapse into one:

```javascript
function decompileFusedRing(fusedRing, indent, nextVar) {
  // 1. Decompile each ring (substitutions + attachments)
  // 2. Fuse them
  // 3. If sequential rings: emit addSequentialRings()
  // 4. If seq atom attachments: emit addSequentialAtomAttachment()
  // Done. No metadata dumping.
}
```

This would cut the decompiler from ~917 lines to ~400.

---

## Refactor 6: Consolidate Codegen's 3 FusedRing SMILES Builders

### Problem

Similar to the decompiler, the codegen has 3 separate SMILES builders:

1. `buildSimpleFusedRingSMILES()` - 124 lines - offset-based, no position data
2. `buildInterleavedFusedRingSMILES()` - 252 lines - position-based, handles branch depths
3. `buildBranchCrossingRingSMILES()` - 231 lines - for rings crossing branch boundaries

`buildInterleavedFusedRingSMILES` and `buildBranchCrossingRingSMILES` share almost identical branch depth tracking and pending-attachment logic.

### Fix

Extract the shared branch-depth walker into a utility:

```javascript
// src/codegen/branch-walker.js
export function walkPositionsWithBranching(positions, branchDepthMap, callbacks) {
  // Shared loop: track currentDepth, open/close parens, call callbacks for each position
  // callbacks: { onAtom, onBranchOpen, onBranchClose, onPendingAttachment }
}
```

Then both `buildInterleavedFusedRingSMILES` and `buildBranchCrossingRingSMILES` become thin wrappers that provide callbacks. This eliminates ~150 lines of duplicated depth-tracking logic.

Separately, once `layout()` from READABLE_GENERATED_CODE plan is complete, `buildSimpleFusedRingSMILES` may become unnecessary (all fused rings would have position data, so the interleaved builder handles everything).

---

## Refactor 7: Eliminate Forward Declarations

### Problem

5 forward declarations exist for mutual recursion:

| File | Declaration | Reason |
|------|-------------|--------|
| decompiler.js | `let decompileNodeInternal` | decompileRing calls decompileNodeInternal for attachments |
| smiles-codegen-core.js | `let buildSMILESInternal` | buildRingSMILES calls buildSMILES for attachments |
| ring-node-builder.js | `let buildLinearNodeSimpleInternal` | buildNodeFromAtoms calls buildLinear |
| smiles-parser-core.js | `let buildBranchWithRingsInternal` | buildNodeFromAtoms calls buildBranchWithRings |
| smiles-parser-core.js | `let buildLinearNodeSimpleInternal` | (same pattern) |

### Fix

For each case, the mutual recursion follows the same pattern: a dispatcher function calls a type-specific handler, and the handler needs to call back into the dispatcher for child nodes. The fix is to pass the dispatcher as a parameter:

```javascript
// Before
let buildSMILESInternal;
function buildRingSMILES(ring) {
  // ... uses buildSMILESInternal(attachment) for child nodes
}
buildSMILESInternal = function(ast) { ... };

// After
function buildRingSMILES(ring, buildSMILES) {
  // ... uses buildSMILES(attachment) for child nodes
}
function buildSMILES(ast) {
  if (isRingNode(ast)) return buildRingSMILES(ast, buildSMILES);
  // ...
}
```

This pattern is already used in `interleaved-fused-ring.js` and `branch-crossing-ring.js` (they receive `buildSMILES` as a parameter). Apply it consistently everywhere.

---

## Refactor 8: Clean Up `smiles-parser-core.js`

### Problem

After removing duplicates (Refactor 1), `smiles-parser-core.js` still has ~1,000 lines with 3 major responsibilities:
1. `buildAtomList()` - Pass 1: tokenize and build flat atom list
2. `buildAST()` - Pass 2: group atoms into rings/linear chains
3. `buildRingGroupNodeWithContext()` - the most complex function (405 lines) that handles sequential rings, truly-fused vs sequential ring separation, and metadata computation

### Fix

After Refactor 1 (delete duplicates) and importing from utility files:

```
src/parser/
  smiles-parser-core.js       - parse() entry point + buildAtomList() (~200 lines)
  ast-builder.js              - buildAST() + buildBranchWithRings() (~200 lines)
  ring-group-builder.js       - buildRingGroupNodeWithContext() + fused ring grouping (~300 lines)
  ring-node-builder.js        - (already exists) buildSingleRingNodeWithContext + buildLinear
  ring-utils.js               - (already exists) collectRingPath, groupFusedRings, etc.
  branch-utils.js             - (already exists) collectBranchChain, findNextSeqAtom, etc.
  atom-builder.js             - (already exists) atom creation utilities
  index.js                    - re-exports parse and buildAtomList
```

The key insight: `buildRingGroupNodeWithContext` (405 lines) is doing too many things. It should be split into:
- `separateFusedFromSequential()` - determine which rings are truly fused vs sequential
- `collectAllPositions()` - the iterative loop that finds sequential continuation atoms
- `buildMetadataMaps()` - build branchDepthMap, atomValueMap, bondMap, etc.
- `buildFusedRingNode()` - assemble the final FusedRing from rings + metadata

---

## Priority Order

| Priority | Refactor | Impact | Risk | Effort |
|----------|----------|--------|------|--------|
| 1 | Delete dead duplicates | -400 lines, no behavior change | Very low | Small |
| 2 | Break up computeFusedRingPositions | Testability, readability | Low | Medium |
| 3 | Split constructors.js | Maintainability, dependency clarity | Low | Medium |
| 4 | Consolidate decompiler paths | -500 lines (with READABLE_GENERATED_CODE) | Medium | Medium |
| 5 | Consolidate codegen paths | -150 lines of duplication | Low | Small |
| 6 | Eliminate forward declarations | Cleaner recursion pattern | Low | Small |
| 7 | Clean up smiles-parser-core | Maintainability | Medium | Medium |
| 8 | Define metadata contract | Documentation, IDE support | Very low | Small |

Refactors 1, 6, and 8 are safe mechanical changes. Refactors 2 and 3 are structural splits with no behavior change. Refactors 4 and 5 depend on the READABLE_GENERATED_CODE plan being done first. Refactor 7 is the riskiest because the parser is the most complex and fragile part.

---

## What NOT to Refactor

- **tokenizer.js** (188 lines) - clean, focused, well-tested
- **ast.js** (74 lines) - simple type definitions
- **fragment.js** (41 lines) - thin wrapper
- **roundtrip.js** (208 lines) - standalone, clean
- **common.js** (59 lines) - simple molecule library
- **manipulation.js** (278 lines) - well-structured, each function is focused
- **Test files** - the integration tests have some overlap with unit tests, but they serve different purposes (regression vs unit). Not worth consolidating.
