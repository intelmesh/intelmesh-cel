import type { FunctionDescriptor } from './types.js';

/**
 * Registry for CEL functions, variables, lists, and scopes.
 * Provides registration and lookup for language intelligence providers.
 */
export class Registry {
  private readonly functions = new Map<string, FunctionDescriptor>();
  private readonly variables = new Map<string, string>();
  private readonly lists = new Set<string>();
  private readonly scopes = new Set<string>();

  /**
   * Registers a function descriptor.
   * @param desc - The function descriptor to register.
   */
  registerFunction(desc: FunctionDescriptor): void {
    this.functions.set(desc.name, desc);
  }

  /**
   * Registers a variable with its type.
   * @param name - The variable name (e.g. "amount").
   * @param type - The variable type (e.g. "double").
   */
  registerVariable(name: string, type: string): void {
    this.variables.set(name, type);
  }

  /**
   * Registers a named list.
   * @param name - The list name (e.g. "blocked_cards").
   */
  registerList(name: string): void {
    this.lists.add(name);
  }

  /**
   * Registers a scope name.
   * @param name - The scope name.
   */
  registerScope(name: string): void {
    this.scopes.add(name);
  }

  /**
   * Looks up a function by fully qualified name.
   * @param name - The function name (e.g. "history.count").
   * @returns The function descriptor, or undefined if not found.
   */
  getFunction(name: string): FunctionDescriptor | undefined {
    return this.functions.get(name);
  }

  /**
   * Returns all registered function descriptors.
   * @returns An array of all function descriptors.
   */
  getAllFunctions(): FunctionDescriptor[] {
    return [...this.functions.values()];
  }

  /**
   * Returns all registered list names.
   * @returns An array of list names.
   */
  getAllLists(): string[] {
    return [...this.lists];
  }

  /**
   * Returns all registered scope names.
   * @returns An array of scope names.
   */
  getAllScopes(): string[] {
    return [...this.scopes];
  }

  /**
   * Looks up a variable type by name.
   * @param name - The variable name.
   * @returns The variable type, or undefined if not found.
   */
  getVariable(name: string): string | undefined {
    return this.variables.get(name);
  }

  /**
   * Returns all registered variables as a read-only map.
   * @returns A new Map of variable name to type.
   */
  getAllVariables(): Map<string, string> {
    return new Map(this.variables);
  }
}
