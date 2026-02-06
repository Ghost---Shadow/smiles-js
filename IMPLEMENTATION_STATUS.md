# Implementation Status

## 1618 TESTS. 0 FAILURES. ALL CODEGEN ROUND-TRIPS PASSING.

**Date:** 2026-02-06
**Branch:** sneaky-bugs
**Result:** 1618 tests across 43 files in ~379ms

Every molecule parses, serializes, decompiles to JavaScript, and round-trips back to the exact same SMILES string. No exceptions.

## Supported Molecule Classes

| Category | Examples | Status |
|----------|----------|--------|
| NSAIDs | Ibuprofen, Naproxen, Celecoxib, Meloxicam, Piroxicam, Etodolac | ✅ |
| Opioids | Fentanyl, Tramadol, Morphine, Codeine, Oxycodone | ✅ |
| Steroids | Cortisone, Hydrocortisone, Prednisone, Dexamethasone | ✅ |
| Cannabinoids | THC, CBD, Nabilone | ✅ |
| Hypertension | Losartan, Valsartan, Telmisartan | ✅ |
| Cholesterol | Fluvastatin, Ezetimibe, Fenofibrate | ✅ |
| Analgesics | Acetaminophen, Phenacetin, Gabapentin, Pregabalin | ✅ |
| Endocannabinoids | Anandamide, 2-AG | ✅ |

## Recent Fixes (sneaky-bugs branch)

1. **Fluvastatin directional bonds** - `/C=C/` stereochemistry was lost or double-emitted through the parser/codegen/decompiler pipeline. Fixed `metaLeadingBond` handling across three modules.
2. **Ezetimibe ring attachments** - `(O)` and `(F)` attachments on base and sequential rings were silently dropped by `decompileComplexFusedRing`. Extracted `generateAttachmentCode` helper.
3. **Etodolac seq atom attachments** - `metaSeqAtomAttachments` always serialized as empty maps, losing branches like `(=O)`. Fixed serialization and variable ordering.

## Divide-and-Conquer Test Files

- `test-integration/telmisartan.test.js`
- `test-integration/fluvastatin.test.js` - 67 tests
- `test-integration/ezetimibe.test.js` - 56 tests
- `test-integration/etodolac.test.js` - 44 tests

Each file builds up from simple fragments to the full molecule, testing both AST and codegen round-trips at every step.

## API Completeness

**Constructors**: Ring, Linear, FusedRing, Molecule, Fragment

**Ring Methods**: attach, substitute, substituteMultiple, fuse, concat, clone

**Linear Methods**: attach, concat, branch, branchAt, clone

**FusedRing Methods**: addRing, getRing, substituteInRing, attachToRing, renumber, concat, clone

**Molecule Methods**: append, prepend, concat, getComponent, replaceComponent, clone

**Parsing**: tokenize, parse, buildSMILES, decompile, .smiles getters, .toCode()

## Implementation Checkpoints: 21/21

All planned features implemented:
- Foundation (AST types, constructors)
- Ring/Linear/FusedRing/Molecule constructors and manipulation
- SMILES tokenizer and parser
- Code generator (AST to SMILES)
- Decompiler (AST to JavaScript)
- Fragment integration
- Round-trip validation
- Documentation and examples
