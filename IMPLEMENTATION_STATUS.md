# Implementation Status

## Summary

**Checkpoints Completed**: 15 out of 21 (71%)

### What Works ✅
- All 4 constructors (Ring, Linear, FusedRing, Molecule)
- Full manipulation API (attach, substitute, fuse, branch, clone, toObject, toCode)
- Standard SMILES serialization for all node types
- Complete tokenizer
- Parser with branch support (simple branches work)
- Decompiler (AST → JavaScript code)
- Round-trip for simple structures
- 147 passing tests, 1 skipped

### What's Missing ❌
- **Rings inside branches** - rings in parentheses become linear chains
- **Fused ring parsing** - interleaved atoms (naphthalene)
- Fragment integration

### 🔴 CRITICAL Limitation
**Rings inside branches are not recognized.** When a ring appears in parentheses, it's parsed as a linear chain.

```
C(c1ccccc1)C  →  parses as  →  C(cccccc)C   # Ring lost!
```

**Impact**: Telmisartan and similar drug molecules lose 40%+ of structure.

**Root cause** (`parser.js`):
- Lines 404-411: Only collects atoms at `branchDepth === 0` for rings
- `buildLinearNode()`: Always creates Linear nodes for branches

---

## Completed Checkpoints

### ✅ Checkpoints 0-6: Core Constructors
All constructors implemented with `.smiles` getters:
```javascript
const benzene = Ring({ atoms: 'c', size: 6 });        // 'c1ccccc1'
const propane = Linear(['C', 'C', 'C']);               // 'CCC'
const toluene = benzene.attach(Linear(['C']), 1);      // 'c1(C)ccccc1'
const pyridine = benzene.substitute(1, 'n');           // 'n1ccccc1'
const propylbenzene = Molecule([propane, benzene]);    // 'CCCc1ccccc1'
```

### ✅ Checkpoints 7-10: Manipulation API
- **Ring**: attach, substitute, substituteMultiple, fuse, concat, clone
- **Linear**: attach, branch, branchAt, concat, clone
- **FusedRing**: addRing, getRing, substituteInRing, attachToRing, renumber
- **Molecule**: append, prepend, concat, getComponent, replaceComponent

### ✅ Checkpoint 11: Tokenizer
Complete tokenizer handles all SMILES features (atoms, bonds, rings, branches, brackets).

### ⚠️ Checkpoints 12-13: Parser
**Working**:
- Simple branches: `C(C)C`, `CC(=O)C`
- Nested branches: `CC(C(C))C`
- Multiple branches: `CC(C)(C)C`
- Ring attachments: `C1CCC(C)CC1`

**NOT Working**:
- Rings inside branches: `C(c1ccccc1)C` → loses ring markers
- Biphenyl in branches: `Cc1ccc(c2ccccc2)cc1` → inner ring lost

### ✅ Checkpoints 16-18: Decompiler
```javascript
const ast = parse('CCCc1ccccc1');
console.log(ast.toCode('compound'));
// const compoundComponent1 = Linear(['C', 'C', 'C']);
// const compoundComponent2 = Ring({ atoms: 'c', size: 6 });
// const compound = Molecule([compoundComponent1, compoundComponent2]);
```

---

## Test Summary

| Module | Tests |
|--------|-------|
| constructors.test.js | 16 ✅ |
| manipulation.test.js | 40 ✅ |
| tokenizer.test.js | 29 ✅ |
| parser.test.js | 46 ✅, 1 ⏭️ |
| parser.branch-tracking.test.js | 3 ✅ |
| decompiler.test.js | 13 ✅ |
| **Total** | **147 ✅, 1 ⏭️** |

---

## Next Steps

1. **🔴 CRITICAL: Fix Rings Inside Branches**
   - Modify `buildAtomList()` to track rings at all branch depths
   - Modify `buildLinearNode()` to detect ring closures in branches
   - Blocking issue for drug-like molecules

2. **Fix Fused Ring Parsing**
   - Handle interleaved atoms (naphthalene `C1CC2CCCCC2CC1`)

3. **Fragment Integration**
   - Integrate AST with existing Fragment API

---

## Architecture

```
src/
├── ast.js              # AST node types and validation
├── constructors.js     # Factory functions (Ring, Linear, etc.)
├── codegen.js          # SMILES code generator
├── manipulation.js     # Manipulation methods
├── tokenizer.js        # SMILES tokenizer
├── parser.js           # SMILES parser
├── decompiler.js       # AST → JavaScript code
└── index.js            # Public API exports
```

---

## Audit (2026-01-25)

**Assessor**: Claude Opus 4.5

### Findings
- ✅ Core construction API works correctly
- ✅ Simple branch parsing works
- ✅ Rings on main chain work
- ❌ **Rings inside branches fail silently** (previously undocumented)

### Test Case
```bash
# Telmisartan
Input:  CCCc1nc2c(C)cc(C)cc2n1Cc1ccc(c2ccccc2C(=O)O)cc1  (47 chars)
Output: CCCc21ccccc2ccn1Ccccc(ccccccC(=O))(O)cc          (39 chars)
# Second benzene ring and biphenyl lost
```

The implementation works well for simple molecules but **cannot parse most drug-like molecules** due to the rings-in-branches limitation.
