import type { Token } from './types.js';
import { tokenize } from './tokenizer.js';

/** Parsed identifier with dotted parts and position info. */
export interface ParsedIdentifier {
  /** Full dotted name (e.g. "history.count"). */
  readonly full: string;
  /** Individual segments. */
  readonly parts: readonly string[];
  /** Start offset. */
  readonly start: number;
  /** End offset. */
  readonly end: number;
}

/** Result of lightweight CEL parsing. */
export interface ParseResult {
  /** Raw tokens. */
  readonly tokens: readonly Token[];
  /** Resolved dotted identifiers. */
  readonly identifiers: readonly ParsedIdentifier[];
  /** Opening delimiters without matching closers. */
  readonly unclosed: readonly UnclosedDelimiter[];
}

/** Represents an unclosed opening delimiter. */
export interface UnclosedDelimiter {
  /** The character: '(', '[', or '{'. */
  readonly char: string;
  /** Position of the opening delimiter. */
  readonly position: number;
}

const OPENERS = new Set(['(', '[', '{']);
const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/**
 * Parses a CEL expression into tokens, identifiers, and unclosed delimiters.
 * @param text - The CEL expression source text.
 * @returns Parsed result with tokens, identifiers, and unclosed info.
 */
export function parse(text: string): ParseResult {
  const tokens = tokenize(text);
  const identifiers = buildIdentifiers(tokens, text);
  const unclosed = findUnclosed(tokens, text);
  return { tokens, identifiers, unclosed };
}

/**
 * Builds dotted identifiers by merging adjacent variable tokens
 * separated by dot punctuation tokens.
 */
function buildIdentifiers(
  tokens: readonly Token[],
  text: string,
): ParsedIdentifier[] {
  const result: ParsedIdentifier[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok === undefined || tok.type !== 'variable') {
      i++;
      continue;
    }

    const parts: string[] = [text.slice(tok.start, tok.end)];
    let end = tok.end;
    let j = i + 1;

    while (j + 1 < tokens.length) {
      const dot = tokens[j];
      const next = tokens[j + 1];
      if (
        dot?.type === 'punctuation' &&
        text.slice(dot.start, dot.end) === '.' &&
        next?.type === 'variable'
      ) {
        parts.push(text.slice(next.start, next.end));
        end = next.end;
        j += 2;
      } else {
        break;
      }
    }

    result.push({ full: parts.join('.'), parts, start: tok.start, end });
    i = j;
  }

  return result;
}

/** Finds unmatched opening delimiters by simple stack matching. */
function findUnclosed(
  tokens: readonly Token[],
  text: string,
): UnclosedDelimiter[] {
  const stack: UnclosedDelimiter[] = [];

  for (const tok of tokens) {
    if (tok.type !== 'paren' && tok.type !== 'bracket') continue;
    const ch = text.slice(tok.start, tok.end);
    if (OPENERS.has(ch)) {
      stack.push({ char: ch, position: tok.start });
    } else if (ch in CLOSERS) {
      const expected = CLOSERS[ch];
      const top = stack[stack.length - 1];
      if (top && top.char === expected) {
        stack.pop();
      }
    }
  }

  return stack;
}
