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

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge into target
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const result = { ...target };

  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue
      && typeof sourceValue === 'object'
      && !Array.isArray(sourceValue)
      && targetValue
      && typeof targetValue === 'object'
      && !Array.isArray(targetValue)
    ) {
      // Both are plain objects, merge recursively
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      // Primitive, array, or null - just overwrite
      result[key] = sourceValue;
    }
  });

  return result;
}
