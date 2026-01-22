export const handleAtoms = (context) => {
  context.atoms.push({ type: context.char, position: context.atomIndex, attachments: [] });
  context.atomIndex += 1;
};

/**
 * Extract content within parentheses (for branches/attachments)
 * @param {string} smiles - SMILES string
 * @param {number} startIndex - Index of opening parenthesis
 * @returns {Object} Object with content and endIndex
 */
export const extractParenthesesContent = (smiles, startIndex) => {
  let depth = 1;
  let j = startIndex + 1;
  let content = '';

  while (j < smiles.length && depth > 0) {
    if (smiles[j] === '(') {
      depth += 1;
    } else if (smiles[j] === ')') {
      depth -= 1;
    }
    if (depth > 0) {
      content += smiles[j];
    }
    j += 1;
  }

  return { content, endIndex: j };
};

export const handleAttachment = (context) => {
  // Handle attachment - extract content within parentheses
  const { content, endIndex } = extractParenthesesContent(context.smiles, context.i);

  // Add attachment to the most recent atom
  if (context.atoms.length > 0) {
    context.atoms[context.atoms.length - 1].attachments.push(content);
  }

  // Skip past the closing parenthesis
  context.i = endIndex - 1;
};

export const handleRings = (context) => {
  // Handle ring closure digit
  const ringNum = parseInt(context.char, 10);

  if (!context.ringStacks[ringNum]) {
    // Opening of ring - push current atom position onto stack
    context.ringStacks[ringNum] = [];
    context.ringStacks[ringNum].push(context.atomIndex - 1);
  } else {
    // Closing of ring - pop start position from stack and create ring
    const startPos = context.ringStacks[ringNum].pop();
    const endPos = context.atomIndex - 1;

    // Calculate ring size by counting atoms between opening and closing
    // For simple rings: all atoms between start and end
    // For fused rings: need to exclude atoms that belong to other rings
    let ringSize = endPos - startPos + 1;

    // Check if any previously closed rings overlap with this range
    context.rings.forEach((prevRing) => {
      const prevStart = prevRing.startPos;
      const prevEnd = prevRing.startPos + prevRing.size - 1;

      // If previous ring is entirely within this ring's range
      if (prevStart > startPos && prevEnd < endPos) {
        // Subtract the overlapping atoms (but keep the shared edge atoms)
        ringSize -= (prevRing.size - 2);
      }
    });

    // Find base type
    const baseType = context.atoms[startPos].type;

    // Calculate offset for fused rings
    let offset = 0;
    if (context.rings.length > 0) {
      // This is a fused ring - offset is where it starts
      offset = startPos;
    }

    // Detect substitutions (atoms different from base type)
    const substitutions = {};
    for (let pos = startPos; pos <= endPos; pos += 1) {
      const relativePos = pos - startPos + 1; // 1-based position in ring
      if (context.atoms[pos].type !== baseType) {
        substitutions[relativePos] = context.atoms[pos].type;
      }
    }

    // Collect attachments and recursively parse ring attachments
    const attachments = {};
    for (let pos = startPos; pos <= endPos; pos += 1) {
      const relativePos = pos - startPos + 1; // 1-based position in ring
      if (context.atoms[pos].attachments.length > 0) {
        // Initialize array for this position if not exists
        if (!attachments[relativePos]) {
          attachments[relativePos] = [];
        }
        // Process all attachments at this position
        context.atoms[pos].attachments.forEach((attachmentSmiles) => {
          // Check if attachment contains a ring (has digits)
          if (/\d/.test(attachmentSmiles)) {
            try {
              // Recursively parse the ring attachment
              // eslint-disable-next-line no-use-before-define
              const parsedRings = parse(attachmentSmiles);
              // Store parsed rings directly without meta wrapper
              attachments[relativePos].push(parsedRings);
            } catch {
              // If parsing fails, store as string (might be non-ring attachment)
              attachments[relativePos].push(attachmentSmiles);
            }
          } else {
            // Simple attachment (no rings)
            attachments[relativePos].push(attachmentSmiles);
          }
        });
      }
    }

    context.rings.push({
      type: baseType,
      size: ringSize,
      offset,
      ringNumber: ringNum,
      substitutions,
      attachments,
      startPos, // Keep for sorting
    });

    delete context.ringStacks[ringNum];
  }
};

export const handleLargeRings = (context) => {
  // Handle %NN ring notation (for ring numbers > 9)
  const match = context.smiles.substring(context.i + 1).match(/^\d+/);
  if (match) {
    const ringNumStr = match[0];
    context.char = ringNumStr;
    handleRings(context);
    // Skip the digits (minus 1 because loop will increment)
    context.i += ringNumStr.length;
  }
};

/**
 * Parse SMILES string for linear structures
 * @param {string} smiles - SMILES string to parse
 * @returns {Object} Linear structure descriptor
 */
export function parseLinear(smiles) {
  const atoms = [];
  const attachments = {};
  let atomIndex = 1; // 1-based indexing

  let i = 0;
  while (i < smiles.length) {
    const char = smiles[i];

    if (char === '(') {
      // Extract attachment content
      const { content, endIndex } = extractParenthesesContent(smiles, i);

      // Recursively parse attachment
      if (atoms.length > 0) {
        const position = atomIndex - 1;
        if (!attachments[position]) {
          attachments[position] = [];
        }
        attachments[position].push(parseLinear(content));
      }

      i = endIndex;
    } else if (char === '[') {
      // Handle bracketed atoms
      let j = i + 1;
      while (j < smiles.length && smiles[j] !== ']') {
        j += 1;
      }
      atoms.push(smiles.substring(i, j + 1));
      atomIndex += 1;
      i = j + 1;
    } else if (/[A-Z]/.test(char)) {
      // Handle atoms
      let atom = char;
      if (i + 1 < smiles.length && /[a-z]/.test(smiles[i + 1])) {
        atom += smiles[i + 1];
        i += 1;
      }
      atoms.push(atom);
      atomIndex += 1;
      i += 1;
    } else if (char === '=' || char === '#') {
      // Bond symbols
      atoms.push(char);
      i += 1;
    } else {
      // Skip other characters
      i += 1;
    }
  }

  return {
    type: 'linear',
    atoms: atoms.join(''),
    attachments,
  };
}

/**
 * Parse SMILES string to create ring descriptors with AST
 * @param {string} smiles - SMILES string to parse
 * @returns {Array} Array of ring descriptors
 */
export function parseRings(smiles) {
  if (!smiles || smiles.length === 0) {
    throw new Error('Cannot parse empty SMILES');
  }

  // Find all ring closures (digits 1-9)
  const ringMatches = smiles.match(/\d/g);
  if (!ringMatches || ringMatches.length === 0) {
    throw new Error('No rings found in SMILES');
  }

  // Create context object with all state
  const context = {
    smiles,
    ringStacks: {}, // { ringNumber: [positions] }
    rings: [], // Array of ring descriptors
    atoms: [], // Track all atoms with their positions
    atomIndex: 0,
    i: 0,
    char: '',
  };

  // Parse SMILES character by character
  for (context.i = 0; context.i < smiles.length; context.i += 1) {
    context.char = smiles[context.i];

    // Handle atoms (letters)
    if (/[a-zA-Z]/.test(context.char)) {
      handleAtoms(context);
    } else if (context.char === '(') {
      handleAttachment(context);
    } else if (context.char === '%') {
      handleLargeRings(context);
    } else if (/\d/.test(context.char)) {
      handleRings(context);
    }
  }

  // Sort rings by start position (so ring 1 comes before ring 2)
  context.rings.sort((a, b) => a.startPos - b.startPos);

  // Recalculate offsets based on sorted order and remove internal tracking fields
  const cleanRings = context.rings.map(({ startPos, ...rest }) => ({
    ...rest,
    offset: startPos,
  }));

  return cleanRings;
}

/**
 * Main parse function - detects structure type and routes to appropriate parser
 * @param {string} smiles - SMILES string to parse
 * @returns {Array} Array of Meta descriptors (rings or single linear descriptor)
 */
export function parse(smiles) {
  if (!smiles || smiles.length === 0) {
    throw new Error('Cannot parse empty SMILES');
  }

  // Check if SMILES contains ring closures (digits that aren't in brackets)
  // This is a simple heuristic: if there are digits outside brackets, it's likely a ring
  let hasRingClosures = false;
  let inBracket = false;

  for (let i = 0; i < smiles.length; i += 1) {
    if (smiles[i] === '[') {
      inBracket = true;
    } else if (smiles[i] === ']') {
      inBracket = false;
    } else if (!inBracket && /\d/.test(smiles[i])) {
      hasRingClosures = true;
      break;
    }
  }

  // Route to appropriate parser
  if (hasRingClosures) {
    return parseRings(smiles);
  }
  // Wrap linear result in array for consistency
  return [parseLinear(smiles)];
}
