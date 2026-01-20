import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import { Linear } from './linear.js';
import { isValidSMILES } from './test-utils.js';

describe('Linear', () => {
  test('creates simple carbon chain', async () => {
    const chain = Linear('CCC');
    assert.strictEqual(chain.smiles, 'CCC');
    assert.deepStrictEqual(chain.meta.toObject(), {
      type: 'linear',
      atoms: 'CCC',
    });
    assert.ok(await isValidSMILES(chain.smiles));
  });

  test('creates branched structure', async () => {
    const branched = Linear('CC(C)C');
    assert.strictEqual(branched.smiles, 'CC(C)C');
    assert.deepStrictEqual(branched.meta.toObject(), {
      type: 'linear',
      atoms: 'CCC',
      attachments: {
        2: {
          type: 'linear',
          atoms: 'C',
        },
      },
    });
    assert.ok(await isValidSMILES(branched.smiles));
  });

  test('throws error for empty string', () => {
    assert.throws(
      () => Linear(''),
      /Linear requires a non-empty SMILES string/,
    );
  });

  test('throws error for invalid SMILES', () => {
    assert.throws(
      () => Linear('X@#$'),
    );
  });
});

describe('Linear.concat method', () => {
  test('concatenates two simple chains', async () => {
    const chain1 = Linear('CC');
    const chain2 = Linear('CC');
    const result = chain1.concat(chain2);
    assert.strictEqual(result.smiles, 'CCCC');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CCCC',
    });
    assert.ok(await isValidSMILES(result.smiles));
  });

  test('concatenates multiple times', async () => {
    const c = Linear('C');
    const result = c.concat('C').concat('C').concat('O');
    assert.strictEqual(result.smiles, 'CCCO');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CCCO',
    });
    assert.ok(await isValidSMILES(result.smiles));
  });
});

describe('Linear.attach method', () => {
  test('attaches branch to linear chain', async () => {
    const chain = Linear('CC');
    const branch = Linear('O');
    const result = chain.attach(branch);
    assert.strictEqual(result.smiles, 'CC(O)');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CC',
      attachments: {
        2: {
          type: 'linear',
          atoms: 'O',
        },
      },
    });
    assert.ok(await isValidSMILES(result.smiles));
  });

  test('attaches at specific position', async () => {
    const chain = Linear('CCC');
    const branch = Linear('O');
    const result = chain.attachAt(2, branch);
    assert.strictEqual(result.smiles, 'CC(O)C');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CCC',
      attachments: {
        2: {
          type: 'linear',
          atoms: 'O',
        },
      },
    });
    assert.ok(await isValidSMILES(result.smiles));
  });

  test('attaches multiple branches', async () => {
    const chain = Linear('CC');
    const result = chain.attachAt(1, 'O').attachAt(2, 'N');
    assert.strictEqual(result.smiles, 'C(O)C(N)');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CC',
      attachments: {
        1: {
          type: 'linear',
          atoms: 'O',
        },
        2: {
          type: 'linear',
          atoms: 'N',
        },
      },
    });
    assert.ok(await isValidSMILES(result.smiles));
  });
});

describe('Linear static methods', () => {
  test('Linear.concat static method', async () => {
    const result = Linear.concat('CC', 'O');
    assert.strictEqual(result.smiles, 'CCO');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CCO',
    });
    assert.ok(await isValidSMILES(result.smiles));
  });

  test('Linear.concat with Linear instances', async () => {
    const chain1 = Linear('CC');
    const chain2 = Linear('O');
    const result = Linear.concat(chain1, chain2);
    assert.strictEqual(result.smiles, 'CCO');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CCO',
    });
    assert.ok(await isValidSMILES(result.smiles));
  });
});

describe('Linear edge cases', () => {
  test('handles isotopes', async () => {
    const structure = Linear('[13C]CC');
    assert.strictEqual(structure.smiles, '[13C]CC');
    assert.deepStrictEqual(structure.meta.toObject(), {
      type: 'linear',
      atoms: '[13C]CC',
    });
    assert.ok(await isValidSMILES(structure.smiles));
  });

  test('handles charges', async () => {
    const structure = Linear('C[NH3+]');
    assert.strictEqual(structure.smiles, 'C[NH3+]');
    assert.deepStrictEqual(structure.meta.toObject(), {
      type: 'linear',
      atoms: 'C[NH3+]',
    });
    assert.ok(await isValidSMILES(structure.smiles));
  });

  test('handles stereochemistry', async () => {
    const structure = Linear('C[C@H](O)N');
    assert.strictEqual(structure.smiles, 'C[C@H](O)N');
    assert.deepStrictEqual(structure.meta.toObject(), {
      type: 'linear',
      atoms: 'C[C@H](O)N',
    });
    assert.ok(await isValidSMILES(structure.smiles));
  });

  test('handles double bonds', async () => {
    const structure = Linear('C=C');
    assert.strictEqual(structure.smiles, 'C=C');
    assert.deepStrictEqual(structure.meta.toObject(), {
      type: 'linear',
      atoms: 'C=C',
    });
    assert.ok(await isValidSMILES(structure.smiles));
  });

  test('handles triple bonds', async () => {
    const structure = Linear('C#C');
    assert.strictEqual(structure.smiles, 'C#C');
    assert.deepStrictEqual(structure.meta.toObject(), {
      type: 'linear',
      atoms: 'C#C',
    });
    assert.ok(await isValidSMILES(structure.smiles));
  });
});

describe('Linear.meta', () => {
  test('stores meta as Meta instance', () => {
    const chain = Linear('CCC');
    assert.deepStrictEqual(chain.meta.toObject(), {
      type: 'linear',
      atoms: 'CCC',
    });
  });

  test('meta.toObject() returns plain object', () => {
    const chain = Linear('CCC');
    const obj = chain.meta.toObject();
    assert.deepStrictEqual(obj, {
      type: 'linear',
      atoms: 'CCC',
    });
  });

  test('tracks attachments in meta', () => {
    const chain = Linear('CC');
    const result = chain.attachAt(1, 'O');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CC',
      attachments: {
        1: {
          type: 'linear',
          atoms: 'O',
        },
      },
    });
  });

  test('handles nested branching structure', async () => {
    const inner = Linear('CC').attachAt(1, 'CC');
    const outer = Linear('CC').attachAt(1, inner).attachAt(2, 'CC');
    const result = outer.concat('CC');
    assert.deepStrictEqual(result.meta.toObject(), {
      type: 'linear',
      atoms: 'CCCC',
      attachments: {
        1: {
          type: 'linear',
          atoms: 'CC',
          attachments: {
            1: {
              type: 'linear',
              atoms: 'CC',
            },
          },
        },
        2: {
          type: 'linear',
          atoms: 'CC',
        },
      },
    });
    assert.strictEqual(result.smiles, 'C(C(CC)C)C(CC)CC');
    assert.ok(await isValidSMILES(result.smiles));
  });
});
