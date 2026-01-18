# Fused Rings Module

This module handles the generation of SMILES strings for fused ring systems (currently supporting 2-ring systems like naphthalene, indole, quinoline, etc.).

## Architecture Overview

The module is organized into separate files for better maintainability and testability:

```
fused-rings/
├── index.js           # Main entry point, exports FusedRings function
├── builder.js         # Builds base SMILES without substituents
├── substituents.js    # Rebuilds SMILES with substituents attached
├── utils.js           # Shared utility functions
└── README.md          # This file
```

## Data Flow

### 1. Initial Creation (No Substituents)

```
FusedRings([6, 6], 'c')
  → buildBaseSmiles(sizes, hetero, atom)
    → Builds: "c1ccc2ccccc2c1" (naphthalene)
    → Returns: { smiles, atomPositions, totalAtoms }
  → Fragment(smiles)
    → Returns fragment with .attachAt() method
```

### 2. Adding Substituents

```
naphthalene.attachAt([0, 0], 'C')
  → validatePosition([0, 0])
  → validateRingIndex(0, sizes)
  → findGlobalPosition(0, 0, atomPositions, sizes)
    → Returns global atom index
  → extractSubstituentSmiles('C')
    → Returns 'C'
  → buildSmilesWithSubstituents(sizes, substituents, hetero, atom)
    → Builds: "c1(C)ccc2ccccc2c1" (methylnaphthalene)
  → Fragment(newSmiles)
    → Returns new fragment with updated .attachAt()
```

## Module Breakdown

### `index.js` - Main Entry Point

**Responsibilities:**
- Exports the main `FusedRings()` function
- Validates input (currently only 2 rings supported)
- Orchestrates the building process
- Creates the `attachAt()` method for chaining
- Manages substituent state

**Key Functions:**
- `FusedRings(sizes, atom, options)` - Main export, creates fused ring system
- `createAttachAt(currentSubstituents, currentHetero)` - Factory for attachAt method

### `builder.js` - Base SMILES Builder

**Responsibilities:**
- Builds the initial SMILES string without substituents
- Tracks atom positions for later substituent attachment
- Handles heteroatom replacements

**Key Functions:**
- `buildBaseSmiles(sizes, heteroAtoms, defaultAtom)` - Main builder
- `buildFirstAtom()` - First atom with ring marker 1
- `buildFirstRingMiddleAtoms()` - Atoms between first and bridge
- `buildFirstBridgeAtom()` - Shared atom with ring marker 2
- `buildSecondRingMiddleAtoms()` - Atoms in second ring
- `buildSecondBridgeAtom()` - Second shared atom with ring marker 2
- `buildLastAtom()` - Last atom with ring marker 1

**Output Example:**
For `FusedRings([6, 6], 'c')`:
```
c1ccc2ccccc2c1
^   ^ ^    ^  ^
|   | |    |  └─ Last atom (ring marker 1)
|   | |    └──── Second bridge (ring marker 2)
|   | └───────── First bridge (ring marker 2)
|   └─────────── Middle atoms of first ring
└─────────────── First atom (ring marker 1)
```

### `substituents.js` - SMILES with Substituents

**Responsibilities:**
- Rebuilds SMILES string with substituents in parentheses
- Handles ring number remapping to avoid conflicts
- Maintains correct ring marker placement

**Key Functions:**
- `buildSmilesWithSubstituents(sizes, substituents, heteroAtoms, defaultAtom)` - Main rebuilder
- `buildFirstAtomWithSub()` - First atom with optional substituent
- `buildFirstRingMiddleAtomsWithSub()` - Middle atoms with optional substituents
- `buildFirstBridgeAtomWithSub()` - Bridge with optional substituent
- `buildSecondRingMiddleAtomsWithSub()` - Second ring middle atoms
- `buildSecondBridgeAtomWithSub()` - Second bridge with optional substituent
- `buildLastAtomWithSub()` - Last atom with optional substituent

**Output Example:**
For `naphthalene.attachAt([0, 0], 'C')`:
```
c1(C)ccc2ccccc2c1
  ^^^
  └─ Substituent in parentheses after atom, before remaining markers
```

### `utils.js` - Shared Utilities

**Responsibilities:**
- Input validation
- Position mapping (ring coordinates → global atom index)
- Ring number conflict resolution
- Atom string building with substituents

**Key Functions:**

**Validation:**
- `validatePosition(position)` - Ensures position is [ringIndex, atomIndex]
- `validateRingIndex(ringIndex, sizes)` - Ensures ring index is valid

**Position Mapping:**
- `findGlobalPosition(ringIndex, atomIndex, atomPositions, sizes)` - Maps ring coordinates to global atom index
  - Example: `[0, 0]` → global position `0` (first atom)
  - Example: `[1, 1]` → global position `5` (second atom in second ring)

**Substituent Handling:**
- `extractSubstituentSmiles(substituent)` - Extracts SMILES from string/Fragment/FusedRings
- `remapRingNumbers(currentSmiles, subSmiles)` - Remaps ring numbers to avoid conflicts
  - Always reserves `1` and `2` for fused ring markers
  - Example: If substituent has `C1CC1` and parent already uses `1`, remaps to `C3CC3`

**Atom Building:**
- `getAtomString(atomPos, heteroAtoms, defaultAtom)` - Gets atom with hetero substitution
- `buildAtomWithSubstituent(atomString, substituent, marker, markerBefore)` - Builds atom string
  - `markerBefore=true`: `C1(CCO)` (marker before substituent)
  - `markerBefore=false`: `C(CCO)1` (marker after substituent)

## Ring Numbering System

Fused rings use two ring numbers to create the fusion:
- `1` - Connects first and last atom (closes the first ring)
- `2` - Connects the two bridge atoms (creates the fusion)

Example for naphthalene `c1ccc2ccccc2c1`:
```
Atom positions:  0 1 2 3 4 5 6 7 8 9
Ring markers:    1 - - - 2 - - - - 2 1
                 ^       ^       ^   ^
                 |       |       |   └─ Closes ring 1
                 |       |       └───── Closes ring 2 (bridge)
                 |       └───────────── Opens ring 2 (bridge)
                 └───────────────────── Opens ring 1
```

## Atom Position Metadata

The `atomPositions` array tracks where each atom belongs:

```javascript
{
  ring: 0 or 1,           // Which ring this atom belongs to
  index: number,          // Position within that ring
  smilesIndex: number,    // Position in SMILES string (legacy, not used)
  shared: boolean         // True if this is a bridge atom
}
```

Example for `[6, 6]` (naphthalene):
```
Global Pos | Ring | Index | Shared | Atom
-----------|------|-------|--------|------
     0     |  0   |   0   |  false | c1
     1     |  0   |   1   |  false | c
     2     |  0   |   2   |  false | c
     3     |  0   |   3   |  true  | c2 (bridge 1)
     4     |  1   |   1   |  false | c
     5     |  1   |   2   |  false | c
     6     |  1   |   3   |  false | c
     7     |  1   |   4   |  false | c
     8     |  1   |   5   |  true  | c2 (bridge 2)
     9     |  0   |   5   |  false | c1
```

## Usage Examples

### Basic Creation
```javascript
const naphthalene = FusedRings([6, 6], 'c');
// c1ccc2ccccc2c1
```

### With Heteroatoms
```javascript
const quinoline = FusedRings([6, 6], 'c', { hetero: { 0: 'n' } });
// n1ccc2ccccc2c1
```

### With Substituents
```javascript
const naphthalene = FusedRings([6, 6], 'c');
const methylNaphthalene = naphthalene.attachAt([0, 0], 'C');
// c1(C)ccc2ccccc2c1
```

### Chained Substituents
```javascript
const naphthalene = FusedRings([6, 6], 'c');
const disubstituted = naphthalene
  .attachAt([0, 0], 'C')
  .attachAt([1, 2], 'O');
// c1(C)ccc2cc(O)ccc2c1
```

## Testing

Unit tests are organized by module:
- `test/fused-rings.test.js` - Integration tests for the main FusedRings function
- `test/fused-rings-utils.test.js` - Unit tests for utility functions
- Additional test files can be added for builder.js and substituents.js

Run tests with:
```bash
npm test
```
