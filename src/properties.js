const ATOMIC_WEIGHTS = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  Br: 79.904,
  I: 126.90,
  B: 10.81,
  Si: 28.085,
  Se: 78.971,
  Na: 22.990,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Zn: 65.38,
  Mg: 24.305,
};

function parseAtom(smiles, index) {
  if (smiles[index] === '[') {
    const end = smiles.indexOf(']', index);
    if (end === -1) return null;
    const bracketContent = smiles.substring(index + 1, end);

    let isotope = '';
    let atom = '';
    let i = 0;

    while (i < bracketContent.length && bracketContent[i] >= '0' && bracketContent[i] <= '9') {
      isotope += bracketContent[i];
      i += 1;
    }

    if (i < bracketContent.length && bracketContent[i] >= 'A' && bracketContent[i] <= 'Z') {
      atom = bracketContent[i];
      i += 1;
      if (i < bracketContent.length && bracketContent[i] >= 'a' && bracketContent[i] <= 'z') {
        atom += bracketContent[i];
      }
    } else if (i < bracketContent.length && bracketContent[i] >= 'a' && bracketContent[i] <= 'z') {
      atom = bracketContent[i];
    }

    return { atom, length: end - index + 1 };
  }

  if (smiles[index] >= 'A' && smiles[index] <= 'Z') {
    let atom = smiles[index];
    if (index + 1 < smiles.length && smiles[index + 1] >= 'a' && smiles[index + 1] <= 'z') {
      atom += smiles[index + 1];
      return { atom, length: 2 };
    }
    return { atom, length: 1 };
  }

  if (smiles[index] >= 'a' && smiles[index] <= 'z') {
    return { atom: smiles[index].toUpperCase(), length: 1 };
  }

  return null;
}

export function countAtoms(smiles) {
  let count = 0;
  let i = 0;

  while (i < smiles.length) {
    const char = smiles[i];

    if (char === '(' || char === ')' || char === '=' || char === '#'
        || char === '/' || char === '\\' || char === '@' || char === '+' || char === '-') {
      i += 1;
      continue;
    }

    if (char >= '0' && char <= '9') {
      i += 1;
      continue;
    }

    if (char === '%') {
      i += 3;
      continue;
    }

    const parsed = parseAtom(smiles, i);
    if (parsed) {
      count += 1;
      i += parsed.length;
    } else {
      i += 1;
    }
  }

  return count;
}

export function countRings(smiles) {
  const ringNumbers = new Set();
  let count = 0;
  let i = 0;

  while (i < smiles.length) {
    const char = smiles[i];

    if (char >= '0' && char <= '9') {
      if (ringNumbers.has(char)) {
        count += 1;
        ringNumbers.delete(char);
      } else {
        ringNumbers.add(char);
      }
      i += 1;
    } else if (char === '%' && i + 2 < smiles.length) {
      const num = smiles.substring(i + 1, i + 3);
      if (ringNumbers.has(num)) {
        count += 1;
        ringNumbers.delete(num);
      } else {
        ringNumbers.add(num);
      }
      i += 3;
    } else {
      i += 1;
    }
  }

  return count;
}

export function calculateFormula(smiles) {
  const elementCounts = {};
  let i = 0;

  while (i < smiles.length) {
    const char = smiles[i];

    if (char === '(' || char === ')' || char === '=' || char === '#'
        || char === '/' || char === '\\' || char === '@' || char === '+' || char === '-') {
      i += 1;
      continue;
    }

    if (char >= '0' && char <= '9') {
      i += 1;
      continue;
    }

    if (char === '%') {
      i += 3;
      continue;
    }

    const parsed = parseAtom(smiles, i);
    if (parsed && parsed.atom) {
      const element = parsed.atom;
      elementCounts[element] = (elementCounts[element] || 0) + 1;
      i += parsed.length;
    } else {
      i += 1;
    }
  }

  const implicitHydrogens = calculateImplicitHydrogens(smiles, elementCounts);
  if (implicitHydrogens > 0) {
    elementCounts.H = (elementCounts.H || 0) + implicitHydrogens;
  }

  const elements = Object.keys(elementCounts).sort();

  const hillOrder = (a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return -1;
    if (b === 'H') return 1;
    return a.localeCompare(b);
  };

  elements.sort(hillOrder);

  return elements.map((e) => {
    const count = elementCounts[e];
    return count === 1 ? e : `${e}${count}`;
  }).join('');
}

function calculateImplicitHydrogens(smiles, elementCounts) {
  let totalHydrogens = 0;

  for (const [element, count] of Object.entries(elementCounts)) {
    if (element === 'C') {
      totalHydrogens += count * 2 + 2;
    }
  }

  const bonds = (smiles.match(/=/g) || []).length + (smiles.match(/#/g) || []).length * 2;
  totalHydrogens -= bonds * 2;

  const explicitHCount = elementCounts.H || 0;
  totalHydrogens -= explicitHCount;

  return Math.max(0, totalHydrogens);
}

export function calculateMolecularWeight(smiles) {
  const formula = calculateFormula(smiles);
  let weight = 0;
  let i = 0;

  while (i < formula.length) {
    let element = formula[i];
    i += 1;

    if (i < formula.length && formula[i] >= 'a' && formula[i] <= 'z') {
      element += formula[i];
      i += 1;
    }

    let count = '';
    while (i < formula.length && formula[i] >= '0' && formula[i] <= '9') {
      count += formula[i];
      i += 1;
    }

    const atomCount = count ? parseInt(count) : 1;
    weight += (ATOMIC_WEIGHTS[element] || 0) * atomCount;
  }

  return Math.round(weight * 100) / 100;
}
