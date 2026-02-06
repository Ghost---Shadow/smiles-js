# Plan: Making Auto-Generated Code Readable

## The Problem

When `toCode()` generates JavaScript construction code for complex molecules, the output is littered with `meta*` property assignments that are completely unreadable. Here's a real example from Telmisartan:

```javascript
// Readable part - this is great
export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null] });
export const v6 = v4.fuse(v5, 2);

// Unreadable garbage - what is any of this?
v6.rings[0].metaPositions = [3, 4, 5, 10, 11];
v6.rings[0].metaStart = 3;
v6.rings[0].metaEnd = 11;
v6.rings[1].metaPositions = [5, 6, 7, 8, 9, 10];
v6.rings[1].metaStart = 5;
v6.rings[1].metaEnd = 10;
v6.metaSequentialRings = [v9, v10, v11, v12];
v6.metaAllPositions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, ...];
v6.metaBranchDepthMap = new Map([[3, 0], [4, 0], [5, 0], ...]);
v6.metaAtomValueMap = new Map([[3, 'C'], [4, 'N'], [5, 'C'], ...]);
v6.metaBondMap = new Map([[4, '='], [6, '='], [8, '='], ...]);
v6.metaSeqAtomAttachments = new Map([[25, [v13]]]);
```

There are **18 distinct `meta*` properties** scattered across Ring, FusedRing, and attachment nodes. They fall into these categories:

### Category 1: Ring Position Metadata (on individual Rings inside FusedRings)
| Property | Type | Purpose |
|----------|------|---------|
| `metaPositions` | `number[]` | Global position indices for each atom in the ring |
| `metaStart` | `number` | Global position where ring starts |
| `metaEnd` | `number` | Global position where ring ends |

### Category 2: FusedRing-Level Traversal Metadata
| Property | Type | Purpose |
|----------|------|---------|
| `metaAllPositions` | `number[]` | All positions in the fused system (sorted) |
| `metaTotalAtoms` | `number` | Total atom count |
| `metaBranchDepthMap` | `Map<pos, depth>` | Branch depth at each position (for parenthesis placement) |
| `metaAtomValueMap` | `Map<pos, atom>` | Atom element at each position |
| `metaBondMap` | `Map<pos, bond>` | Bond character before each position |
| `metaParentIndexMap` | `Map<pos, parent>` | Parent atom index at each position |
| `metaRingOrderMap` | `Map<pos, number[]>` | Order of ring markers at each position |
| `metaSequentialRings` | `Ring[]` | Rings that follow inline (not fused, but sequential) |
| `metaSeqAtomAttachments` | `Map<pos, node[]>` | Attachments on sequential (non-ring) atoms |

### Category 3: Ring-Level Serialization Hints
| Property | Type | Purpose |
|----------|------|---------|
| `metaBranchDepths` | `number[]` | Branch depth per ring atom (branch-crossing detection) |
| `metaLeadingBond` | `string` | Bond before the ring in SMILES (e.g., `=`) |
| `metaParentIndices` | `number[]` | Parent indices from parser (debugging) |
| `metaIsSibling` | `boolean` | On attachments: sibling branch vs inline continuation |

### Category 4: Inter-Component Connection
| Property | Type | Purpose |
|----------|------|---------|
| `metaConnectsToComponent` | `number` | Which prior component a ring connects to |
| `metaConnectsAtPosition` | `number` | Position in prior component |

---

## Root Cause Analysis

These meta properties exist because the **codegen (SMILES serializer)** needs them to reconstruct the original SMILES string. The core issue is:

1. The **AST** (Ring, FusedRing, etc.) captures the *structural chemistry* (what atoms, what bonds, what's fused where)
2. The **codegen** needs to know the *serialization order* (which atom to write first, where to put ring markers, where to open/close parentheses)
3. The structural AST alone doesn't contain enough info to reconstruct the serialization order, so the parser stuffs extra position/depth/ordering metadata onto the nodes

The decompiler then faithfully dumps all this metadata into the generated code because without it, the reconstructed objects wouldn't produce correct SMILES.

---

## Proposed Solution: A `layout()` Method

Instead of requiring all meta properties to be manually set in generated code, introduce a **`layout()` method** on FusedRing (and Ring when it has sequential rings). This method computes all the meta properties from the structural information that's already on the node.

### What `layout()` Does

`layout()` takes the structural information (rings, their offsets, sizes, substitutions, attachments, sequential rings) and computes:
- `metaPositions` / `metaStart` / `metaEnd` for each ring
- `metaAllPositions` for the fused system
- `metaBranchDepthMap` from ring branchDepths and structural nesting
- `metaAtomValueMap` from ring atoms, substitutions, and sequential atom values
- `metaBondMap` from ring bonds and sequential bonds
- `metaRingOrderMap` from ring numbers and positions
- `metaSeqAtomAttachments` from sequential ring context

Most of this logic **already exists** in `computeFusedRingPositions()` in `constructors.js` (lines 338-1042). The difference is that `computeFusedRingPositions` only runs when rings are created via the API (not parser). We need to generalize it to also handle the complex case (sequential rings, atom value maps, bond maps).

### Before (current generated code)

```javascript
export const v1 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v2 = v1.substitute(2, 'N');
export const v3 = v2.substitute(5, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null] });
export const v5 = v3.fuse(v4, 2);
v5.rings[0].metaPositions = [3, 4, 5, 10, 11];
v5.rings[0].metaStart = 3;
v5.rings[0].metaEnd = 11;
// ... 20+ more lines of unreadable metadata
v5.metaBranchDepthMap = new Map([[3, 0], [4, 0], ...]);
v5.metaAtomValueMap = new Map([[3, 'C'], [4, 'N'], ...]);
v5.metaBondMap = new Map([[4, '='], [6, '='], ...]);
```

### After (proposed generated code)

```javascript
export const v1 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v2 = v1.substitute(2, 'N');
export const v3 = v2.substitute(5, 'N');
export const v4 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null] });
export const v5 = v3.fuse(v4, 2);
```

That's it. The `fuse()` method (and `FusedRing()` constructor) would call `layout()` internally, computing all the metadata automatically.

For cases with sequential rings, we'd need a new API method:

```javascript
export const v5 = v3.fuse(v4, 2);
export const v6 = Ring({ atoms: 'C', size: 5, ringNumber: 5, bonds: ['=', null, '=', null, null] });
export const v7 = v6.substitute(2, 'N');
export const v8 = v7.substitute(5, 'N');
export const v9 = v5.addSequentialRing(v8);

// Or alternatively, pass sequential rings at construction time:
export const v5 = v3.fuse(v4, 2, {
  sequentialRings: [v8, v10, v11, v12],
  sequentialAtomAttachments: { 25: [v13] }
});
```

---

## Implementation Plan

### Step 1: Enhance `computeFusedRingPositions()` to Handle Complex Cases

The existing function handles simple fused rings (2-3 rings with offsets). Extend it to also compute:
- `metaAtomValueMap` - derive from ring atoms + substitutions + sequential ring atoms
- `metaBondMap` - derive from ring bonds + sequential ring bonds
- `metaRingOrderMap` - derive from ring numbers at shared positions
- `metaSeqAtomAttachments` - pass through from sequential ring context

This function already handles inside/extending/endpoint/chained/spiro fusions. The enhancement is to also populate the atom-level maps that the interleaved codegen needs.

### Step 2: Add `addSequentialRing()` / `addSequentialRings()` to FusedRing

New API method that:
1. Accepts one or more Ring nodes that follow the fused ring inline (not fused, but sequential)
2. Stores them on `metaSequentialRings`
3. Recomputes the layout (all positions, atom values, bonds, branch depths)

```javascript
FusedRing.prototype.addSequentialRings = function(rings, options = {}) {
  // Store sequential rings
  // Recompute all position metadata
  // Return new FusedRing with everything computed
};
```

### Step 3: Add `addSequentialAtomAttachment()` to FusedRing

For attachments on non-ring atoms (like the `C(=O)O` group attached to position 25 in telmisartan):

```javascript
FusedRing.prototype.addSequentialAtomAttachment = function(position, attachment) {
  // Add attachment to metaSeqAtomAttachments
  // Return new FusedRing
};
```

### Step 4: Update Decompiler to Use New API

Change `decompileComplexFusedRing()` and `decompileInterleavedFusedRing()` to:
1. Emit `Ring(...)` / `.substitute()` / `.fuse()` calls as before
2. Emit `.addSequentialRings([...])` instead of manual `metaSequentialRings = [...]`
3. Emit `.addSequentialAtomAttachment(pos, node)` instead of manual `metaSeqAtomAttachments = new Map(...)`
4. **Stop emitting** all `meta*` assignments - the API methods handle it

### Step 5: Ensure `layout()` Runs at the Right Times

The layout computation should run:
- In `createFusedRingNode()` when rings don't have parser positions (already happens via `computeFusedRingPositions`)
- In `addSequentialRings()` after adding sequential rings
- In `addSequentialAtomAttachment()` after adding attachments
- **NOT** when loading from parser (parser already has exact positions from the original SMILES)

### Step 6: Update Tests

- Update all integration test snapshots (the generated code will be much shorter)
- Add new tests for `addSequentialRings()` and `addSequentialAtomAttachment()`
- Verify round-trip fidelity is preserved (parse -> toCode -> eval -> .smiles should match)

---

## What the Telmisartan Example Would Look Like After

```javascript
export const v1 = Linear(['C', 'C', 'C']);
export const v2 = Ring({ atoms: 'C', size: 5, bonds: ['=', null, '=', null, null] });
export const v3 = v2.substitute(2, 'N');
export const v4 = v3.substitute(5, 'N');
export const v5 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 2, bonds: ['=', null, '=', null, '=', null], branchDepths: [0, 0, 1, 1, 2, 2] });
export const v6 = v4.fuse(v5, 2);

export const v7 = Ring({ atoms: 'C', size: 5, ringNumber: 5, bonds: ['=', null, '=', null, null] });
export const v8 = v7.substitute(2, 'N');
export const v9 = v8.substitute(5, 'N');
export const v10 = Ring({ atoms: 'C', size: 6, ringNumber: 3, bonds: ['=', null, '=', null, '=', null], branchDepths: [2, 2, 2, 2, 3, 3] });
export const v11 = Ring({ atoms: 'C', size: 6, ringNumber: 6, bonds: ['=', null, '=', null, '=', null] });
export const v12 = Ring({ atoms: 'C', size: 6, ringNumber: 4, bonds: ['=', null, '=', null, '=', null] });
export const v13 = Linear(['O'], ['=']);

export const v14 = v6.addSequentialRings([v9, v10, v11, v12], {
  atomAttachments: { 25: [v13] }
});

export const v15 = Linear(['C']);
export const v16 = Molecule([v1, v14, v15]);
```

That's **16 lines** vs the original **34 lines**, and every line is a readable API call. No raw Maps, no position arrays, no manual metadata wiring.

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| `layout()` computes different positions than parser | Round-trip tests will catch this. The existing `computeFusedRingPositions` already handles most topologies. |
| Sequential ring layout is harder to compute than fused ring layout | Start with the simplest case (linear chain of sequential rings) and expand. The parser's metadata can serve as ground truth for testing. |
| Some meta properties are actually needed for edge cases we haven't seen | Keep the `includeMetadata` option in decompiler as an escape hatch. If `layout()` can't handle a case, fall back to explicit meta. |
| Breaking change for code that was generated with old format | Old generated code will still work (meta properties are just JS assignments). New code will be cleaner but functionally equivalent. |

---

## Summary

The core insight is: **meta properties are derived data**. They can be computed from the structural information (ring sizes, offsets, substitutions, bonds, sequential rings). The fix is to make the API compute them automatically instead of requiring the decompiler to dump them as raw assignments.

The main work is:
1. Generalizing `computeFusedRingPositions()` to handle sequential rings and atom-level maps
2. Adding `addSequentialRings()` and `addSequentialAtomAttachment()` API methods
3. Updating the decompiler to emit these API calls instead of raw meta assignments
