/**
 * Decompiler - Converts AST nodes to JavaScript constructor code
 * This allows users to see the programmatic construction of molecules
 */

import {
  isMoleculeNode,
  isFusedRingNode,
  isRingNode,
  isLinearNode,
} from './ast.js';

/**
 * Generate JavaScript code from an AST node
 * @param {Object} node - AST node (Ring, Linear, FusedRing, or Molecule)
 * @param {Object} options - Decompiler options
 * @returns {string} JavaScript code
 */
/**
 * Decompile a Ring node
 */
function decompileRing(ring, indent, varName) {
  const lines = [];

  // Build options object
  const options = {
    atoms: `'${ring.atoms}'`,
    size: ring.size,
  };

  if (ring.ringNumber !== 1) {
    options.ringNumber = ring.ringNumber;
  }

  if (ring.offset !== 0) {
    options.offset = ring.offset;
  }

  // Format options
  const optionsStr = Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

  // Add substitutions
  if (Object.keys(ring.substitutions).length > 0) {
    Object.entries(ring.substitutions).forEach(([pos, atom]) => {
      lines.push(`${indent}const ${varName}Substituted = ${varName}.substitute(${pos}, '${atom}');`);
    });
  }

  // Add attachments
  if (Object.keys(ring.attachments).length > 0) {
    let currentVar = Object.keys(ring.substitutions).length > 0
      ? `${varName}Substituted`
      : varName;

    Object.entries(ring.attachments).forEach(([pos, attachmentList], idx) => {
      attachmentList.forEach((attachment, attachIdx) => {
        const attachVarName = `${varName}Attachment${idx}_${attachIdx}`;
        // eslint-disable-next-line no-use-before-define
        const attachCode = decompile(attachment, { indent: 0, varName: attachVarName });
        lines.push(attachCode);

        const newVar = `${varName}WithAttachment${idx}_${attachIdx}`;
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${attachVarName}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return lines.join('\n');
}

/**
 * Decompile a Linear node
 */
function decompileLinear(linear, indent, varName) {
  const lines = [];

  // Format atoms array
  const atomsStr = linear.atoms.map((a) => `'${a}'`).join(', ');

  // Format bonds array if present
  if (linear.bonds.length > 0) {
    const bondsStr = linear.bonds.map((b) => `'${b}'`).join(', ');
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}], [${bondsStr}]);`);
  } else {
    lines.push(`${indent}const ${varName} = Linear([${atomsStr}]);`);
  }

  // Add attachments
  if (Object.keys(linear.attachments).length > 0) {
    let currentVar = varName;

    Object.entries(linear.attachments).forEach(([pos, attachmentList], idx) => {
      attachmentList.forEach((attachment, attachIdx) => {
        const attachVarName = `${varName}Attachment${idx}_${attachIdx}`;
        // eslint-disable-next-line no-use-before-define
        const attachCode = decompile(attachment, { indent: 0, varName: attachVarName });
        lines.push(attachCode);

        const newVar = `${varName}WithAttachment${idx}_${attachIdx}`;
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${attachVarName}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return lines.join('\n');
}

/**
 * Decompile a FusedRing node
 */
function decompileFusedRing(fusedRing, indent, varName) {
  const lines = [];

  // Create individual rings first
  fusedRing.rings.forEach((ring, idx) => {
    const ringVarName = `${varName}Ring${idx + 1}`;
    const options = {
      atoms: `'${ring.atoms}'`,
      size: ring.size,
      ringNumber: ring.ringNumber,
      offset: ring.offset,
    };

    const optionsStr = Object.entries(options)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    lines.push(`${indent}const ${ringVarName} = Ring({ ${optionsStr} });`);
  });

  // Fuse rings together
  if (fusedRing.rings.length === 2) {
    const ring1 = `${varName}Ring1`;
    const ring2 = `${varName}Ring2`;
    const { offset } = fusedRing.rings[1];
    lines.push(`${indent}const ${varName} = ${ring1}.fuse(${ring2}, ${offset});`);
  } else {
    // Multiple rings - create fused ring directly
    const ringsStr = fusedRing.rings.map((r, idx) => `${varName}Ring${idx + 1}`).join(', ');
    lines.push(`${indent}const ${varName} = FusedRing([${ringsStr}]);`);
  }

  return lines.join('\n');
}

/**
 * Decompile a Molecule node
 */
function decompileMolecule(molecule, indent, varName) {
  const lines = [];

  // Create components
  molecule.components.forEach((component, idx) => {
    const componentVarName = `${varName}Component${idx + 1}`;
    // eslint-disable-next-line no-use-before-define
    const componentCode = decompile(component, { indent: 0, varName: componentVarName });
    lines.push(componentCode);
  });

  // Create molecule
  const componentsStr = molecule.components
    .map((c, idx) => `${varName}Component${idx + 1}`)
    .join(', ');
  lines.push(`${indent}const ${varName} = Molecule([${componentsStr}]);`);

  return lines.join('\n');
}

/**
 * Main decompile dispatcher
 */
export function decompile(node, options = {}) {
  const { indent = 0, varName = 'molecule' } = options;
  const indentStr = '  '.repeat(indent);

  if (isRingNode(node)) {
    return decompileRing(node, indentStr, varName);
  }

  if (isLinearNode(node)) {
    return decompileLinear(node, indentStr, varName);
  }

  if (isFusedRingNode(node)) {
    return decompileFusedRing(node, indentStr, varName);
  }

  if (isMoleculeNode(node)) {
    return decompileMolecule(node, indentStr, varName);
  }

  throw new Error(`Unknown node type: ${node.type}`);
}
