/** Completion kind for categorizing suggestions. */
export type CompletionKind = 'function' | 'variable' | 'keyword' | 'list' | 'scope' | 'snippet';

/** A completion suggestion. */
export interface CompletionItem {
  /** Display label. */
  readonly label: string;
  /** Category. */
  readonly kind: CompletionKind;
  /** Short type signature. */
  readonly detail: string;
  /** Markdown documentation. */
  readonly documentation: string;
  /** Text to insert (supports ${N:placeholder} snippets). */
  readonly insertText: string;
  /** Sort order (lower = higher priority). */
  readonly sortPriority: number;
}

/** A diagnostic (error/warning) in the expression. */
export interface Diagnostic {
  /** Character range of the diagnostic. */
  readonly range: Range;
  /** Severity level. */
  readonly severity: 'error' | 'warning' | 'info';
  /** Human-readable message. */
  readonly message: string;
  /** Machine-readable error code. */
  readonly code: string;
}

/** Hover information for a position. */
export interface HoverInfo {
  /** Character range the hover applies to. */
  readonly range: Range;
  /** Markdown content to display. */
  readonly content: string;
}

/** A syntax token. */
export interface Token {
  /** Start offset (inclusive). */
  readonly start: number;
  /** End offset (exclusive). */
  readonly end: number;
  /** Token classification. */
  readonly type: TokenType;
}

/** Character range (start inclusive, end exclusive). */
export interface Range {
  /** Start offset (inclusive). */
  readonly start: number;
  /** End offset (exclusive). */
  readonly end: number;
}

/** Token types for syntax highlighting. */
export type TokenType =
  | 'keyword'
  | 'function'
  | 'variable'
  | 'string'
  | 'number'
  | 'operator'
  | 'paren'
  | 'bracket'
  | 'punctuation'
  | 'comment'
  | 'error';

/** Function registration descriptor. */
export interface FunctionDescriptor {
  /** Fully qualified function name (e.g. "history.count"). */
  readonly name: string;
  /** Parameter descriptors. */
  readonly params: readonly ParamDescriptor[];
  /** Return type as a string. */
  readonly returnType: string;
  /** Human-readable description. */
  readonly description: string;
  /** Usage examples. */
  readonly examples?: readonly string[];
}

/** Parameter descriptor. */
export interface ParamDescriptor {
  /** Parameter name. */
  readonly name: string;
  /** Parameter type as a string. */
  readonly type: string;
}
