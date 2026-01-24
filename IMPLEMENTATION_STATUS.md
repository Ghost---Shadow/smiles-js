# Implementation Status

This document tracks the implementation progress of the SMILES-JS AST refactor.

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
console.log(benzene.smiles); // '1cccccc1'
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
console.log(toluene.smiles); // '1c(C)ccccc1'
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
console.log(pyridine.smiles); // '1nccccc1'
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
console.log(propylbenzene.smiles); // 'CCC1cccccc1'
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
console.log(naphthalene.smiles); // '1CC2CCCCCC2CC1'
```

### ✅ Checkpoint 7: SMILES Code Generator (Phase 4)
- [x] Created `src/codegen.js`
- [x] Implemented `buildSMILES()` dispatcher
- [x] Implemented `buildRingSMILES()` function
- [x] Implemented `buildLinearSMILES()` function
- [x] Implemented `buildFusedRingSMILES()` function
- [x] Implemented `buildMoleculeSMILES()` function
- [x] Updated all `.smiles` getters to use code generator
- [x] Wrote round-trip tests for all node types

**Status**: Complete and tested

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
- [x] Implemented `Molecule.prototype.append()`
- [x] Implemented `Molecule.prototype.prepend()`
- [x] Implemented `Molecule.prototype.concat()`
- [x] Implemented `Molecule.prototype.getComponent()`
- [x] Implemented `Molecule.prototype.replaceComponent()`
- [x] Implemented `Molecule.prototype.clone()`
- [x] Wrote tests for all methods

**Status**: Partially complete (Linear.attach, Linear.branch not yet implemented)

## Pending Checkpoints

### ⏳ Checkpoint 9: FusedRing Manipulation Methods
- [ ] Implement `FusedRing.prototype.addRing()`
- [ ] Implement `FusedRing.prototype.getRing()`
- [ ] Implement `FusedRing.prototype.substituteInRing()`
- [ ] Implement `FusedRing.prototype.attachToRing()`
- [ ] Implement `FusedRing.prototype.renumber()`
- [ ] Write tests for each method

**Status**: Not started

### ⏳ Checkpoint 11: Tokenizer (Phase 1)
- [ ] Create `src/tokenizer.js`
- [ ] Implement `tokenize()` function
- [ ] Implement atom token extraction
- [ ] Implement bond token extraction
- [ ] Implement ring marker extraction
- [ ] Implement branch symbol extraction
- [ ] Add position tracking for error messages
- [ ] Write tests for tokenizer

**Status**: Not started

### ⏳ Checkpoint 12-13: Parser (Phase 2)
- [ ] Create `src/parser.js`
- [ ] Implement Pass 1: Linear scan with ring tracking
- [ ] Implement Pass 2: AST building
- [ ] Handle nested branches
- [ ] Write parser tests

**Status**: Not started

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

**Total Tests**: 36
**Passing**: 36 ✅
**Failing**: 0 ❌

### Test Coverage by Module

- `src/constructors.test.js`: 16 tests ✅
- `src/manipulation.test.js`: 20 tests ✅

## Key Features Implemented

1. **Programmatic Molecule Construction**
   - Ring(), Linear(), FusedRing(), Molecule() constructors
   - All constructors validated and tested

2. **SMILES Serialization**
   - Every AST node has a `.smiles` property
   - Code generator supports all node types
   - Proper handling of attachments and substitutions

3. **Immutable Manipulation API**
   - Ring: attach, substitute, substituteMultiple, fuse, concat, clone
   - Linear: concat, clone
   - Molecule: append, prepend, concat, getComponent, replaceComponent, clone

4. **Type Safety**
   - Type checking utilities (isRingNode, etc.)
   - Input validation (validateAtoms, validateSize, validatePosition)
   - Clear error messages

## Next Steps

The highest priority next steps are:

1. **Checkpoint 11-13**: Implement Tokenizer and Parser
   - This will enable parsing SMILES strings into AST
   - Required for full round-trip capability (SMILES → AST → SMILES)

2. **Checkpoint 9**: Complete FusedRing manipulation methods
   - Enable advanced manipulation of fused ring systems

3. **Checkpoint 14**: Fragment Integration
   - Integrate new AST with existing Fragment API
   - Ensure backward compatibility

4. **Checkpoint 16-18**: Decompiler
   - Enable code generation from AST
   - Add `.toCode()` method to Fragment

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
console.log(benzene.smiles);   // '1cccccc1'
console.log(pyridine.smiles);  // '1nccccc1'
console.log(toluene.smiles);   // '1c(C)ccccc1'
```

## Architecture

```
src/
├── ast.js              # AST node types and validation utilities
├── constructors.js     # Factory functions (Ring, Linear, etc.)
├── codegen.js          # SMILES code generator
├── manipulation.js     # Manipulation methods
└── index.js            # Public API exports

examples/
└── basic-usage.js      # Usage examples
```

## Notes

- All implementations follow the design from `docs/PARSER_REFACTOR_PLAN.md`
- Code follows the "startup mindset" from `CLAUDE.md` (move fast, iterate, breaking changes OK)
- Test assertions use `.toEqual()` for object matching per project guidelines
- SMILES generation works but is not yet canonical (e.g., uses ring markers at different positions than standard)
