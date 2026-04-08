import { describe, it, expect, beforeEach } from 'vitest';
import { Registry } from '../src/registry.js';
import type { FunctionDescriptor } from '../src/types.js';

describe('Registry', () => {
  let registry: Registry;

  beforeEach(() => {
    registry = new Registry();
  });

  describe('functions', () => {
    const fn: FunctionDescriptor = {
      name: 'history.count',
      params: [
        { name: 'event_type', type: 'string' },
        { name: 'field', type: 'string' },
        { name: 'value', type: 'string' },
        { name: 'duration', type: 'string' },
      ],
      returnType: 'int',
      description: 'Counts events.',
    };

    it('registers and retrieves a function', () => {
      registry.registerFunction(fn);
      expect(registry.getFunction('history.count')).toBe(fn);
    });

    it('returns undefined for unknown functions', () => {
      expect(registry.getFunction('unknown')).toBeUndefined();
    });

    it('returns all registered functions', () => {
      registry.registerFunction(fn);
      expect(registry.getAllFunctions()).toHaveLength(1);
      expect(registry.getAllFunctions()[0]).toBe(fn);
    });
  });

  describe('variables', () => {
    it('registers and retrieves a variable', () => {
      registry.registerVariable('amount', 'double');
      expect(registry.getVariable('amount')).toBe('double');
    });

    it('returns undefined for unknown variables', () => {
      expect(registry.getVariable('unknown')).toBeUndefined();
    });

    it('returns all variables as a map', () => {
      registry.registerVariable('amount', 'double');
      registry.registerVariable('card_number', 'string');
      const vars = registry.getAllVariables();
      expect(vars.size).toBe(2);
      expect(vars.get('amount')).toBe('double');
      expect(vars.get('card_number')).toBe('string');
    });
  });

  describe('lists', () => {
    it('registers and retrieves lists', () => {
      registry.registerList('blocked_cards');
      registry.registerList('vip_users');
      const lists = registry.getAllLists();
      expect(lists).toContain('blocked_cards');
      expect(lists).toContain('vip_users');
    });

    it('returns empty array when no lists registered', () => {
      expect(registry.getAllLists()).toEqual([]);
    });

    it('deduplicates list names', () => {
      registry.registerList('blocked_cards');
      registry.registerList('blocked_cards');
      expect(registry.getAllLists()).toHaveLength(1);
    });
  });

  describe('scopes', () => {
    it('registers and retrieves scopes', () => {
      registry.registerScope('global');
      registry.registerScope('user');
      const scopes = registry.getAllScopes();
      expect(scopes).toContain('global');
      expect(scopes).toContain('user');
    });

    it('returns empty array when no scopes registered', () => {
      expect(registry.getAllScopes()).toEqual([]);
    });
  });
});
