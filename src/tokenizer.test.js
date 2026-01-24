const { TokenType, tokenize } = require('./tokenizer');

describe('Tokenizer', () => {
  describe('Simple atoms', () => {
    test('tokenizes single uppercase atom', () => {
      const tokens = tokenize('C');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
      ]);
    });

    test('tokenizes single lowercase atom', () => {
      const tokens = tokenize('c');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'c', position: 0, length: 1,
        },
      ]);
    });

    test('tokenizes two-letter atoms', () => {
      const tokens = tokenize('Cl');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'Cl', position: 0, length: 2,
        },
      ]);
    });

    test('tokenizes Br atom', () => {
      const tokens = tokenize('Br');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'Br', position: 0, length: 2,
        },
      ]);
    });

    test('tokenizes multiple atoms', () => {
      const tokens = tokenize('CCC');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 2, length: 1,
        },
      ]);
    });
  });

  describe('Bracketed atoms', () => {
    test('tokenizes simple bracketed atom', () => {
      const tokens = tokenize('[C]');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: '[C]', position: 0, length: 3,
        },
      ]);
    });

    test('tokenizes bracketed atom with charge', () => {
      const tokens = tokenize('[NH3+]');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: '[NH3+]', position: 0, length: 6,
        },
      ]);
    });

    test('tokenizes bracketed atom with chirality', () => {
      const tokens = tokenize('[C@H]');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: '[C@H]', position: 0, length: 5,
        },
      ]);
    });
  });

  describe('Bonds', () => {
    test('tokenizes single bond', () => {
      const tokens = tokenize('C-C');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.BOND, value: '-', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 2, length: 1,
        },
      ]);
    });

    test('tokenizes double bond', () => {
      const tokens = tokenize('C=C');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.BOND, value: '=', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 2, length: 1,
        },
      ]);
    });

    test('tokenizes triple bond', () => {
      const tokens = tokenize('C#C');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.BOND, value: '#', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 2, length: 1,
        },
      ]);
    });

    test('tokenizes aromatic bond', () => {
      const tokens = tokenize('c:c');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'c', position: 0, length: 1,
        },
        {
          type: TokenType.BOND, value: ':', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'c', position: 2, length: 1,
        },
      ]);
    });
  });

  describe('Ring markers', () => {
    test('tokenizes single digit ring marker', () => {
      const tokens = tokenize('C1CCC1');
      expect(tokens[1]).toEqual({
        type: TokenType.RING_MARKER,
        value: 1,
        position: 1,
        length: 1,
      });
    });

    test('tokenizes ring markers with %NN notation', () => {
      const tokens = tokenize('C%10CCC%10');
      expect(tokens[1]).toEqual({
        type: TokenType.RING_MARKER,
        value: 10,
        position: 1,
        length: 3,
      });
    });

    test('tokenizes benzene with ring markers', () => {
      const tokens = tokenize('c1ccccc1');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'c', position: 0, length: 1,
        },
        {
          type: TokenType.RING_MARKER, value: 1, position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'c', position: 2, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'c', position: 3, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'c', position: 4, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'c', position: 5, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'c', position: 6, length: 1,
        },
        {
          type: TokenType.RING_MARKER, value: 1, position: 7, length: 1,
        },
      ]);
    });
  });

  describe('Branches', () => {
    test('tokenizes branch symbols', () => {
      const tokens = tokenize('C(C)C');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.BRANCH_OPEN, value: '(', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 2, length: 1,
        },
        {
          type: TokenType.BRANCH_CLOSE, value: ')', position: 3, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 4, length: 1,
        },
      ]);
    });

    test('tokenizes nested branches', () => {
      const tokens = tokenize('C(C(C))C');
      expect(tokens[1]).toEqual({
        type: TokenType.BRANCH_OPEN,
        value: '(',
        position: 1,
        length: 1,
      });
      expect(tokens[3]).toEqual({
        type: TokenType.BRANCH_OPEN,
        value: '(',
        position: 3,
        length: 1,
      });
    });
  });

  describe('Complex molecules', () => {
    test('tokenizes toluene', () => {
      const tokens = tokenize('c1ccc(C)cc1');
      expect(tokens.length).toBe(11);
      expect(tokens[0]).toEqual({
        type: TokenType.ATOM,
        value: 'c',
        position: 0,
        length: 1,
      });
      expect(tokens[5]).toEqual({
        type: TokenType.BRANCH_OPEN,
        value: '(',
        position: 5,
        length: 1,
      });
    });

    test('tokenizes ethanol', () => {
      const tokens = tokenize('CCO');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 1, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'O', position: 2, length: 1,
        },
      ]);
    });

    test('tokenizes naphthalene', () => {
      const tokens = tokenize('C1=CC2=CC=CC=C2C=C1');
      expect(tokens.length).toBe(19);
    });
  });

  describe('Error handling', () => {
    test('throws on unmatched opening bracket', () => {
      expect(() => tokenize('[C')).toThrow('Unmatched bracket');
    });

    test('throws on invalid ring marker', () => {
      expect(() => tokenize('C%1')).toThrow('Invalid ring marker');
    });

    test('throws on unknown character', () => {
      expect(() => tokenize('C@C')).toThrow('Unknown character');
    });
  });

  describe('Whitespace handling', () => {
    test('ignores whitespace', () => {
      const tokens = tokenize('C C C');
      expect(tokens).toEqual([
        {
          type: TokenType.ATOM, value: 'C', position: 0, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 2, length: 1,
        },
        {
          type: TokenType.ATOM, value: 'C', position: 4, length: 1,
        },
      ]);
    });
  });
});
