# Implementation Status

## 🔴 BLOCKING ISSUE: Double Bonds in Rings Not Preserved

**Double bonds in rings are lost during parsing/regeneration.**

```
Input:  C1=CC=CC=C1   →   Output: C1CCCCC1   (bonds LOST)
```

### Telmisartan (PubChem) - FAILS

```
Input:  CCCC1=NC2=C(C=C(C=C2N1CC3=CC=C(C=C3)C4=CC=CC=C4C(=O)O)C5=NC6=CC=CC=C6N5C)C
Output: CCCC1NC2C(C=C(C=CNCC3CCC(C=C)CC3C4CCCCC4C(=O)O)C5NC6CCCCC6N5C)CCCC2N1C
```

All `=` bonds inside rings are lost.

---

## Root Cause

Ring AST stores atoms as a single string (e.g., `'C'`) with no per-atom bond information.

## Fix Required

Extend Ring AST to store bond types between atoms, similar to how Linear nodes handle bonds.
