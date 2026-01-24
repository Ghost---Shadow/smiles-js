// Token types
const TokenType = {
  ATOM: 'atom',
  BOND: 'bond',
  RING_MARKER: 'ring_marker',
  BRANCH_OPEN: 'branch_open',
  BRANCH_CLOSE: 'branch_close',
};

// Helper functions
function isDigit(char) {
  return char >= '0' && char <= '9';
}

function isUpperCase(char) {
  return char >= 'A' && char <= 'Z';
}

function isLowerCase(char) {
  return char >= 'a' && char <= 'z';
}

function isBondSymbol(char) {
  return char === '-' || char === '=' || char === '#' || char === ':' || char === '/' || char === '\\';
}

function isBranchSymbol(char) {
  return char === '(' || char === ')';
}

/**
 * Extract a simple (non-bracketed) atom token
 * Handles both single letter (C, N, O) and two letter (Cl, Br) atoms
 */
function extractSimpleAtom(smiles, position) {
  const firstChar = smiles[position];
  const secondChar = smiles[position + 1];

  // Two-letter atoms
  if (isUpperCase(firstChar) && isLowerCase(secondChar)) {
    // Check for valid two-letter atoms
    const twoLetter = firstChar + secondChar;
    if (['Cl', 'Br', 'Si', 'Al', 'Ca', 'Fe', 'Mg', 'Na', 'Se', 'Zn'].includes(twoLetter)) {
      return {
        type: TokenType.ATOM,
        value: twoLetter,
        position,
        length: 2,
      };
    }
  }

  // Single letter atom (aromatic or aliphatic)
  if (isUpperCase(firstChar) || isLowerCase(firstChar)) {
    return {
      type: TokenType.ATOM,
      value: firstChar,
      position,
      length: 1,
    };
  }

  return null;
}

/**
 * Extract a bracketed atom token
 * Handles complex atoms like [NH3+], [C@H], etc.
 */
function extractBracketedAtom(smiles, position) {
  if (smiles[position] !== '[') {
    return null;
  }

  let i = position + 1;
  let depth = 1;

  // Find matching closing bracket
  while (i < smiles.length && depth > 0) {
    if (smiles[i] === '[') {
      depth++;
    } else if (smiles[i] === ']') {
      depth--;
    }
    i++;
  }

  if (depth !== 0) {
    throw new Error(`Unmatched bracket at position ${position}`);
  }

  const value = smiles.substring(position, i);
  return {
    type: TokenType.ATOM,
    value,
    position,
    length: value.length,
  };
}

/**
 * Extract a ring marker token
 * Handles both single digit (1-9) and % notation (%10, %11, etc.)
 */
function extractRingMarker(smiles, position) {
  const char = smiles[position];

  if (char === '%') {
    // % notation for numbers >= 10
    if (position + 2 >= smiles.length) {
      throw new Error(`Invalid ring marker at position ${position}`);
    }

    const digit1 = smiles[position + 1];
    const digit2 = smiles[position + 2];

    if (!isDigit(digit1) || !isDigit(digit2)) {
      throw new Error(`Invalid ring marker at position ${position}`);
    }

    return {
      type: TokenType.RING_MARKER,
      value: parseInt(digit1 + digit2, 10),
      position,
      length: 3,
    };
  }

  if (isDigit(char)) {
    return {
      type: TokenType.RING_MARKER,
      value: parseInt(char, 10),
      position,
      length: 1,
    };
  }

  return null;
}

/**
 * Tokenize a SMILES string into a stream of tokens
 * @param {string} smiles - SMILES string to tokenize
 * @returns {Array} Array of token objects
 */
function tokenize(smiles) {
  const tokens = [];
  let position = 0;

  while (position < smiles.length) {
    const char = smiles[position];

    // Skip whitespace
    if (char === ' ' || char === '\t' || char === '\n') {
      position++;
      continue;
    }

    // Bracketed atom
    if (char === '[') {
      const token = extractBracketedAtom(smiles, position);
      tokens.push(token);
      position += token.length;
      continue;
    }

    // Simple atom (must check before ring marker to handle 'c1' correctly)
    const atomToken = extractSimpleAtom(smiles, position);
    if (atomToken) {
      tokens.push(atomToken);
      position += atomToken.length;
      continue;
    }

    // Bond symbol
    if (isBondSymbol(char)) {
      tokens.push({
        type: TokenType.BOND,
        value: char,
        position,
        length: 1,
      });
      position++;
      continue;
    }

    // Ring marker
    const ringToken = extractRingMarker(smiles, position);
    if (ringToken) {
      tokens.push(ringToken);
      position += ringToken.length;
      continue;
    }

    // Branch symbols
    if (isBranchSymbol(char)) {
      tokens.push({
        type: char === '(' ? TokenType.BRANCH_OPEN : TokenType.BRANCH_CLOSE,
        value: char,
        position,
        length: 1,
      });
      position++;
      continue;
    }

    // Unknown character
    throw new Error(`Unknown character '${char}' at position ${position}`);
  }

  return tokens;
}

module.exports = {
  TokenType,
  tokenize,
};
