import type { Token, TokenType } from './types.js';

const KEYWORDS = new Set(['true', 'false', 'null', 'in', 'has']);

const TWO_CHAR_OPERATORS = new Set(['==', '!=', '<=', '>=', '&&', '||']);

const SINGLE_OPERATORS = new Set(['+', '-', '*', '/', '%', '<', '>', '!', '?', ':']);

const PAREN_CHARS = new Set(['(', ')']);

const BRACKET_CHARS = new Set(['[', ']', '{', '}']);

const PUNCTUATION_CHARS = new Set([',', ';']);

/** Token reader function that returns a token or null. */
type TokenReader = (text: string, pos: number) => Token | null;

/** Ordered list of token readers tried in sequence. */
const TOKEN_READERS: readonly TokenReader[] = [
  readQuotedString,
  readDigit,
  readParen,
  readBracket,
  readPunctuation,
  readDotOrNumber,
  readTwoCharOp,
  readSingleOp,
  readIdentifier,
];

/**
 * Tokenizes a CEL expression into a stream of typed tokens.
 * @param text - The CEL expression source text.
 * @returns An array of tokens covering the full input.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < text.length) {
    const ch = text[pos];
    if (ch === undefined) break;

    if (isWhitespace(ch)) {
      pos++;
      continue;
    }

    const token = tryReadToken(text, pos);
    tokens.push(token);
    pos = token.end;
  }

  return tokens;
}

/** Tries all token readers in order, returns error token if none match. */
function tryReadToken(text: string, pos: number): Token {
  for (const reader of TOKEN_READERS) {
    const token = reader(text, pos);
    if (token !== null) return token;
  }
  return { start: pos, end: pos + 1, type: 'error' };
}

/** Reads a string literal delimited by a quote character. */
function readQuotedString(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch !== '"' && ch !== "'") return null;
  return readStringBody(text, pos, ch);
}

/** Reads the body of a string literal. */
function readStringBody(text: string, pos: number, quote: string): Token {
  let i = pos + 1;
  while (i < text.length) {
    const c = text[i];
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === quote) {
      return { start: pos, end: i + 1, type: 'string' };
    }
    i++;
  }
  return { start: pos, end: text.length, type: 'error' };
}

/** Reads a numeric literal starting with a digit. */
function readDigit(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch === undefined || !isDigitChar(ch)) return null;
  return readNumber(text, pos);
}

/** Reads a full numeric literal (integer or float). */
function readNumber(text: string, pos: number): Token {
  let i = pos;
  let hasDot = false;
  while (i < text.length) {
    const c = text[i];
    if (c === '.' && !hasDot) {
      hasDot = true;
      i++;
    } else if (c !== undefined && isDigitChar(c)) {
      i++;
    } else {
      break;
    }
  }
  return { start: pos, end: i, type: 'number' };
}

/** Reads a paren token. */
function readParen(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch !== undefined && PAREN_CHARS.has(ch)) {
    return { start: pos, end: pos + 1, type: 'paren' };
  }
  return null;
}

/** Reads a bracket token. */
function readBracket(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch !== undefined && BRACKET_CHARS.has(ch)) {
    return { start: pos, end: pos + 1, type: 'bracket' };
  }
  return null;
}

/** Reads a punctuation token (comma, semicolon). */
function readPunctuation(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch !== undefined && PUNCTUATION_CHARS.has(ch)) {
    return { start: pos, end: pos + 1, type: 'punctuation' };
  }
  return null;
}

/** Reads a dot — standalone punctuation unless followed by digits. */
function readDotOrNumber(text: string, pos: number): Token | null {
  if (text[pos] !== '.') return null;
  const next = text[pos + 1];
  if (next !== undefined && isDigitChar(next)) {
    return readNumber(text, pos);
  }
  return { start: pos, end: pos + 1, type: 'punctuation' };
}

/** Reads a two-character operator. */
function readTwoCharOp(text: string, pos: number): Token | null {
  if (pos + 1 >= text.length) return null;
  const pair = text.slice(pos, pos + 2);
  if (TWO_CHAR_OPERATORS.has(pair)) {
    return { start: pos, end: pos + 2, type: 'operator' };
  }
  return null;
}

/** Reads a single-character operator. */
function readSingleOp(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch !== undefined && SINGLE_OPERATORS.has(ch)) {
    return { start: pos, end: pos + 1, type: 'operator' };
  }
  return null;
}

/** Reads an identifier or keyword. */
function readIdentifier(text: string, pos: number): Token | null {
  const ch = text[pos];
  if (ch === undefined || !isIdentStart(ch)) return null;

  let i = pos;
  while (i < text.length && isIdentPart(text[i] ?? '')) {
    i++;
  }
  const word = text.slice(pos, i);
  const type: TokenType = KEYWORDS.has(word) ? 'keyword' : 'variable';
  return { start: pos, end: i, type };
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isDigitChar(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigitChar(ch);
}
