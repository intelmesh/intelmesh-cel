import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/tokenizer.js';

describe('tokenizer', () => {
  it('tokenizes a simple boolean literal', () => {
    const tokens = tokenize('true');
    expect(tokens).toEqual([{ start: 0, end: 4, type: 'keyword' }]);
  });

  it('tokenizes multiple keywords', () => {
    const tokens = tokenize('true && false');
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toEqual({ start: 0, end: 4, type: 'keyword' });
    expect(tokens[1]).toEqual({ start: 5, end: 7, type: 'operator' });
    expect(tokens[2]).toEqual({ start: 8, end: 13, type: 'keyword' });
  });

  it('tokenizes a string literal with double quotes', () => {
    const tokens = tokenize('"hello world"');
    expect(tokens).toEqual([{ start: 0, end: 13, type: 'string' }]);
  });

  it('tokenizes a string literal with single quotes', () => {
    const tokens = tokenize("'hello'");
    expect(tokens).toEqual([{ start: 0, end: 7, type: 'string' }]);
  });

  it('reports unclosed string as error', () => {
    const tokens = tokenize('"unclosed');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.type).toBe('error');
  });

  it('tokenizes integer and float numbers', () => {
    const tokens = tokenize('42 3.14');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({ start: 0, end: 2, type: 'number' });
    expect(tokens[1]).toEqual({ start: 3, end: 7, type: 'number' });
  });

  it('tokenizes all two-char operators', () => {
    const ops = ['==', '!=', '<=', '>=', '&&', '||'];
    for (const op of ops) {
      const tokens = tokenize(op);
      expect(tokens).toEqual([{ start: 0, end: 2, type: 'operator' }]);
    }
  });

  it('tokenizes single-char operators', () => {
    const tokens = tokenize('+ - * / %');
    expect(tokens).toHaveLength(5);
    for (const tok of tokens) {
      expect(tok.type).toBe('operator');
    }
  });

  it('tokenizes parentheses and brackets', () => {
    const tokens = tokenize('()[]{}');
    expect(tokens).toHaveLength(6);
    expect(tokens[0]!.type).toBe('paren');
    expect(tokens[1]!.type).toBe('paren');
    expect(tokens[2]!.type).toBe('bracket');
    expect(tokens[3]!.type).toBe('bracket');
    expect(tokens[4]!.type).toBe('bracket');
    expect(tokens[5]!.type).toBe('bracket');
  });

  it('tokenizes identifiers', () => {
    const tokens = tokenize('foo bar_baz');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual({ start: 0, end: 3, type: 'variable' });
    expect(tokens[1]).toEqual({ start: 4, end: 11, type: 'variable' });
  });

  it('tokenizes a function call expression', () => {
    const tokens = tokenize('history.count("purchase", "card", val, "24h") > 5');
    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens[0]!.type).toBe('variable'); // history
    expect(tokens[1]!.type).toBe('punctuation'); // .
    expect(tokens[2]!.type).toBe('variable'); // count
    expect(tokens[3]!.type).toBe('paren'); // (
  });

  it('tokenizes the "in" keyword', () => {
    const tokens = tokenize('x in list');
    expect(tokens).toHaveLength(3);
    expect(tokens[1]).toEqual({ start: 2, end: 4, type: 'keyword' });
  });

  it('tokenizes punctuation (commas)', () => {
    const tokens = tokenize('a, b');
    expect(tokens[1]).toEqual({ start: 1, end: 2, type: 'punctuation' });
  });

  it('handles empty input', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('handles whitespace-only input', () => {
    expect(tokenize('   \t\n  ')).toEqual([]);
  });

  it('tokenizes escaped characters in strings', () => {
    const tokens = tokenize('"hello \\"world\\""');
    expect(tokens).toHaveLength(1);
    expect(tokens[0]!.type).toBe('string');
  });

  it('tokenizes comparison operators correctly', () => {
    const tokens = tokenize('x > 5');
    expect(tokens).toHaveLength(3);
    expect(tokens[1]).toEqual({ start: 2, end: 3, type: 'operator' });
  });
});
