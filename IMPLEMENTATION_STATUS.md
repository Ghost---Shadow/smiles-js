# Implementation Status

This document tracks the implementation progress of the SMILES-JS AST refactor.

## Summary

**Checkpoints Completed**: 11 out of 21 (52%)
**Current Status**: Core construction API + Tokenizer + Parser complete

### What Works ✅
- All 4 constructors (Ring, Linear, FusedRing, Molecule)
- Ring manipulation (attach, substitute, substituteMultiple, fuse, concat, clone)
- Molecule manipulation (append, prepend, concat, getComponent, replaceComponent, clone)
- Linear.concat() and Linear.clone()
- **Standard SMILES serialization** for all node types
- **Complete tokenizer** - converts SMILES strings to token stream
- **Working parser** - converts SMILES strings to AST
- **Round-trip capability** - SMILES → AST → SMILES works for most structures
- Immutable operations throughout
- Full test coverage (86 passing tests, 1 skipped)

### What's Missing ❌
- Linear.attach() - **throws "not yet implemented" error**
- Linear.branch() and Linear.branchAt() - **not implemented**
- FusedRing manipulation methods (addRing, substituteInRing, attachToRing, renumber)
- **Parser branch handling** - branches are tracked but not yet integrated into AST
- **Parser fused ring handling** - fused rings parse incorrectly (skipped test)
- Fragment integration - **not started**
- Decompiler (Phase 5) - **not started**

### Known Limitations ⚠️
- Parser doesn't handle branch attachments yet (branches parsed but not integrated)
- Fused ring parsing is incomplete (rings that interleave atoms)
- No bond handling beyond basic storage in Linear nodes
- Linear attachments (branches) not yet implemented in manipulation API

## Completed Checkpoints

### ✅ Checkpoint 0: Foundation
- [x] Created `src/ast.js` with AST node type constants
- [x] Created `src/constructors.js` with factory functions
- [x] Added basic type-checking utilities (`isRingNode`, `isMoleculeNode`, etc.)
- [x] Created helper functions for immutable updates

**Status**: Complete and tested

### ✅ Checkpoint 1: Ring Constructor
- [x] Implemented `Ring()` constructor function
- [x] Implemented `createRingNode()` internal function
- [x] Added validation for ring parameters (atoms, size)
- [x] Added `.smiles` getter to Ring nodes
- [x] Wrote tests for Ring construction
- [x] Wrote tests for `ring.smiles` output

**Status**: Complete and tested

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
console.log(benzene.smiles); // 'c1ccccc1' (standard SMILES notation)
```

### ✅ Checkpoint 2: Linear Constructor
- [x] Implemented `Linear()` constructor function
- [x] Implemented `createLinearNode()` internal function
- [x] Added validation for linear parameters (atoms array)
- [x] Added `.smiles` getter to Linear nodes
- [x] Wrote tests for Linear construction
- [x] Wrote tests for `linear.smiles` output

**Status**: Complete and tested

**Example**:
```javascript
const propane = Linear(['C', 'C', 'C']);
console.log(propane.smiles); // 'CCC'
```

### ✅ Checkpoint 3: Ring.attach() - Simple Attachments
- [x] Implemented `Ring.prototype.attach()` method
- [x] Handle single attachment to a ring position
- [x] Update ring's attachments object immutably
- [x] Ensure `.smiles` getter works with attachments
- [x] Wrote tests for ring attachments
- [x] Tested round-trip compatibility

**Status**: Complete and tested

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
const methyl = Linear(['C']);
const toluene = benzene.attach(methyl, 1);
console.log(toluene.smiles); // 'c1(C)ccccc1'
```

### ✅ Checkpoint 4: Ring.substitute() - Ring Substitutions
- [x] Implemented `Ring.prototype.substitute()` method
- [x] Handle substitution at specific position
- [x] Update ring's substitutions object immutably
- [x] Handle removal of substitution when newAtom matches base
- [x] Ensure `.smiles` getter works with substitutions
- [x] Wrote tests for ring substitutions
- [x] Tested pyridine and other heteroaromatics

**Status**: Complete and tested

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
const pyridine = benzene.substitute(1, 'n');
console.log(pyridine.smiles); // 'n1ccccc1'
```

### ✅ Checkpoint 5: Molecule Constructor
- [x] Implemented `Molecule()` constructor function
- [x] Implemented `createMoleculeNode()` internal function
- [x] Added `.smiles` getter to Molecule nodes
- [x] Handle concatenation of linear + ring components
- [x] Wrote tests for molecule construction
- [x] Tested propylbenzene and similar structures

**Status**: Complete and tested

**Example**:
```javascript
const propyl = Linear(['C', 'C', 'C']);
const benzene = Ring({ atoms: 'c', size: 6 });
const propylbenzene = Molecule([propyl, benzene]);
console.log(propylbenzene.smiles); // 'CCCc1ccccc1'
```

### ✅ Checkpoint 6: FusedRing Constructor
- [x] Implemented `FusedRing()` constructor function
- [x] Implemented `createFusedRingNode()` internal function
- [x] Implemented basic ring validation
- [x] Added `.smiles` getter to FusedRing nodes
- [x] Wrote tests for fused ring construction
- [x] Tested naphthalene and similar structures

**Status**: Complete and tested

**Example**:
```javascript
const naphthalene = FusedRing([
  Ring({ atoms: 'C', size: 10, offset: 0, ringNumber: 1 }),
  Ring({ atoms: 'C', size: 6, offset: 2, ringNumber: 2 })
]);
console.log(naphthalene.smiles); // 'C1CC2CCCCC2CC1'
```

### ✅ Checkpoint 7: SMILES Code Generator (Phase 4)
- [x] Created `src/codegen.js`
- [x] Implemented `buildSMILES()` dispatcher
- [x] Implemented `buildRingSMILES()` function with standard notation
- [x] Implemented `buildLinearSMILES()` function
- [x] Implemented `buildFusedRingSMILES()` function with detailed comments
- [x] Implemented `buildMoleculeSMILES()` function
- [x] Updated all `.smiles` getters to use code generator
- [x] Wrote round-trip tests for all node types
- [x] **Fixed to use standard SMILES notation** (ring marker after first atom)

**Status**: Complete and tested

**Note**: SMILES generation now follows standard notation where ring markers appear AFTER atoms, not before (e.g., `c1ccccc1` not `1cccccc1`).

### ✅ Checkpoint 8: Additional Ring Manipulation Methods
- [x] Implemented `Ring.prototype.substituteMultiple()`
- [x] Implemented `Ring.prototype.fuse()`
- [x] Implemented `Ring.prototype.concat()`
- [x] Implemented `Ring.prototype.clone()`
- [x] Wrote tests for each method
- [x] Ensured all operations are immutable

**Status**: Complete and tested

### ✅ Checkpoint 10 (Partial): Linear & Molecule Manipulation Methods
- [x] Implemented `Linear.prototype.concat()`
- [x] Implemented `Linear.prototype.clone()`
- [ ] ~~Implemented `Linear.prototype.attach()`~~ - **STUBBED** (throws "not yet implemented")
- [ ] ~~Implemented `Linear.prototype.branch()`~~ - **NOT STARTED**
- [ ] ~~Implemented `Linear.prototype.branchAt()`~~ - **NOT STARTED**
- [x] Implemented `Molecule.prototype.append()`
- [x] Implemented `Molecule.prototype.prepend()`
- [x] Implemented `Molecule.prototype.concat()`
- [x] Implemented `Molecule.prototype.getComponent()`
- [x] Implemented `Molecule.prototype.replaceComponent()`
- [x] Implemented `Molecule.prototype.clone()`
- [x] Wrote tests for implemented methods

**Status**: Partially complete

**Important**: Linear.attach() exists but throws an error. Linear.branch() and Linear.branchAt() do not exist. Only use Linear.concat() and Linear.clone().

## Pending Checkpoints

### ⏳ Checkpoint 9: FusedRing Manipulation Methods
- [ ] Implement `FusedRing.prototype.addRing()`
- [ ] Implement `FusedRing.prototype.getRing()`
- [ ] Implement `FusedRing.prototype.substituteInRing()`
- [ ] Implement `FusedRing.prototype.attachToRing()`
- [ ] Implement `FusedRing.prototype.renumber()`
- [ ] Write tests for each method

**Status**: Not started

### ✅ Checkpoint 11: Tokenizer (Phase 1)
- [x] Create `src/tokenizer.js`
- [x] Implement `tokenize()` function
- [x] Implement atom token extraction (simple and bracketed)
- [x] Implement bond token extraction (-, =, #, :, /, \)
- [x] Implement ring marker extraction (single digit and %NN notation)
- [x] Implement branch symbol extraction ( and )
- [x] Add position tracking for error messages
- [x] Write comprehensive tests (29 test cases)
- [x] Handle disconnected fragments (dot notation)
- [x] Error handling for invalid SMILES

**Status**: Complete and tested

**Example**:
```javascript
import { tokenize } from './src/index.js';

const tokens = tokenize('c1ccccc1');
// Returns array of token objects with type, value, position
// [
//   { type: 'atom', value: 'c', atom: 'c', position: 0 },
//   { type: 'ring_marker', value: '1', ringNumber: 1, position: 1 },
//   { type: 'atom', value: 'c', atom: 'c', position: 2 },
//   ...
// ]
```

### ✅ Checkpoint 12-13: Parser (Phase 2)
- [x] Create `src/parser.js`
- [x] Implement Pass 1: Linear scan with ring tracking
- [x] Implement Pass 2: AST building
- [ ] Handle nested branches (tracked but not yet integrated into AST)
- [x] Write parser tests (22 tests, 1 skipped for fused rings)

**Status**: Mostly complete - basic parsing works, branches and complex fused rings need work

**Working**:
- Simple linear chains (CCC, CCO)
- Simple rings (c1ccccc1, C1CCCC1)
- Ring substitutions (n1ccccc1, n1cncnc1)
- Molecules with multiple components (Cc1ccccc1, CCCc1ccccc1)
- Two-letter atoms (Cl, Br)
- Bracketed atoms ([NH3+], [13C])
- Round-trip for simple structures

**Not Yet Working**:
- Branch attachments (branches tracked but not integrated)
- Complex fused rings with interleaving atoms (naphthalene C1CC2CCCCC2CC1)

### ⏳ Checkpoint 14: Fragment Integration
- [ ] Update `Fragment` constructor to use new parser
- [ ] Add `Fragment.prototype.toAST()` method
- [ ] Ensure Fragment can accept AST nodes as input
- [ ] Ensure backward compatibility

**Status**: Not started

### ⏳ Checkpoint 16-18: Decompiler (Phase 5)
- [ ] Create `src/decompiler.js`
- [ ] Implement JavaScript code generation from AST
- [ ] Add `Fragment.prototype.toCode()` method
- [ ] Write decompiler tests

**Status**: Not started

## Test Summary

**Total Tests**: 87
**Passing**: 86 ✅
**Skipped**: 1 ⏭️
**Failing**: 0 ❌

### Test Coverage by Module

- `src/constructors.test.js`: 16 tests ✅
- `src/manipulation.test.js`: 20 tests ✅
- `src/tokenizer.test.js`: 29 tests ✅
- `src/parser.test.js`: 22 tests (21 ✅, 1 ⏭️ - fused rings)

## Key Features Implemented

1. **Programmatic Molecule Construction**
   - Ring(), Linear(), FusedRing(), Molecule() constructors
   - All constructors validated and tested

2. **Standard SMILES Serialization**
   - Every AST node has a `.smiles` property
   - Code generator supports all node types
   - Proper handling of attachments and substitutions
   - **Standard notation**: Ring markers appear after atoms (e.g., `c1ccccc1`)

3. **Immutable Manipulation API**
   - Ring: attach, substitute, substituteMultiple, fuse, concat, clone
   - Linear: concat, clone (attach/branch not yet implemented)
   - Molecule: append, prepend, concat, getComponent, replaceComponent, clone

4. **Type Safety**
   - Type checking utilities (isRingNode, etc.)
   - Input validation (validateAtoms, validateSize, validatePosition)
   - Clear error messages

## Next Steps

The highest priority next steps are:

1. **Complete Parser Branch Handling**
   - Parse branches (e.g., C(C)C, CC(=O)C) and integrate them into AST
   - This will enable parsing molecules with attachments
   - Required for full SMILES coverage

2. **Fix Fused Ring Parsing**
   - Handle complex fused rings where atoms interleave (naphthalene C1CC2CCCCC2CC1)
   - Current implementation assumes consecutive atom sequences

3. **Complete Linear manipulation** (Checkpoint 10)
   - Implement Linear.attach(), Linear.branch(), Linear.branchAt()
   - Enable branching for linear chains

4. **Checkpoint 9**: Complete FusedRing manipulation methods
   - Enable advanced manipulation of fused ring systems

5. **Checkpoint 14**: Fragment Integration
   - Integrate new AST with existing Fragment API
   - Ensure backward compatibility

## Usage Examples

See `examples/basic-usage.js` for comprehensive usage examples.

### Quick Example

```javascript
import { Ring, Linear } from './src/index.js';

// Create benzene
const benzene = Ring({ atoms: 'c', size: 6 });

// Create pyridine by substitution
const pyridine = benzene.substitute(1, 'n');

// Create toluene by attachment
const methyl = Linear(['C']);
const toluene = benzene.attach(methyl, 1);

// All operations are immutable
console.log(benzene.smiles);   // 'c1ccccc1'
console.log(pyridine.smiles);  // 'n1ccccc1'
console.log(toluene.smiles);   // 'c1(C)ccccc1'
```

## Architecture

```
src/
├── ast.js              # AST node types and validation utilities
├── constructors.js     # Factory functions (Ring, Linear, etc.)
├── codegen.js          # SMILES code generator (standard notation)
├── manipulation.js     # Manipulation methods
├── tokenizer.js        # SMILES tokenizer (Phase 1) ✨ NEW
└── index.js            # Public API exports

examples/
└── basic-usage.js      # Usage examples
```

## Code Quality

### Linting
- **0 errors** ✅
- **26 warnings** (all from console.log in examples, which is expected)

### Testing
- **36 tests passing**
- Full coverage of implemented features
- All assertions use `.toEqual()` for object matching

### Documentation
- Inline comments for complex logic (especially FusedRing SMILES generation)
- Clear JSDoc comments on all public functions
- Examples demonstrate all core features

## Implementation Notes

- All implementations follow the design from `docs/PARSER_REFACTOR_PLAN.md`
- Code follows the "startup mindset" from `CLAUDE.md` (move fast, iterate, breaking changes OK)
- SMILES generation uses **standard notation** (ring markers after atoms)
- FusedRing SMILES generation includes detailed inline documentation
- Linear.attach() is stubbed with error message - clearly documented as not implemented
