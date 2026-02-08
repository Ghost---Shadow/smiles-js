# Plan: Standardize API to (where, what) parameter order

## Changes

### Methods to flip:
- `ring.attach(attachment, position)` → `ring.attach(position, attachment)`
- `linear.attach(attachment, position)` → `linear.attach(position, attachment)`
- `ring.fuse(otherRing, offset)` → `ring.fuse(offset, otherRing)`
- `fused.addRing(ring, offset)` → `fused.addRing(offset, ring)`
- `fused.attachToRing(ringNumber, attachment, position)` → `fused.attachToRing(ringNumber, position, attachment)`

### Functional API counterparts:
- `ringAttach(ring, attachment, position, options?)` → `ringAttach(ring, position, attachment, options?)`
- `linearAttach(linear, attachment, position)` → `linearAttach(linear, position, attachment)`
- `ringFuse(ring, otherRing, offset, options?)` → `ringFuse(ring, offset, otherRing, options?)`
- `fusedRingAddRing(fusedRing, ring, offset)` → `fusedRingAddRing(fusedRing, offset, ring)`
- `fusedRingAttachToRing(fusedRing, ringNumber, attachment, position)` → `fusedRingAttachToRing(fusedRing, ringNumber, position, attachment)`

### Files:
1. src/manipulation.js — function definitions
2. src/method-attachers.js — method wrappers
3. src/decompiler.js — generates code with these calls
4. All test files, examples, docs
5. API.md, README.md
