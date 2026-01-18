export function validateSMILES(smiles) {
  const errors = [];
  let branchCount = 0;
  const ringNumbers = new Set();
  const openRings = new Set();

  for (let i = 0; i < smiles.length; i++) {
    const char = smiles[i];

    if (char === '[') {
      // Skip over bracketed atoms (e.g., [NH4+], [O-], [13C])
      const closingBracket = smiles.indexOf(']', i);
      if (closingBracket === -1) {
        return { valid: false, error: 'Unclosed bracket' };
      }
      i = closingBracket;
      continue;
    }

    if (char === '(') {
      branchCount++;
    } else if (char === ')') {
      branchCount--;
      if (branchCount < 0) {
        return { valid: false, error: 'Unmatched closing branch' };
      }
    } else if (char >= '0' && char <= '9') {
      const num = char;
      if (openRings.has(num)) {
        openRings.delete(num);
      } else {
        openRings.add(num);
      }
    } else if (char === '%') {
      if (i + 2 < smiles.length) {
        const num = smiles.substring(i + 1, i + 3);
        if (openRings.has(num)) {
          openRings.delete(num);
        } else {
          openRings.add(num);
        }
        i += 2;
      }
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
