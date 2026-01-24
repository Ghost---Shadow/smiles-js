import { describe, test, expect } from 'bun:test';
import { tokenize, TokenType } from './tokenizer.js';

describe('Tokenizer - Simple Atoms', () => {
  test('tokenizes single atom', () => {
    const tokens = tokenize('C');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: TokenType.ATOM,
      value: 'C',
      atom: 'C',
      position: 0,
    });
  });

  test('tokenizes multiple atoms', () => {
    const tokens = tokenize('CCO');
    expect(tokens).toHaveLength(3);
    expect(tokens.map((t) => t.atom)).toEqual(['C', 'C', 'O']);
  });

  test('tokenizes two-letter atoms', () => {
    const tokens = tokenize('Cl');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].atom).toBe('Cl');

    const tokens2 = tokenize('Br');
    expect(tokens2).toHaveLength(1);
    expect(tokens2[0].atom).toBe('Br');
  });

  test('tokenizes aromatic atoms', () => {
    const tokens = tokenize('c1ccccc1');
    expect(tokens.filter((t) => t.type === TokenType.ATOM)).toHaveLength(6);
    expect(tokens[0].atom).toBe('c');
  });
});

describe('Tokenizer - Bonds', () => {
  test('tokenizes single bond', () => {
    const tokens = tokenize('C-C');
    expect(tokens).toHaveLength(3);
    expect(tokens[1]).toEqual({
      type: TokenType.BOND,
      value: '-',
      position: 1,
    });
  });

  test('tokenizes double bond', () => {
    const tokens = tokenize('C=C');
    expect(tokens[1].value).toBe('=');
  });

  test('tokenizes triple bond', () => {
    const tokens = tokenize('C#C');
    expect(tokens[1].value).toBe('#');
  });

  test('tokenizes aromatic bond', () => {
    const tokens = tokenize('c:c');
    expect(tokens[1].value).toBe(':');
  });

  test('tokenizes stereochemical bonds', () => {
    const tokens = tokenize('C/C');
    expect(tokens[1].value).toBe('/');

    const tokens2 = tokenize('C\\C');
    expect(tokens2[1].value).toBe('\\');
  });
});

describe('Tokenizer - Ring Markers', () => {
  test('tokenizes single digit ring markers', () => {
    const tokens = tokenize('C1CCCC1');
    const ringMarkers = tokens.filter((t) => t.type === TokenType.RING_MARKER);
    expect(ringMarkers).toHaveLength(2);
    expect(ringMarkers[0]).toEqual({
      type: TokenType.RING_MARKER,
      value: '1',
      ringNumber: 1,
      position: 1,
    });
  });

  test('tokenizes percent notation ring markers', () => {
    const tokens = tokenize('C%10CCCC%10');
    const ringMarkers = tokens.filter((t) => t.type === TokenType.RING_MARKER);
    expect(ringMarkers).toHaveLength(2);
    expect(ringMarkers[0]).toEqual({
      type: TokenType.RING_MARKER,
      value: '%10',
      ringNumber: 10,
      position: 1,
    });
  });

  test('tokenizes benzene ring', () => {
    const tokens = tokenize('c1ccccc1');
    expect(tokens).toHaveLength(8); // 6 atoms + 2 ring markers
    expect(tokens[1].type).toBe(TokenType.RING_MARKER);
    expect(tokens[7].type).toBe(TokenType.RING_MARKER);
  });
});

describe('Tokenizer - Branches', () => {
  test('tokenizes branch symbols', () => {
    const tokens = tokenize('C(C)C');
    expect(tokens).toHaveLength(5);
    expect(tokens[1]).toEqual({
      type: TokenType.BRANCH_OPEN,
      value: '(',
      position: 1,
    });
    expect(tokens[3]).toEqual({
      type: TokenType.BRANCH_CLOSE,
      value: ')',
      position: 3,
    });
  });

  test('tokenizes nested branches', () => {
    const tokens = tokenize('C(C(C))C');
    const opens = tokens.filter((t) => t.type === TokenType.BRANCH_OPEN);
    const closes = tokens.filter((t) => t.type === TokenType.BRANCH_CLOSE);
    expect(opens).toHaveLength(2);
    expect(closes).toHaveLength(2);
  });
});

describe('Tokenizer - Bracketed Atoms', () => {
  test('tokenizes bracketed atom', () => {
    const tokens = tokenize('[NH3+]');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.ATOM);
    expect(tokens[0].value).toBe('[NH3+]');
    expect(tokens[0].atom.raw).toBe('NH3+');
  });

  test('tokenizes isotope notation', () => {
    const tokens = tokenize('[13C]');
    expect(tokens[0].atom.raw).toBe('13C');
  });

  test('tokenizes chirality', () => {
    const tokens = tokenize('[C@H]');
    expect(tokens[0].atom.raw).toBe('C@H');
  });
});

describe('Tokenizer - Complex Molecules', () => {
  test('tokenizes ethanol', () => {
    const tokens = tokenize('CCO');
    expect(tokens).toHaveLength(3);
    expect(tokens.map((t) => t.atom)).toEqual(['C', 'C', 'O']);
  });

  test('tokenizes benzene', () => {
    const tokens = tokenize('c1ccccc1');
    expect(tokens).toHaveLength(8);
  });

  test('tokenizes toluene', () => {
    const tokens = tokenize('Cc1ccccc1');
    expect(tokens).toHaveLength(9);
  });

  test('tokenizes acetone', () => {
    const tokens = tokenize('CC(=O)C');
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      TokenType.ATOM,
      TokenType.ATOM,
      TokenType.BRANCH_OPEN,
      TokenType.BOND,
      TokenType.ATOM,
      TokenType.BRANCH_CLOSE,
      TokenType.ATOM,
    ]);
  });
});

describe('Tokenizer - Disconnected Fragments', () => {
  test('tokenizes dot separator', () => {
    const tokens = tokenize('C.C');
    expect(tokens).toHaveLength(3);
    expect(tokens[1]).toEqual({
      type: TokenType.DOT,
      value: '.',
      position: 1,
    });
  });

  test('tokenizes salt', () => {
    const tokens = tokenize('[Na+].[Cl-]');
    expect(tokens).toHaveLength(3);
    expect(tokens[1].type).toBe(TokenType.DOT);
  });
});

describe('Tokenizer - Whitespace', () => {
  test('ignores whitespace', () => {
    const tokens = tokenize('C C O');
    expect(tokens).toHaveLength(3);
    expect(tokens.map((t) => t.atom)).toEqual(['C', 'C', 'O']);
  });
});

describe('Tokenizer - Error Handling', () => {
  test('throws on unclosed bracket', () => {
    expect(() => tokenize('[NH3+')).toThrow('Unclosed bracket');
  });

  test('throws on invalid ring marker', () => {
    expect(() => tokenize('C%1C')).toThrow('Invalid ring marker');
  });

  test('throws on unexpected character', () => {
    expect(() => tokenize('C$C')).toThrow('Unexpected character');
  });
});

describe('Tokenizer - Position Tracking', () => {
  test('tracks position for each token', () => {
    const tokens = tokenize('C1CC1');
    expect(tokens[0].position).toBe(0); // C
    expect(tokens[1].position).toBe(1); // 1
    expect(tokens[2].position).toBe(2); // C
    expect(tokens[3].position).toBe(3); // C
    expect(tokens[4].position).toBe(4); // 1
  });

  test('tracks position with branches', () => {
    const tokens = tokenize('C(C)C');
    expect(tokens[0].position).toBe(0); // C
    expect(tokens[1].position).toBe(1); // (
    expect(tokens[2].position).toBe(2); // C
    expect(tokens[3].position).toBe(3); // )
    expect(tokens[4].position).toBe(4); // C
  });
});
