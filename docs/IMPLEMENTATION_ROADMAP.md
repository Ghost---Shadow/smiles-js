# Implementation Roadmap

This roadmap breaks down the parser refactor into incremental, shipable checkpoints. Each checkpoint delivers working functionality that can be tested and validated independently.

## Checkpoint 0: Foundation

**Goal**: Set up the basic infrastructure and types without breaking existing functionality.

### Tasks
- [ ] Create `src/ast.js` with AST node type constants
- [ ] Create `src/constructors.js` stub file
- [ ] Add basic type-checking utilities (`isRingNode`, `isMoleculeNode`, etc.)
- [ ] Write unit tests for type checkers

**Shipable**: Type system is defined and testable

---

## Checkpoint 1: Ring Constructor

**Goal**: Users can programmatically create simple rings.

### Tasks
- [ ] Implement `Ring()` constructor function
- [ ] Implement `createRingNode()` internal function
- [ ] Add validation for ring parameters (atoms, size)
- [ ] Add `.smiles` getter to Ring prototype using existing `FusedRing.parse()` as fallback
- [ ] Write tests for Ring construction
- [ ] Write tests for `ring.smiles` output

**Shipable**: `Ring({ atoms: 'c', size: 6 })` works and returns valid SMILES

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
console.log(benzene.smiles); // 'c1ccccc1'
```

---

## Checkpoint 2: Linear Constructor

**Goal**: Users can programmatically create linear chains.

### Tasks
- [ ] Implement `Linear()` constructor function
- [ ] Implement `createLinearNode()` internal function
- [ ] Add validation for linear parameters (atoms array)
- [ ] Add `.smiles` getter to Linear prototype
- [ ] Write tests for Linear construction
- [ ] Write tests for `linear.smiles` output

**Shipable**: `Linear(['C', 'C', 'C'])` works and returns valid SMILES

**Example**:
```javascript
const propane = Linear(['C', 'C', 'C']);
console.log(propane.smiles); // 'CCC'
```

---

## Checkpoint 3: Ring.attach() - Simple Attachments

**Goal**: Users can attach linear chains to rings.

### Tasks
- [ ] Implement `Ring.prototype.attach()` method
- [ ] Handle single attachment to a ring position
- [ ] Update ring's attachments object immutably
- [ ] Ensure `.smiles` getter works with attachments
- [ ] Write tests for ring attachments
- [ ] Test round-trip: construct → smiles → parse → compare

**Shipable**: Can create toluene programmatically

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
const methyl = Linear(['C']);
const toluene = benzene.attach(1, methyl);
console.log(toluene.smiles); // 'c1c(C)cccc1' or equivalent
```

---

## Checkpoint 4: Ring.substitute() - Ring Substitutions

**Goal**: Users can substitute atoms within rings.

### Tasks
- [ ] Implement `Ring.prototype.substitute()` method
- [ ] Handle substitution at specific position
- [ ] Update ring's substitutions object immutably
- [ ] Handle removal of substitution when newAtom matches base
- [ ] Ensure `.smiles` getter works with substitutions
- [ ] Write tests for ring substitutions
- [ ] Test pyridine and other heteroaromatics

**Shipable**: Can create pyridine programmatically

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
const pyridine = benzene.substitute(1, 'n');
console.log(pyridine.smiles); // 'c1ncccc1' or equivalent
```

---

## Checkpoint 5: Molecule Constructor

**Goal**: Users can combine multiple components into molecules.

### Tasks
- [ ] Implement `Molecule()` constructor function
- [ ] Implement `createMoleculeNode()` internal function
- [ ] Add `.smiles` getter to Molecule prototype
- [ ] Handle concatenation of linear + ring components
- [ ] Write tests for molecule construction
- [ ] Test propylbenzene and similar structures

**Shipable**: Can create molecules with multiple components

**Example**:
```javascript
const propyl = Linear(['C', 'C', 'C']);
const benzene = Ring({ atoms: 'c', size: 6 });
const propylbenzene = Molecule([propyl, benzene]);
console.log(propylbenzene.smiles); // 'CCCc1ccccc1'
```

---

## Checkpoint 6: FusedRing Constructor

**Goal**: Users can create fused ring systems programmatically.

### Tasks
- [ ] Implement `FusedRing()` constructor function
- [ ] Implement `createFusedRingNode()` internal function
- [ ] Implement `validateRings()` to check offsets and ring numbers
- [ ] Add `.smiles` getter to FusedRing prototype
- [ ] Write tests for fused ring construction
- [ ] Test naphthalene, benzimidazole, etc.

**Shipable**: Can create naphthalene programmatically

**Example**:
```javascript
const naphthalene = FusedRing([
  Ring({ atoms: 'C', size: 10, offset: 0, ringNumber: 1 }),
  Ring({ atoms: 'C', size: 6, offset: 2, ringNumber: 2 })
]);
console.log(naphthalene.smiles); // 'C1=CC2=CC=CC=C2C=C1'
```

---

## Checkpoint 7: SMILES Code Generator (Phase 4)

**Goal**: Replace fallback serialization with proper code generator.

### Tasks
- [ ] Create `src/codegen.js` (or `src/serializer.js`)
- [ ] Implement `buildSMILES()` dispatcher
- [ ] Implement `buildRingSMILES()` function
- [ ] Implement `buildLinearSMILES()` function
- [ ] Implement `buildFusedRingSMILES()` function
- [ ] Implement `buildMoleculeSMILES()` function
- [ ] Update all `.smiles` getters to use new code generator
- [ ] Write round-trip tests for all node types
- [ ] Ensure existing tests still pass

**Shipable**: All constructors use proper SMILES code generator

---

## Checkpoint 8: Additional Ring Manipulation Methods

**Goal**: Complete the Ring manipulation API.

### Tasks
- [ ] Implement `Ring.prototype.substituteMultiple()`
- [ ] Implement `Ring.prototype.fuse()`
- [ ] Implement `Ring.prototype.concat()`
- [ ] Implement `Ring.prototype.clone()`
- [ ] Write tests for each method
- [ ] Ensure all operations are immutable

**Shipable**: Complete Ring manipulation API

**Example**:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });
const triazine = benzene.substituteMultiple({ 1: 'n', 3: 'n', 5: 'n' });

const ring1 = Ring({ atoms: 'C', size: 10 });
const ring2 = Ring({ atoms: 'C', size: 6 });
const naphthalene = ring1.fuse(2, ring2);
```

---

## Checkpoint 9: FusedRing Manipulation Methods

**Goal**: Complete the FusedRing manipulation API.

### Tasks
- [ ] Implement `FusedRing.prototype.addRing()`
- [ ] Implement `FusedRing.prototype.getRing()`
- [ ] Implement `FusedRing.prototype.substituteInRing()`
- [ ] Implement `FusedRing.prototype.attachToRing()`
- [ ] Implement `FusedRing.prototype.renumber()`
- [ ] Implement `FusedRing.prototype.concat()`
- [ ] Implement `FusedRing.prototype.clone()`
- [ ] Write tests for each method

**Shipable**: Complete FusedRing manipulation API

---

## Checkpoint 10: Linear & Molecule Manipulation Methods

**Goal**: Complete the Linear and Molecule manipulation APIs.

### Tasks
- [ ] Implement `Linear.prototype.attach()`
- [ ] Implement `Linear.prototype.concat()`
- [ ] Implement `Linear.prototype.branch()`
- [ ] Implement `Linear.prototype.branchAt()`
- [ ] Implement `Linear.prototype.clone()`
- [ ] Implement `Molecule.prototype.append()`
- [ ] Implement `Molecule.prototype.prepend()`
- [ ] Implement `Molecule.prototype.concat()`
- [ ] Implement `Molecule.prototype.getComponent()`
- [ ] Implement `Molecule.prototype.replaceComponent()`
- [ ] Implement `Molecule.prototype.clone()`
- [ ] Write tests for all methods

**Shipable**: Complete programmatic construction API

---

## Checkpoint 11: Tokenizer (Phase 1)

**Goal**: Parse SMILES strings into token stream.

### Tasks
- [ ] Create `src/tokenizer.js`
- [ ] Implement `tokenize()` function
- [ ] Implement atom token extraction (simple and bracketed)
- [ ] Implement bond token extraction
- [ ] Implement ring marker extraction (digit and % notation)
- [ ] Implement branch symbol extraction
- [ ] Add position tracking for error messages
- [ ] Write tests for tokenizer with various SMILES strings
- [ ] Test edge cases (bracketed atoms, % ring markers, etc.)

**Shipable**: SMILES → token stream works

---

## Checkpoint 12: Parser Pass 1 - Linear Scan (Phase 2)

**Goal**: Build flat atom list with ring boundary tracking.

### Tasks
- [ ] Create `src/parser.js`
- [ ] Implement `buildAtomList()` function
- [ ] Implement ring stack tracking (ring opening/closing)
- [ ] Implement branch depth tracking
- [ ] Implement bond attachment to atoms
- [ ] Track ring boundaries (start/end positions)
- [ ] Write tests for atom list building
- [ ] Test ring boundary detection

**Shipable**: Can extract atoms and ring boundaries from SMILES

---

## Checkpoint 13: Parser Pass 2 - AST Building (Phase 2)

**Goal**: Convert flat atom list into hierarchical AST.

### Tasks
- [ ] Implement `buildAST()` function
- [ ] Implement `groupFusedRings()` - detect overlapping rings
- [ ] Implement `buildFusedRingNode()` from ring group
- [ ] Implement `buildSingleRingNode()` with substitutions/attachments
- [ ] Handle linear chains before/after/between rings
- [ ] Handle nested branches (recursive parsing)
- [ ] Write tests for AST building
- [ ] Test telmisartan and other complex molecules

**Shipable**: SMILES → AST works for complex molecules

---

## Checkpoint 14: Fragment Integration

**Goal**: Integrate new parser with existing Fragment API.

### Tasks
- [ ] Update `Fragment` constructor to use new parser
- [ ] Add `Fragment.prototype.toAST()` method
- [ ] Ensure Fragment can accept AST nodes as input
- [ ] Update Fragment to use code generator for `.smiles` property
- [ ] Ensure backward compatibility with existing Fragment API
- [ ] Run all existing Fragment tests
- [ ] Fix any regressions

**Shipable**: Fragment works with new parser, existing tests pass

---

## Checkpoint 15: Round-Trip Validation

**Goal**: Ensure SMILES → AST → SMILES is lossless.

### Tasks
- [ ] Write round-trip tests for simple molecules
- [ ] Write round-trip tests for rings with substitutions
- [ ] Write round-trip tests for rings with attachments
- [ ] Write round-trip tests for fused rings
- [ ] Write round-trip tests for complex molecules (telmisartan, etc.)
- [ ] Identify and fix any information loss
- [ ] Document any intentional SMILES normalization

**Shipable**: Round-trip fidelity for all test cases

---

## Checkpoint 16: Decompiler - Basic Implementation (Phase 5)

**Goal**: Generate JavaScript code from AST.

### Tasks
- [ ] Create `src/decompiler.js`
- [ ] Implement `decompile()` entry point
- [ ] Implement `decompileNode()` dispatcher
- [ ] Implement `decompileRing()` - basic ring construction
- [ ] Implement `decompileLinear()` - linear chain construction
- [ ] Implement variable name generation
- [ ] Write tests for basic decompilation
- [ ] Test Ring and Linear decompilation

**Shipable**: Can decompile simple rings and linear chains to code

---

## Checkpoint 17: Decompiler - Complete Implementation

**Goal**: Decompile all AST node types to code.

### Tasks
- [ ] Implement `decompileFusedRing()` - fused ring construction
- [ ] Implement `decompileMolecule()` - molecule assembly
- [ ] Implement substitution method call generation
- [ ] Implement attachment method call generation
- [ ] Implement method chaining optimization
- [ ] Write tests for complex decompilation
- [ ] Test telmisartan decompilation

**Shipable**: Can decompile any AST to JavaScript construction code

---

## Checkpoint 18: Decompiler - Fragment Integration

**Goal**: Add `.toCode()` to Fragment API.

### Tasks
- [ ] Add `Fragment.prototype.toCode()` method
- [ ] Implement decompiler options (varPrefix, useChaining, etc.)
- [ ] Add option to include comments in generated code
- [ ] Write tests for Fragment.toCode()
- [ ] Test with various SMILES strings
- [ ] Write documentation with examples

**Shipable**: `Fragment('c1ccccc1').toCode()` works

**Example**:
```javascript
const fragment = Fragment('c1ccc(C)cc1');
console.log(fragment.toCode());
// Output:
// const linear1 = Linear(['C'])
// const ring1 = Ring({ atoms: 'c', size: 6 })
// const ring2 = ring1.attach(4, linear1)
```

---

## Checkpoint 19: Documentation & Examples

**Goal**: Complete API documentation and usage examples.

### Tasks
- [ ] Write API documentation for all constructors
- [ ] Write API documentation for all manipulation methods
- [ ] Create example gallery for common molecules
- [ ] Document `.smiles` property on all types
- [ ] Document `.toCode()` method
- [ ] Add JSDoc comments to all public APIs
- [ ] Update README with new API examples
- [ ] Create migration guide from old API

**Shipable**: Complete documentation for new API

---

## Checkpoint 20: Performance & Optimization

**Goal**: Optimize performance.

### Tasks
- [ ] Benchmark parser performance
- [ ] Benchmark code generator performance
- [ ] Optimize hot paths identified in benchmarks
- [ ] Consider caching `.smiles` getter (with invalidation)
- [ ] Profile memory usage
- [ ] Optimize AST node creation
- [ ] Run performance tests on large molecule sets
- [ ] Document performance characteristics

**Shipable**: Optimized performance

---

## Checkpoint 21: Final Testing & Release

**Goal**: Complete test coverage and prepare for release.

### Tasks
- [ ] Achieve >90% code coverage
- [ ] Test all edge cases from SMILES spec
- [ ] Test malformed SMILES input (error handling)
- [ ] Run existing integration tests
- [ ] Run new parser tests on large SMILES database
- [ ] Fix any remaining bugs
- [ ] Update CHANGELOG
- [ ] Tag release version

**Shipable**: Release ready

---

## Notes

### Incremental Delivery Strategy

Each checkpoint is designed to be independently valuable and testable. You can ship and use functionality from earlier checkpoints while continuing work on later ones.

### Testing Strategy

- Unit tests for each function/method
- Integration tests at checkpoint boundaries
- Round-trip tests for SMILES → AST → SMILES
- Code execution tests for decompiler output

### Backward Compatibility

The existing Fragment API should continue to work throughout the implementation. New functionality is additive.

### Risk Mitigation

If issues arise during implementation:
1. Each checkpoint can be reverted independently
2. Existing Fragment API remains stable
3. Can iterate on design within each checkpoint
4. Can adjust scope of later checkpoints based on learnings
