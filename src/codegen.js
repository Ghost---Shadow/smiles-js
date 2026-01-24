const {
  isRingNode, isLinearNode, isMoleculeNode, isFusedRingNode,
} = require('./ast');

/**
 * Build SMILES for a molecule node
 * @param {Object} molecule - Molecule AST node
 * @returns {string} SMILES string
 */
function buildMoleculeSMILES(molecule) {
  const { components } = molecule;

  if (components.length === 0) {
    return '';
  }

  // Concatenate SMILES from all components
  return components.map((component) => buildSMILES(component)).join('');
}

/**
 * Build SMILES for a linear chain node
 * @param {Object} linear - Linear AST node
 * @returns {string} SMILES string
 */
function buildLinearSMILES(linear) {
  const { atoms, bonds = [] } = linear;

  if (atoms.length === 0) {
    return '';
  }

  // Interleave bonds and atoms
  let smiles = atoms[0];
  for (let i = 1; i < atoms.length; i += 1) {
    const bond = bonds[i - 1] || ''; // Default to implicit bond if not specified
    smiles += bond + atoms[i];
  }

  return smiles;
}

/**
 * Build SMILES for a ring node
 * @param {Object} ring - Ring AST node
 * @returns {string} SMILES string
 */
function buildRingSMILES(ring) {
  const {
    size, atoms, substitutions, attachments, ringNumber,
  } = ring;

  // Format ring number (use %NN notation for numbers > 9)
  const ringNumStr = ringNumber > 9 ? `%${ringNumber}` : String(ringNumber);

  // Build base ring structure
  const atomsArray = [];
  for (let i = 0; i < size; i += 1) {
    const position = i + 1;
    const atomType = substitutions[position] || atoms;
    const isClosurePoint = i === 0 || i === size - 1;
    atomsArray.push(isClosurePoint ? `${atomType}${ringNumStr}` : atomType);
  }

  // Handle attachments
  Object.entries(attachments).forEach(([position, attachmentArray]) => {
    const i = Number(position) - 1;

    let allAttachmentsSmiles = '';
    attachmentArray.forEach((attachment) => {
      const attachmentSmiles = buildSMILES(attachment);
      allAttachmentsSmiles += `(${attachmentSmiles})`;
    });

    // For position 1 (index 0), ring number comes BEFORE attachment
    // For last position, attachment goes after ring number
    // For other positions, no ring number present
    if (i === 0) {
      // First position: atom + ringNum + attachment
      const atomWithoutRingNum = atomsArray[i].replace(ringNumStr, '');
      atomsArray[i] = `${atomWithoutRingNum}${ringNumStr}${allAttachmentsSmiles}`;
    } else if (i === size - 1) {
      // Last position: atom + ringNum + attachment
      atomsArray[i] = `${atomsArray[i]}${allAttachmentsSmiles}`;
    } else {
      // Middle positions: just atom + attachment (no ring number)
      atomsArray[i] = `${atomsArray[i]}${allAttachmentsSmiles}`;
    }
  });

  return atomsArray.join('');
}

/**
 * Build SMILES for a fused ring system
 * @param {Object} fusedRing - FusedRing AST node
 * @returns {string} SMILES string
 */
function buildFusedRingSMILES(fusedRing) {
  const { rings } = fusedRing;

  if (rings.length === 0) {
    return '';
  }

  if (rings.length === 1) {
    return buildRingSMILES(rings[0]);
  }

  // Sort rings from largest to smallest
  const sortedRings = [...rings].sort((a, b) => b.size - a.size);

  // Build the SMILES structure
  let atoms = buildRingAtomsArray(sortedRings[0]);

  // Wrap each subsequent ring around the previous structure
  for (let ringIdx = 1; ringIdx < sortedRings.length; ringIdx += 1) {
    const ring = sortedRings[ringIdx];
    const { offset } = ring;

    const newRingAtoms = buildRingAtomsArray(ring);

    const beforeFusion = atoms.slice(0, offset);
    const afterFusion = atoms.slice(offset + 2);

    atoms = [
      ...beforeFusion,
      ...newRingAtoms,
      ...afterFusion,
    ];
  }

  return atoms.join('');
}

/**
 * Helper function to build ring atoms array
 * @param {Object} ring - Ring AST node
 * @returns {Array<string>} Array of atom strings
 */
function buildRingAtomsArray(ring) {
  const {
    size, atoms, substitutions, attachments, ringNumber,
  } = ring;

  // Format ring number (use %NN notation for numbers > 9)
  const ringNumStr = ringNumber > 9 ? `%${ringNumber}` : String(ringNumber);

  // Build base ring structure
  const atomsArray = [];
  for (let i = 0; i < size; i += 1) {
    const position = i + 1;
    const atomType = substitutions[position] || atoms;
    const isClosurePoint = i === 0 || i === size - 1;
    atomsArray.push(isClosurePoint ? `${atomType}${ringNumStr}` : atomType);
  }

  // Handle attachments
  Object.entries(attachments).forEach(([position, attachmentArray]) => {
    const i = Number(position) - 1;

    let allAttachmentsSmiles = '';
    attachmentArray.forEach((attachment) => {
      const attachmentSmiles = buildSMILES(attachment);
      allAttachmentsSmiles += `(${attachmentSmiles})`;
    });

    // For the last position (ring closure), attachment goes after ring number
    // For other positions, strip ring number, add attachment, restore ring number
    if (i === size - 1) {
      atomsArray[i] = `${atomsArray[i]}${allAttachmentsSmiles}`;
    } else {
      const atomWithoutRingNum = atomsArray[i].replace(ringNumStr, '');
      atomsArray[i] = `${atomWithoutRingNum}${allAttachmentsSmiles}${atomsArray[i].includes(ringNumStr) ? ringNumStr : ''}`;
    }
  });

  return atomsArray;
}

/**
 * Build SMILES from an AST node (dispatcher)
 * @param {Object} ast - AST node
 * @returns {string} SMILES string
 */
function buildSMILES(ast) {
  if (isMoleculeNode(ast)) {
    return buildMoleculeSMILES(ast);
  }

  if (isFusedRingNode(ast)) {
    return buildFusedRingSMILES(ast);
  }

  if (isRingNode(ast)) {
    return buildRingSMILES(ast);
  }

  if (isLinearNode(ast)) {
    return buildLinearSMILES(ast);
  }

  throw new Error(`Unknown AST node type: ${ast.type}`);
}

module.exports = {
  buildSMILES,
  buildMoleculeSMILES,
  buildLinearSMILES,
  buildRingSMILES,
  buildFusedRingSMILES,
};
