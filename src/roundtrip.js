/**
 * Round-Trip Validation Module
 *
 * Validates SMILES parsing fidelity by testing:
 * 1. First round-trip: parse(smiles).smiles === smiles
 * 2. Second round-trip: parse(parse(smiles).smiles).smiles === parse(smiles).smiles
 *
 * Provides automatic stabilization detection and user guidance.
 */

import { parse } from './parser.js';

/**
 * Round-trip validation result
 * @typedef {Object} RoundTripResult
 * @property {boolean} perfect - True if first round-trip is perfect
 * @property {boolean} stabilizes - True if second round-trip stabilizes
 * @property {string} original - Original input SMILES
 * @property {string} firstRoundTrip - SMILES after first parse
 * @property {string} secondRoundTrip - SMILES after second parse
 * @property {string} status - 'perfect' | 'stabilized' | 'unstable'
 * @property {string} recommendation - User-facing recommendation
 * @property {Object} ast - Parsed AST (from first parse)
 */

/**
 * Validate round-trip fidelity for a SMILES string
 *
 * @param {string} smiles - SMILES string to validate
 * @returns {RoundTripResult} Validation result
 *
 * @example
 * const result = validateRoundTrip('c1ccccc1');
 * if (result.perfect) {
 *   console.log('Perfect round-trip!');
 * } else if (result.stabilizes) {
 *   console.log('Use:', result.firstRoundTrip);
 * } else {
 *   console.log('Please file a bug report');
 * }
 */
export function validateRoundTrip(smiles) {
  // First parse
  const ast1 = parse(smiles);
  const firstRoundTrip = ast1.smiles;

  // Check if perfect on first round-trip
  if (firstRoundTrip === smiles) {
    return {
      perfect: true,
      stabilizes: true,
      original: smiles,
      firstRoundTrip,
      secondRoundTrip: firstRoundTrip,
      status: 'perfect',
      recommendation: 'SMILES round-trips perfectly. No action needed.',
      ast: ast1,
    };
  }

  // Second parse (test stabilization)
  const ast2 = parse(firstRoundTrip);
  const secondRoundTrip = ast2.smiles;

  // Check if stabilizes on second round-trip
  if (secondRoundTrip === firstRoundTrip) {
    return {
      perfect: false,
      stabilizes: true,
      original: smiles,
      firstRoundTrip,
      secondRoundTrip,
      status: 'stabilized',
      recommendation: `SMILES stabilizes on second parse. Use the normalized form: ${firstRoundTrip}`,
      ast: ast1,
    };
  }

  // Does not stabilize - potential bug
  return {
    perfect: false,
    stabilizes: false,
    original: smiles,
    firstRoundTrip,
    secondRoundTrip,
    status: 'unstable',
    recommendation: 'SMILES does not stabilize after two round-trips. Please file a bug report at https://github.com/Ghost---Shadow/smiles-js/issues',
    ast: ast1,
  };
}

/**
 * Parse SMILES with automatic round-trip validation
 * Logs warnings if round-trip is not perfect
 *
 * @param {string} smiles - SMILES string to parse
 * @param {Object} options - Options
 * @param {boolean} options.silent - Suppress warnings (default: false)
 * @param {boolean} options.strict - Throw error if not perfect (default: false)
 * @returns {Object} Parsed AST with validation metadata
 *
 * @example
 * // Basic usage - warns if imperfect
 * const mol = parseWithValidation('c1ccccc1');
 *
 * @example
 * // Silent mode
 * const mol = parseWithValidation('c1ccccc1', { silent: true });
 *
 * @example
 * // Strict mode - throws on imperfect round-trip
 * const mol = parseWithValidation('c1ccccc1', { strict: true });
 */
export function parseWithValidation(smiles, options = {}) {
  const { silent = false, strict = false } = options;

  const result = validateRoundTrip(smiles);

  // Perfect round-trip - no warnings needed
  if (result.perfect) {
    return result.ast;
  }

  // Stabilizes - warn user
  if (result.stabilizes) {
    if (!silent) {
      console.warn('⚠️  SMILES Round-Trip Notice:');
      console.warn(`   Input:      ${result.original}`);
      console.warn(`   Normalized: ${result.firstRoundTrip}`);
      console.warn('   Recommendation: Use the normalized form for consistent results.');
    }

    if (strict) {
      throw new Error(`Round-trip not perfect. Input: ${result.original}, Output: ${result.firstRoundTrip}`);
    }

    return result.ast;
  }

  // Does not stabilize - critical warning
  if (!silent) {
    console.error('❌ SMILES Round-Trip Error:');
    console.error(`   Input:  ${result.original}`);
    console.error(`   1st RT: ${result.firstRoundTrip}`);
    console.error(`   2nd RT: ${result.secondRoundTrip}`);
    console.error(`   ${result.recommendation}`);
  }

  if (strict) {
    throw new Error(`SMILES does not stabilize. ${result.recommendation}`);
  }

  return result.ast;
}

/**
 * Check if SMILES round-trips perfectly (simple boolean check)
 *
 * @param {string} smiles - SMILES string to check
 * @returns {boolean} True if perfect round-trip
 *
 * @example
 * if (isValidRoundTrip('c1ccccc1')) {
 *   console.log('Perfect!');
 * }
 */
export function isValidRoundTrip(smiles) {
  const result = validateRoundTrip(smiles);
  return result.perfect;
}

/**
 * Get normalized SMILES (stabilized form after round-trip)
 *
 * @param {string} smiles - SMILES string to normalize
 * @returns {string} Normalized SMILES
 *
 * @example
 * const normalized = normalize('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1');
 * console.log(normalized); // Returns stabilized form
 */
export function normalize(smiles) {
  const result = validateRoundTrip(smiles);
  return result.firstRoundTrip;
}

/**
 * Check if SMILES stabilizes (becomes consistent after second parse)
 *
 * @param {string} smiles - SMILES string to check
 * @returns {boolean} True if stabilizes
 *
 * @example
 * if (stabilizes('COc1ccc2nc(S(=O)Cc3ncc(C)c(OC)c3C)[nH]c2c1')) {
 *   console.log('Use normalized form');
 * }
 */
export function stabilizes(smiles) {
  const result = validateRoundTrip(smiles);
  return result.stabilizes;
}
