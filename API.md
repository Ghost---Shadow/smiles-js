# SMILES-JS API Reference

Full API documentation for smiles-js. For a quick introduction, see the [README](./README.md).

---

## Embedding

```html
<script type="module">
  import { Fragment, Ring, FusedRing, Linear } from 'https://unpkg.com/smiles-js@latest/src/index.js';
  import { benzene, methyl, ethyl, hydroxyl, carboxyl, phenyl, cyclohexane } from 'https://unpkg.com/smiles-js@latest/src/common.js';

  window.SMILES = { Fragment, Ring, FusedRing, Linear, benzene, methyl, ethyl, hydroxyl, carboxyl, phenyl, cyclohexane };
  // Your code
</script>
```

---

## Constructors

### `Ring(options)`

Create ring structures with substitutions and attachments.

**Options:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `atoms` | `string` | required | Base atom type (e.g., `'c'`, `'C'`, `'N'`) |
| `size` | `number` | required | Number of atoms in the ring |
| `ringNumber` | `number` | `1` | Ring number for SMILES notation |
| `offset` | `number` | `0` | Offset for fused rings |
| `substitutions` | `object` | `{}` | Position -> atom substitutions |
| `attachments` | `object` | `{}` | Position -> attachment list |
| `bonds` | `array` | `[]` | Bond types between atoms |
| `branchDepths` | `number[]` | `null` | Per-atom branch depth (for rings that cross branch boundaries) |

```javascript
// Simple benzene
const benzene = Ring({ atoms: 'c', size: 6 });

// Pyridine (nitrogen at position 5)
const pyridine = Ring({
  atoms: 'c',
  size: 6,
  substitutions: { 5: 'n' }
});

// Toluene (methyl attached at position 1)
const toluene = Ring({
  atoms: 'c',
  size: 6,
  attachments: { 1: [Linear(['C'])] }
});
```

### `Linear(atoms, bonds?, attachments?)`

Create linear chains with optional bond specifications.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `atoms` | `string[]` | required | Array of atom symbols |
| `bonds` | `string[]` | `[]` | Array of bond types (`'='`, `'#'`, `null`) |
| `attachments` | `object` | `{}` | Position -> attachment list |

```javascript
// Simple propane
const propane = Linear(['C', 'C', 'C']);

// Propene (with double bond)
const propene = Linear(['C', 'C', 'C'], [null, '=']);

// Ethanol with hydroxyl
const ethyl = Linear(['C', 'C']);
const hydroxyl = Linear(['O']);
const ethanol = ethyl.attach(2, hydroxyl);
```

### `FusedRing(rings)` / `FusedRing({ metadata })`

Create fused ring systems like naphthalene. Supports two formats:

**Array format** (simple fused rings):

| Parameter | Type | Description |
|-----------|------|-------------|
| `rings` | `Ring[]` | Array of Ring nodes (minimum 2) |

```javascript
const naphthalene = FusedRing([
  Ring({ atoms: 'C', size: 10, offset: 0, ringNumber: 1 }),
  Ring({ atoms: 'C', size: 6, offset: 2, ringNumber: 2 })
]);
```

**Metadata format** (complex interleaved rings with position data):

| Parameter | Type | Description |
|-----------|------|-------------|
| `metadata.rings` | `object[]` | Per-ring metadata with `ring`, `start`, `end`, and `atoms` |
| `metadata.atoms` | `object[]` | Standalone atoms not belonging to any ring |
| `metadata.leadingBond` | `string` | Optional leading bond (e.g., `'='`) |

Each ring entry: `{ ring, start, end, atoms: [{ position, depth, value?, bond?, rings?, attachments? }] }`

Each standalone atom entry: `{ position, depth, value?, bond?, attachments? }`

```javascript
const ring1 = Ring({ atoms: 'C', size: 6 });
const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2, offset: 1 });
const fused = FusedRing({ metadata: {
  rings: [
    { ring: ring1, start: 0, end: 9, atoms: [{ position: 0, depth: 0 }, { position: 5, depth: 0 }] },
    { ring: ring2, start: 1, end: 6, atoms: [{ position: 1, depth: 0 }, { position: 6, depth: 0 }] }
  ],
  atoms: [{ position: 12, depth: 0, value: 'N' }]
} });
```

### `Molecule(components)`

Combine multiple structural components.

| Parameter | Type | Description |
|-----------|------|-------------|
| `components` | `object[]` | Array of Ring, Linear, FusedRing, or Molecule nodes |

```javascript
const propyl = Linear(['C', 'C', 'C']);
const benzene = Ring({ atoms: 'c', size: 6 });
const propylbenzene = Molecule([propyl, benzene]);

console.log(propylbenzene.smiles);  // CCCc1ccccc1
```

---

## Manipulation Methods

All manipulation methods are **immutable** -- they return new nodes and never modify the original.

### Ring Methods

```javascript
const benzene = Ring({ atoms: 'c', size: 6 });

// Attach substituent at position
const toluene = benzene.attach(1, Linear(['C']));

// Substitute atom at position
const pyridine = benzene.substitute(5, 'n');

// Multiple substitutions
const triazine = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });

// Fuse with another ring (offset = shared atom count)
const ring2 = Ring({ atoms: 'C', size: 6 });
const naphthalene = benzene.fuse(2, ring2);

// Clone
const benzeneClone = benzene.clone();
```

#### `ring.attach(position, attachment, options?)`

Attach a node to the ring at a 1-indexed position.

| Parameter | Type | Description |
|-----------|------|-------------|
| `position` | `number` | 1-indexed ring position |
| `attachment` | `object` | Node to attach |
| `options.sibling` | `boolean` | If set, marks the attachment as sibling (true) or inline (false) |

#### `ring.substitute(position, newAtom)`

Replace the atom at position with a different atom symbol.

#### `ring.substituteMultiple(substitutionMap)`

Replace multiple atoms. `substitutionMap` is `{ position: atomSymbol }`.

#### `ring.fuse(offset, otherRing, options?)`

Fuse this ring with another ring. `offset` is how many positions into this ring the other ring starts.

#### `ring.clone()`

Return a deep copy of the ring.

### Linear Methods

```javascript
const butane = Linear(['C', 'C', 'C', 'C']);

// Attach branch at position
const methyl = Linear(['C']);
const branched = butane.attach(2, methyl);

// Concatenate chains
const hexane = butane.concat(Linear(['C', 'C']));

// Branch at specific position
const isobutane = butane.branchAt({ 2: methyl });

// Branch with multiple attachments
const decorated = butane.branch(2, methyl, Linear(['O']));
```

#### `linear.attach(position, attachment)`

Attach a node at a 1-indexed position.

#### `linear.concat(other)`

Concatenate with another Linear (merges atoms/bonds) or other node (creates Molecule).

#### `linear.branch(position, ...branches)`

Attach one or more branches at a position.

#### `linear.branchAt(branchMap)`

Attach branches at multiple positions. `branchMap` is `{ position: node | [nodes] }`.

### Molecule Methods

```javascript
const mol = Molecule([Linear(['C', 'C', 'C'])]);

// Append component
const extended = mol.append(Ring({ atoms: 'c', size: 6 }));

// Prepend component
const withPrefix = mol.prepend(Linear(['C']));

// Get component by index
const first = mol.getComponent(0);

// Replace component by index
const modified = mol.replaceComponent(0, Linear(['N', 'N']));

// Concatenate molecules
const combined = mol.concat(Molecule([Ring({ atoms: 'c', size: 6 })]));
```

### FusedRing Methods

```javascript
const fused = ring1.fuse(4, ring2);

// Add another ring to the fused system
const triple = fused.addRing(8, ring3);

// Get a specific ring by number
const r = fused.getRing(1);

// Substitute in a specific ring
const modified = fused.substituteInRing(1, 3, 'N');

// Attach to a specific ring
const decorated = fused.attachToRing(1, 4, Linear(['O']));

// Renumber rings
const renumbered = fused.renumber(10);

// Add sequential continuation rings with colocated depth
const withSeq = fused.addSequentialRings([{ ring: ring3, depth: 1 }, { ring: ring4, depth: 2 }], {
  chainAtoms: [
    { atom: 'C', depth: 2, position: 'before' },
    { atom: 'C', depth: 2, position: 'after', attachments: [Linear(['O'], ['='])] },
  ]
});

// Add attachment to a sequential atom position
const withAtt = fused.addSequentialAtomAttachment(25, Linear(['O']));
```

#### `fusedRing.addSequentialRings(rings, options?)`

Add continuation rings to a fused ring system. Computes all position metadata internally.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rings` | `Ring[]` or `object[]` | Sequential rings — plain `Ring` nodes or `{ ring, depth? }` objects |
| `options.depths` | `number[]` | Legacy: per-ring branch depth. Prefer colocated `{ ring, depth }` format instead |
| `options.chainAtoms` | `object[]` | Standalone atoms between rings (see below) |

**rings entries (object format):**

| Property | Type | Description |
|----------|------|-------------|
| `ring` | `Ring` | The Ring node to add |
| `depth` | `number` | Branch depth for this ring (default: `0`, omit if zero) |

**chainAtoms entries:**

| Property | Type | Description |
|----------|------|-------------|
| `atom` | `string` | Atom symbol (e.g., `'C'`, `'N'`, `'O'`) |
| `depth` | `number` | Branch depth for this atom |
| `position` | `'before'` \| `'after'` | Whether the atom appears before or after rings at its depth |
| `bond` | `string` | Optional bond type (e.g., `'='`, `'#'`) |
| `attachments` | `object[]` | Optional array of nodes attached to this atom |

---

## Parsing & Serialization

```javascript
import { parse, tokenize, buildSMILES, decompile } from 'smiles-js';

// Parse SMILES to AST
const ast = parse('c1ccccc1');

// Tokenize SMILES into token stream
const tokens = tokenize('C(=O)O');

// Generate SMILES from AST
const smiles = buildSMILES(ast);

// Decompile AST to JavaScript constructor code
const code = decompile(ast);

// Every node has a .smiles getter
console.log(ast.smiles);  // c1ccccc1

// Every node has a .toCode() method
console.log(ast.toCode());
// const ring1 = Ring({ atoms: 'c', size: 6 });
```

---

## Round-Trip Validation

Validate SMILES parsing fidelity with built-in round-trip testing:

```javascript
import {
  validateRoundTrip,
  isValidRoundTrip,
  normalize,
  parseWithValidation
} from 'smiles-js';

// Quick boolean check
if (isValidRoundTrip('c1ccccc1')) {
  console.log('Perfect round-trip!');
}

// Detailed validation
const result = validateRoundTrip('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1');
console.log(result.status);  // 'perfect', 'stabilized', or 'unstable'

if (result.stabilizes) {
  console.log('Use normalized form:', result.firstRoundTrip);
}

// Automatic normalization
const normalized = normalize('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1');

// Parse with automatic warnings
const ast = parseWithValidation(smiles);

// Silent mode
const ast2 = parseWithValidation(smiles, { silent: true });

// Strict mode (throws on imperfect)
const ast3 = parseWithValidation(smiles, { strict: true });
```

**Round-Trip Validation Logic:**
1. **Perfect**: First round-trip matches exactly -- no action needed
2. **Stabilized**: Second round-trip stabilizes -- use `normalize()` to get stable form
3. **Unstable**: Doesn't stabilize after 2 round-trips -- file a bug report

---

## AST Inspection

```javascript
import { parse, ASTNodeType } from 'smiles-js';

const mol = parse('c1ccccc1');

console.log(mol.type);           // 'ring'
console.log(mol.atoms);          // 'c'
console.log(mol.size);           // 6
console.log(mol.substitutions);  // {}
console.log(mol.attachments);    // {}
```

### Node Types (`ASTNodeType`)

| Type | Description |
|------|-------------|
| `'ring'` | Ring structure |
| `'linear'` | Linear chain |
| `'fused_ring'` | Fused ring system |
| `'molecule'` | Multi-component molecule |

---

## Functional API

For a more functional programming style, import manipulation functions directly:

```javascript
import {
  ringAttach,
  ringSubstitute,
  ringSubstituteMultiple,
  ringFuse,
  ringClone,
  linearAttach,
  linearConcat,
  linearBranch,
  linearBranchAt,
  fusedRingAddRing,
  fusedRingGetRing,
  fusedRingSubstituteInRing,
  fusedRingAttachToRing,
  fusedRingRenumber,
  fusedRingAddSequentialRings,
  fusedRingAddSequentialAtomAttachment,
  moleculeAppend,
  moleculePrepend,
  moleculeConcat,
  moleculeGetComponent,
  moleculeReplaceComponent,
} from 'smiles-js/manipulation';

const benzene = Ring({ atoms: 'c', size: 6 });
const toluene = ringAttach(benzene, 1, Linear(['C']));
```

---

## Clone Utilities

Deep-clone AST nodes for safe modification:

```javascript
import {
  deepCloneRing,
  deepCloneLinear,
  deepCloneFusedRing,
  deepCloneMolecule,
  cloneAttachments,
  cloneSubstitutions,
  cloneComponents,
} from 'smiles-js';
```

---

## Integration with RDKit

```javascript
import { parse, Ring, Linear } from 'smiles-js';
import RDKit from '@rdkit/rdkit';

// Build molecule programmatically
const benzene = Ring({ atoms: 'c', size: 6 });
const methyl = Linear(['C']);
const toluene = benzene.attach(1, methyl);

// Use with RDKit
const rdkit = await RDKit.load();
const mol = rdkit.get_mol(toluene.smiles);
console.log(mol.get_svg());
```

---

## Known Limitations

### Minor Round-Trip Issues

Some complex molecules may have minor notation differences during round-trip:

1. **Terminal substituents** - May be omitted in certain edge cases
2. **Bond notation in branches** - `C(N)=O` may serialize as `C(N)O`

**Impact**: Low - Structure is preserved, only notation differs.

### toCode() Generated Code

The `.toCode()` method generates JavaScript constructor code that reconstructs the molecule:

- **Interleaved fused rings** emit `FusedRing({ metadata: { rings: [...], atoms: [...] } })` with hierarchical, colocated atom data (position, depth, value, bond, rings, attachments) instead of scattered Maps
- **Sequential continuation rings** use `const`-only declarations and `addSequentialRings([{ ring: v, depth }])` with colocated depth per ring
- All generated variable declarations use `const` (no `let` + reassignment)
