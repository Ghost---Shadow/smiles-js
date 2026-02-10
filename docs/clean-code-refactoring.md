# Clean Code Refactoring: Eliminating Mutations and Improving Readability

## Overview

This document describes the ongoing refactoring effort to improve code generation in the SMILES-JS library by eliminating mutating code patterns and improving the readability of generated code through data colocation.

## Problem Statement

The original code generation (decompiler) produced code with mutating patterns that were hard to read and maintain:

```javascript
// Old approach: Mutations
let v1 = Ring({ atoms: 'C', size: 6 });
v1.meta = {
  positions: [0, 1, 2, 3, 4, 5],
  branchDepthMap: new Map([[0, 0], [1, 0]]),
  atomValueMap: new Map([[5, 'N']]),
  bondMap: new Map([[1, '=']]),
  ringOrderMap: new Map([[0, [1]], [1, [1,2]]])
};
```

### Issues with the Old Approach

1. **Mutations**: Using `let` and modifying objects after creation
2. **Scattered Data**: Related information spread across separate maps
3. **Hard to Understand**: Difficult to see which atoms have which properties at a glance
4. **Non-declarative**: Imperative style rather than declarative construction

## Solution: Non-Mutating, Colocated Metadata

### Phase 1: Eliminate Mutations

Replace post-construction mutations with constructor options:

```javascript
// New approach: Constructor options
const v1 = Ring({ atoms: 'C', size: 6 });
const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
const v3 = v1.addSequentialRings([v2], {
  depths: [0],
  chainAtoms: [
    { position: 11, depth: 0, value: 'N', bond: '=', attachments: [v4] }
  ]
});
```

**Benefits**:
- No mutations (`const` instead of `let`)
- Data passed at construction time
- Immutable-style programming

### Phase 2: Colocate Related Data

Group related properties together instead of scattering them across separate data structures:

```javascript
// Old: Scattered across maps
metadata: {
  positions: [5, 10, 15],
  atomValues: new Map([[5, 'N'], [10, 'O'], [15, 'S']]),
  bonds: new Map([[5, '='], [10, '#']]),
  ringOrder: new Map([[5, [1,1]], [10, [1,2]]])
}

// New: Colocated atoms
metadata: {
  rings: [
    {
      ring: v5,
      start: 5,
      end: 18,
      atoms: [
        { position: 5, depth: 0, value: 'N', bond: '=', rings: [1,1] },
        { position: 10, depth: 0, value: 'O', bond: '#', rings: [1,2] },
        { position: 15, depth: 1, value: 'S', rings: [1] }
      ]
    }
  ]
}
```

**Benefits**:
- Related data stays together
- Easier to understand atom properties at a glance
- Natural hierarchical structure (rings contain their atoms)
- More maintainable and easier to debug

## Implementation Details

### Hierarchical Metadata Structure

The new metadata structure uses a hierarchical format where rings contain their atoms:

```javascript
FusedRing({
  metadata: {
    rings: [
      {
        ring: v5,           // Reference to the ring variable
        start: 5,           // Starting position
        end: 18,            // Ending position
        atoms: [            // Atoms in this ring
          {
            position: 5,    // Position in SMILES string
            depth: 0,       // Branch depth
            value: 'N',     // Atom type (if not default C)
            bond: '=',      // Bond type (if not single)
            rings: [1,1],   // Ring membership
            attachments: [] // Attached fragments
          }
        ]
      }
    ]
  }
})
```

### Sequential Rings with Chain Atoms

For rings that follow sequentially after a base ring, the `addSequentialRings` API now uses `chainAtoms`:

```javascript
v1.addSequentialRings([v2], {
  depths: [0],                    // Branch depths for sequential rings
  chainAtoms: [                   // Atoms in the chain after rings
    {
      atom: 'N',                  // Atom type
      depth: 0,                   // Branch depth
      position: 'after',          // Position relative to rings
      attachments: [v3]           // Attached fragments
    }
  ]
})
```

## Examples

### Before (Old Approach)
```javascript
export let v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
v1 = v1.addSequentialRings([v2]);
v1.meta = {
  positions: [0,1,2,3,4,5,6,7,8,9,10],
  atomValueMap: new Map([[10, 'N']]),
  seqAtomAttachments: new Map([[11, [v3]]])
};
```

### After (New Approach)
```javascript
export const v1 = Ring({ atoms: 'C', size: 6 });
export const v2 = Ring({ atoms: 'C', size: 5, ringNumber: 2 });
export const v3 = Linear(['O']);
export const v4 = v1.addSequentialRings([v2], {
  depths: [0],
  chainAtoms: [
    { atom: 'N', depth: 0, position: 'after', attachments: [v3] }
  ]
});
```
