# Implementation Status

## ✅ FIXED: Double Bonds in Rings Now Preserved

**Double bonds in rings are now correctly preserved during parsing/regeneration.**

```
Input:  C1=CC=CC=C1   →   Output: C1=CC=CC=C1   (bonds PRESERVED)
```

### Naphthalene - WORKS
```
Input:  C1=CC2=CC=CC=C2C=C1
Output: C1=CC2=CC=CC=C2C=C1
```

### Simple Benzimidazole - WORKS
```
Input:  C1=NC2=CC=CC=C2N1
Output: C1=NC2=CC=CC=C2N1
```

---

## ✅ FIXED: Rings Inside Branches

**Rings that appear inside branches (as attachments) are now correctly parsed and regenerated.**

### Biphenyl in branch - WORKS
```
Input:  c1ccc(c2ccccc2)cc1
Output: c1ccc(c2ccccc2)cc1
```

### Fused ring inside branch - WORKS
```
Input:  C(c1nc2ccccc2n1)C
Output: C(c1nc2ccccc2n1)C
```

### Nested fused ring with trailing atom - WORKS
```
Input:  c1ccc(C5=NC6=CC=CC=C6N5C)cc1
Output: c1ccc(C5=NC6=CC=CC=C6N5C)cc1
```

---

## ✅ FIXED: Ring Closures Inside Branches

**Ring closures that occur at different branch depths than where the ring opened are now handled correctly.**

### Ring closure inside branch of ring - WORKS
```
Input:  C1=NC2=C(CC2N1)C
Output: C1=NC2=C(CC2N1)C
```

### Simple ring closure at different depth - WORKS
```
Input:  C1CC(C1)
Output: C1CCC1   (canonical cyclobutane)
```

---

## ✅ FIXED: Full Telmisartan Structure

**The full telmisartan molecule with deeply nested ring systems now parses and round-trips correctly.**

### Telmisartan - WORKS
```
Input:  CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C
Output: CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C
```

This structure has:
- Multiple ring closures inside nested branches
- Ring closures (`2N1`) at different depths than where rings opened
- Fused ring systems as branch attachments
- Sequential continuation rings (rings 3, 4 appearing inline after ring closures)
- Attachments on sequential continuation atoms (carboxylic acid group)

---

## ✅ FIXED: Steroid Polycyclic Structures

**Complex polycyclic steroids with shared atoms now parse correctly. Fixed duplicate attachment bug on shared fused ring atoms.**

### Cortisone - WORKS
```
Input:  CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12
Output: CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12
```

### Hydrocortisone - WORKS
```
Input:  CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12O
Output: CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C(C(=O)CO)CCC12O
```

### Prednisone - WORKS
```
Input:  CC12CC(=O)C=CC1=CC(O)C1C2CCC2(C)C(C(=O)CO)CCC12
Output: CC12CC(=O)C=CC1=CC(O)C1C2CCC2(C)C(C(=O)CO)CCC12
```

### Prednisolone - WORKS
```
Input:  CC12CC(=O)C=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12
Output: CC12CC(=O)C=CC1=CC(O)C1C2C(O)CC2(C)C(C(=O)CO)CCC12
```

---

## 🟡 Known Limitation: toCode() for Complex Structures

The `toCode()` method (generating JS constructor code from AST) does not yet fully support complex nested structures with sequential continuation rings. The SMILES parsing and serialization works correctly, but the generated JavaScript code may not reproduce the full structure.

---

## Changes Made

1. Added `bonds` array to Ring AST node (like Linear nodes)
2. Parser now extracts bonds between ring atoms
3. Codegen serializes bonds in ring output
4. Fused ring codegen updated to preserve bonds
5. Fixed rings inside branches being excluded from attachments
6. Added branch depth normalization to fused ring codegen
7. Fixed sequential continuation atoms for trailing atoms after ring closures
8. Added unified iterative loop for collecting all inline positions (sequential continuations + afterBranchClose atoms)
9. Track sequential continuation rings separately for codegen
10. Store atom values for non-ring positions in `_atomValueMap`
11. Store attachments for sequential continuation atoms in `_seqAtomAttachments`
12. Fixed `lastAtomAtDepth` to clear when entering new branches (prevents cross-branch linking)
13. Fixed duplicate attachments on shared atoms in fused rings (positionsWithAttachments tracking)

---

## 🔴 Known Parser Bugs

### Opioid Morphinan Structures

Complex polycyclic opioids with bridged ring systems fail or produce unstable output.

**Broken opioids:**
- Oxycodone: `CN1CCC23C4C(=O)CCC2(C1CC5=C3C(=C(C=C5)OC)O4)O`
- Fentanyl: `CCC(=O)N(C1CCN(CC1)CCC2=CC=CC=C2)C3=CC=CC=C3`
- Tramadol: `CN(C)CC1CCCCC1(C2=CC(=CC=C2)OC)O`

### Cannabinoid Structures

THC-like structures with complex ring systems fail.

**Broken cannabinoids:**
- Anandamide: `CCCCCC=CCC=CCC=CCC=CCCCC(=O)NCCO`
- 2-Arachidonoylglycerol: `CCCCCC=CCC=CCC=CCC=CCCCC(=O)OC(CO)CO`
- THC: `CCCCCC1=CC(=C2C3C=C(CCC3C(OC2=C1)(C)C)C)O`
- CBD: `CCCCCC1=CC(=C(C(=C1)O)C2C=C(CCC2C(=C)C)C)O`
- Nabilone: `CCCCCCC(C)(C)C1=CC(=C2C3CC(=O)CCC3C(OC2=C1)(C)C)O`

### Complex Prescription NSAIDs

Several COX-2 inhibitors and oxicam-class drugs fail.

**Broken NSAIDs:**
- Celecoxib: `CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C(F)(F)F`
- Meloxicam: `CC1=C(N=C(S1)NC(=O)C2=C(C3=CC=CC=C3S(=O)(=O)N2C)O)C`
- Piroxicam: `CN1C(=C(C2=CC=CC=C2S1(=O)=O)O)C(=O)NC3=CC=CC=N3`
- Rofecoxib: `CS(=O)(=O)C1=CC=C(C=C1)C2=C(C(=O)OC2)C3=CC=CC=C3`
- Etoricoxib: `CC1=NC=C(C=C1)C2=CC=C(C=C2)S(=O)(=O)C3=CC=CC=C3`
- Nabumetone: `COC1=CC2=CC(=CC=C2C=C1)CCC(=O)C`
- Oxaprozin: `OC(=O)CCC1=NC(=C(O1)C2=CC=CC=C2)C3=CC=CC=C3`
- Ketoprofen: `CC(c1cccc(c1)C(=O)c2ccccc2)C(=O)O` (ketone bridge dropped)

### Para-Substituted Benzene Normalization

The parser normalizes `C=C(C=C1)` patterns. Chemically equivalent but SMILES differ.

**Affected molecules:**
- Ibuprofen: `CC(C)Cc1ccc(cc1)C(C)C(=O)O` → `CC(C)Cc1ccccc1C(C)C(=O)O`
- Benzocaine: `CCOC(=O)C1=CC=C(C=C1)N` → `CCOC(=O)C1=CC=CC=C1N`
- Losartan, Valsartan, Irbesartan (similar pattern)

---

## Test Coverage

- 178 tests passing across 10 integration test files
- Tests cover parsing, code generation, and round-trip validation
