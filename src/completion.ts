import type { CompletionItem } from './types.js';
import type { Registry } from './registry.js';

const CEL_KEYWORDS = ['true', 'false', 'null', 'in', 'has'];

const EVENT_FIELDS = ['type', 'metadata'];

/**
 * Provides context-aware completions for a CEL expression at a given cursor position.
 * @param text - The CEL expression text.
 * @param position - The cursor offset within the text.
 * @param registry - The function/variable/list/scope registry.
 * @returns An array of completion items sorted by priority.
 */
export function complete(
  text: string,
  position: number,
  registry: Registry,
): CompletionItem[] {
  const before = text.slice(0, position);

  const listContext = detectListContext(before);
  if (listContext) return completeListNames(registry);

  const scopeContext = detectScopeContext(before);
  if (scopeContext) return completeScopeNames(registry);

  const dotPrefix = detectDotPrefix(before);
  if (dotPrefix !== null) return completeDotAccess(dotPrefix, registry);

  return completeTopLevel(before, registry);
}

/** Detects if cursor is inside list.contains(' or list.contains(". */
function detectListContext(before: string): boolean {
  return /list\.contains\(\s*['"][^'"]*$/.test(before);
}

/** Detects if cursor is inside a map literal. */
function detectScopeContext(before: string): boolean {
  const opens = (before.match(/\{/g) ?? []).length;
  const closes = (before.match(/\}/g) ?? []).length;
  return opens > closes;
}

/** Detects a dot prefix like "history." or "event.metadata.". */
function detectDotPrefix(before: string): string | null {
  const match = /([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)\.\s*$/.exec(before);
  return match?.[1] ?? null;
}

/** Completions after a dot access on a known prefix. */
function completeDotAccess(prefix: string, registry: Registry): CompletionItem[] {
  if (prefix === 'event') {
    return buildEventFieldCompletions();
  }

  if (prefix === 'event.metadata') {
    return buildMetadataCompletions(registry);
  }

  return completeNamespaceMethods(prefix, registry);
}

/** Completions for event.* fields. */
function buildEventFieldCompletions(): CompletionItem[] {
  return EVENT_FIELDS.map((field, i) => ({
    label: field,
    kind: 'variable' as const,
    detail: field === 'type' ? 'string' : 'map',
    documentation: field === 'type'
      ? 'The event type identifier.'
      : 'The event metadata map containing all event fields.',
    insertText: field,
    sortPriority: i,
  }));
}

/** Completions for event.metadata.* using registered variables. */
function buildMetadataCompletions(registry: Registry): CompletionItem[] {
  const vars = registry.getAllVariables();
  const items: CompletionItem[] = [];
  let priority = 0;
  for (const [name, type] of vars) {
    items.push({
      label: name,
      kind: 'variable',
      detail: type,
      documentation: `Event metadata field \`${name}\` of type \`${type}\`.`,
      insertText: name,
      sortPriority: priority++,
    });
  }
  return items;
}

/** Completions for methods in a namespace (e.g. history.count). */
function completeNamespaceMethods(
  namespace: string,
  registry: Registry,
): CompletionItem[] {
  const fns = registry.getAllFunctions();
  const prefix = namespace + '.';
  const items: CompletionItem[] = [];
  let priority = 0;

  for (const fn of fns) {
    if (fn.name.startsWith(prefix)) {
      const method = fn.name.slice(prefix.length);
      const sig = fn.params.map((p) => `${p.name}: ${p.type}`).join(', ');
      items.push({
        label: method,
        kind: 'function',
        detail: `(${sig}) -> ${fn.returnType}`,
        documentation: formatFunctionDoc(fn),
        insertText: buildSnippet(method, fn.params.length),
        sortPriority: priority++,
      });
    }
  }

  return items;
}

/** Completions for the start of an expression or after operators. */
function completeTopLevel(before: string, registry: Registry): CompletionItem[] {
  const items: CompletionItem[] = [];
  let priority = 0;

  const namespaces = getNamespaces(registry);
  for (const ns of namespaces) {
    items.push({
      label: ns,
      kind: 'function',
      detail: 'namespace',
      documentation: `IntelMesh \`${ns}\` function namespace.`,
      insertText: ns + '.',
      sortPriority: priority++,
    });
  }

  items.push({
    label: 'event',
    kind: 'variable',
    detail: 'Event',
    documentation: 'The current event being evaluated.',
    insertText: 'event.',
    sortPriority: priority++,
  });

  for (const kw of CEL_KEYWORDS) {
    items.push({
      label: kw,
      kind: 'keyword',
      detail: 'keyword',
      documentation: `CEL keyword \`${kw}\`.`,
      insertText: kw,
      sortPriority: priority++,
    });
  }

  return filterByPrefix(items, before);
}

/** Completions for list names inside list.contains(). */
function completeListNames(registry: Registry): CompletionItem[] {
  return registry.getAllLists().map((name, i) => ({
    label: name,
    kind: 'list' as const,
    detail: 'list',
    documentation: `Named list \`${name}\`.`,
    insertText: name,
    sortPriority: i,
  }));
}

/** Completions for scope names inside map literals. */
function completeScopeNames(registry: Registry): CompletionItem[] {
  return registry.getAllScopes().map((name, i) => ({
    label: name,
    kind: 'scope' as const,
    detail: 'scope',
    documentation: `Scope \`${name}\`.`,
    insertText: name,
    sortPriority: i,
  }));
}

/** Extracts unique namespaces from function names. */
function getNamespaces(registry: Registry): string[] {
  const seen = new Set<string>();
  for (const fn of registry.getAllFunctions()) {
    const dot = fn.name.indexOf('.');
    if (dot > 0) {
      seen.add(fn.name.slice(0, dot));
    }
  }
  return [...seen];
}

/** Formats a function descriptor as markdown documentation. */
function formatFunctionDoc(fn: { description: string; examples?: readonly string[] }): string {
  let doc = fn.description;
  if (fn.examples && fn.examples.length > 0) {
    doc += '\n\n**Examples:**\n' + fn.examples.map((e) => `- \`${e}\``).join('\n');
  }
  return doc;
}

/** Builds a snippet string with numbered placeholders. */
function buildSnippet(method: string, paramCount: number): string {
  if (paramCount === 0) return method + '()';
  const placeholders = Array.from(
    { length: paramCount },
    (_, i) => `\${${String(i + 1)}}`,
  ).join(', ');
  return `${method}(${placeholders})`;
}

/** Filters items whose labels match the trailing word in the text. */
function filterByPrefix(items: CompletionItem[], before: string): CompletionItem[] {
  const match = /([a-zA-Z_]\w*)$/.exec(before);
  if (!match?.[1]) return items;
  const prefix = match[1].toLowerCase();
  return items.filter((item) => item.label.toLowerCase().startsWith(prefix));
}
