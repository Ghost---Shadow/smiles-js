# Plan: `.mirror()` API for Symmetric Molecule Construction

## Motivation

Many molecules and polymers are symmetric — their structure reads the same forwards and backwards around a central point. Building these today requires manually constructing both halves. A `.mirror()` method would let users define one half and automatically produce the symmetric whole.

### Use Cases

1. **ABA triblock copolymers** — The most common symmetric polymer architecture. Define the A and B blocks, get A-B-A automatically.
2. **Palindromic linear chains** — e.g., `CCCOCCC` from `CCCO` mirrored at the O.
3. **Symmetric branched molecules** — e.g., diethyl ether `CCOCC` from `CCO` mirrored.
4. **Symmetric ring-bearing chains** — e.g., a chain with a ring in the center and identical arms on each side.
5. **Dendrimers** — Symmetric branching structures built outward from a core.

---

## API Design

### `linear.mirror(pivotId?)`

Mirror a linear chain around a pivot atom to create a palindromic structure.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pivotId` | `number` | `atoms.length` | 1-indexed position of the pivot atom (included once in the output) |

**Returns:** A new `Linear` (for simple chains) or `Molecule` (if attachments are present).

**Behavior:** Takes atoms `[1..pivotId]`, then appends atoms `[pivotId-1..1]` in reverse. The pivot atom appears once in the center. Attachments on mirrored atoms are also mirrored.

```javascript
// Diethyl ether: CCO + mirror → CCOCC
const half = Linear(['C', 'C', 'O']);
const ether = half.mirror();            // pivot defaults to last atom (O)
console.log(ether.smiles);              // CCOCC

// Palindromic chain: CCCNCCC
const half2 = Linear(['C', 'C', 'C', 'N']);
const palindrome = half2.mirror();      // pivot at N (position 4)
console.log(palindrome.smiles);         // CCCNCCC

// Mirror at a specific pivot
const chain = Linear(['C', 'C', 'C', 'O', 'C']);
const mirrored = chain.mirror(4);       // pivot at O (position 4)
console.log(mirrored.smiles);           // CCCOCCC
// atoms [1,2,3,4] + reverse of [3,2,1] → C,C,C,O,C,C,C
```

### `ring.mirror(pivotId?)`

Mirror a ring's attachments to create symmetric substitution patterns.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pivotId` | `number` | `1` | 1-indexed ring position that serves as the symmetry axis |

**Returns:** A new `Ring` with attachments mirrored around the pivot.

**Behavior:** For a ring with an attachment at position `p`, also adds the same attachment at the "mirror" position relative to the pivot. The mirror position for `p` around pivot `v` on a ring of size `s` is: `((2*v - p) mod s)`, adjusted to 1-indexed range.

```javascript
// Symmetric toluene → xylene (1,4-dimethylbenzene)
const benzene = Ring({ atoms: 'c', size: 6 });
const toluene = benzene.attach(1, Linear(['C']));
const xylene = toluene.mirror(1);       // mirror around position 1
// Attachment at position 1 stays, mirrored attachment appears at position 4
console.log(xylene.smiles);             // c1(C)ccc(C)cc1
```

### `molecule.mirror(pivotComponent?)`

Mirror a molecule's component sequence to create an ABA-like structure.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pivotComponent` | `number` | `components.length - 1` | 0-indexed component that serves as the center |

**Returns:** A new `Molecule` with components mirrored.

**Behavior:** Takes components `[0..pivot]`, then appends components `[pivot-1..0]` in reverse (with ring renumbering to avoid collisions).

```javascript
// ABA triblock copolymer
const A = Linear(['C', 'C']);
const B = Ring({ atoms: 'c', size: 6 });
const AB = Molecule([A, B]);
const ABA = AB.mirror();                 // pivot at last component (B)
console.log(ABA.smiles);                 // CCc1ccccc1CC

// More complex: A-B-C-B-A from A-B-C
const block = Molecule([
  Linear(['C', 'C']),
  Ring({ atoms: 'c', size: 6 }),
  Linear(['O']),
]);
const symmetric = block.mirror();        // pivot at last (O)
console.log(symmetric.smiles);           // CCc1ccccc1Oc2ccccc2CC
```

### `fusedRing.mirror()`

For fused rings, mirror could create a symmetric fused system by adding rings on both sides of the base. This is more complex and may be deferred to a later iteration.

---

## Functional API

```javascript
import {
  linearMirror,
  ringMirror,
  moleculeMirror,
} from 'smiles-js/manipulation';

const half = Linear(['C', 'C', 'O']);
const ether = linearMirror(half);         // CCOCC
```

---

## Implementation Strategy

### Phase 1: `linear.mirror(pivotId?)`

The simplest and highest-value case. Pure atom/bond array manipulation.

**Algorithm:**
1. Validate `pivotId` is within `[1, atoms.length]`.
2. Take `leftAtoms = atoms[0..pivotId-1]` (the left half including pivot).
3. Take `rightAtoms = atoms[0..pivotId-2].reverse()` (the left half excluding pivot, reversed).
4. Concatenate: `leftAtoms + rightAtoms`.
5. Handle bonds: mirror the bond array similarly. Bond between atoms `i` and `i+1` maps to the corresponding mirrored position.
6. Handle attachments: clone attachments from mirrored positions. Attachments at position `p` (where `p < pivotId`) also appear at the mirror position `2*pivotId - p`.

**Files:**
- `src/manipulation.js` — Add `linearMirror()` function
- `src/method-attachers.js` — Attach `.mirror()` to Linear

### Phase 2: `molecule.mirror(pivotComponent?)`

Component-level mirroring for ABA block copolymers.

**Algorithm:**
1. Take `leftComponents = components[0..pivot]`.
2. Take `rightComponents = components[0..pivot-1].reverse()`, each deep-cloned with shifted ring numbers.
3. Return `Molecule([...leftComponents, ...rightComponents])`.

**Files:**
- `src/manipulation.js` — Add `moleculeMirror()` function (reuses `shiftRingNumbers` and `maxRingNumber` from the `repeat` implementation)
- `src/method-attachers.js` — Attach `.mirror()` to Molecule

### Phase 3: `ring.mirror(pivotId?)`

Attachment-level mirroring for symmetric ring substitution patterns.

**Algorithm:**
1. For each attachment at position `p`, compute mirror position `mp = 2*pivotId - p` (mod ring size, 1-indexed).
2. If `mp` doesn't already have the attachment, add it.
3. Similarly mirror substitutions.

**Files:**
- `src/manipulation.js` — Add `ringMirror()` function
- `src/method-attachers.js` — Attach `.mirror()` to Ring

### Phase 4 (Future): `fusedRing.mirror()`

Defer to a later iteration. FusedRing has complex position metadata that makes mirroring non-trivial.

---

## Edge Cases

1. **Odd-length palindrome:** `mirror()` on `Linear(['C', 'O', 'C'])` with `pivotId=2` → `COCOC` (the pivot O appears once)
2. **Single atom:** `Linear(['O']).mirror()` → `Linear(['O'])` (nothing to mirror)
3. **Already symmetric:** Mirroring an already-symmetric molecule should produce the same result (idempotent on symmetric inputs)
4. **Bonds in mirror:** Double bonds in the left half should appear in the mirrored right half at the corresponding position
5. **Attachments with rings:** Mirrored ring attachments need unique ring numbers (reuse `shiftRingNumbers`)

---

## Test Plan

### Unit Tests (`manipulation.test.js`)
- `linear.mirror()` — simple chain, with pivot, with bonds, with attachments
- `molecule.mirror()` — ABA, ABCBA, with rings
- `ring.mirror()` — symmetric substitutions, symmetric attachments
- Edge cases: n=1, already symmetric, single atom

### Integration Tests (`test-integration/mirror.test.js`)
- Diethyl ether: `CCO.mirror()` → `CCOCC`
- ABA block copolymer with polystyrene/polyethylene blocks
- Symmetric biphenyl-bridged molecule
- Palindromic peptide-like chain

---

## Relationship to `.repeat()`

`.mirror()` and `.repeat()` are complementary:
- `.repeat(n, left, right)` — Produces **A-A-A-A** (homopolymer)
- `.mirror()` — Produces **A-B-A** (symmetric structure)
- Combined: `.repeat(2).mirror()` could produce **A-A-B-A-A** (repeated then mirrored)

Together they cover the main polymer architectures: homopolymer, block copolymer, and symmetric block copolymer.
