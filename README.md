# Molecular DSL

A JavaScript library for building molecules using composable fragments.

## Installation

```bash
npm install smiles-js
```

## Quick Start

```js
import { Fragment, Ring, FusedRings } from 'smiles-js';

const methyl = Fragment('C');
const benzene = Ring('c', 6);
const toluene = benzene(methyl);

console.log(toluene);  // c1ccccc1C
```

## Core Concepts

Molecules are built by composing fragments. There are four composition operations:

| Operation | Syntax | Result |
|-----------|--------|--------|
| Concatenate | `a.concat(b)` | `a` and `b` joined linearly |
| Branch | `a(b)` | `b` attached as branch to `a` |
| Multiple branches | `a(b)(c)(d)` | `b`, `c`, `d` all branch from `a` |
| Nested branches | `a(b(c))` | `c` branches from `b`, which branches from `a` |

## API

### Fragment(smiles)

Creates a fragment from a SMILES string.

```js
const methyl = Fragment('C');
const ethyl = Fragment('CC');
const hydroxyl = Fragment('O');
const carbonyl = Fragment('C=O');
const carboxyl = Fragment('C(=O)O');
```

Fragments are composable:

```js
const ethanol = ethyl(hydroxyl);                   // CC(O)
const acetone = methyl(Fragment('=O'))(methyl);    // CC(=O)C
```

Nested branching:

```js
const a = Fragment('C');
const b = Fragment('CC');
const c = Fragment('CCC');

const molecule = a(b(c));  // C(CC(CCC))
```

#### Concatenation with `.concat()`

The `concat` method joins fragments linearly (end-to-end) without branching:

```js
const ethyl = Fragment('CC');
const propyl = Fragment('CCC');
const pentane = ethyl.concat(propyl);  // CCCCC
```

**Method chaining:**

```js
const hexane = Fragment('CC')
  .concat('CC')
  .concat('CC');  // CCCCCC
```

**Static method:**

```js
const butane = Fragment.concat('CC', 'CC');  // CCCC
```

**Ring number handling:**

When concatenating fragments with rings, conflicting ring numbers are automatically remapped:

```js
const ring1 = Fragment('C1CCC1');
const ring2 = Fragment('C1CCC1');
const twoRings = ring1.concat(ring2);  // C1CCC1C2CCC2
```

**Use cases:**

- Building linear chains: `Fragment('C').concat('C').concat('C')` → `CCC`
- Creating polymers: repeatedly concat to build long chains
- Combining building blocks: `benzene.concat(methyl)` → `c1ccccc1C`

**Difference from branching:**

```js
const a = Fragment('CC');
const b = Fragment('O');

a.concat(b);  // CCO (linear)
a(b);          // CC(O) (branched)
```

### Ring(atom, size)

Creates a simple ring.

```js
const benzene = Ring('c', 6);       // c1ccccc1
const cyclohexane = Ring('C', 6);   // C1CCCCC1
const cyclopentane = Ring('C', 5);  // C1CCCC1
const pyridine = Ring('c', 6, { replace: { 0: 'n' } });  // n1ccccc1
```

**Parameters:**

- `atom` — The atom type. Lowercase for aromatic, uppercase for aliphatic.
- `size` — Number of atoms in the ring (3-8 typical).
- `options.replace` — Object mapping positions to different atoms.

**Substituted rings:**

```js
const benzene = Ring('c', 6);
const toluene = benzene(methyl);           // c1ccccc1C
const xylene = benzene(methyl)(methyl);    // c1ccccc1(C)C
```

### FusedRings(sizes, atom, options?)

Creates fused ring systems.

```js
const naphthalene = FusedRings([6, 6], 'c');      // c1ccc2ccccc2c1
const anthracene = FusedRings([6, 6, 6], 'c');   // linear fusion
const indene = FusedRings([6, 5], 'c');          // 6-membered fused to 5-membered
```

**Parameters:**

- `sizes` — Array of ring sizes, fused linearly.
- `atom` — Default atom type.
- `options.hetero` — Object mapping positions to heteroatoms.

**Examples:**

```js
// Indole: benzene fused to pyrrole
const indole = FusedRings([6, 5], 'c', { 
  hetero: { 8: '[nH]' } 
});

// Quinoline: benzene fused to pyridine
const quinoline = FusedRings([6, 6], 'c', { 
  hetero: { 0: 'n' } 
});
```

### Repeat(fragment, count)

Creates repeating units for polymers and chains.

```js
const hexane = Repeat('C', 6);           // CCCCCC
const peg = Repeat('CCO', 4);            // CCOCCOCCOCCOCCO
const polyethylene = Repeat('CC', 100);  // CC...CC (200 carbons)
```

**Parameters:**

- `fragment` — SMILES string or Fragment to repeat.
- `count` — Number of repetitions.

## Composition

### Branching with `()`

Calling a fragment with another fragment creates a branch:

```js
const methyl = Fragment('C');
const ethyl = Fragment('CC');

methyl(ethyl);           // C(CC)
methyl(ethyl)(ethyl);    // C(CC)(CC)
```

The branch attaches to the last atom of the parent fragment.

### Nested Branches

Branches can be nested to any depth:

```js
const C = Fragment('C');
const CC = Fragment('CC');
const CCC = Fragment('CCC');

C(CC(CCC));  // C(CC(CCC))
```

This creates:

```
C ─ C ─ C
        │
        C ─ C ─ C
```

A more complex example:

```js
const methyl = Fragment('C');
const ethyl = Fragment('CC');
const propyl = Fragment('CCC');
const butyl = Fragment('CCCC');

// Central carbon with 4 different branches
methyl(ethyl)(propyl(butyl))(methyl);  // C(CC)(CCC(CCCC))(C)
```

## Common Fragments

The library includes common fragments:

```js
import { 
  // Alkyls
  methyl,     // C
  ethyl,      // CC
  propyl,     // CCC
  isopropyl,  // C(C)C
  butyl,      // CCCC
  tbutyl,     // C(C)(C)C
  
  // Functional groups
  hydroxyl,   // O
  amino,      // N
  carboxyl,   // C(=O)O
  carbonyl,   // C=O
  nitro,      // [N+](=O)[O-]
  cyano,      // C#N
  
  // Halogens
  fluoro,     // F
  chloro,     // Cl
  bromo,      // Br
  iodo,       // I
  
  // Rings
  benzene,    // c1ccccc1
  cyclohexane,// C1CCCCC1
  pyridine,   // n1ccccc1
  pyrrole,    // c1cc[nH]c1
  furan,      // c1ccoc1
  thiophene,  // c1ccsc1
  
  // Fused rings
  naphthalene,  // c1ccc2ccccc2c1
  indole,       // c1ccc2[nH]ccc2c1
  quinoline,    // n1ccc2ccccc2c1
} from 'molecular-dsl/common';
```

## Properties

Every fragment exposes:

```js
const mol = benzene(methyl);

mol.smiles;          // "c1ccccc1C"
mol.atoms;           // 7
mol.rings;           // 1
mol.formula;         // "C7H8"
mol.molecularWeight; // 92.14

console.log(mol);    // c1ccccc1C
```

## Validation

Fragments validate on creation:

```js
Fragment('C(C');  // Error: Unclosed branch

Fragment('c1ccc1');  // Error: Invalid ring closure
```

To check validity without throwing:

```js
const result = Fragment.validate('C(C');
// { valid: false, error: 'Unclosed branch' }

const result = Fragment.validate('CCO');
// { valid: true }
```

## Advanced SMILES Features

For features not covered by the DSL, use raw SMILES in `Fragment()`:

**Charges:**

```js
const ammonium = Fragment('[NH4+]');
const carboxylate = Fragment('[O-]');
```

**Explicit hydrogens:**

```js
const pyrroleN = Fragment('[nH]');
```

**Stereochemistry:**

```js
const lAlanine = Fragment('C[C@H](N)C(=O)O');
const transButene = Fragment('C/C=C/C');
```

**Isotopes:**

```js
const deuterium = Fragment('[2H]');
const carbon13 = Fragment('[13C]');
```

## Examples

### Aspirin

```js
const aspirin = benzene(carboxyl)(Fragment('OC(=O)C'));
```

### Caffeine

```js
const caffeine = Fragment('Cn1cnc2c1c(=O)n(c(=O)n2C)C');
```

### Ibuprofen

```js
const ibuprofen = benzene(
  Fragment('CC(C)C')
)(
  Fragment('CC(C)C(=O)O')
);
```

### Building a library

```js
import { Fragment, benzene, methyl, hydroxyl, carboxyl } from 'molecular-dsl';

// Define your fragments
const acetyl = Fragment('C(=O)C');
const phenyl = benzene;

// Compose molecules
const molecules = {
  toluene: phenyl(methyl),
  phenol: phenyl(hydroxyl),
  benzoicAcid: phenyl(carboxyl),
  acetophenone: phenyl(acetyl),
};

// Export SMILES
for (const [name, mol] of Object.entries(molecules)) {
  console.log(`${name}: ${mol}`);
}
```

Output:

```
toluene: c1ccccc1C
phenol: c1ccccc1O
benzoicAcid: c1ccccc1C(=O)O
acetophenone: c1ccccc1C(=O)C
```

### Polymer

```js
const peg = Repeat('OCO', 10);
console.log(peg);  // OCOOCOOCOOCOOCOOCOOCOOCOOCOOCO
```

## Known issues

### Directionality for attachment

```js
export const acetamidoLeft = Fragment('CC(=O)N');
export const acetamidoRight = Fragment('NC(=O)C');
export const acetaminophen = benzene.attachAt(1, acetamidoLeft).attachAt(4, 'O') ; // Wrong
export const acetaminophen = benzene.attachAt(1, acetamidoRight).attachAt(4, 'O') ; // Right
```
