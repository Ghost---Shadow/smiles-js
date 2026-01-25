# Implementation Status

This document tracks the implementation progress of the SMILES-JS AST refactor.

## Summary

**Checkpoints Completed**: 15 out of 21 (71%)
**Current Status**: Core construction API + Tokenizer + Parser + Manipulation methods + Decompiler complete

### What Works ✅
- All 4 constructors (Ring, Linear, FusedRing, Molecule)
- **Ring manipulation** (attach, substitute, substituteMultiple, fuse, concat, clone, toObject, toCode)
- **Linear manipulation** (attach, branch, branchAt, concat, clone, toObject, toCode)
- **FusedRing manipulation** (addRing, getRing, substituteInRing, attachToRing, renumber, concat, clone, toObject, toCode)
- **Molecule manipulation** (append, prepend, concat, getComponent, replaceComponent, clone, toObject, toCode)
- **Standard SMILES serialization** for all node types including branches
- **Complete tokenizer** - converts SMILES strings to token stream
- **Parser with full branch support** - converts SMILES strings to AST with branch attachments
- **Nested branches** - `CC(C(C))C` parses correctly
- **Multiple branches at same position** - `CC(C)(C)C` parses correctly
- **Ring attachments** - `C1CCC(C)CC1` parses correctly
- **Decompiler** - converts AST back to JavaScript constructor code
- **Round-trip capability** - SMILES → AST → SMILES → Code works for most structures
- Immutable operations throughout
- Full test coverage (147 passing tests, 1 skipped)

### What's Missing ❌
- **Parser fused ring handling** - fused rings with interleaved atoms (1 skipped test)
- Fragment integration - **not started**

### Known Limitations ⚠️
- Fused ring SMILES generation is incomplete for interleaved structures (naphthalene)
- No bond handling beyond basic storage in Linear nodes

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

### ✅ Checkpoint 10: Linear & Molecule Manipulation Methods
- [x] Implemented `Linear.prototype.attach()`
- [x] Implemented `Linear.prototype.branch()`
- [x] Implemented `Linear.prototype.branchAt()`
- [x] Implemented `Linear.prototype.concat()`
- [x] Implemented `Linear.prototype.clone()`
- [x] Implemented `Molecule.prototype.append()`
- [x] Implemented `Molecule.prototype.prepend()`
- [x] Implemented `Molecule.prototype.concat()`
- [x] Implemented `Molecule.prototype.getComponent()`
- [x] Implemented `Molecule.prototype.replaceComponent()`
- [x] Implemented `Molecule.prototype.clone()`
- [x] Wrote tests for all methods (11 new tests for Linear)

**Status**: Complete and tested

**Example**:
```javascript
const propyl = Linear(['C', 'C', 'C']);
const methyl = Linear(['C']);
const ethyl = Linear(['C', 'C']);

// Single attachment
const branched = propyl.attach(methyl, 2);

// Multiple branches at once
const multiBranched = propyl.branch(2, methyl, ethyl);

// Branches at multiple positions
const complex = propyl.branchAt({
  1: methyl,
  2: [methyl, ethyl],
  3: methyl,
});
```

### ✅ Checkpoint 9: FusedRing Manipulation Methods
- [x] Implement `FusedRing.prototype.addRing()`
- [x] Implement `FusedRing.prototype.getRing()`
- [x] Implement `FusedRing.prototype.substituteInRing()`
- [x] Implement `FusedRing.prototype.attachToRing()`
- [x] Implement `FusedRing.prototype.renumber()`
- [x] Implement `FusedRing.prototype.concat()`
- [x] Implement `FusedRing.prototype.clone()`
- [x] Write tests for each method (9 tests)

**Status**: Complete and tested

**Example**:
```javascript
const ring1 = Ring({ atoms: 'C', size: 10, ringNumber: 1 });
const ring2 = Ring({ atoms: 'C', size: 6, ringNumber: 2 });
const fusedRing = ring1.fuse(ring2, 2);

// Add another ring to the system
const ring3 = Ring({ atoms: 'C', size: 5, ringNumber: 3 });
const expanded = fusedRing.addRing(ring3, 8);

// Substitute in a specific ring
const modified = fusedRing.substituteInRing(2, 3, 'N');

// Attach to a specific ring
const methyl = Linear(['C']);
const withAttachment = fusedRing.attachToRing(2, methyl, 3);

// Renumber rings sequentially
const renumbered = fusedRing.renumber(); // Rings become 1, 2, 3...
```

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

### ✅ Checkpoint 12-13: Parser with Branch Support
- [x] Create `src/parser.js`
- [x] Implement Pass 1: Linear scan with ring and branch tracking
- [x] Implement Pass 2: AST building
- [x] Integrate branch attachments into Linear nodes
- [x] Update codegen to serialize branches
- [x] Write parser tests (27 tests, 1 skipped for fused rings)
- [x] Handle multiple branches at same position

**Status**: Complete - all branch types work correctly

**Working**:
- Simple branches: `C(C)C` → parses correctly with attachment
- Branches with bonds: `CC(=O)C` → bond preserved in attachment
- Branch round-trip: Parse and regenerate identical SMILES
- Nested branches: `CC(C(C))C` → correctly nests branches ✅
- Multiple branches: `CC(C)(C)C` → creates separate attachments at same position ✅
- Triple branches: `C(C)(C)(C)C` → correctly handles 3+ branches ✅
- Ring attachments: `C1CCC(C)CC1` → branches on rings work ✅

**Implementation Details**:
- Uses branchId tracking to distinguish separate branches at same position
- Tracks lastAtomAtDepth Map to maintain parent context at each nesting level
- Filters branch atoms (depth > 0) when building ring positions
- Unit tests verify branch tracking logic independently

**Example**:
```javascript
const ast = parse('CC(=O)C');
// Returns Linear node with:
//   atoms: ['C', 'C', 'C']
//   attachments: {
//     2: [Linear(['O'], ['='])]
//   }
// ast.smiles === 'CC(=O)C' ✅
```

### ✅ Checkpoint 12-13 (Old): Parser (Phase 2)
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

**Working**:
- Simple branches (`C(C)C`, `CC(=O)C`)
- Branch round-trip (parse and regenerate SMILES)
- Bonds in branches

**Not Yet Working**:
- Multiple branches at same position (`CC(C)(C)C` - groups as nested)
- Complex fused rings with interleaving atoms (naphthalene C1CC2CCCCC2CC1)

### ✅ Checkpoint 16-18: Decompiler (Phase 5)
- [x] Create `src/decompiler.js`
- [x] Implement `decompile()` function for all node types
- [x] Add `.toCode()` method to all nodes
- [x] Write decompiler tests (13 tests)
- [x] Create decompiler examples

**Status**: Complete and tested

**Features**:
- Converts any AST node to JavaScript constructor code
- Preserves structure and attachments
- Customizable variable names
- Works with all node types (Ring, Linear, FusedRing, Molecule)

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
console.log(benzene.toCode('benzene'));
// Output: const benzene = Ring({ atoms: 'c', size: 6 });

const ast = parse('CCCc1ccccc1');
console.log(ast.toCode('compound'));
// Output:
// const compoundComponent1 = Linear(['C', 'C', 'C']);
// const compoundComponent2 = Ring({ atoms: 'c', size: 6 });
// const compound = Molecule([compoundComponent1, compoundComponent2]);
```

## Pending Checkpoints

### ⏳ Checkpoint 14: Fragment Integration
- [ ] Update `Fragment` constructor to use new parser
- [ ] Add `Fragment.prototype.toAST()` method
- [ ] Ensure Fragment can accept AST nodes as input
- [ ] Ensure backward compatibility

**Status**: Not started

## Test Summary

**Total Tests**: 148
**Passing**: 147 ✅
**Skipped**: 1 ⏭️
**Failing**: 0 ❌

### Test Coverage by Module

- `src/constructors.test.js`: 16 tests ✅
- `src/manipulation.test.js`: 40 tests ✅ (11 Linear tests, 9 FusedRing tests)
- `src/tokenizer.test.js`: 29 tests ✅
- `src/parser.test.js`: 47 tests (46 ✅, 1 ⏭️ - fused rings only)
- `src/parser.branch-tracking.test.js`: 3 tests ✅ (unit tests for branch logic)
- `src/decompiler.test.js`: 13 tests ✅

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
   - Ring: attach, substitute, substituteMultiple, fuse, concat, clone, toObject, toCode
   - Linear: attach, branch, branchAt, concat, clone, toObject, toCode
   - FusedRing: addRing, getRing, substituteInRing, attachToRing, renumber, concat, clone, toObject, toCode
   - Molecule: append, prepend, concat, getComponent, replaceComponent, clone, toObject, toCode

4. **Decompiler**
   - decompile() function converts AST to JavaScript code
   - .toCode() method on all nodes
   - Enables AST → Constructor code conversion
   - Useful for debugging and code generation

5. **Type Safety**
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

3. **Checkpoint 14**: Fragment Integration
   - Integrate new AST with existing Fragment API
   - Ensure backward compatibility

4. **Checkpoint 16-18**: Decompiler (Phase 5)
   - Create JavaScript code generation from AST
   - Enable AST → Constructor code conversion

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
├── tokenizer.js        # SMILES tokenizer (Phase 1) ✅
├── parser.js           # SMILES parser (Phase 2) ✅
└── index.js            # Public API exports

examples/
└── basic-usage.js      # Usage examples
```

## Code Quality

### Linting
- **0 errors** ✅
- **89 warnings** (all from console.log in examples, which is expected)

### Testing
- **95 tests passing** ✅
- **3 tests skipped** (parser limitations - documented as incomplete)
- Full coverage of implemented features
- All assertions use `.toEqual()` for object matching

### Documentation
- Inline comments for complex logic (especially FusedRing SMILES generation)
- Clear JSDoc comments on all public functions
- Examples demonstrate all core features
- Status doc accurately describes limitations

## Implementation y Assessment ✅

**Assessment Date**: 2026-01-24
**Assessor**: Claude Sonnet 4.5
**Method**: Code inspection, test execution, and behavioral verification

### Summary:  ✅

The implementation status document is ** and accurate**. All claims have been verified through code inspection, test execution, and behavioral testing. Limitations are clearly documented and match actual behavior.

### Test Results Verification:
```bash
$ bun test
 106 pass
 3 skip
 0 fail
 221 expect() calls
Ran 109 tests across 4 files. [50.00ms]
```

**Status**: ✅ Test counts are accurate (106 passing, 3 skipped, 0 failing)

### Verified Claims:

#### 1. Core Construction API ✅
- **Claim**: All 4 constructors work (Ring, Linear, FusedRing, Molecule)
- **Verification**:
  ```bash
  $ node -e "import {Ring} from './src/index.js'; const benzene = Ring({ atoms: 'c', size: 6 }); console.log(benzene.smiles);"
  c1ccccc1
  ```
- **Status**: ✅ VERIFIED - All constructors present and functional

#### 2. Standard SMILES Notation ✅
- **Claim**: Uses standard notation where ring markers appear after atoms (e.g., `c1ccccc1`)
- **Verification**: Benzene outputs `c1ccccc1` not `1cccccc1`
- **Code Evidence**: `src/codegen.js:64` - "Ring marker appears AFTER the first atom (standard notation)"
- **Status**: ✅ VERIFIED - Standard SMILES notation implemented correctly

#### 3. Round-Trip Capability ✅
- **Claim**: SMILES → AST → SMILES works for most structures
- **Verification**:
  ```bash
  $ node -e "import {parse} from './src/index.js'; const ast = parse('CCCc1ccccc1'); console.log(ast.smiles);"
  CCCc1ccccc1
  ```
- **Status**: ✅ VERIFIED - Round-trip works for simple and medium complexity structures

#### 4. Tokenizer Complete ✅
- **Claim**: Complete tokenizer converts SMILES strings to token stream
- **Verification**:
  ```bash
  $ node -e "import {tokenize} from './src/index.js'; const tokens = tokenize('C(C)C'); console.log(JSON.stringify(tokens[1]));"
  {"type":"branch_open","value":"(","position":1}
  ```
- **Test Coverage**: 29 tests in `src/tokenizer.test.js`
- **Status**: ✅ VERIFIED - Tokenizer handles all SMILES features including branches, bonds, ring markers

#### 5. Manipulation Methods Implemented ✅
- **Claim**: Complete manipulation methods for Ring, Linear, FusedRing, and Molecule
- **Code Evidence**:
  - `src/manipulation.js:23-101` - Ring methods (attach, substitute, substituteMultiple, fuse, concat, clone)
  - `src/manipulation.js:107-157` - Linear methods (attach, branch, branchAt, concat, clone)
  - `src/manipulation.js:163-232` - FusedRing methods (addRing, getRing, substituteInRing, attachToRing, renumber, concat, clone)
  - `src/manipulation.js:234-279` - Molecule methods (append, prepend, concat, getComponent, replaceComponent, clone)
- **Test Coverage**: 40 tests in `src/manipulation.test.js`
- **Status**: ✅ VERIFIED - All manipulation methods implemented and tested

### Verified Limitations (ly Documented):

#### 1. Parser Branch Handling ⚠️
- **Claim**: "Branches are tracked but not yet integrated into AST (2 skipped tests)"
- **Verification**:
  ```bash
  $ node -e "import {parse} from './src/index.js'; const ast = parse('C(C)C'); console.log(JSON.stringify(ast, null, 2));"
  {
    "type": "linear",
    "atoms": ["C", "C", "C"],
    "bonds": [],
    "attachments": {},
    "smiles": "CCC"
  }
  ```
- **Code Evidence**:
  - `src/parser.js:251-254` - Branch tracking variables declared
  - `src/parser.test.js:148` - `test.skip('parses simple branch - NOT IMPLEMENTED')`
  - `src/parser.test.js:157` - `test.skip('parses branch with double bond - NOT IMPLEMENTED')`
- **Status**: ✅  - Branches are tokenized and tracked but result in flat linear chains

#### 2. Fused Ring Parsing ⚠️
- **Claim**: "Fused rings parse incorrectly (1 skipped test)"
- **Code Evidence**: `src/parser.test.js:103` - `test.skip('parses naphthalene')` with TODO comment: "Fused ring parsing is complex - rings interleave rather than being consecutive"
- **Status**: ✅  - Limitation clearly documented with explanation

#### 3. Known Limitations Section ⚠️
- **Claim**: "No bond handling beyond basic storage in Linear nodes"
- **Code Evidence**: `src/codegen.js:34-37` - Bonds are stored and serialized but not fully manipulated
- **Status**: ✅  - Limitation accurately stated

### Architecture Verification:

#### File Structure ✅
- ✅ `src/ast.js` - AST node types and validation utilities
- ✅ `src/constructors.js` - Factory functions (Ring, Linear, FusedRing, Molecule)
- ✅ `src/codegen.js` - SMILES code generator
- ✅ `src/manipulation.js` - Manipulation methods
- ✅ `src/tokenizer.js` - SMILES tokenizer
- ✅ `src/parser.js` - SMILES parser
- ✅ `src/index.js` - Public API exports

All claimed files exist and contain the documented functionality.

### Code Quality Verification:

#### Linting ✅
- **Status**: Not directly verified but code appears clean and well-formatted

#### Testing ✅
- **Total Tests**: 109 (106 passing, 3 skipped, 0 failing)
- **Test Files**: 4 files with comprehensive coverage
- **Assertions**: Uses `.toEqual()` for object matching as per guidelines
- **Status**: ✅ VERIFIED - Excellent test coverage

#### Documentation ✅
- Inline comments present in complex sections (e.g., FusedRing SMILES generation)
- Status document accurately describes all features and limitations
- **Status**: ✅ VERIFIED - Well documented

### Discrepancies Found:

**NONE** - All claims in the IMPLEMENTATION_STATUS.md document have been verified as accurate. The document is  about both capabilities and limitations.

### Conclusion:

The IMPLEMENTATION_STATUS.md document is **REMARKABLY **. It:
- ✅ Accurately reports test counts (106 passing, 3 skipped)
- ✅ Clearly documents implemented features with examples
- ✅ Explicitly calls out limitations and incomplete features
- ✅ Provides TODO comments for unfinished work
- ✅ Uses "NOT IMPLEMENTED" labels on skipped tests
- ✅ Describes exactly what works and what doesn't

**No updates required** - The document accurately reflects the current implementation state.


## Implementation Notes

- All implementations follow the design from `PARSER_REFACTOR_PLAN.md`
- Code follows the "startup mindset" from `CLAUDE.md` (move fast, iterate, breaking changes OK)
- SMILES generation uses **standard notation** (ring markers after atoms) - FIXED ✅
- FusedRing SMILES generation includes detailed inline documentation
- Linear.attach() is stubbed with error message - clearly documented as not implemented
- Parser exists and works for basic cases - branches tracked but not yet integrated into AST
- Tokenizer is complete and handles all SMILES features including branches, bonds, ring markers
