// ---------------------------------------------------------------------------
// @intelmesh/cel — Public API exports
// ---------------------------------------------------------------------------

// Main facade
export { CelLanguage } from './language.js';

// Registry
export { Registry } from './registry.js';

// Builtins
export { registerBuiltins } from './builtins.js';

// Providers
export { complete } from './completion.js';
export { diagnose } from './diagnostics.js';
export { hover } from './hover.js';
export { tokenize } from './tokenizer.js';

// Parser (advanced usage)
export { parse } from './parser.js';
export type { ParsedIdentifier, ParseResult, UnclosedDelimiter } from './parser.js';

// Types
export type {
  CompletionItem,
  CompletionKind,
  Diagnostic,
  FunctionDescriptor,
  HoverInfo,
  ParamDescriptor,
  Range,
  Token,
  TokenType,
} from './types.js';
