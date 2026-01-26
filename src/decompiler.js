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
 * Decompile a Ring node
 * Returns { code: string, finalVar: string } where finalVar is the variable
 * name after all substitutions and attachments are applied
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

  let currentVar = varName;

  // Add substitutions
  if (Object.keys(ring.substitutions).length > 0) {
    Object.entries(ring.substitutions).forEach(([pos, atom]) => {
      const newVar = `${currentVar}Sub${pos}`;
      lines.push(`${indent}const ${newVar} = ${currentVar}.substitute(${pos}, '${atom}');`);
      currentVar = newVar;
    });
  }

  // Add attachments
  if (Object.keys(ring.attachments).length > 0) {
    Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment, attachIdx) => {
        const aName = `${varName}Attach${pos}_${attachIdx}`;
        // eslint-disable-next-line no-use-before-define
        const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, aName);
        lines.push(aCode);

        const newVar = `${currentVar}WithAttach${pos}_${attachIdx}`;
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Decompile a Linear node
 * Returns { code: string, finalVar: string }
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

  let currentVar = varName;

  // Add attachments
  if (Object.keys(linear.attachments).length > 0) {
    Object.entries(linear.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment, attachIdx) => {
        const aName = `${varName}Attach${pos}_${attachIdx}`;
        // eslint-disable-next-line no-use-before-define
        const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, aName);
        lines.push(aCode);

        const newVar = `${currentVar}WithAttach${pos}_${attachIdx}`;
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Decompile a FusedRing node
 * Returns { code: string, finalVar: string }
 */
function decompileFusedRing(fusedRing, indent, varName) {
  const lines = [];
  const ringFinalVars = [];

  // Create individual rings with their substitutions and attachments
  fusedRing.rings.forEach((ring, idx) => {
    const ringVarName = `${varName}Ring${idx + 1}`;
    const { code: ringCode, finalVar: ringFinalVar } = decompileRing(ring, indent, ringVarName);
    lines.push(ringCode);
    ringFinalVars.push(ringFinalVar);
  });

  // Fuse rings together
  if (fusedRing.rings.length === 2) {
    const ring1 = ringFinalVars[0];
    const ring2 = ringFinalVars[1];
    const { offset } = fusedRing.rings[1];
    lines.push(`${indent}const ${varName} = ${ring1}.fuse(${ring2}, ${offset});`);
  } else {
    // Multiple rings - create fused ring directly
    const ringsStr = ringFinalVars.join(', ');
    lines.push(`${indent}const ${varName} = FusedRing([${ringsStr}]);`);
  }

  return { code: lines.join('\n'), finalVar: varName };
}

/**
 * Decompile a Molecule node
 * Returns { code: string, finalVar: string }
 */
function decompileMolecule(molecule, indent, varName) {
  const lines = [];
  const componentFinalVars = [];

  // Create components
  molecule.components.forEach((component, idx) => {
    const componentVarName = `${varName}Comp${idx + 1}`;
    // eslint-disable-next-line no-use-before-define
    const { code: componentCode, finalVar } = decompileNode(component, indent, componentVarName);
    lines.push(componentCode);
    componentFinalVars.push(finalVar);
  });

  // Create molecule using the final variable names (after attachments)
  const componentsStr = componentFinalVars.join(', ');
  lines.push(`${indent}const ${varName} = Molecule([${componentsStr}]);`);

  return { code: lines.join('\n'), finalVar: varName };
}

/**
 * Internal dispatcher that returns { code, finalVar }
 */
function decompileNode(node, indent, varName) {
  if (isRingNode(node)) {
    return decompileRing(node, indent, varName);
  }

  if (isLinearNode(node)) {
    return decompileLinear(node, indent, varName);
  }

  if (isFusedRingNode(node)) {
    return decompileFusedRing(node, indent, varName);
  }

  if (isMoleculeNode(node)) {
    return decompileMolecule(node, indent, varName);
  }

  throw new Error(`Unknown node type: ${node.type}`);
}

/**
 * Main decompile dispatcher - public API
 * Returns just the code string for backward compatibility
 */
export function decompile(node, options = {}) {
  const { indent = 0, varName = 'molecule' } = options;
  const indentStr = '  '.repeat(indent);

  const { code } = decompileNode(node, indentStr, varName);
  return code;
}
