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

/**
 * Check if character is a bond symbol
 */
function isBondSymbol(char) {
  return char === '-' || char === '=' || char === '#' || char === ':' || char === '/' || char === '\\';
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
      // eslint-disable-next-line no-continue
      continue;
    }

    // Branch symbols
    if (char === '(') {
      tokens.push({
        type: TokenType.BRANCH_OPEN,
        value: '(',
        position,
      });
      position += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (char === ')') {
      tokens.push({
        type: TokenType.BRANCH_CLOSE,
        value: ')',
        position,
      });
      position += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Dot (disconnected fragments)
    if (char === '.') {
      tokens.push({
        type: TokenType.DOT,
        value: '.',
        position,
      });
      position += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Bond symbols
    if (isBondSymbol(char)) {
      tokens.push({
        type: TokenType.BOND,
        value: char,
        position,
      });
      position += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Ring markers (% followed by two digits, or single digit)
    if (char === '%') {
      const marker = smiles.slice(position, position + 3);
      if (marker.length === 3 && /^%\d\d$/.test(marker)) {
        tokens.push({
          type: TokenType.RING_MARKER,
          value: marker,
          ringNumber: parseInt(marker.slice(1), 10),
          position,
        });
        position += 3;
        // eslint-disable-next-line no-continue
        continue;
      }
      throw new Error(`Invalid ring marker at position ${position}: ${marker}`);
    }

    // Ring markers (single digit)
    if (/\d/.test(char)) {
      tokens.push({
        type: TokenType.RING_MARKER,
        value: char,
        ringNumber: parseInt(char, 10),
        position,
      });
      position += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Bracketed atoms [...]
    if (char === '[') {
      const result = parseBracketedAtom(smiles, position);
      tokens.push({
        type: TokenType.ATOM,
        value: result.value,
        atom: result.atom,
        position,
      });
      position = result.endPosition;
      // eslint-disable-next-line no-continue
      continue;
    }

    // Simple atoms (organic subset and aromatic)
    if (isAtomStart(char)) {
      const result = parseSimpleAtom(smiles, position);
      tokens.push({
        type: TokenType.ATOM,
        value: result.value,
        atom: result.atom,
        position,
      });
      position = result.endPosition;
      // eslint-disable-next-line no-continue
      continue;
    }

    throw new Error(`Unexpected character at position ${position}: '${char}'`);
  }

  return tokens;
}
