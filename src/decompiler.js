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
 * Counter-based variable name generator
 */
function createCounter(prefix) {
  let count = 0;
  return () => {
    count += 1;
    return `${prefix}${count}`;
  };
}

/**
 * Decompile a Ring node
 */
function decompileRing(ring, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

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

  const optionsStr = Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  lines.push(`${indent}const ${varName} = Ring({ ${optionsStr} });`);

  let currentVar = varName;

  // Add substitutions
  if (Object.keys(ring.substitutions).length > 0) {
    Object.entries(ring.substitutions).forEach(([pos, atom]) => {
      const newVar = nextVar();
      lines.push(`${indent}const ${newVar} = ${currentVar}.substitute(${pos}, '${atom}');`);
      currentVar = newVar;
    });
  }

  // Add attachments
  if (Object.keys(ring.attachments).length > 0) {
    Object.entries(ring.attachments).forEach(([pos, attachmentList]) => {
      attachmentList.forEach((attachment) => {
        // eslint-disable-next-line no-use-before-define
        const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, nextVar);
        lines.push(aCode);

        const newVar = nextVar();
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Decompile a Linear node
 */
function decompileLinear(linear, indent, nextVar) {
  const lines = [];
  const varName = nextVar();

  const atomsStr = linear.atoms.map((a) => `'${a}'`).join(', ');

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
      attachmentList.forEach((attachment) => {
        // eslint-disable-next-line no-use-before-define
        const { code: aCode, finalVar: aFinalVar } = decompileNode(attachment, indent, nextVar);
        lines.push(aCode);

        const newVar = nextVar();
        lines.push(`${indent}const ${newVar} = ${currentVar}.attach(${aFinalVar}, ${pos});`);
        currentVar = newVar;
      });
    });
  }

  return { code: lines.join('\n'), finalVar: currentVar };
}

/**
 * Decompile a FusedRing node
 */
function decompileFusedRing(fusedRing, indent, nextVar) {
  const lines = [];
  const ringFinalVars = [];

  // Create individual rings with their substitutions and attachments
  fusedRing.rings.forEach((ring) => {
    const { code: ringCode, finalVar: ringFinalVar } = decompileRing(ring, indent, nextVar);
    lines.push(ringCode);
    ringFinalVars.push(ringFinalVar);
  });

  // Fuse rings together
  const finalVar = nextVar();
  if (fusedRing.rings.length === 2) {
    const ring1 = ringFinalVars[0];
    const ring2 = ringFinalVars[1];
    const { offset } = fusedRing.rings[1];
    lines.push(`${indent}const ${finalVar} = ${ring1}.fuse(${ring2}, ${offset});`);
  } else {
    const ringsStr = ringFinalVars.join(', ');
    lines.push(`${indent}const ${finalVar} = FusedRing([${ringsStr}]);`);
  }

  return { code: lines.join('\n'), finalVar };
}

/**
 * Decompile a Molecule node
 */
function decompileMolecule(molecule, indent, nextVar) {
  const lines = [];
  const componentFinalVars = [];

  // Create components
  molecule.components.forEach((component) => {
    // eslint-disable-next-line no-use-before-define
    const { code: componentCode, finalVar } = decompileNode(component, indent, nextVar);
    lines.push(componentCode);
    componentFinalVars.push(finalVar);
  });

  // Create molecule using the final variable names
  const finalVarName = nextVar();
  const componentsStr = componentFinalVars.join(', ');
  lines.push(`${indent}const ${finalVarName} = Molecule([${componentsStr}]);`);

  return { code: lines.join('\n'), finalVar: finalVarName };
}

/**
 * Internal dispatcher
 */
function decompileNode(node, indent, nextVar) {
  if (isRingNode(node)) {
    return decompileRing(node, indent, nextVar);
  }

  if (isLinearNode(node)) {
    return decompileLinear(node, indent, nextVar);
  }

  if (isFusedRingNode(node)) {
    return decompileFusedRing(node, indent, nextVar);
  }

  if (isMoleculeNode(node)) {
    return decompileMolecule(node, indent, nextVar);
  }

  throw new Error(`Unknown node type: ${node.type}`);
}

/**
 * Main decompile dispatcher - public API
 */
export function decompile(node, options = {}) {
  const { indent = 0, varName = 'v' } = options;
  const indentStr = '  '.repeat(indent);
  const nextVar = createCounter(varName);

  const { code } = decompileNode(node, indentStr, nextVar);
  return code;
}
