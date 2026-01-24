const { ASTNodeType, isRingNode, isLinearNode } = require('./ast');
const { buildSMILES } = require('./codegen');

// Internal node creation functions
function createRingNode(
  atoms,
  size,
  ringNumber = 1,
  offset = 0,
  substitutions = {},
  attachments = {},
) {
  return {
    type: ASTNodeType.RING,
    ringNumber,
    size,
    offset,
    atoms,
    substitutions,
    attachments,
  };
}

function createLinearNode(atoms, bonds = []) {
  return {
    type: ASTNodeType.LINEAR,
    atoms,
    bonds,
  };
}

function createMoleculeNode(components = []) {
  return {
    type: ASTNodeType.MOLECULE,
    components,
  };
}

function createFusedRingNode(rings) {
  return {
    type: ASTNodeType.FUSED_RING,
    rings,
  };
}

// Validation helper for Ring
function validateRingOptions(options) {
  const { atoms, size } = options;

  if (!atoms || typeof atoms !== 'string') {
    throw new Error('Ring requires atoms (string)');
  }

  if (!size || typeof size !== 'number' || size < 3) {
    throw new Error('Ring requires size >= 3');
  }
}

// Constructor functions
function Ring(options) {
  validateRingOptions(options);

  const {
    atoms,
    size,
    ringNumber = 1,
    offset = 0,
    substitutions = {},
    attachments = {},
  } = options;

  const ring = createRingNode(atoms, size, ringNumber, offset, substitutions, attachments);

  // Add .smiles getter
  Object.defineProperty(ring, 'smiles', {
    get() {
      return buildSMILES(this);
    },
    enumerable: true,
    configurable: true,
  });

  // Add manipulation methods
  ring.attach = function (attachment, position) {
    // Clone existing attachments
    const newAttachments = {};
    Object.keys(this.attachments).forEach((pos) => {
      newAttachments[pos] = [...this.attachments[pos]];
    });

    // Add new attachment to the array at this position
    if (newAttachments[position]) {
      newAttachments[position].push(attachment);
    } else {
      newAttachments[position] = [attachment];
    }

    // Create new ring with updated attachments
    return Ring({
      atoms: this.atoms,
      size: this.size,
      ringNumber: this.ringNumber,
      offset: this.offset,
      substitutions: { ...this.substitutions },
      attachments: newAttachments,
    });
  };

  ring.substitute = function (position, newAtom) {
    // Clone existing substitutions
    const newSubstitutions = { ...this.substitutions };

    // If newAtom matches base atom, remove the substitution
    if (newAtom === this.atoms) {
      delete newSubstitutions[position];
    } else {
      // Add/update substitution
      newSubstitutions[position] = newAtom;
    }

    // Create new ring with updated substitutions
    return Ring({
      atoms: this.atoms,
      size: this.size,
      ringNumber: this.ringNumber,
      offset: this.offset,
      substitutions: newSubstitutions,
      attachments: { ...this.attachments },
    });
  };

  ring.substituteMultiple = function (substitutionMap) {
    // Apply multiple substitutions at once
    let result = this;
    for (const [position, atom] of Object.entries(substitutionMap)) {
      result = result.substitute(Number(position), atom);
    }
    return result;
  };

  ring.clone = function () {
    // Deep clone this ring
    return Ring({
      atoms: this.atoms,
      size: this.size,
      ringNumber: this.ringNumber,
      offset: this.offset,
      substitutions: { ...this.substitutions },
      attachments: JSON.parse(JSON.stringify(this.attachments)),
    });
  };

  return ring;
}

// Validation helper for Linear
function validateLinearAtoms(atoms) {
  if (!Array.isArray(atoms)) {
    throw new Error('Linear requires atoms array');
  }

  if (atoms.length === 0) {
    throw new Error('Linear requires at least one atom');
  }

  if (!atoms.every((atom) => typeof atom === 'string')) {
    throw new Error('Linear atoms must all be strings');
  }
}

function Linear(atoms, bonds = []) {
  validateLinearAtoms(atoms);

  const linear = createLinearNode(atoms, bonds);

  // Add .smiles getter
  Object.defineProperty(linear, 'smiles', {
    get() {
      return buildSMILES(this);
    },
    enumerable: true,
    configurable: true,
  });

  // Add manipulation methods
  linear.concat = function (other) {
    // Concatenate this linear chain with another structure
    if (isLinearNode(other)) {
      return Linear([...this.atoms, ...other.atoms], [...this.bonds, ...other.bonds]);
    }
    return Molecule([this, other]);
  };

  linear.clone = function () {
    // Deep clone this linear chain
    return Linear([...this.atoms], [...this.bonds]);
  };

  return linear;
}

// Validation helper for Molecule
function validateMoleculeComponents(components) {
  if (!Array.isArray(components)) {
    throw new Error('Molecule requires components array');
  }
}

function Molecule(components = []) {
  validateMoleculeComponents(components);

  const molecule = createMoleculeNode(components);

  // Add .smiles getter
  Object.defineProperty(molecule, 'smiles', {
    get() {
      return buildSMILES(this);
    },
    enumerable: true,
    configurable: true,
  });

  // Add manipulation methods
  molecule.append = function (component) {
    // Add a component to the end of this molecule
    return Molecule([...this.components, component]);
  };

  molecule.prepend = function (component) {
    // Add a component to the beginning of this molecule
    return Molecule([component, ...this.components]);
  };

  molecule.concat = function (other) {
    // Concatenate this molecule with another structure
    if (other.type === ASTNodeType.MOLECULE) {
      return Molecule([...this.components, ...other.components]);
    }
    return Molecule([...this.components, other]);
  };

  molecule.clone = function () {
    // Deep clone this molecule
    return Molecule([...this.components]);
  };

  return molecule;
}

// Validation helper for FusedRing
function validateRings(rings) {
  if (!Array.isArray(rings)) {
    throw new Error('FusedRing requires rings array');
  }

  if (rings.length === 0) {
    throw new Error('FusedRing requires at least one ring');
  }

  rings.forEach((ring, idx) => {
    if (!isRingNode(ring)) {
      throw new Error(`Ring at index ${idx} is not a valid ring node`);
    }
  });

  return rings;
}

function FusedRing(rings) {
  const validatedRings = validateRings(rings);

  const fusedRing = createFusedRingNode(validatedRings);

  // Add .smiles getter
  Object.defineProperty(fusedRing, 'smiles', {
    get() {
      return buildSMILES(this);
    },
    enumerable: true,
    configurable: true,
  });

  return fusedRing;
}

module.exports = {
  createRingNode,
  createLinearNode,
  createMoleculeNode,
  createFusedRingNode,
  Ring,
  Linear,
  Molecule,
  FusedRing,
};
