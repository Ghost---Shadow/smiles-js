import { getElementSymbol } from './utils.js';

/**
 * Build MOL block from RDKit JSON meta
 * @param {Object} meta - RDKit JSON meta
 * @returns {string} MOL block format (V2000)
 */
export function buildMolBlockFromMeta(meta) {
  const mol = meta.molecules[0];
  const { atoms, bonds } = mol;
  const defaults = meta.defaults.atom;

  // Header lines
  const lines = [];
  lines.push(''); // Molecule name (empty)
  lines.push('  Generated from RDKit JSON'); // Program info
  lines.push(''); // Comment line

  // Counts line: aaabbblllfffcccsssxxxrrrpppiiimmmvvvvvv
  const atomCount = atoms.length.toString().padStart(3);
  const bondCount = bonds.length.toString().padStart(3);
  lines.push(`${atomCount}${bondCount}  0  0  0  0  0  0  0  0999 V2000`);

  // Atom block
  atoms.forEach((atom, i) => {
    const z = atom.z !== undefined ? atom.z : defaults.z;
    const symbol = getElementSymbol(z).padEnd(3);

    // Use dummy linear coordinates (valid but not geometrically accurate)
    // Users can generate proper 2D coords by: mol.get_smiles() then rdkit.get_mol(smiles).get_molblock()
    const x = '0.0000'.padStart(10);
    const y = '0.0000'.padStart(10);
    const zCoord = '0.0000'.padStart(10);

    // Atom line: xxxxx.xxxxyyyyy.yyyyzzzzz.zzzz aaaddcccssshhhbbbvvvHHHrrriiimmmnnneee
    lines.push(`${x}${y}${zCoord} ${symbol} 0  0  0  0  0  0  0  0  0  0  0  0`);
  });

  // Bond block
  bonds.forEach((bond) => {
    const atom1 = (bond.atoms[0] + 1).toString().padStart(3); // 1-indexed
    const atom2 = (bond.atoms[1] + 1).toString().padStart(3);
    const bondType = bond.bo !== undefined ? bond.bo : meta.defaults.bond.bo;
    const type = bondType.toString().padStart(3);

    // Bond line: 111222tttsssxxxrrrccc
    lines.push(`${atom1}${atom2}${type}  0`);
  });

  // End line
  lines.push('M  END');

  return lines.join('\n');
}
