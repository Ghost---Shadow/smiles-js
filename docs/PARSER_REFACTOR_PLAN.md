# Parser Refactor Plan: Complete AST Coverage

## Problem Statement

The current parser (`src/parse.js`) is ring-focused and only captures atoms between ring opening/closing markers. This causes significant information loss for complex molecules like telmisartan.

### What's Missing from the AST

1. **Leading linear chains** - atoms before the first ring
2. **Trailing linear chains** - atoms after the last ring closure
3. **Inter-ring linear chains** - atoms between ring closures (e.g., `CC` in `N1CC3`)
4. **Attachments outside ring boundaries** - groups attached after closures (e.g., `C(=O)O`)
5. **Double bonds** - `=` bonds (current known limitation)

### Impact

- **Telmisartan**: 74-char input → 44-char rebuilt SMILES (40% data loss)
- **Fragment workaround**: Preserves original SMILES but AST is incomplete
- **Round-trip fidelity**: Cannot reconstruct original SMILES from AST

## Design Goals

1. **Complete AST coverage** - capture ALL atoms, bonds, and structural elements
2. **Maintain ring metadata** - preserve existing ring size, offset, substitution info
3. **Support round-trip** - AST → SMILES → AST should be lossless
4. **Backward compatibility** - existing tests should pass (or have clear migration path)
5. **Clean architecture** - separate concerns (tokenization → parsing → AST building)

## Grammar Definition

### Key Insight: Rings as Cycle Capture Mechanism

Molecules are inherently cyclic graphs, not trees. The SMILES ring notation (e.g., `C1CCCCC1`) is the mechanism to represent cycles in a linear string. The AST must capture this by:

1. **Ring nodes represent the cyclic part** - The ring itself captures the cycle
2. **Everything else is acyclic** - Linear chains, attachments, and the hierarchy descending from rings are all trees
3. **Cycles only exist within ring boundaries** - Once a ring closes, it's a complete cyclic unit

### SMILES Grammar for Ring-Centric Parsing

Organized from highest to lowest level, with recursive rules clearly marked.

```ebnf
(* ============================================ *)
(* LEVEL 1: Molecule (Top Level)               *)
(* ============================================ *)

(* A molecule is a chain of connected components *)
molecule ::= chain

(* ============================================ *)
(* LEVEL 2: Chain (Recursive Backbone)         *)
(* ============================================ *)

(* A chain is one or more atom units connected by bonds *)
(* This is the PRIMARY RECURSIVE STRUCTURE - chains contain atoms with branches,
   and branches contain chains, creating the recursive hierarchy *)
chain ::= atom_unit (bond? atom_unit)*

(* An atom unit is an atom optionally followed by ring markers and branches *)
atom_unit ::= atom ring_marker* branch*

(* ============================================ *)
(* LEVEL 3: Atoms (Leaf Nodes)                 *)
(* ============================================ *)

(* An atom can be simple (single letter or two letters) or bracketed *)
atom ::= simple_atom | bracketed_atom

(* Simple organic atoms: single or two-letter symbols *)
simple_atom ::= aliphatic_organic | aromatic_organic

aliphatic_organic ::= 'Br' | 'Cl' | 'B' | 'C' | 'N' | 'O' | 'S' | 'P' | 'F' | 'I'

aromatic_organic ::= 'b' | 'c' | 'n' | 'o' | 's' | 'p'

(* Bracketed atoms with isotope, charge, stereochemistry, hydrogen count *)
bracketed_atom ::= '[' isotope? element chiral? hcount? charge? class? ']'

(* ============================================ *)
(* LEVEL 4: Ring Markers (Cycle Indicators)    *)
(* ============================================ *)

(* Ring markers create/close cycles - NOT recursive, just labels *)
ring_marker ::= digit | '%' digit digit

digit ::= '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

(* ============================================ *)
(* LEVEL 5: Branches (RECURSIVE ATTACHMENT)    *)
(* ============================================ *)

(* Branches are acyclic attachments in parentheses *)
(* CRITICAL RECURSION: branch contains chain, chain contains atom_unit,
   atom_unit can have branches, creating infinite nesting *)
branch ::= '(' bond? chain ')'

(* Example of recursion: C(C(C(C))) creates nested branches *)

(* ============================================ *)
(* LEVEL 6: Bonds (Connectors)                 *)
(* ============================================ *)

(* Bonds between atoms - optional in most cases (implicit single bond) *)
bond ::= single_bond | double_bond | triple_bond | aromatic_bond |
         directional_bond_up | directional_bond_down

single_bond ::= '-'
double_bond ::= '='
triple_bond ::= '#'
aromatic_bond ::= ':'
directional_bond_up ::= '/'    (* cis/trans stereochemistry *)
directional_bond_down ::= '\'  (* cis/trans stereochemistry *)

(* ============================================ *)
(* LEVEL 7: Atom Details (Bracketed Atoms)     *)
(* ============================================ *)

(* Isotope specification *)
isotope ::= digit+

(* Element symbol *)
element ::= 'H' | 'He' | 'Li' | 'Be' | 'B' | 'C' | 'N' | 'O' | 'F' | 'Ne' |
            'Na' | 'Mg' | 'Al' | 'Si' | 'P' | 'S' | 'Cl' | 'Ar' | 'K' | 'Ca' |
            'Sc' | 'Ti' | 'V' | 'Cr' | 'Mn' | 'Fe' | 'Co' | 'Ni' | 'Cu' | 'Zn' |
            (* ... all periodic table elements ... *)
            'Br' | 'I' | 'At' | '*' (* wildcard *)

(* Chirality specification *)
chiral ::= '@' | '@@' | '@TH1' | '@TH2' | '@AL1' | '@AL2' |
           '@SP1' | '@SP2' | '@SP3' | '@TB1' | '@TB2' | (* ... etc ... *)

(* Hydrogen count *)
hcount ::= 'H' digit?

(* Charge *)
charge ::= '+' | '-' | '++' | '--' | '+' digit | '-' digit

(* Atom class (for reaction mapping) *)
class ::= ':' digit+

(* ============================================ *)
(* RECURSION SUMMARY                            *)
(* ============================================ *)

(*
  The grammar has TWO primary recursive paths:

  1. BRANCH RECURSION (attachment nesting):
     chain -> atom_unit -> branch -> chain -> atom_unit -> branch -> ...
     Example: C(C(C(C))) has 3 levels of nested branches

  2. RING CLOSURE RECURSION (via re-parsing attachments):
     When an attachment contains a ring, parsing that attachment
     recursively invokes molecule -> chain with new ring markers
     Example: C1CC(C2CCC2)C1 - the branch (C2CCC2) is a recursive parse

  Ring markers themselves are NOT recursive - they just label cycle points.
  The Ring AST node captures the cycle, making the graph acyclic at AST level.
*)
```

### How This Grammar Captures Cycles and Recursion

**Example 1: Benzene `c1ccccc1` (Simple Ring)**
```
Grammar derivation:
molecule
  └─ chain
      └─ atom_unit              ← c with ring_marker 1 (OPEN)
          └─ atom (c)
          └─ ring_marker (1)
      └─ atom_unit (c)
      └─ atom_unit (c)
      └─ atom_unit (c)
      └─ atom_unit (c)
      └─ atom_unit              ← c with ring_marker 1 (CLOSE)
          └─ atom (c)
          └─ ring_marker (1)    ← Cycle complete!

AST representation (ring captures the cycle):
{
  type: 'ring',
  ringNumber: 1,
  size: 6,
  atoms: 'c',
  substitutions: {},
  attachments: {}
}

Key: Ring marker 1 appears twice, creating a cycle. The Ring AST node
     encapsulates this cycle, making the AST acyclic.
```

**Example 2: Nested Branches `C(C(C(C)))` (Recursion via Branches)**
```
Grammar derivation showing RECURSION:
molecule
  └─ chain
      └─ atom_unit
          └─ atom (C)
          └─ branch               ← RECURSION LEVEL 1
              └─ chain
                  └─ atom_unit
                      └─ atom (C)
                      └─ branch   ← RECURSION LEVEL 2
                          └─ chain
                              └─ atom_unit
                                  └─ atom (C)
                                  └─ branch  ← RECURSION LEVEL 3
                                      └─ chain
                                          └─ atom_unit
                                              └─ atom (C)

AST representation:
{
  type: 'linear',
  atoms: ['C'],
  attachments: {
    1: [
      {
        type: 'linear',
        atoms: ['C'],
        attachments: {
          1: [
            {
              type: 'linear',
              atoms: ['C'],
              attachments: {
                1: [{ type: 'linear', atoms: ['C'] }]
              }
            }
          ]
        }
      }
    ]
  }
}

Key: branch -> chain -> atom_unit -> branch creates infinite recursion depth.
     Each level of parentheses is one recursive descent.
```

**Example 3: Ring with Nested Ring in Branch `C1CCC(C2CCC2)C1` (Recursion + Cycle)**
```
Grammar derivation:
molecule
  └─ chain
      └─ atom_unit
          └─ atom (C)
          └─ ring_marker (1)     ← Ring 1 OPENS
      └─ atom_unit (C)
      └─ atom_unit (C)
      └─ atom_unit
          └─ atom (C)
          └─ branch              ← RECURSION: parse new chain
              └─ chain
                  └─ atom_unit
                      └─ atom (C)
                      └─ ring_marker (2)  ← Ring 2 OPENS (nested)
                  └─ atom_unit (C)
                  └─ atom_unit (C)
                  └─ atom_unit
                      └─ atom (C)
                      └─ ring_marker (2)  ← Ring 2 CLOSES
      └─ atom_unit
          └─ atom (C)
          └─ ring_marker (1)     ← Ring 1 CLOSES

AST representation:
{
  type: 'ring',
  ringNumber: 1,
  size: 5,
  atoms: 'C',
  attachments: {
    4: [                        ← Attachment at position 4
      {
        type: 'ring',           ← Nested ring (from recursive parse)
        ringNumber: 2,
        size: 4,
        atoms: 'C'
      }
    ]
  }
}

Key: The branch (C2CCC2) is parsed RECURSIVELY as a new molecule/chain.
     Ring 2 is completely independent from Ring 1 (no shared atoms).
     Recursion happens via: atom_unit -> branch -> chain -> atom_unit -> ...
```

**Example 4: Fused Rings `C1=CC2=CC=CC=C2C=C1` (Naphthalene - Shared Atoms, Not Recursion)**
```
Grammar derivation:
molecule
  └─ chain
      └─ atom_unit
          └─ atom (C)
          └─ ring_marker (1)     ← Ring 1 OPENS
      └─ atom_unit (C)
      └─ atom_unit
          └─ atom (C)
          └─ ring_marker (2)     ← Ring 2 OPENS (while Ring 1 still open!)
      └─ atom_unit (C)
      └─ atom_unit (C)
      └─ atom_unit (C)
      └─ atom_unit
          └─ atom (C)
          └─ ring_marker (2)     ← Ring 2 CLOSES
      └─ atom_unit (C)
      └─ atom_unit
          └─ atom (C)
          └─ ring_marker (1)     ← Ring 1 CLOSES

AST representation (FUSED_RING type groups rings with offsets):
{
  type: 'fused_ring',
  rings: [
    {
      type: 'ring',
      ringNumber: 1,
      size: 10,                  ← Total atoms in path for ring 1
      offset: 0,                 ← Ring 1 starts at position 0
      atoms: 'C',
      substitutions: {},
      attachments: {}
    },
    {
      type: 'ring',
      ringNumber: 2,
      size: 6,                   ← Ring 2 has 6 atoms
      offset: 2,                 ← Ring 2 starts at position 2 (shares atoms)
      atoms: 'C',
      substitutions: {},
      attachments: {}
    }
  ]
}

Key: Both rings share atoms (fusion). Ring 2 opens BEFORE Ring 1 closes.
     This is NOT recursion - it's overlapping ring boundaries in a single chain.
     The FUSED_RING type groups all rings that share atoms, with offsets
     indicating where each ring starts in the fused system.
```

### Critical Design Principle

**Cycles exist ONLY within ring markers:**
- Everything between matching ring markers (e.g., `1...1`) forms a cycle
- The `Ring` AST node encapsulates this cycle
- Everything else in the AST is a tree (acyclic):
  - Linear chains before/after rings
  - Attachments via branches `(...)`
  - The flat array of rings in a `fused_ring` (no parent-child hierarchy)

**This means:**
1. Ring opening (`C1`) → Start capturing atoms for a cycle
2. Ring closing (`C1`) → Complete the cycle, create Ring node
3. Branches `(...)` → Acyclic attachments (never create cycles)
4. Fused rings → Multiple cycles, grouped in `fused_ring` with offsets showing overlap
   - NOT a tree/hierarchy - just a flat array with offset metadata
   - Offset tells where each ring starts in the shared atom sequence

## Proposed Architecture

### Phase 1: Tokenization Layer

Create a new tokenizer that converts SMILES into a token stream.

**New file: `src/tokenizer.js`**

High-level tokenization flow:

```javascript
function tokenize(smiles) {
  const tokens = [];
  let position = 0;

  while (position < smiles.length) {
    const char = smiles[position];

    if (isAtomStart(char)) {
      const atomToken = extractAtomToken(smiles, position);
      tokens.push(atomToken);
      position = advancePosition(position, atomToken);
    }

    if (isBondSymbol(char)) {
      const bondToken = createBondToken(char, position);
      tokens.push(bondToken);
      position++;
    }

    if (isRingMarkerStart(char)) {
      const ringToken = extractRingMarker(smiles, position);
      tokens.push(ringToken);
      position = advancePosition(position, ringToken);
    }

    if (isBranchSymbol(char)) {
      const branchToken = createBranchToken(char, position);
      tokens.push(branchToken);
      position++;
    }
  }

  return tokens;
}
```

**Benefits:**
- Clean separation of lexical analysis from parsing
- Position tracking for error messages
- Easier to handle special cases (bracketed atoms, % notation)

### Phase 2: Hierarchical AST Structure

Replace flat ring array with a tree structure that captures the full molecule.

**Important Distinction:**
- **Substitutions**: Atoms within a ring that differ from the base atom type (part of the ring structure)
  - Example: In pyridine `c1cccnc1`, position 5 has `n` instead of `c`
  - Stored as: `substitutions: { 5: 'n' }`
- **Attachments**: Branches/groups attached to ring atoms via parentheses (separate from ring)
  - Example: In `C1CCC(CC)C1`, `CC` is attached to position 4
  - Stored as: `attachments: { 4: [linearChain('CC')] }`

**New file: `src/ast.js`**

```javascript
// AST Node Types
const ASTNodeType = {
  MOLECULE: 'molecule',      // Root node
  LINEAR: 'linear',          // Linear chain of atoms
  RING: 'ring',              // Single ring structure
  FUSED_RING: 'fused_ring',  // Multiple rings sharing atoms
  ATOM: 'atom',              // Single atom
};

// Example AST for pyridine with methyl: c1ccc(C)nc1
{
  type: 'ring',
  ringNumber: 1,
  size: 6,
  atoms: 'c',
  substitutions: {
    5: 'n',  // Position 5 is nitrogen instead of carbon (IN the ring)
  },
  attachments: {
    4: [     // Position 4 has an attachment (NOT part of ring)
      { type: 'linear', atoms: ['C'] }
    ]
  }
}

// Example AST for naphthalene (simple fused ring): C1=CC2=CC=CC=C2C=C1
{
  type: 'fused_ring',
  rings: [
    {
      type: 'ring',
      ringNumber: 1,
      size: 10,
      offset: 0,  // First ring always starts at 0
      atoms: 'C',
      substitutions: {},
      attachments: {}
    },
    {
      type: 'ring',
      ringNumber: 2,
      size: 6,
      offset: 2,  // Fused at position 2 of the overall structure
      atoms: 'C',
      substitutions: {},
      attachments: {}
    }
  ]
}

// Example AST for telmisartan (simplified structure)
{
  type: 'molecule',
  components: [
    {
      type: 'linear',
      atoms: ['C', 'C', 'C', 'C'], // Leading CCCC
    },
    {
      type: 'fused_ring',
      rings: [
        {
          type: 'ring',
          ringNumber: 1,
          size: 5,
          offset: 0,
          atoms: 'C',
          substitutions: {
            2: 'N',  // Position 2 is N (part of the ring)
            9: 'N',  // Position 9 is N (part of the ring - fused closure point)
          },
          attachments: {
            9: [     // Position 9 (N atom) has an attachment
              { type: 'linear', atoms: ['C', 'C'] }, // The CC before ring 3
              {
                type: 'ring',
                ringNumber: 3,
                size: 6,
                atoms: 'C',
                attachments: {
                  6: [  // Ring 3 has ring 4 attached at position 6
                    {
                      type: 'ring',
                      ringNumber: 4,
                      size: 6,
                      atoms: 'C',
                      attachments: {
                        6: [  // Carboxylic acid group
                          { type: 'linear', atoms: ['C'], bonds: ['=O', '-O'] }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          type: 'ring',
          ringNumber: 2,
          size: 6,
          offset: 2, // Fused at position 2 of ring 1
          atoms: 'C',
          substitutions: {},
          attachments: {
            4: [  // Attachment at position 4 of ring 2
              { type: 'linear', atoms: ['C'] }, // Content inside the fused ring's paren
              {
                type: 'fused_ring',  // Another fused ring system in the attachment
                rings: [
                  {
                    type: 'ring',
                    ringNumber: 5,
                    size: 5,
                    offset: 0,
                    atoms: 'C',
                    substitutions: { 2: 'N', 9: 'N' },
                    attachments: {}
                  },
                  {
                    type: 'ring',
                    ringNumber: 6,
                    size: 6,
                    offset: 2,
                    atoms: 'C',
                    substitutions: {},
                    attachments: {}
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    {
      type: 'linear',
      atoms: ['C'], // Trailing C
    }
  ]
}
```

**Key Principles:**
1. **Substitutions** = atoms IN the ring circle that differ from base type
2. **Attachments** = branches OUTSIDE the ring connected via parentheses
3. **Fused rings** = Multiple rings sharing atoms, grouped in a `fused_ring` node
4. **Offsets** = Position where each ring starts in the fused system
5. Linear chains can appear at molecule level (before/after rings) or in attachments

**Benefits:**
- Captures full molecule structure
- Maintains distinction between substitutions and attachments (like current impl)
- Natural representation of branching and fusion
- Easy to traverse and rebuild
- Preserves parent-child relationships

#### Programmatic Construction API

Each AST node type has a corresponding constructor/factory function for building molecules from scratch:

**New file: `src/constructors.js`**

```javascript
// Factory functions for programmatic molecule construction

function Molecule(components = []) {
  return createMoleculeNode(components);
}

function Linear(atoms, bonds = []) {
  return createLinearNode(atoms, bonds);
}

function Ring(options) {
  const {
    atoms,
    size,
    ringNumber = 1,
    offset = 0,
    substitutions = {},
    attachments = {}
  } = options;

  return createRingNode(atoms, size, ringNumber, offset, substitutions, attachments);
}

function FusedRing(rings) {
  return createFusedRingNode(validateRings(rings));
}

// Example usage: Building molecules from scratch

// Benzene from scratch
const benzene = Ring({
  atoms: 'c',
  size: 6
});

// Toluene (benzene with methyl group)
const toluene = Ring({
  atoms: 'c',
  size: 6,
  attachments: {
    1: [Linear(['C'])]
  }
});

// Naphthalene (fused rings)
const naphthalene = FusedRing([
  Ring({ atoms: 'C', size: 10, offset: 0, ringNumber: 1 }),
  Ring({ atoms: 'C', size: 6, offset: 2, ringNumber: 2 })
]);

// Propane (linear chain)
const propane = Linear(['C', 'C', 'C']);

// Ethanol (linear with attachment)
const ethanol = Linear(['C', 'C'], ['-']);
// Would need attachment API - TBD during implementation

// Complex molecule with multiple components
const molecule = Molecule([
  Linear(['C', 'C', 'C', 'C']),  // Leading chain
  FusedRing([
    Ring({ atoms: 'C', size: 6, offset: 0, ringNumber: 1 }),
    Ring({ atoms: 'C', size: 5, offset: 2, ringNumber: 2 })
  ]),
  Linear(['C'])  // Trailing chain
]);
```

**Integration with existing Fragment API:**

```javascript
// Convert AST to Fragment
function Fragment(input) {
  if (typeof input === 'string') {
    return parseAndCreateFragment(input);
  }

  if (isASTNode(input)) {
    return createFragmentFromAST(input);
  }

  throw new Error('Invalid input');
}

// Example: Create via AST then convert to Fragment
const benzeneAST = Ring({ atoms: 'c', size: 6 });
const benzeneFragment = Fragment(benzeneAST);
// benzeneFragment.smiles === 'c1ccccc1'

// Roundtrip
const parsed = Fragment('c1ccccc1');
const ast = parsed.toAST();  // New method
const rebuilt = Fragment(ast);
// rebuilt.smiles === 'c1ccccc1'
```

**Key Benefits:**
- Users can build complex molecules programmatically
- No need to write SMILES strings manually
- Type-safe construction (via validation functions)
- Composable - build small parts and combine them
- Interoperable with existing Fragment API

#### Molecule Manipulation API

Methods organized by the type they manipulate. Each type has its own manipulation methods.

**Updated: `src/constructors.js`** - Add instance methods to each type

```javascript
// ============================================
// RING MANIPULATION METHODS
// ============================================

Ring.prototype.attach = function(attachment, position) {
  // Attach to a specific position on this ring (1-indexed)
  const updatedAttachments = cloneAttachments(this.attachments);
  const newAttachments = addToAttachmentList(updatedAttachments, position, attachment);
  return createRingWithAttachments(this, newAttachments);
};

Ring.prototype.substitute = function(position, newAtom) {
  // Replace an atom at a specific position in this ring
  const updatedSubstitutions = cloneSubstitutions(this.substitutions);
  const baseAtom = determineBaseAtom(this);

  if (isSameAsBase(newAtom, baseAtom)) {
    return createRingWithSubstitutions(this, removeSubstitutionAt(updatedSubstitutions, position));
  }

  return createRingWithSubstitutions(this, addSubstitutionAt(updatedSubstitutions, position, newAtom));
};

Ring.prototype.substituteMultiple = function(substitutionMap) {
  // Apply multiple substitutions at once
  // substitutionMap: { position: atom, ... }
  let result = this;
  for (const [position, atom] of Object.entries(substitutionMap)) {
    result = result.substitute(position, atom);
  }
  return result;
};

Ring.prototype.fuse = function(otherRing, offset) {
  // Fuse this ring with another ring
  const rings = [
    setRingOffset(this, 0),
    setRingOffset(otherRing, offset)
  ];
  return createFusedRingNode(rings);
};

Ring.prototype.concat = function(other) {
  // Concatenate this ring with another structure
  return createMoleculeFromComponents([this, other]);
};

Ring.prototype.clone = function() {
  // Deep clone this ring
  return deepCloneRing(this);
};

// ============================================
// FUSED RING MANIPULATION METHODS
// ============================================

FusedRing.prototype.addRing = function(ring, offset) {
  // Add a ring to this fused ring system at specified offset
  const existingRings = cloneRings(this.rings);
  const ringWithOffset = setRingOffset(ring, offset);
  const allRings = [...existingRings, ringWithOffset];
  return createFusedRingNode(allRings);
};

FusedRing.prototype.getRing = function(ringNumber) {
  // Get a specific ring by its ring number
  return findRingByNumber(this.rings, ringNumber);
};

FusedRing.prototype.substituteInRing = function(ringNumber, position, newAtom) {
  // Apply substitution to a specific ring in the fused system
  const targetRing = this.getRing(ringNumber);
  const updatedRing = targetRing.substitute(position, newAtom);
  return replaceRingInFusedSystem(this, ringNumber, updatedRing);
};

FusedRing.prototype.attachToRing = function(ringNumber, position, attachment) {
  // Attach to a specific ring in the fused system
  const targetRing = this.getRing(ringNumber);
  const updatedRing = targetRing.attach(position, attachment);
  return replaceRingInFusedSystem(this, ringNumber, updatedRing);
};

FusedRing.prototype.renumber = function(startNumber = 1) {
  // Reassign ring numbers sequentially
  const renumberedRings = assignSequentialRingNumbers(this.rings, startNumber);
  return createFusedRingNode(renumberedRings);
};

FusedRing.prototype.concat = function(other) {
  // Concatenate this fused ring with another structure
  return createMoleculeFromComponents([this, other]);
};

FusedRing.prototype.clone = function() {
  // Deep clone this fused ring system
  return deepCloneFusedRing(this);
};

// ============================================
// LINEAR CHAIN MANIPULATION METHODS
// ============================================

Linear.prototype.attach = function(attachment, atomIndex) {
  // Attach to a specific atom in this linear chain
  const cloned = this.clone();
  return insertAttachmentAtPosition(cloned, atomIndex, attachment);
};

Linear.prototype.concat = function(other) {
  // Concatenate this linear chain with another structure
  if (isLinear(other)) {
    return concatenateLinearChains(this, other);
  }
  return createMoleculeFromComponents([this, other]);
};

Linear.prototype.branch = function(...branches) {
  // Add branches at auto-calculated positions
  const positions = calculateBranchPositions(this, branches.length);
  return addBranchesAtPositions(this, branches, positions);
};

Linear.prototype.branchAt = function(branchMap) {
  // Add branches at specific positions
  // branchMap: { position: branch, ... }
  let result = this;
  for (const [position, branchStructure] of Object.entries(branchMap)) {
    result = result.attach(position, branchStructure);
  }
  return result;
};

Linear.prototype.clone = function() {
  // Deep clone this linear chain
  return deepCloneLinear(this);
};

// ============================================
// MOLECULE MANIPULATION METHODS
// ============================================

Molecule.prototype.append = function(component) {
  // Add a component to the end of this molecule
  const clonedComponents = cloneComponents(this.components);
  return createMoleculeFromComponents([...clonedComponents, component]);
};

Molecule.prototype.prepend = function(component) {
  // Add a component to the beginning of this molecule
  const clonedComponents = cloneComponents(this.components);
  return createMoleculeFromComponents([component, ...clonedComponents]);
};

Molecule.prototype.concat = function(other) {
  // Concatenate this molecule with another structure
  const clonedComponents = cloneComponents(this.components);
  if (isMolecule(other)) {
    return createMoleculeFromComponents([...clonedComponents, ...other.components]);
  }
  return createMoleculeFromComponents([...clonedComponents, other]);
};

Molecule.prototype.getComponent = function(index) {
  // Get a specific component by index
  return this.components[index];
};

Molecule.prototype.replaceComponent = function(index, newComponent) {
  // Replace a component at specific index
  const clonedComponents = cloneComponents(this.components);
  clonedComponents[index] = newComponent;
  return createMoleculeFromComponents(clonedComponents);
};

Molecule.prototype.clone = function() {
  // Deep clone this molecule
  return deepCloneMolecule(this);
};
```

#### SMILES Serialization at Every Level

Every AST node type should provide a `.smiles` property (or getter) that returns the SMILES representation of that node. This enables inspection at any point in the construction process.

**Updated: `src/constructors.js`** - Add `.smiles` getter to each type

```javascript
// ============================================
// SMILES PROPERTY FOR ALL AST NODES
// ============================================

// Ring.smiles - Returns SMILES for this ring
Object.defineProperty(Ring.prototype, 'smiles', {
  get: function() {
    return buildRingSMILES(this);
  }
});

// FusedRing.smiles - Returns SMILES for this fused ring system
Object.defineProperty(FusedRing.prototype, 'smiles', {
  get: function() {
    return buildFusedRingSMILES(this);
  }
});

// Linear.smiles - Returns SMILES for this linear chain
Object.defineProperty(Linear.prototype, 'smiles', {
  get: function() {
    return buildLinearSMILES(this);
  }
});

// Molecule.smiles - Returns SMILES for this molecule
Object.defineProperty(Molecule.prototype, 'smiles', {
  get: function() {
    return buildMoleculeSMILES(this);
  }
});
```

**Example Usage:**

```javascript
// Ring SMILES
const benzene = Ring({ atoms: 'c', size: 6 });
console.log(benzene.smiles);  // 'c1ccccc1'

const pyridine = benzene.substitute(5, 'n');
console.log(pyridine.smiles);  // 'c1cccnc1'

// Linear SMILES
const propyl = Linear(['C', 'C', 'C']);
console.log(propyl.smiles);  // 'CCC'

const methyl = Linear(['C']);
console.log(methyl.smiles);  // 'C'

// Combined structures
const toluene = benzene.attach(1, methyl);
console.log(toluene.smiles);  // 'c1ccccc1C' or 'c1c(C)cccc1' (depending on serialization)

// Fused ring SMILES
const naphthalene = FusedRing([
  Ring({ atoms: 'C', size: 10, offset: 0, ringNumber: 1 }),
  Ring({ atoms: 'C', size: 6, offset: 2, ringNumber: 2 })
]);
console.log(naphthalene.smiles);  // 'C1=CC2=CC=CC=C2C=C1'

// Molecule SMILES
const propylbenzene = Molecule([propyl, benzene]);
console.log(propylbenzene.smiles);  // 'CCCc1ccccc1'

// Step-by-step construction with SMILES inspection
const ring1 = Ring({ atoms: 'c', size: 6 });
console.log(ring1.smiles);  // 'c1ccccc1'

const linear1 = Linear(['C']);
console.log(linear1.smiles);  // 'C'

const molecule1 = ring1.attach(1, linear1);
console.log(molecule1.smiles);  // 'c1c(C)cccc1' (toluene)

// Chained operations with SMILES inspection at each step
const base = Ring({ atoms: 'c', size: 6 });
console.log('Base:', base.smiles);  // 'c1ccccc1'

const step1 = base.substitute(1, 'n');
console.log('Step 1:', step1.smiles);  // 'c1ncccc1'

const step2 = step1.substitute(3, 'n');
console.log('Step 2:', step2.smiles);  // 'c1nccncc1'

const branch = Linear(['C', 'C']);
const final = step2.attach(5, branch);
console.log('Final:', final.smiles);  // 'c1nccnc(CC)c1'
```

**Key Benefits:**
- **Debugging**: Inspect SMILES at any construction stage
- **Validation**: Verify each step produces expected structure
- **Transparency**: See how operations affect SMILES representation
- **Testing**: Easy to write tests comparing `.smiles` output
- **Live inspection**: No need to explicitly serialize to see result

**Implementation Notes:**
- Use `Object.defineProperty` with getter to compute on-demand
- Reuses the same code generator from Phase 4 (`buildRingSMILES`, etc.)
- Getters are computed each time (not cached) to ensure correctness after mutations
- Alternative: Cache and invalidate on mutations (optimization for later)

**Example Usage:**

```javascript
// ============================================
// RING MANIPULATION
// ============================================

// Create benzene and add methyl group
const benzene = Ring({ atoms: 'c', size: 6 });
const methyl = Linear(['C']);
const toluene = benzene.attach(1, methyl);

// Create pyridine via substitution
const pyridine = benzene.substitute(1, 'n');

// Create multiple substitutions
const triazine = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });

// Fuse two rings
const ring1 = Ring({ atoms: 'C', size: 10 });
const ring2 = Ring({ atoms: 'C', size: 6 });
const naphthalene = ring1.fuse(2, ring2);

// ============================================
// FUSED RING MANIPULATION
// ============================================

// Create benzimidazole and modify it
const benzimidazole = FusedRing([
  Ring({ atoms: 'c', size: 6, offset: 0 }),
  Ring({ atoms: 'c', size: 5, offset: 3 })
]);

// Substitute in specific ring of fused system
const substituted = benzimidazole
  .substituteInRing(1, 2, 'n')
  .substituteInRing(1, 7, 'n');

// Attach to specific ring in fused system
const withMethyl = benzimidazole.attachToRing(1, 1, Linear(['C']));

// Add another ring to the fused system
const expandedSystem = naphthalene.addRing(8, Ring({ atoms: 'C', size: 5 }));

// ============================================
// LINEAR CHAIN MANIPULATION
// ============================================

// Create branched structure
const butane = Linear(['C', 'C', 'C', 'C']);
const methyl1 = Linear(['C']);
const methyl2 = Linear(['C']);

// Method 1: Specify positions explicitly
const isobutane = butane.branchAt({
  2: methyl1,  // Methyl at position 2
  3: methyl2   // Methyl at position 3
});

// Method 2: Auto-distribute branches
const branchedChain = butane.branch(methyl1, methyl2);

// Concatenate linear chains
const propyl = Linear(['C', 'C', 'C']);
const hexane = propyl.concat(propyl);

// ============================================
// MOLECULE ASSEMBLY
// ============================================

// Build complex molecule by concatenation
const phenyl = Ring({ atoms: 'c', size: 6 });
const propylbenzene = propyl.concat(phenyl);

// Build telmisartan-like structure programmatically
const leadingChain = Linear(['C', 'C', 'C', 'C']);

const benzimidazoleCore = FusedRing([
  Ring({ atoms: 'C', size: 5, substitutions: { 2: 'N', 9: 'N' } }),
  Ring({ atoms: 'C', size: 6, offset: 2 })
]);

const phenyl1 = Ring({ atoms: 'C', size: 6 });
const phenyl2 = Ring({ atoms: 'C', size: 6 });
const carboxyl = Linear(['C'], ['=O', '-O']);

// Fluent chaining
const phenylWithCarboxyl = phenyl2.attach(6, carboxyl);
const biphenyl = phenyl1.attach(6, phenylWithCarboxyl);
const connector = Linear(['C', 'C']);
const sideChain = connector.concat(biphenyl);

const coreWithSideChain = benzimidazoleCore.attachToRing(1, 9, sideChain);

// Final assembly using Molecule
const telmisartan = Molecule([
  leadingChain,
  coreWithSideChain
]).append(Linear(['C']));

// Alternative: start with empty molecule and build up
const molecule = Molecule([])
  .append(leadingChain)
  .append(coreWithSideChain)
  .append(Linear(['C']));

// ============================================
// CLONING AND IMMUTABILITY
// ============================================

// All operations return new instances
const original = benzene;
const modified = original.substitute(1, 'n');
// original is unchanged, modified is new instance

// Explicit cloning
const benzeneClone = benzene.clone();
```

**Key Benefits:**
- **Type-specific methods**: Each type has methods appropriate to its structure
- **Fluent, chainable API**: Methods return new instances for chaining
- **Immutable operations**: All modifications return new structures
- **Clear scoping**: Ring methods on Ring, FusedRing methods on FusedRing, etc.
- **Discoverability**: Methods appear on the objects they manipulate

### Phase 3: Two-Pass Parser

Implement a two-pass parsing strategy that respects the grammar.

#### Pass 1: Linear Scan with Ring Tracking

Scan tokens linearly and track ring boundaries:

```javascript
function buildAtomList(tokens) {
  const atoms = createAtomArray();
  const ringStacks = initializeRingTracking();
  const ringBoundaries = [];
  const branchInfo = initializeBranchTracking();

  for (const token of tokens) {
    if (isAtomToken(token)) {
      addAtomToList(atoms, token, branchInfo);
    }

    if (isRingMarker(token)) {
      handleRingMarker(token, atoms, ringStacks, ringBoundaries);
    }

    if (isBranchToken(token)) {
      updateBranchTracking(token, branchInfo, atoms);
    }

    if (isBondToken(token)) {
      attachBondToAtom(atoms, token);
    }
  }

  return { atoms, ringBoundaries };
}
```

#### Pass 2: Build Ring-Centric AST

Convert linear atom list into hierarchical structure with rings as cycle containers:

```javascript
function buildAST(atoms, ringBoundaries) {
  const ast = createMoleculeNode();
  const sortedRings = sortRingsByStartPosition(ringBoundaries);
  const fusedRingGroups = groupFusedRings(sortedRings);
  const atomToGroupMap = mapAtomsToGroups(fusedRingGroups);

  let currentLinearChain = [];
  const processedGroups = new Set();

  for (let i = 0; i < atoms.length; i++) {
    if (isAtomInRing(i, atomToGroupMap)) {
      flushLinearChainIfExists(ast, currentLinearChain);
      const groupIdx = getGroupIndex(i, atomToGroupMap);

      if (isNewGroup(groupIdx, processedGroups)) {
        const fusedRingNode = buildFusedRingNode(fusedRingGroups[groupIdx], atoms);
        addComponentToMolecule(ast, fusedRingNode);
        markGroupAsProcessed(processedGroups, groupIdx);
      }

      i = skipToEndOfGroup(fusedRingGroups, groupIdx);
    } else {
      addAtomToLinearChain(currentLinearChain, atoms[i]);
    }
  }

  flushLinearChainIfExists(ast, currentLinearChain);
  return ast;
}

function buildFusedRingNode(ringGroup, allAtoms) {
  if (isSingleRing(ringGroup)) {
    return buildSingleRingNode(ringGroup[0], allAtoms);
  }

  const rings = ringGroup.map(ring => buildSingleRingNode(ring, allAtoms));
  return createFusedRingNode(rings);
}

function buildSingleRingNode(ring, allAtoms) {
  const ringAtoms = extractRingAtoms(ring, allAtoms);
  const baseType = determineBaseAtomType(ringAtoms);
  const substitutions = calculateSubstitutions(ringAtoms, baseType);
  const attachments = extractAttachments(ringAtoms, allAtoms);

  return createRingNode(ring, baseType, substitutions, attachments);
}

function groupFusedRings(rings) {
  const groups = [];
  const assigned = new Set();

  for (const ring of rings) {
    if (isAlreadyAssigned(ring, assigned)) continue;

    const group = initializeGroupWith(ring);
    markAsAssigned(ring, assigned);
    expandGroupWithOverlappingRings(group, rings, assigned);
    addGroupToList(groups, group);
  }

  return groups;
}
```

**Key Insight:** The parser identifies cycles via ring markers, then builds Ring nodes to encapsulate those cycles. Everything else remains acyclic and tree-structured.

### Phase 4: AST → SMILES Code Generation (Serializer)

Generate SMILES strings from the AST representation.

**Terminology:**
- **Parser**: SMILES string → AST (Phase 1-3)
- **Code Generator/Serializer**: AST → SMILES string (Phase 4)
- Together they form a **compiler pipeline**: SMILES → AST → SMILES

This is not a transpiler (which converts between different languages). It's a **round-trip compiler** that can parse and regenerate the same representation.

**New file: `src/codegen.js` (or `src/serializer.js`)**

High-level SMILES code generation:

```javascript
function buildSMILES(ast) {
  if (isMoleculeNode(ast)) {
    return buildMoleculeSMILES(ast);
  }

  if (isFusedRingNode(ast)) {
    return buildFusedRingSMILES(ast);
  }

  if (isRingNode(ast)) {
    return buildRingSMILES(ast);
  }

  if (isLinearNode(ast)) {
    return buildLinearSMILES(ast);
  }
}

function buildMoleculeSMILES(molecule) {
  const parts = molecule.components.map(component => buildSMILES(component));
  return joinComponents(parts);
}

function buildFusedRingSMILES(fusedRing) {
  const ringNumbers = assignRingNumbers(fusedRing.rings);
  const sortedRings = sortRingsByOffset(fusedRing.rings);
  const smilesParts = [];

  for (const ring of sortedRings) {
    const ringPart = buildRingWithOffset(ring, ringNumbers);
    smilesParts.push(ringPart);
  }

  return mergeFusedRingParts(smilesParts);
}

function buildRingSMILES(ring) {
  const atoms = buildRingAtoms(ring);
  const withSubstitutions = applySubstitutions(atoms, ring.substitutions);
  const withAttachments = attachBranches(withSubstitutions, ring.attachments);
  const withRingMarkers = addRingClosureMarkers(withAttachments, ring.ringNumber);
  return joinAtoms(withRingMarkers);
}

function buildLinearSMILES(linear) {
  const atoms = linear.atoms;
  const bonds = linear.bonds || [];
  return interleaveBondsAndAtoms(atoms, bonds);
}
```

**Benefits:**
- Round-trip fidelity: SMILES → AST → SMILES
- Consistent serialization
- Easy to test via round-trip tests
- Clean separation between parsing and generation

### Phase 5: AST → JavaScript Code Decompiler

Generate JavaScript construction code from the AST representation. This allows users to see how to programmatically build the parsed molecule.

**New file: `src/decompiler.js`**

High-level decompilation flow:

```javascript
function decompile(ast, options = {}) {
  const context = initializeContext(options);
  const code = decompileNode(ast, context);
  return formatCode(code, context);
}

function decompileNode(node, context) {
  if (isMoleculeNode(node)) {
    return decompileMolecule(node, context);
  }

  if (isFusedRingNode(node)) {
    return decompileFusedRing(node, context);
  }

  if (isRingNode(node)) {
    return decompileRing(node, context);
  }

  if (isLinearNode(node)) {
    return decompileLinear(node, context);
  }
}

function decompileMolecule(molecule, context) {
  const componentVars = [];
  const componentCode = [];

  for (const component of molecule.components) {
    const varName = generateVarName(context);
    const code = decompileNode(component, context);
    componentVars.push(varName);
    componentCode.push(assignToVar(varName, code));
  }

  if (shouldCombineIntoMolecule(molecule)) {
    const moleculeVar = generateVarName(context, 'molecule');
    const moleculeCode = buildMoleculeConstructor(componentVars);
    componentCode.push(assignToVar(moleculeVar, moleculeCode));
    return joinCodeLines(componentCode);
  }

  return joinCodeLines(componentCode);
}

function decompileRing(ring, context) {
  const varName = generateVarName(context, 'ring');
  const baseCode = buildRingConstructor(ring);
  const codeLines = [assignToVar(varName, baseCode)];

  if (hasSubstitutions(ring)) {
    const substitutionCode = buildSubstitutionCalls(ring, varName, context);
    codeLines.push(substitutionCode);
  }

  if (hasAttachments(ring)) {
    const attachmentCode = buildAttachmentCalls(ring, varName, context);
    codeLines.push(attachmentCode);
  }

  return optimizeChaining(codeLines, context);
}

function decompileFusedRing(fusedRing, context) {
  const ringVars = [];
  const codeLines = [];

  for (const ring of fusedRing.rings) {
    const ringVar = generateVarName(context, 'ring');
    const ringCode = buildRingConstructor(ring);
    codeLines.push(assignToVar(ringVar, ringCode));
    ringVars.push(ringVar);
  }

  const fusedVar = generateVarName(context, 'fusedRing');
  const fusedCode = buildFusedRingConstructor(ringVars);
  codeLines.push(assignToVar(fusedVar, fusedCode));

  return joinCodeLines(codeLines);
}

function decompileLinear(linear, context) {
  const varName = generateVarName(context, 'linear');
  const code = buildLinearConstructor(linear);
  return assignToVar(varName, code);
}

function buildRingConstructor(ring) {
  const params = buildRingParams(ring);
  return callConstructor('Ring', params);
}

function buildFusedRingConstructor(ringVars) {
  const ringArray = buildArrayLiteral(ringVars);
  return callConstructor('FusedRing', [ringArray]);
}

function buildLinearConstructor(linear) {
  const atomsArray = buildArrayLiteral(linear.atoms);
  const params = [atomsArray];

  if (hasBonds(linear)) {
    const bondsArray = buildArrayLiteral(linear.bonds);
    params.push(bondsArray);
  }

  return callConstructor('Linear', params);
}

function buildMoleculeConstructor(componentVars) {
  const componentsArray = buildArrayLiteral(componentVars);
  return callConstructor('Molecule', [componentsArray]);
}

function buildSubstitutionCalls(ring, varName, context) {
  const substitutions = ring.substitutions;
  const calls = [];

  for (const [position, atom] of Object.entries(substitutions)) {
    const call = buildMethodCall(varName, 'substitute', [position, quote(atom)]);
    calls.push(call);
  }

  return chainMethodCalls(varName, calls, context);
}

function buildAttachmentCalls(ring, varName, context) {
  const attachments = ring.attachments;
  const calls = [];

  for (const [position, attachmentList] of Object.entries(attachments)) {
    for (const attachment of attachmentList) {
      const attachmentCode = decompileNode(attachment, context);
      const call = buildMethodCall(varName, 'attach', [attachmentCode, position]);
      calls.push(call);
    }
  }

  return chainMethodCalls(varName, calls, context);
}
```

**Integration with Fragment API:**

Add `.toCode()` method to Fragment:

```javascript
// In src/fragment.js
Fragment.prototype.toCode = function(options = {}) {
  const ast = this.toAST();
  return decompile(ast, options);
};

// Example usage:
const fragment = Fragment('c1ccccc1');
console.log(fragment.toCode());
// Output:
// const ring1 = Ring({ atoms: 'c', size: 6 })

const toluene = Fragment('c1ccc(C)cc1');
console.log(toluene.toCode());
// Output:
// const linear1 = Linear(['C'])
// const ring1 = Ring({ atoms: 'c', size: 6 })
// const ring2 = ring1.attach(4, linear1)
```

**Decompiler Options:**

```javascript
// Options for customizing output
const options = {
  varPrefix: 'my',        // Use 'my' instead of default prefix
  useChaining: true,      // Chain methods when possible
  includeComments: true,  // Add comments explaining structure
  optimize: true          // Optimize code (combine operations)
};

Fragment('c1ccc(C)cc1').toCode(options);
// Output:
// const myLinear1 = Linear(['C'])
// const myRing1 = Ring({ atoms: 'c', size: 6 }).attach(4, myLinear1)
```

**Example Outputs:**

```javascript
// Benzene: c1ccccc1
Fragment('c1ccccc1').toCode();
// const ring1 = Ring({ atoms: 'c', size: 6 })

// Toluene: c1ccc(C)cc1
Fragment('c1ccc(C)cc1').toCode();
// const linear1 = Linear(['C'])
// const ring1 = Ring({ atoms: 'c', size: 6 })
// const ring2 = ring1.attach(4, linear1)

// Pyridine: c1cccnc1
Fragment('c1cccnc1').toCode();
// const ring1 = Ring({ atoms: 'c', size: 6 })
// const ring2 = ring1.substitute(5, 'n')

// Naphthalene: C1=CC2=CC=CC=C2C=C1
Fragment('C1=CC2=CC=CC=C2C=C1').toCode();
// const ring1 = Ring({ atoms: 'C', size: 10, offset: 0, ringNumber: 1 })
// const ring2 = Ring({ atoms: 'C', size: 6, offset: 2, ringNumber: 2 })
// const fusedRing1 = FusedRing([ring1, ring2])

// Propylbenzene: CCCc1ccccc1
Fragment('CCCc1ccccc1').toCode();
// const linear1 = Linear(['C', 'C', 'C'])
// const ring1 = Ring({ atoms: 'c', size: 6 })
// const molecule1 = Molecule([linear1, ring1])

// Complex branching: C(C(C))c1ccccc1
Fragment('C(C(C))c1ccccc1').toCode();
// const linear1 = Linear(['C'])
// const linear2 = Linear(['C'])
// const linear3 = linear1.attach(1, linear2)
// const linear4 = Linear(['C'])
// const linear5 = linear3.attach(1, linear4)
// const ring1 = Ring({ atoms: 'c', size: 6 })
// const molecule1 = Molecule([linear5, ring1])
```
