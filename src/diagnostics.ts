import type { Diagnostic } from './types.js';
import type { Registry } from './registry.js';
import { parse } from './parser.js';

/**
 * Validates a CEL expression and returns diagnostics.
 * @param text - The CEL expression to validate.
 * @param registry - The function/variable/list/scope registry.
 * @returns An array of diagnostics (errors, warnings, info).
 */
export function diagnose(text: string, registry: Registry): Diagnostic[] {
  const result = parse(text);
  const diagnostics: Diagnostic[] = [];

  checkUnclosed(result, diagnostics);
  checkErrorTokens(result, diagnostics);
  checkFunctionCalls(result, text, registry, diagnostics);
  checkListReferences(result, text, registry, diagnostics);

  return diagnostics;
}

/** Reports unclosed delimiters as errors. */
function checkUnclosed(
  result: ReturnType<typeof parse>,
  diagnostics: Diagnostic[],
): void {
  for (const u of result.unclosed) {
    diagnostics.push({
      range: { start: u.position, end: u.position + 1 },
      severity: 'error',
      message: `Unclosed '${u.char}'.`,
      code: 'unclosed-delimiter',
    });
  }
}

/** Reports error tokens (e.g. unclosed strings). */
function checkErrorTokens(
  result: ReturnType<typeof parse>,
  diagnostics: Diagnostic[],
): void {
  for (const tok of result.tokens) {
    if (tok.type === 'error') {
      diagnostics.push({
        range: { start: tok.start, end: tok.end },
        severity: 'error',
        message: 'Unexpected or malformed token.',
        code: 'invalid-token',
      });
    }
  }
}

/** Checks function calls for unknown names and wrong arg counts. */
function checkFunctionCalls(
  result: ReturnType<typeof parse>,
  text: string,
  registry: Registry,
  diagnostics: Diagnostic[],
): void {
  for (const ident of result.identifiers) {
    if (!isFunctionCall(result, ident, text)) continue;

    const fn = registry.getFunction(ident.full);
    if (!fn) {
      const suggestion = findSimilar(ident.full, registry);
      const msg = suggestion
        ? `Unknown function '${ident.full}'. Did you mean '${suggestion}'?`
        : `Unknown function '${ident.full}'.`;
      diagnostics.push({
        range: { start: ident.start, end: ident.end },
        severity: 'error',
        message: msg,
        code: 'unknown-function',
      });
      continue;
    }

    const argCount = countArguments(result, ident, text);
    if (argCount !== null && argCount !== fn.params.length) {
      diagnostics.push({
        range: { start: ident.start, end: ident.end },
        severity: 'error',
        message: `'${ident.full}' expects ${String(fn.params.length)} argument(s), got ${String(argCount)}.`,
        code: 'wrong-arg-count',
      });
    }
  }
}

/** Checks list.contains references for unknown list names. */
function checkListReferences(
  result: ReturnType<typeof parse>,
  text: string,
  registry: Registry,
  diagnostics: Diagnostic[],
): void {
  for (const ident of result.identifiers) {
    if (ident.full !== 'list.contains') continue;

    const listName = extractFirstStringArg(result, ident, text);
    if (listName === null) continue;

    const allLists = registry.getAllLists();
    if (allLists.length > 0 && !allLists.includes(listName)) {
      const nameStart = findStringArgPosition(result, ident, text);
      if (nameStart !== null) {
        diagnostics.push({
          range: { start: nameStart, end: nameStart + listName.length + 2 },
          severity: 'warning',
          message: `Unknown list '${listName}'.`,
          code: 'unknown-list',
        });
      }
    }
  }
}

/** Determines if an identifier is followed by '(' — i.e. it's a function call. */
function isFunctionCall(
  result: ReturnType<typeof parse>,
  ident: { end: number },
  text: string,
): boolean {
  for (const tok of result.tokens) {
    if (tok.start >= ident.end && tok.type === 'paren') {
      return text.slice(tok.start, tok.end) === '(';
    }
    if (tok.start >= ident.end && tok.type !== 'paren') {
      return false;
    }
  }
  return false;
}

/** Counts comma-separated arguments inside the parentheses after an identifier. */
function countArguments(
  result: ReturnType<typeof parse>,
  ident: { end: number },
  text: string,
): number | null {
  const relevant = result.tokens.filter((tok) => tok.start >= ident.end);
  return countArgsInTokens(relevant, text);
}

/** Counts arguments from a filtered token list. */
function countArgsInTokens(
  tokens: readonly { start: number; end: number; type: string }[],
  text: string,
): number | null {
  let state: ArgCountState = { depth: 0, started: false, commas: 0, hasContent: false, done: null };

  for (const tok of tokens) {
    const ch = text.slice(tok.start, tok.end);
    state = processArgToken(tok.type, ch, state);
    if (state.done !== null) return state.done;
  }
  return null;
}

/** State for argument counting. */
interface ArgCountState {
  depth: number;
  started: boolean;
  commas: number;
  hasContent: boolean;
  done: number | null;
}

/** Processes an opening paren for argument counting. */
function processOpenParen(state: ArgCountState): ArgCountState {
  return { ...state, depth: state.depth + 1, started: true };
}

/** Processes a closing paren for argument counting. */
function processCloseParen(state: ArgCountState): ArgCountState {
  const newDepth = state.depth - 1;
  const isDone = newDepth === 0 && state.started;
  const result = isDone ? (state.hasContent ? state.commas + 1 : 0) : null;
  return { ...state, depth: newDepth, done: result };
}

/** Processes a content token inside arguments. */
function processContentToken(state: ArgCountState, type: string, ch: string): ArgCountState {
  if (!state.started || state.depth !== 1) return state;
  const isComma = type === 'punctuation' && ch === ',';
  return { ...state, commas: isComma ? state.commas + 1 : state.commas, hasContent: true };
}

/** Processes a single token for argument counting. */
function processArgToken(
  type: string, ch: string, state: ArgCountState,
): ArgCountState {
  if (type === 'paren' && ch === '(') return processOpenParen(state);
  if (type === 'paren' && ch === ')') return processCloseParen(state);
  return processContentToken(state, type, ch);
}

/** Extracts the first string argument value from a function call. */
function extractFirstStringArg(
  result: ReturnType<typeof parse>,
  ident: { end: number },
  text: string,
): string | null {
  let foundParen = false;
  for (const tok of result.tokens) {
    if (tok.start < ident.end) continue;
    const ch = text.slice(tok.start, tok.end);
    if (tok.type === 'paren' && ch === '(') {
      foundParen = true;
      continue;
    }
    if (foundParen && tok.type === 'string') {
      return text.slice(tok.start + 1, tok.end - 1);
    }
    if (foundParen && tok.type !== 'string') return null;
  }
  return null;
}

/** Finds the position of the first string argument token. */
function findStringArgPosition(
  result: ReturnType<typeof parse>,
  ident: { end: number },
  text: string,
): number | null {
  let foundParen = false;
  for (const tok of result.tokens) {
    if (tok.start < ident.end) continue;
    const ch = text.slice(tok.start, tok.end);
    if (tok.type === 'paren' && ch === '(') {
      foundParen = true;
      continue;
    }
    if (foundParen && tok.type === 'string') return tok.start;
    if (foundParen && tok.type !== 'string') return null;
  }
  return null;
}

/** Finds the most similar function name using simple edit distance. */
function findSimilar(name: string, registry: Registry): string | null {
  let best: string | null = null;
  let bestDist = Infinity;

  for (const fn of registry.getAllFunctions()) {
    const d = levenshtein(name, fn.name);
    if (d < bestDist && d <= 3) {
      bestDist = d;
      best = fn.name;
    }
  }

  return best;
}

/** Simple Levenshtein distance. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1,
        (curr[j - 1] ?? 0) + 1,
        (prev[j - 1] ?? 0) + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n] ?? 0;
}
