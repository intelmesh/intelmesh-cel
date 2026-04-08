import { describe, it, expect, beforeEach } from 'vitest';
import { CelLanguage } from '../src/language.js';

describe('completion', () => {
  let lang: CelLanguage;

  beforeEach(() => {
    lang = new CelLanguage();
    lang.registerVariable('amount', 'double');
    lang.registerVariable('card_number', 'string');
    lang.registerList('blocked_cards');
    lang.registerList('vip_users');
    lang.registerScope('global');
    lang.registerScope('user');
  });

  describe('top-level completions', () => {
    it('returns namespaces, event, and keywords at start', () => {
      const items = lang.complete('', 0);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('history');
      expect(labels).toContain('score');
      expect(labels).toContain('list');
      expect(labels).toContain('event');
      expect(labels).toContain('true');
      expect(labels).toContain('false');
    });

    it('filters by typed prefix', () => {
      const items = lang.complete('his', 3);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('history');
      expect(labels).not.toContain('score');
    });
  });

  describe('namespace dot completions', () => {
    it('returns history methods after "history."', () => {
      const items = lang.complete('history.', 8);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('exists');
      expect(labels).toContain('count');
      expect(labels).toContain('sum');
      expect(labels).toContain('distinct_count');
      expect(labels).toContain('last');
      expect(labels).not.toContain('get');
    });

    it('returns score methods after "score."', () => {
      const items = lang.complete('score.', 6);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('get');
      expect(labels).toHaveLength(1);
    });

    it('returns list methods after "list."', () => {
      const items = lang.complete('list.', 5);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('contains');
      expect(labels).toHaveLength(1);
    });

    it('provides snippet insert text with placeholders', () => {
      const items = lang.complete('score.', 6);
      const getItem = items.find((i) => i.label === 'get');
      expect(getItem?.insertText).toBe('get(${1}, ${2})');
    });
  });

  describe('event field completions', () => {
    it('returns type and metadata after "event."', () => {
      const items = lang.complete('event.', 6);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('type');
      expect(labels).toContain('metadata');
    });

    it('returns registered variables after "event.metadata."', () => {
      const items = lang.complete('event.metadata.', 15);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('amount');
      expect(labels).toContain('card_number');
    });
  });

  describe('list name completions', () => {
    it('returns list names inside list.contains("', () => {
      const items = lang.complete('list.contains("', 15);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('blocked_cards');
      expect(labels).toContain('vip_users');
    });

    it('returns list names inside list.contains(\'', () => {
      const items = lang.complete("list.contains('", 15);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('blocked_cards');
    });
  });

  describe('scope name completions', () => {
    it('returns scope names inside map literal', () => {
      const items = lang.complete('{ ', 2);
      const labels = items.map((i) => i.label);
      expect(labels).toContain('global');
      expect(labels).toContain('user');
    });
  });

  describe('completion item properties', () => {
    it('function completions have correct kind', () => {
      const items = lang.complete('history.', 8);
      for (const item of items) {
        expect(item.kind).toBe('function');
      }
    });

    it('keyword completions have correct kind', () => {
      const items = lang.complete('tr', 2);
      const trueItem = items.find((i) => i.label === 'true');
      expect(trueItem?.kind).toBe('keyword');
    });
  });
});
