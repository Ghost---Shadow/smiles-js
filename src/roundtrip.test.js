/**
 * Unit tests for roundtrip.js
 */

import {
  describe, it, expect, spyOn,
} from 'bun:test';
import {
  validateRoundTrip,
  parseWithValidation,
  isValidRoundTrip,
  normalize,
  stabilizes,
} from './roundtrip.js';
import * as parserModule from './parser/index.js';

describe('validateRoundTrip', () => {
  it('should return perfect status for perfect round-trip', () => {
    const smiles = 'CCC';
    const result = validateRoundTrip(smiles);
    expect(result).toEqual({
      perfect: true,
      stabilizes: true,
      original: smiles,
      firstRoundTrip: smiles,
      secondRoundTrip: smiles,
      status: 'perfect',
      recommendation: 'SMILES round-trips perfectly. No action needed.',
      ast: result.ast,
    });
  });

  it('should handle perfect round-trip for rings', () => {
    const smiles = 'C1CC1';
    const result = validateRoundTrip(smiles);
    expect(result.perfect).toBe(true);
    expect(result.stabilizes).toBe(true);
    expect(result.status).toBe('perfect');
  });

  it('should detect aromatic rings as perfect', () => {
    const smiles = 'c1ccccc1';
    const result = validateRoundTrip(smiles);
    expect(result.perfect).toBe(true);
    expect(result.stabilizes).toBe(true);
    expect(result.status).toBe('perfect');
  });

  it('should return stabilized status when second parse equals first but differs from original', () => {
    const spy = spyOn(parserModule, 'parse').mockImplementation(() => ({ smiles: 'NORMALIZED', type: 'linear' }));

    const result = validateRoundTrip('ORIGINAL');

    expect(result.perfect).toBe(false);
    expect(result.stabilizes).toBe(true);
    expect(result.status).toBe('stabilized');
    expect(result.original).toBe('ORIGINAL');
    expect(result.firstRoundTrip).toBe('NORMALIZED');
    expect(result.secondRoundTrip).toBe('NORMALIZED');
    expect(result.recommendation).toBe('SMILES stabilizes on second parse. Use the normalized form: NORMALIZED');

    spy.mockRestore();
  });

  it('should return unstable status when second parse differs from first', () => {
    let callCount = 0;
    const spy = spyOn(parserModule, 'parse').mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return { smiles: 'FIRST', type: 'linear' };
      }
      return { smiles: 'SECOND', type: 'linear' };
    });

    const result = validateRoundTrip('ORIGINAL');

    expect(result.perfect).toBe(false);
    expect(result.stabilizes).toBe(false);
    expect(result.status).toBe('unstable');
    expect(result.original).toBe('ORIGINAL');
    expect(result.firstRoundTrip).toBe('FIRST');
    expect(result.secondRoundTrip).toBe('SECOND');
    expect(result.recommendation).toBe('SMILES does not stabilize after two round-trips. Please file a bug report at https://github.com/Ghost---Shadow/smiles-js/issues');

    spy.mockRestore();
  });
});

describe('parseWithValidation', () => {
  it('should return AST for perfect round-trip without warnings', () => {
    const smiles = 'CCC';
    const ast = parseWithValidation(smiles);
    expect(ast.smiles).toBe(smiles);
  });

  it('should return AST for perfect round-trip in silent mode', () => {
    const smiles = 'C1CC1';
    const ast = parseWithValidation(smiles, { silent: true });
    expect(ast.smiles).toBe('C1CC1');
  });

  it('should log warning for stabilized round-trip when not silent', () => {
    const warnings = [];
    const logger = {
      warn: (...args) => { warnings.push(args.join(' ')); },
      error: (...args) => { warnings.push(args.join(' ')); },
    };

    const spy = spyOn(parserModule, 'parse').mockImplementation(() => ({ smiles: 'NORMALIZED', type: 'linear' }));

    const ast = parseWithValidation('ORIGINAL', { logger });

    expect(warnings.length).toBe(4);
    expect(warnings[0]).toBe('⚠️  SMILES Round-Trip Notice:');
    expect(warnings[1]).toBe('   Input:      ORIGINAL');
    expect(warnings[2]).toBe('   Normalized: NORMALIZED');
    expect(warnings[3]).toBe('   Recommendation: Use the normalized form for consistent results.');
    expect(ast.smiles).toBe('NORMALIZED');

    spy.mockRestore();
  });

  it('should throw in strict mode for stabilized round-trip', () => {
    const spy = spyOn(parserModule, 'parse').mockImplementation(() => ({ smiles: 'NORMALIZED', type: 'linear' }));

    expect(() => {
      parseWithValidation('ORIGINAL', { strict: true });
    }).toThrow('Round-trip not perfect. Input: ORIGINAL, Output: NORMALIZED');

    spy.mockRestore();
  });

  it('should log error for unstable round-trip when not silent', () => {
    let callCount = 0;
    const errors = [];
    const logger = {
      warn: (...args) => { errors.push(args.join(' ')); },
      error: (...args) => { errors.push(args.join(' ')); },
    };

    const spy = spyOn(parserModule, 'parse').mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return { smiles: 'FIRST', type: 'linear' };
      }
      return { smiles: 'SECOND', type: 'linear' };
    });

    const ast = parseWithValidation('ORIGINAL', { logger });

    expect(errors.length).toBe(5);
    expect(errors[0]).toBe('❌ SMILES Round-Trip Error:');
    expect(errors[1]).toBe('   Input:  ORIGINAL');
    expect(errors[2]).toBe('   1st RT: FIRST');
    expect(errors[3]).toBe('   2nd RT: SECOND');
    expect(errors[4]).toBe('   SMILES does not stabilize after two round-trips. Please file a bug report at https://github.com/Ghost---Shadow/smiles-js/issues');
    expect(ast.smiles).toBe('FIRST');

    spy.mockRestore();
  });

  it('should throw in strict mode for unstable round-trip', () => {
    let callCount = 0;

    const spy = spyOn(parserModule, 'parse').mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return { smiles: 'FIRST', type: 'linear' };
      }
      return { smiles: 'SECOND', type: 'linear' };
    });

    expect(() => {
      parseWithValidation('ORIGINAL', { strict: true });
    }).toThrow('SMILES does not stabilize');

    spy.mockRestore();
  });
});

describe('isValidRoundTrip', () => {
  it('should return true for perfect round-trip', () => {
    const smiles = 'CCC';
    expect(isValidRoundTrip(smiles)).toBe(true);
  });

  it('should return true for ring round-trip', () => {
    const smiles = 'C1CC1';
    expect(isValidRoundTrip(smiles)).toBe(true);
  });

  it('should return false for non-perfect round-trip', () => {
    const spy = spyOn(parserModule, 'parse').mockImplementation(() => ({ smiles: 'DIFFERENT', type: 'linear' }));

    expect(isValidRoundTrip('ORIGINAL')).toBe(false);

    spy.mockRestore();
  });
});

describe('normalize', () => {
  it('should return same SMILES for perfect round-trip', () => {
    const smiles = 'CCC';
    expect(normalize(smiles)).toBe(smiles);
  });

  it('should return normalized form for stabilized round-trip', () => {
    const smiles = 'C1CC1';
    const normalized = normalize(smiles);
    expect(normalized).toBe('C1CC1');
  });
});

describe('stabilizes', () => {
  it('should return true for perfect round-trip', () => {
    const smiles = 'CCC';
    expect(stabilizes(smiles)).toBe(true);
  });

  it('should return true for stabilized round-trip', () => {
    const smiles = 'C1CC1';
    expect(stabilizes(smiles)).toBe(true);
  });
});
