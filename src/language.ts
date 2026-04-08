import type { CompletionItem, Diagnostic, FunctionDescriptor, HoverInfo, Token } from './types.js';
import { Registry } from './registry.js';
import { registerBuiltins } from './builtins.js';
import { complete } from './completion.js';
import { diagnose } from './diagnostics.js';
import { hover } from './hover.js';
import { tokenize } from './tokenizer.js';

/**
 * Main facade for CEL language intelligence.
 * Provides completions, diagnostics, hover info, and tokenization
 * for CEL expressions with IntelMesh custom functions.
 *
 * Editor-agnostic: accepts strings and positions, returns structured data.
 */
export class CelLanguage {
  private readonly registry: Registry;

  /** Creates a new CelLanguage instance with built-in functions pre-registered. */
  constructor() {
    this.registry = new Registry();
    registerBuiltins(this.registry);
  }

  /**
   * Registers a custom function descriptor.
   * @param desc - The function descriptor to register.
   */
  registerFunction(desc: FunctionDescriptor): void {
    this.registry.registerFunction(desc);
  }

  /**
   * Registers a metadata variable with its type.
   * @param name - The variable name (e.g. "amount").
   * @param type - The variable type (e.g. "double").
   */
  registerVariable(name: string, type: string): void {
    this.registry.registerVariable(name, type);
  }

  /**
   * Registers a named list.
   * @param name - The list name (e.g. "blocked_cards").
   */
  registerList(name: string): void {
    this.registry.registerList(name);
  }

  /**
   * Registers a scope name.
   * @param name - The scope name.
   */
  registerScope(name: string): void {
    this.registry.registerScope(name);
  }

  /**
   * Returns context-aware completion items for the given position.
   * @param text - The CEL expression text.
   * @param position - The cursor offset within the text.
   * @returns An array of completion items.
   */
  complete(text: string, position: number): CompletionItem[] {
    return complete(text, position, this.registry);
  }

  /**
   * Validates the expression and returns diagnostics.
   * @param text - The CEL expression text.
   * @returns An array of diagnostics (errors, warnings).
   */
  diagnose(text: string): Diagnostic[] {
    return diagnose(text, this.registry);
  }

  /**
   * Returns hover information for the given position.
   * @param text - The CEL expression text.
   * @param position - The cursor offset within the text.
   * @returns Hover info, or null if nothing to show.
   */
  hover(text: string, position: number): HoverInfo | null {
    return hover(text, position, this.registry);
  }

  /**
   * Tokenizes the expression for syntax highlighting.
   * @param text - The CEL expression text.
   * @returns An array of typed tokens.
   */
  tokenize(text: string): Token[] {
    return tokenize(text);
  }
}
