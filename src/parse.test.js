import { test, describe } from 'bun:test';
import assert from 'bun:assert';
import {
  handleAtoms, handleAttachment, handleRings, handleLargeRings,
} from './parse.js';
import { FusedRing } from './fused-ring.js';
import { isValidSMILES } from './test-utils.js';

describe('handleAtoms', () => {
  test('adds an atom to the context', () => {
    const context = {
      atoms: [],
      char: 'c',
      atomIndex: 0,
    };

    handleAtoms(context);

    assert.strictEqual(context.atoms.length, 1);
    assert.deepStrictEqual(context.atoms[0], {
      type: 'c',
      position: 0,
      attachments: [],
    });
    assert.strictEqual(context.atomIndex, 1);
  });

  test('increments atomIndex', () => {
    const context = {
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      char: 'n',
      atomIndex: 1,
    };

    handleAtoms(context);

    assert.strictEqual(context.atoms.length, 2);
    assert.strictEqual(context.atoms[1].type, 'n');
    assert.strictEqual(context.atoms[1].position, 1);
    assert.strictEqual(context.atomIndex, 2);
  });

  test('handles uppercase atoms', () => {
    const context = {
      atoms: [],
      char: 'N',
      atomIndex: 0,
    };

    handleAtoms(context);

    assert.strictEqual(context.atoms[0].type, 'N');
  });
});

describe('handleAttachment', () => {
  test('extracts simple attachment content', () => {
    const context = {
      smiles: 'c(C)cc',
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      i: 1,
    };

    handleAttachment(context);

    assert.strictEqual(context.atoms[0].attachments.length, 1);
    assert.strictEqual(context.atoms[0].attachments[0], 'C');
    assert.strictEqual(context.i, 3); // Should skip past closing paren
  });

  test('handles nested parentheses', () => {
    const context = {
      smiles: 'c(C(C)C)cc',
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      i: 1,
    };

    handleAttachment(context);

    assert.strictEqual(context.atoms[0].attachments.length, 1);
    assert.strictEqual(context.atoms[0].attachments[0], 'C(C)C');
    assert.strictEqual(context.i, 7);
  });

  test('handles attachment with ring notation', () => {
    const context = {
      smiles: 'c(c1ccccc1)cc',
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      i: 1,
    };

    handleAttachment(context);

    assert.strictEqual(context.atoms[0].attachments[0], 'c1ccccc1');
  });

  test('does nothing if no atoms exist', () => {
    const context = {
      smiles: '(C)cc',
      atoms: [],
      i: 0,
    };

    handleAttachment(context);

    assert.strictEqual(context.atoms.length, 0);
  });
});

describe('handleRings', () => {
  test('opens a ring on first encounter', () => {
    const context = {
      char: '1',
      ringStacks: {},
      rings: [],
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      atomIndex: 1,
    };

    handleRings(context);

    assert.ok(context.ringStacks[1]);
    assert.strictEqual(context.ringStacks[1].length, 1);
    assert.strictEqual(context.ringStacks[1][0], 0); // Position of last atom
    assert.strictEqual(context.rings.length, 0); // Ring not closed yet
  });

  test('closes a ring on second encounter', () => {
    const context = {
      char: '1',
      ringStacks: {
        1: [0], // Ring 1 opened at position 0
      },
      rings: [],
      atoms: [
        { type: 'c', position: 0, attachments: [] },
        { type: 'c', position: 1, attachments: [] },
        { type: 'c', position: 2, attachments: [] },
        { type: 'c', position: 3, attachments: [] },
        { type: 'c', position: 4, attachments: [] },
        { type: 'c', position: 5, attachments: [] },
      ],
      atomIndex: 6,
    };

    handleRings(context);

    assert.strictEqual(context.rings.length, 1);
    assert.strictEqual(context.rings[0].type, 'c');
    assert.strictEqual(context.rings[0].size, 6);
    assert.strictEqual(context.rings[0].ringNumber, 1);
    assert.strictEqual(context.ringStacks[1], undefined); // Stack cleaned up
  });

  test('detects substitutions when closing ring', () => {
    const context = {
      char: '1',
      ringStacks: {
        1: [0],
      },
      rings: [],
      atoms: [
        { type: 'c', position: 0, attachments: [] },
        { type: 'n', position: 1, attachments: [] }, // Different from base type
        { type: 'c', position: 2, attachments: [] },
        { type: 'n', position: 3, attachments: [] },
        { type: 'c', position: 4, attachments: [] },
        { type: 'n', position: 5, attachments: [] },
      ],
      atomIndex: 6,
    };

    handleRings(context);

    assert.deepStrictEqual(context.rings[0].substitutions, {
      2: 'n',
      4: 'n',
      6: 'n',
    });
  });

  test('collects attachments when closing ring', () => {
    const context = {
      char: '1',
      ringStacks: {
        1: [0],
      },
      rings: [],
      atoms: [
        { type: 'c', position: 0, attachments: [] },
        { type: 'c', position: 1, attachments: ['C'] }, // Has attachment
        { type: 'c', position: 2, attachments: [] },
        { type: 'c', position: 3, attachments: [] },
        { type: 'c', position: 4, attachments: ['C'] }, // Has attachment
        { type: 'c', position: 5, attachments: [] },
      ],
      atomIndex: 6,
    };

    handleRings(context);

    assert.deepStrictEqual(context.rings[0].attachments, {
      2: 'C',
      5: 'C',
    });
  });

  test('handles multiple different rings', () => {
    const context = {
      char: '2',
      ringStacks: {
        1: [0], // Ring 1 already open
      },
      rings: [],
      atoms: [
        { type: 'c', position: 0, attachments: [] },
        { type: 'c', position: 1, attachments: [] },
      ],
      atomIndex: 2,
    };

    handleRings(context);

    assert.strictEqual(context.ringStacks[2].length, 1);
    assert.strictEqual(context.ringStacks[2][0], 1);
    assert.strictEqual(context.rings.length, 0); // Neither ring closed yet
  });

  test('calculates offset for fused rings', () => {
    const context = {
      char: '2',
      ringStacks: {
        2: [3], // Ring 2 opened at position 3
      },
      rings: [
        {
          type: 'c',
          size: 6,
          offset: 0,
          ringNumber: 1,
          substitutions: {},
          attachments: {},
          startPos: 0,
        },
      ],
      atoms: [
        { type: 'c', position: 0, attachments: [] },
        { type: 'c', position: 1, attachments: [] },
        { type: 'c', position: 2, attachments: [] },
        { type: 'c', position: 3, attachments: [] },
        { type: 'c', position: 4, attachments: [] },
        { type: 'c', position: 5, attachments: [] },
        { type: 'c', position: 6, attachments: [] },
        { type: 'c', position: 7, attachments: [] },
        { type: 'c', position: 8, attachments: [] },
      ],
      atomIndex: 9,
    };

    handleRings(context);

    assert.strictEqual(context.rings.length, 2);
    assert.strictEqual(context.rings[1].offset, 3); // Offset is startPos for fused rings
  });
});

describe('handleLargeRings', () => {
  test('handles 2-digit ring numbers', () => {
    const context = {
      smiles: '%10c',
      ringStacks: {},
      rings: [],
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      atomIndex: 1,
      i: 0,
      char: '%',
    };

    handleLargeRings(context);

    assert.strictEqual(context.char, '10');
    assert.ok(context.ringStacks[10]);
    assert.strictEqual(context.ringStacks[10][0], 0);
    assert.strictEqual(context.i, 2); // Should skip to position 2
  });

  test('handles 3-digit ring numbers', () => {
    const context = {
      smiles: '%100c',
      ringStacks: {},
      rings: [],
      atoms: [{ type: 'c', position: 0, attachments: [] }],
      atomIndex: 1,
      i: 0,
      char: '%',
    };

    handleLargeRings(context);

    assert.strictEqual(context.char, '100');
    assert.ok(context.ringStacks[100]);
    assert.strictEqual(context.ringStacks[100][0], 0);
    assert.strictEqual(context.i, 3); // Should skip to position 3
  });

  test('closes ring with large ring number', () => {
    const context = {
      smiles: '%42',
      ringStacks: {
        42: [0], // Ring 42 opened at position 0
      },
      rings: [],
      atoms: [
        { type: 'c', position: 0, attachments: [] },
        { type: 'c', position: 1, attachments: [] },
        { type: 'c', position: 2, attachments: [] },
        { type: 'c', position: 3, attachments: [] },
        { type: 'c', position: 4, attachments: [] },
        { type: 'c', position: 5, attachments: [] },
      ],
      atomIndex: 6,
      i: 0,
      char: '%',
    };

    handleLargeRings(context);

    assert.strictEqual(context.rings.length, 1);
    assert.strictEqual(context.rings[0].ringNumber, 42);
    assert.strictEqual(context.rings[0].size, 6);
    assert.strictEqual(context.ringStacks[42], undefined); // Stack cleaned up
  });
});

describe('FusedRing.parse', () => {
  // describe('no rings', () => {
  //   test('parses ethane', async () => {
  //     const ethaneString = 'CC';
  //     const ethane = FusedRing.parse(ethaneString);
  //     assert.strictEqual(ethane.smiles, ethaneString);
  //     assert.ok(await isValidSMILES(ethane.smiles));

  //     assert.deepStrictEqual(ethane.meta, [
  //       {
  //         type: 'CC',
  //         size: 2,
  //         offset: 0,
  //         ringNumber: null,
  //         substitutions: {},
  //         attachments: {},
  //       },
  //     ]);
  //   });
  //   test('parses ethene', async () => {
  //     const ethaneString = 'C=C';
  //     const ethane = FusedRing.parse(ethaneString);
  //     assert.strictEqual(ethane.smiles, ethaneString);
  //     assert.ok(await isValidSMILES(ethane.smiles));

  //     assert.deepStrictEqual(ethane.meta, [
  //       {
  //         type: 'C=C',
  //         size: 6,
  //         offset: 0,
  //         ringNumber: null,
  //         substitutions: {},
  //         attachments: {},
  //       },
  //     ]);
  //   });
  // });
  describe('single rings', () => {
    test('parses benzene', async () => {
      const benzene = FusedRing.parse('c1ccccc1');

      assert.strictEqual(benzene.smiles, 'c1ccccc1');
      assert.ok(await isValidSMILES(benzene.smiles));

      assert.deepStrictEqual(benzene.meta.rings, [
        {
          type: 'c',
          size: 6,
          offset: 0,
          ringNumber: 1,
          substitutions: {},
          attachments: {},
        },
      ]);
    });

    test('parses 1,3,5-triazine', async () => {
      const triazine = FusedRing.parse('c1ncncn1');

      assert.strictEqual(triazine.smiles, 'c1ncncn1');
      assert.ok(await isValidSMILES(triazine.smiles));

      assert.deepStrictEqual(triazine.meta.rings[0], {
        type: 'c',
        size: 6,
        offset: 0,
        ringNumber: 1,
        substitutions: {
          2: 'n',
          4: 'n',
          6: 'n',
        },
        attachments: {},
      });
    });
  });

  describe('rings with attachments', () => {
    test('parses para-xylene', async () => {
      const xylene = FusedRing.parse('c1c(C)ccc(C)c1');

      assert.strictEqual(xylene.smiles, 'c1c(C)ccc(C)c1');
      assert.ok(await isValidSMILES(xylene.smiles));

      assert.deepStrictEqual(xylene.meta.rings[0], {
        type: 'c',
        size: 6,
        offset: 0,
        ringNumber: 1,
        substitutions: {},
        attachments: {
          2: 'C',
          5: 'C',
        },
      });
    });
  });

  describe('fused ring systems', () => {
    test('parses naphthalene', async () => {
      const naphthalene = FusedRing.parse('c1ccc2ccccc2c1');

      assert.strictEqual(naphthalene.smiles, 'c1ccc2ccccc2c1');
      assert.ok(await isValidSMILES(naphthalene.smiles));

      assert.deepStrictEqual(naphthalene.meta.rings, [
        {
          type: 'c',
          size: 6,
          offset: 0,
          ringNumber: 1,
          substitutions: {},
          attachments: {},
        },
        {
          type: 'c',
          size: 6,
          offset: 3,
          ringNumber: 2,
          substitutions: {},
          attachments: {},
        },
      ]);
    });
    test('parses structure with c12 notation', async () => {
      // c12 notation where both rings start at same atom
      // c12ccccc1cccc2 creates a 6-atom ring (0-5) and 10-atom ring (0-9)
      const rings = (await import('./parse.js')).parse('c12ccccc1cccc2');

      assert.deepStrictEqual(rings, [
        {
          type: 'c',
          size: 6,
          offset: 0,
          ringNumber: 1,
          substitutions: {},
          attachments: {},
        },
        {
          type: 'c',
          size: 10,
          offset: 0,
          ringNumber: 2,
          substitutions: {},
          attachments: {},
        },
      ]);
    });
    test('parses todo 42', async () => {
      const todo = FusedRing.parse('c%42ccccccccc%42');

      assert.strictEqual(todo.smiles, 'c%42ccccccccc%42');
      assert.ok(await isValidSMILES(todo.smiles));

      assert.deepStrictEqual(todo.meta.rings, [
        {
          type: 'c',
          size: 10,
          offset: 0,
          ringNumber: 42,
          substitutions: {},
          attachments: {},
        },
      ]);
    });
  });

  describe('rings with ring attachments', () => {
    test('parses terphenyl', async () => {
      const terphenyl = FusedRing.parse('c1c(c2ccccc2)ccc(c3ccccc3)c1');

      assert.strictEqual(terphenyl.smiles, 'c1c(c2ccccc2)ccc(c3ccccc3)c1');
      assert.ok(await isValidSMILES(terphenyl.smiles));

      // TODO: Attachments should be recursively parsed
      assert.deepStrictEqual(terphenyl.meta.rings, [
        {
          attachments: {
            2: 'c2ccccc2',
            5: 'c3ccccc3',
          },
          offset: 0,
          ringNumber: 1,
          size: 6,
          substitutions: {},
          type: 'c',
        },
      ]);
    });
  });
});
