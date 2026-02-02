/**
 * SMILES Tokenizer (Phase 1)
 * Converts SMILES strings into a stream of tokens
 */

/**
 * Token types
 */
export const TokenType = {
  ATOM: 'atom', // Simple or bracketed atom
  BOND: 'bond', // Bond symbol (-, =, #, :, /, \)
  RING_MARKER: 'ring_marker', // Ring closure digit or %NN
  BRANCH_OPEN: 'branch_open', // (
  BRANCH_CLOSE: 'branch_close', // )
  DOT: 'dot', // . (disconnected fragments)
};

// Bond symbols: single (-), double (=), triple (#), aromatic (:), cis/trans (/ \)
const BOND_SYMBOLS = new Set(['-', '=', '#', ':', '/', '\\']);

/**
 * Check if character is a bond symbol
 */
function isBondSymbol(char) {
  return BOND_SYMBOLS.has(char);
}

/**
 * Check if character can start an atom
 */
function isAtomStart(char) {
  return /[A-Za-z*]/.test(char);
}

/**
 * Parse a simple (non-bracketed) atom
 * Handles: C, N, O, Cl, Br, c, n, o, etc.
 */
function parseSimpleAtom(smiles, startPos) {
  const char = smiles[startPos];

  // Two-letter atoms: Cl, Br
  if (startPos + 1 < smiles.length) {
    const twoChar = smiles.slice(startPos, startPos + 2);
    if (twoChar === 'Cl' || twoChar === 'Br') {
      return {
        value: twoChar,
        atom: twoChar,
        endPosition: startPos + 2,
      };
    }
  }

  // Single-letter atoms (uppercase aliphatic or lowercase aromatic)
  return {
    value: char,
    atom: char,
    endPosition: startPos + 1,
  };
}

/**
 * Parse a bracketed atom [...]
 * Format: [isotope?][element][chiral?][hcount?][charge?][class?]
 * Examples: [NH3+], [C@H], [13C], [Fe+2]
 */
function parseBracketedAtom(smiles, startPos) {
  const closeBracket = smiles.indexOf(']', startPos);
  if (closeBracket === -1) {
    throw new Error(`Unclosed bracket starting at position ${startPos}`);
  }

  const content = smiles.slice(startPos + 1, closeBracket);
  const fullValue = smiles.slice(startPos, closeBracket + 1);

  // For now, we'll do basic parsing
  // Full parsing would extract isotope, element, chirality, H-count, charge, class
  // This is a simplified version that just captures the content
  const atom = {
    raw: content,
    // TODO: Parse isotope, element, chirality, hcount, charge, class
  };

  return {
    value: fullValue,
    atom,
    endPosition: closeBracket + 1,
  };
}

/**
 * Tokenize a SMILES string
 * @param {string} smiles - SMILES string to tokenize
 * @returns {Array<Object>} Array of tokens
 */
export function tokenize(smiles) {
  const tokens = [];
  let position = 0;

  while (position < smiles.length) {
    const char = smiles[position];

    // Skip whitespace
    if (/\s/.test(char)) {
      position += 1;
    } else if (char === '(') {
      // Branch open
      tokens.push({
        type: TokenType.BRANCH_OPEN,
        value: '(',
        position,
      });
      position += 1;
    } else if (char === ')') {
      // Branch close
      tokens.push({
        type: TokenType.BRANCH_CLOSE,
        value: ')',
        position,
      });
      position += 1;
    } else if (char === '.') {
      // Dot (disconnected fragments)
      tokens.push({
        type: TokenType.DOT,
        value: '.',
        position,
      });
      position += 1;
    } else if (isBondSymbol(char)) {
      // Bond symbols
      tokens.push({
        type: TokenType.BOND,
        value: char,
        position,
      });
      position += 1;
    } else if (char === '%') {
      // Ring markers (% followed by two digits)
      const marker = smiles.slice(position, position + 3);
      if (marker.length === 3 && /^%\d\d$/.test(marker)) {
        tokens.push({
          type: TokenType.RING_MARKER,
          value: marker,
          ringNumber: parseInt(marker.slice(1), 10),
          position,
        });
        position += 3;
      } else {
        throw new Error(`Invalid ring marker at position ${position}: ${marker}`);
      }
    } else if (/\d/.test(char)) {
      // Ring markers (single digit)
      tokens.push({
        type: TokenType.RING_MARKER,
        value: char,
        ringNumber: parseInt(char, 10),
        position,
      });
      position += 1;
    } else if (char === '[') {
      // Bracketed atoms [...]
      const result = parseBracketedAtom(smiles, position);
      tokens.push({
        type: TokenType.ATOM,
        value: result.value,
        atom: result.atom,
        position,
      });
      position = result.endPosition;
    } else if (isAtomStart(char)) {
      // Simple atoms (organic subset and aromatic)
      const result = parseSimpleAtom(smiles, position);
      tokens.push({
        type: TokenType.ATOM,
        value: result.value,
        atom: result.atom,
        position,
      });
      position = result.endPosition;
    } else {
      throw new Error(`Unexpected character at position ${position}: '${char}'`);
    }
  }

  return tokens;
}
