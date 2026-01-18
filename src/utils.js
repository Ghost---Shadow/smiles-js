export function findUsedRingNumbers(smiles) {
  const used = new Set();
  let i = 0;

  while (i < smiles.length) {
    const char = smiles[i];

    if (char >= '0' && char <= '9') {
      used.add(char);
      i += 1;
    } else if (char === '%' && i + 2 < smiles.length) {
      const num = smiles.substring(i + 1, i + 3);
      used.add(num);
      i += 3;
    } else {
      i += 1;
    }
  }

  return used;
}

export function getNextRingNumber(smiles) {
  const used = findUsedRingNumbers(smiles);

  for (let i = 1; i <= 9; i += 1) {
    if (!used.has(String(i))) {
      return String(i);
    }
  }

  for (let i = 10; i <= 99; i += 1) {
    if (!used.has(String(i))) {
      return `%${i}`;
    }
  }

  throw new Error('Too many rings (exhausted ring numbers)');
}
