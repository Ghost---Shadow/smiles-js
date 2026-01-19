export const handleAtoms = (context) => {
  context.atoms.push({ type: context.char, position: context.atomIndex, attachments: [] });
  context.atomIndex += 1;
};

export const handleAttachment = (context) => {
  // Handle attachment - extract content within parentheses
  let depth = 1;
  let j = context.i + 1;
  let attachmentContent = '';

  while (j < context.smiles.length && depth > 0) {
    if (context.smiles[j] === '(') {
      depth += 1;
    } else if (context.smiles[j] === ')') {
      depth -= 1;
    }
    if (depth > 0) {
      attachmentContent += context.smiles[j];
    }
    j += 1;
  }

  // Add attachment to the most recent atom
  if (context.atoms.length > 0) {
    context.atoms[context.atoms.length - 1].attachments.push(attachmentContent);
  }

  // Skip past the closing parenthesis
  context.i = j - 1;
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

    // Collect attachments
    const attachments = {};
    for (let pos = startPos; pos <= endPos; pos += 1) {
      const relativePos = pos - startPos + 1; // 1-based position in ring
      if (context.atoms[pos].attachments.length > 0) {
        [attachments[relativePos]] = context.atoms[pos].attachments;
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
 * Parse SMILES string to create ring descriptors with AST
 * @param {string} smiles - SMILES string to parse
 * @returns {Array} Array of ring descriptors
 */
export function parse(smiles) {
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
