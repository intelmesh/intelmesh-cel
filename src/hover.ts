import type { HoverInfo } from './types.js';
import type { Registry } from './registry.js';
import { parse } from './parser.js';

/**
 * Returns hover information for a given position in a CEL expression.
 * @param text - The CEL expression text.
 * @param position - The cursor offset within the text.
 * @param registry - The function/variable/list/scope registry.
 * @returns Hover info if found, or null.
 */
export function hover(
  text: string,
  position: number,
  registry: Registry,
): HoverInfo | null {
  const result = parse(text);

  const identHover = findIdentifierHover(result, position, registry);
  if (identHover) return identHover;

  const tokenHover = findTokenHover(result, text, position);
  if (tokenHover) return tokenHover;

  return null;
}

/** Checks if the position falls within any parsed identifier. */
function findIdentifierHover(
  result: ReturnType<typeof parse>,
  position: number,
  registry: Registry,
): HoverInfo | null {
  for (const ident of result.identifiers) {
    if (position < ident.start || position >= ident.end) continue;

    const fn = registry.getFunction(ident.full);
    if (fn) return buildFunctionHover(fn, ident);

    const varType = findVariableType(ident, registry);
    if (varType) return buildVariableHover(ident, varType);

    if (ident.full === 'event') {
      return {
        range: { start: ident.start, end: ident.end },
        content: '**event**: `Event`\n\nThe current event being evaluated.',
      };
    }
  }
  return null;
}

/** Checks if the position falls within a keyword or literal token. */
function findTokenHover(
  result: ReturnType<typeof parse>,
  text: string,
  position: number,
): HoverInfo | null {
  for (const tok of result.tokens) {
    if (position < tok.start || position >= tok.end) continue;
    if (tok.type === 'keyword') {
      const word = text.slice(tok.start, tok.end);
      return {
        range: { start: tok.start, end: tok.end },
        content: `**${word}**: CEL keyword`,
      };
    }
  }
  return null;
}

/** Builds hover content for a function. */
function buildFunctionHover(
  fn: { name: string; params: readonly { name: string; type: string }[]; returnType: string; description: string; examples?: readonly string[] },
  ident: { start: number; end: number },
): HoverInfo {
  const sig = fn.params.map((p) => `${p.name}: ${p.type}`).join(', ');
  let content = `**${fn.name}**(${sig}) -> \`${fn.returnType}\`\n\n${fn.description}`;
  if (fn.examples && fn.examples.length > 0) {
    content += '\n\n**Examples:**\n' + fn.examples.map((e) => `\`\`\`cel\n${e}\n\`\`\``).join('\n');
  }
  return { range: { start: ident.start, end: ident.end }, content };
}

/** Resolves a dotted identifier to a variable type from the registry. */
function findVariableType(
  ident: { full: string; parts: readonly string[] },
  registry: Registry,
): string | null {
  if (ident.parts.length >= 3 && ident.parts[0] === 'event' && ident.parts[1] === 'metadata') {
    const fieldName = ident.parts[2];
    if (fieldName !== undefined) {
      return registry.getVariable(fieldName) ?? null;
    }
  }
  return null;
}

/** Builds hover content for a variable. */
function buildVariableHover(
  ident: { full: string; start: number; end: number },
  varType: string,
): HoverInfo {
  return {
    range: { start: ident.start, end: ident.end },
    content: `**${ident.full}**: \`${varType}\`\n\nEvent metadata field.`,
  };
}
