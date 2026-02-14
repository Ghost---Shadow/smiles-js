// SMILES Grammar for Peggy (PEG parser generator for JavaScript)
//
// This grammar mirrors the tokenizer + buildAtomList two-pass architecture
// in src/tokenizer.js and src/parser/smiles-parser-core.js.
//
// What this grammar produces:
//   A concrete parse tree (token stream with structure). The codebase then
//   does a second semantic pass (buildAST) to detect rings, fused rings,
//   and attachments — that pass is stateful and cannot be expressed in PEG.
//
// Usage:
//   npx peggy smiles.peggy                          # generates smiles.js
//   npx peggy --format commonjs -o smiles.cjs smiles.peggy  # CommonJS
//
// Differences from OpenSMILES spec (matches codebase behavior):
//   - Simple atoms accept ANY [A-Za-z] letter, not just the organic subset.
//     The tokenizer (isAtomStart + parseSimpleAtom) only special-cases Br/Cl
//     as two-letter atoms; everything else is a single letter.
//   - Bracketed atoms capture raw content only (the codebase has a TODO for
//     full isotope/chirality/hcount/charge/class parsing). The grammar DOES
//     parse the sub-fields since it's trivial in PEG and useful for consumers.
//   - Whitespace is silently skipped (tokenizer.js line 104).
//   - Ring markers can be preceded by a bond (e.g. C=1CC=1 is legal SMILES).

// ============================================================
// Top-level: dot-separated components
// Mirrors: tokenizer DOT token → buildAtomList skips DOT
// ============================================================
smiles
  = _ head:chain tail:(_ "." _ chain)* _ {
      const components = [head, ...tail.map(t => t[3])];
      if (components.length === 1) return components[0];
      return { type: "molecule", components };
    }

// ============================================================
// Chain: sequence of atom_units with optional bonds between them
// Mirrors: buildAtomList's linear scan — each ATOM token may be
//          preceded by a BOND token, and followed by RING_MARKER
//          and BRANCH_OPEN/CLOSE tokens.
// ============================================================
chain
  = first:atom_unit rest:(_ bond? _ atom_unit)* {
      const atoms = [first];
      const bonds = [null];
      for (const r of rest) {
        bonds.push(r[1]);
        atoms.push(r[3]);
      }
      return { type: "chain", atoms, bonds };
    }

// ============================================================
// Atom unit: atom + ring markers + branches
//
// Mirrors the token consumption order in buildAtomList:
//   ATOM → RING_MARKER* → (BRANCH_OPEN chain BRANCH_CLOSE)*
//
// Ring markers can carry their own bond (e.g. C=1...=1)
// This is valid SMILES: the bond on a ring closure describes
// the bond between the two ring-closure atoms.
// ============================================================
atom_unit
  = atom:atom ring_bonds:(bond? ring_marker)* branches:branch* {
      const rings = ring_bonds.map(rb => ({
        bond: rb[0],
        number: rb[1]
      }));
      return { atom, rings, branches };
    }

// ============================================================
// Atoms
//
// Two forms, matching tokenizer.js:
//   1. Bracketed: '[' ... ']'  (parseBracketedAtom, line 67)
//   2. Simple: [A-Za-z*]       (parseSimpleAtom, line 39)
// ============================================================
atom
  = bracketed_atom
  / simple_atom

// ----------------------------------------------------------
// Bracketed atom: [isotope? element chirality? hcount? charge? class?]
//
// The codebase currently stores only { raw } (parseBracketedAtom, line 79).
// We parse the sub-fields here since PEG makes it easy and consumers
// can use them. The `raw` field preserves the full bracket text for
// round-trip fidelity (matching token.value in the codebase).
// ----------------------------------------------------------
bracketed_atom
  = "[" content:bracketed_content "]" {
      return { type: "bracket_atom", ...content, raw: text() };
    }

bracketed_content
  = isotope:isotope?
    symbol:bracket_element
    chirality:chirality?
    hcount:hcount?
    charge:charge?
    atomClass:atom_class? {
      return { isotope, symbol, chirality, hcount, charge, atomClass };
    }

// Isotope: digits before the element symbol
// e.g. [13C], [2H]
isotope
  = digits:$[0-9]+ &[A-Za-z*] { return parseInt(digits, 10); }

// Element inside brackets — can be aromatic two-letter (se, as),
// aromatic single-letter, or any standard element symbol, or wildcard
bracket_element
  = aromatic_element
  / element_symbol
  / "*" { return "*"; }

// Standard element symbol: uppercase letter + optional lowercase
// e.g. C, Na, Fe, Zr
element_symbol
  = a:$[A-Z] b:$[a-z]? { return b ? a + b : a; }

// Aromatic elements inside brackets
// OpenSMILES: b, c, n, o, p, s, se, as
aromatic_element
  = "se" { return "se"; }
  / "as" { return "as"; }
  / c:[bcnops] { return c; }

// Chirality: @ or @@ (the codebase doesn't parse extended forms like @TH1)
chirality
  = "@@" { return "@@"; }
  / "@" { return "@"; }

// Hydrogen count: H or H<digit>
// e.g. [NH3+] has hcount=3, [C@H] has hcount=1
hcount
  = "H" n:$[0-9]? { return n ? parseInt(n, 10) : 1; }

// Charge: +, -, +2, -1, ++, --
// Ordered to try multi-char patterns before single-char
charge
  = "++" { return 2; }
  / "--" { return -2; }
  / "+" n:$[0-9]+ { return parseInt(n, 10); }
  / "-" n:$[0-9]+ { return -parseInt(n, 10); }
  / "+" { return 1; }
  / "-" { return -1; }

// Atom class: :<digits>
// e.g. [C:1]
atom_class
  = ":" n:$[0-9]+ { return parseInt(n, 10); }

// ----------------------------------------------------------
// Simple (non-bracketed) atom
//
// Mirrors tokenizer.js parseSimpleAtom (line 39) + isAtomStart (line 31):
//   isAtomStart accepts /[A-Za-z*]/
//   parseSimpleAtom checks for two-letter Cl/Br first, then single char
//
// The codebase does NOT restrict to the OpenSMILES organic subset —
// it accepts any letter as a valid atom. This is intentional for
// permissive parsing. The semantic layer validates later.
// ----------------------------------------------------------
simple_atom
  = symbol:simple_atom_symbol { return { type: "simple_atom", symbol }; }

simple_atom_symbol
  = "Br" { return "Br"; }
  / "Cl" { return "Cl"; }
  / c:[A-Za-z] { return c; }
  / "*" { return "*"; }

// ============================================================
// Bonds
//
// Mirrors: BOND_SYMBOLS in tokenizer.js (line 19)
//   new Set(['-', '=', '#', ':', '/', '\\'])
// ============================================================
bond
  = b:[-=#:/\\] { return b; }

// ============================================================
// Ring markers
//
// Mirrors: tokenizer.js lines 138-160
//   '%' + two digits → ring number 10-99
//   single digit     → ring number 0-9
// ============================================================
ring_marker
  = "%" d1:[0-9] d2:[0-9] { return parseInt(d1 + d2, 10); }
  / d:[0-9] { return parseInt(d, 10); }

// ============================================================
// Branches (recursive)
//
// Mirrors: BRANCH_OPEN → (bond? chain) → BRANCH_CLOSE
// in tokenizer.js lines 106-120 and buildAtomList lines 139-153
//
// A branch can start with a bond that applies to the first atom
// of the branch chain (e.g. C(=O) means double bond to O).
// ============================================================
branch
  = "(" _ b:bond? _ c:chain _ ")" {
      return { type: "branch", bond: b, chain: c };
    }

// ============================================================
// Whitespace (optional, skipped)
//
// Mirrors: tokenizer.js line 104 — /\s/ is skipped
// ============================================================
_ "whitespace"
  = [ \t\n\r]*
