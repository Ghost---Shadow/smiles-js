# Plan: TDD — Update decompiler tests to target clean-code output

## Context

`docs/clean-code-refactoring.md` defines a target state for decompiler output: no mutations, no scattered Maps, colocated data. The constructors already support the new format. We update tests first (TDD), then implement.

## File to modify

`src/decompiler.test.js`

## What stays the same

- Ring, Linear, Molecule, Options, Round-trip sections — already clean
- FusedRing (simple path) — already clean `const`-only `.fuse()`/`.addRing()` code

## Changes

### 1. Interleaved FusedRing: `FusedRing({ metadata: { rings: [...] } })`

Replace `.fuse(x, y, { metadata: { scattered Maps } })` with `FusedRing({ metadata: { rings: [hierarchical] } })`.

**Format:**
```js
export const v3 = FusedRing({ metadata: { rings: [
  { ring: v1, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 1, depth: 0 }, ...] },
  { ring: v2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 2, depth: 0 }, ...] }
] } });
```

Rules:
- `depth` — **always explicit**, even when 0
- `value` — only when non-default (not the ring's base atom)
- `bond` — only when present (not null/single)
- `leadingBond` — inside metadata: `{ leadingBond: '=', rings: [...] }`
- No `new Map(...)` anywhere

### 2. Sequential rings: colocated depth, no mutation

Replace `depths: [0]` separate array with depth colocated on each ring object. Depth 0 is default and omitted.

**Format:**
```js
// depth 0 (default) — omitted:
export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = v1.addSequentialRings([{ ring: v2 }]);

// depth non-zero:
export const v3 = v1.addSequentialRings([{ ring: v2, depth: 1 }]);

// with chainAtoms (depth always explicit on chainAtoms):
export const v3 = Linear(['O']);
export const v4 = v1.addSequentialRings([{ ring: v2 }], {
  chainAtoms: [{ atom: 'N', depth: 0, position: 'after', attachments: [v3] }]
});
```

All `const`, no `let` + reassignment. `addSequentialRings` result assigned to a **new** const.

### 3. 3+ base rings + sequential

```js
export const v4 = FusedRing([v1, v2, v3]);
export const v6 = v4.addSequentialRings([{ ring: v5 }]);
```

## Verification

```
npx bun test src/decompiler.test.js
```
Tests WILL fail (TDD). That's the point.
