export function validateSMILES(smiles) {
  let branchCount = 0;
  const openRings = new Set();

  let i = 0;
  while (i < smiles.length) {
    const char = smiles[i];

    if (char === '[') {
      // Skip over bracketed atoms (e.g., [NH4+], [O-], [13C])
      const closingBracket = smiles.indexOf(']', i);
      if (closingBracket === -1) {
        return { valid: false, error: 'Unclosed bracket' };
      }
      i = closingBracket + 1;
    } else if (char === '(') {
      branchCount += 1;
      i += 1;
    } else if (char === ')') {
      branchCount -= 1;
      if (branchCount < 0) {
        return { valid: false, error: 'Unmatched closing branch' };
      }
      i += 1;
    } else if (char >= '0' && char <= '9') {
      const num = char;
      if (openRings.has(num)) {
        openRings.delete(num);
      } else {
        openRings.add(num);
      }
      i += 1;
    } else if (char === '%') {
      if (i + 2 < smiles.length) {
        const num = smiles.substring(i + 1, i + 3);
        if (openRings.has(num)) {
          openRings.delete(num);
        } else {
          openRings.add(num);
        }
        i += 3;
      } else {
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  if (branchCount > 0) {
    return { valid: false, error: 'Unclosed branch' };
  }

  if (openRings.size > 0) {
    return { valid: false, error: 'Invalid ring closure' };
  }

  return { valid: true };
}
