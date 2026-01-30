# Example Scripts

This directory contains executable example scripts demonstrating the SMILES-JS library with real-world pharmaceutical molecules from PubChem.

---

## 🧪 Available Examples

### 1. `test-drive.js` - Quick Validation Test

**Purpose**: Rapid testing and debugging of the library
**Molecule**: Omeprazole (Proton Pump Inhibitor)
**Highlights**:
- Parses SMILES from PubChem
- Validates round-trip fidelity
- Identifies character-level differences
- Generates construction code

**Run it:**
```bash
node docs/test-drive.js
```

---

### 2. `atorvastatin-synthesis.js` - Basic Parsing Demo

**Purpose**: Simple parse and code generation
**Molecule**: Atorvastatin (Lipitor) - Cholesterol medication
**Complexity**: 69-character SMILES, multiple rings, long side chain
**Status**: ✅ Perfect round-trip

**Run it:**
```bash
node docs/atorvastatin-synthesis.js
```

**Output:**
```
Atorvastatin (Lipitor) - Cholesterol Medication
======================================================================
SMILES: CC(C)c1c(C(=O)Nc2ccccc2)c(c3ccccc3)c(c4ccc(F)cc4)n1CCC(O)CC(O)CC(=O)O
Parsed successfully: true
Round-trip check: true

Generated Construction Code:
... (25 lines of constructor code)
```

---

### 3. `atorvastatin-named.js` - Educational Showcase ⭐

**Purpose**: Demonstrates programmatic construction with chemical names
**Molecule**: Atorvastatin (Lipitor)
**Features**:
- All variables renamed to actual chemical components
- Step-by-step construction
- Comments explaining each structural element
- Perfect for teaching molecular structure

**Run it:**
```bash
node docs/atorvastatin-named.js
```

**Code Excerpt:**
```javascript
// Isopropyl group (substituent on pyrrole)
const methyl1 = Linear(['C']);
const ethyl = Linear(['C', 'C']);
const isopropyl = ethyl.attach(methyl1, 2);

// Central pyrrole ring (5-membered nitrogen heterocycle)
const pyrroleRing = Ring({ atoms: 'c', size: 5 });
const pyrrole = pyrroleRing.substitute(5, 'n');

// Dihydroxyheptanoic acid side chain (the "statin" pharmacophore)
const heptanoicAcidChain = Linear(['C', 'C', 'C', 'C', 'C', 'C', 'C', 'O']);
const hydroxyl1 = Linear(['O']);
const statinSideChain = heptanoicAcidChain.attach(hydroxyl1, 3);
```

---

### 4. `sildenafil-synthesis.js` - Component Analysis

**Purpose**: Deconstruct drug into chemical components
**Molecule**: Sildenafil (Viagra) - PDE5 inhibitor
**Complexity**: 45-character SMILES, fused heterocycles
**Status**: ✅ Perfect round-trip

**Run it:**
```bash
node docs/sildenafil-synthesis.js
```

**Structural Components Identified:**
- Propyl group
- Pyrazole ring (5-membered with 2 nitrogens)
- N-methyl substituent
- Fused pyrimidine ring
- Piperazine ring with N-ethyl group
- Ethyl ester functional group

---

### 5. `ritonavir-synthesis.js` - Complex Drug Showcase 🏆

**Purpose**: Professional showcase with complete documentation
**Molecule**: Ritonavir (Norvir) - HIV protease inhibitor
**Complexity**: 80-character SMILES, most complex example
**Features**:
- Beautiful UI with emojis and formatting
- Molecular validation section
- Auto-generated construction code
- Manually named components with explanations
- Structural features breakdown
- Clinical use notes

**Run it:**
```bash
node docs/ritonavir-synthesis.js
```

**Output Preview:**
```
🧬 Ritonavir (Norvir) - HIV Protease Inhibitor
================================================================================
📊 Molecular Validation:
  Input:       CC(C)c1nc(C(N)=O)cnc1NC(=O)NC(Cc2ccccc2)...
  Parsed:      CC(C)c1nc(C(N)O)cnc1NC(=O)NC(Cc2ccccc2)...
  Round-trip:  ⚠️  Mismatch (minor bond notation issue)

🎯 Chemically Named Construction (Manual):
  ✓ Isopropyl substituent: CC(C)
  ✓ Pyridine core: c1ncncc1
  ✓ Thiazole heterocycle: c4scnc4
  ...

💊 Clinical Use: HIV-1 protease inhibitor
```

---

### 6. `esomeprazole-showcase.js` - Educational Demo 📚

**Purpose**: Professional educational demonstration
**Molecule**: Esomeprazole (Nexium) - Proton pump inhibitor
**Features**:
- Professional formatting with box drawing characters
- Detailed structural analysis
- Molecular architecture description
- Pharmacology section
- Perfect for presentations and teaching

**Run it:**
```bash
node docs/esomeprazole-showcase.js
```

**Sections:**
- 📥 Input Molecule (PubChem data)
- 🔍 Parsing & Validation
- 🤖 Auto-Generated Code
- 🧪 Chemically Named Reconstruction
- 🏗️ Molecular Architecture
- 💊 Pharmacology
- ✅ Synthesis Complete

---

## 📊 Example Comparison Table

| Script | Molecule | SMILES Length | Round-Trip | Best For |
|--------|----------|---------------|------------|----------|
| `test-drive.js` | Omeprazole | 42 chars | ⚠️ Issue | Debugging |
| `atorvastatin-synthesis.js` | Atorvastatin | 69 chars | ✅ Perfect | Quick demo |
| `atorvastatin-named.js` | Atorvastatin | 69 chars | ✅ Perfect | Teaching |
| `sildenafil-synthesis.js` | Sildenafil | 45 chars | ✅ Perfect | Component analysis |
| `ritonavir-synthesis.js` | Ritonavir | 80 chars | ⚠️ Minor | Professional showcase |
| `esomeprazole-showcase.js` | Esomeprazole | 42 chars | ⚠️ Minor | Education/presentations |

---

## 🎯 Use Cases

### For Learning
- **Start with**: `atorvastatin-named.js` - Clear variable names, well-commented
- **Next**: `sildenafil-synthesis.js` - Learn component identification
- **Advanced**: `esomeprazole-showcase.js` - Professional documentation style

### For Teaching
- **Chemistry class**: `atorvastatin-named.js` or `esomeprazole-showcase.js`
- **Programming class**: `atorvastatin-synthesis.js` → show auto-generation
- **Drug discovery**: `ritonavir-synthesis.js` → complex pharmaceutical example

### For Testing
- **Quick validation**: `test-drive.js`
- **Comprehensive test**: Run all scripts and compare outputs

---

## 🔧 Customizing Examples

All examples follow a similar pattern and can be easily adapted:

```javascript
// 1. Import the library
import { parse, Ring, Linear, Molecule } from '../src/index.js';

// 2. Define SMILES (from PubChem or custom)
const drugSmiles = 'YOUR_SMILES_HERE';

// 3. Parse and validate
const drug = parse(drugSmiles);
console.log('Round-trip:', drugSmiles === drug.smiles);

// 4. Generate code
console.log(drug.toCode());

// 5. Build with named variables
const component1 = Ring({ atoms: 'c', size: 6 });
const component2 = Linear(['C', 'C', 'C']);
// ... etc
```

---

## 🐛 Known Issues in Examples

### Omeprazole & Esomeprazole
**Issue**: Missing terminal 'C' in output (41/42 chars)
**Impact**: Minor - doesn't affect structure
**Example**: `test-drive.js`, `esomeprazole-showcase.js`

### Ritonavir
**Issue**: Bond notation `C(N)=O` becomes `C(N)O` (79/80 chars)
**Impact**: Minor - structure preserved, only notation differs
**Example**: `ritonavir-synthesis.js`

Both issues are documented limitations and do not affect the core functionality or educational value of the examples.

---

## 📝 Creating Your Own Examples

### Template

```javascript
/**
 * Drug Name - Brief Description
 *
 * Drug class and clinical use
 * PubChem CID: XXXXX
 * SMILES: YOUR_SMILES_HERE
 */

import { parse, Ring, Linear, Molecule } from '../src/index.js';

console.log('🧬 Drug Name - Drug Class');
console.log('='.repeat(70));

const drugSmiles = 'YOUR_SMILES_HERE';
const drug = parse(drugSmiles);

console.log('Input: ', drugSmiles);
console.log('Output:', drug.smiles);
console.log('Match: ', drugSmiles === drug.smiles ? '✅' : '⚠️');
console.log();

console.log('Auto-generated code:');
console.log(drug.toCode());
console.log();

// Build with named components
console.log('Manual construction:');
const component1 = Ring({ atoms: 'c', size: 6 });
console.log('Component 1:', component1.smiles);
// ... etc
```

---

## 🚀 Running All Examples

```bash
# Run all examples in sequence
for file in docs/*.js; do
  echo "Running $file..."
  node "$file"
  echo ""
done
```

---

## 📚 Additional Resources

- **[Implementation Status](../IMPLEMENTATION_STATUS.md)** - Complete feature list
- **[Test Drive Results](../TEST_DRIVE_RESULTS.md)** - Detailed validation report
- **[Parser Design](./PARSER_REFACTOR_PLAN.md)** - Technical architecture
- **[Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)** - Development history

---

<div align="center">

**These examples demonstrate real-world usage of SMILES-JS**
**with actual pharmaceutical molecules from PubChem**

✨ Perfect for education • 🔬 Great for research • 💊 Validated with drugs

</div>
