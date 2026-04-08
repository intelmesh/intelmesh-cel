import { describe, it, expect, beforeEach } from 'vitest';
import { CelLanguage } from '../src/language.js';

describe('diagnostics', () => {
  let lang: CelLanguage;

  beforeEach(() => {
    lang = new CelLanguage();
    lang.registerList('blocked_cards');
  });

  describe('unclosed delimiters', () => {
    it('reports unclosed parenthesis', () => {
      const diags = lang.diagnose('history.count(');
      const unclosed = diags.find((d) => d.code === 'unclosed-delimiter');
      expect(unclosed).toBeDefined();
      expect(unclosed?.severity).toBe('error');
    });

    it('reports unclosed bracket', () => {
      const diags = lang.diagnose('[1, 2, 3');
      const unclosed = diags.find((d) => d.code === 'unclosed-delimiter');
      expect(unclosed).toBeDefined();
    });

    it('does not report matched delimiters', () => {
      const diags = lang.diagnose('(1 + 2)');
      const unclosed = diags.filter((d) => d.code === 'unclosed-delimiter');
      expect(unclosed).toHaveLength(0);
    });
  });

  describe('invalid tokens', () => {
    it('reports unclosed strings', () => {
      const diags = lang.diagnose('"unclosed');
      const invalid = diags.find((d) => d.code === 'invalid-token');
      expect(invalid).toBeDefined();
      expect(invalid?.severity).toBe('error');
    });
  });

  describe('unknown functions', () => {
    it('reports unknown function name', () => {
      const diags = lang.diagnose('history.foo()');
      const unknown = diags.find((d) => d.code === 'unknown-function');
      expect(unknown).toBeDefined();
      expect(unknown?.message).toContain('history.foo');
    });

    it('suggests similar function name', () => {
      const diags = lang.diagnose('history.cont()');
      const unknown = diags.find((d) => d.code === 'unknown-function');
      expect(unknown).toBeDefined();
      expect(unknown?.message).toContain('Did you mean');
      expect(unknown?.message).toContain('history.count');
    });

    it('does not report known functions', () => {
      const diags = lang.diagnose(
        'history.count("purchase", "card", "val", "24h")',
      );
      const unknown = diags.filter((d) => d.code === 'unknown-function');
      expect(unknown).toHaveLength(0);
    });
  });

  describe('wrong argument count', () => {
    it('reports wrong argument count', () => {
      const diags = lang.diagnose('history.count("a", "b")');
      const wrong = diags.find((d) => d.code === 'wrong-arg-count');
      expect(wrong).toBeDefined();
      expect(wrong?.message).toContain('4');
      expect(wrong?.message).toContain('2');
    });

    it('does not report correct argument count', () => {
      const diags = lang.diagnose(
        'history.count("purchase", "card", "val", "24h")',
      );
      const wrong = diags.filter((d) => d.code === 'wrong-arg-count');
      expect(wrong).toHaveLength(0);
    });
  });

  describe('unknown lists', () => {
    it('warns about unknown list names', () => {
      const diags = lang.diagnose(
        'list.contains("unknown_list", event.metadata.card)',
      );
      const unknown = diags.find((d) => d.code === 'unknown-list');
      expect(unknown).toBeDefined();
      expect(unknown?.severity).toBe('warning');
      expect(unknown?.message).toContain('unknown_list');
    });

    it('does not warn about known list names', () => {
      const diags = lang.diagnose(
        'list.contains("blocked_cards", event.metadata.card)',
      );
      const unknown = diags.filter((d) => d.code === 'unknown-list');
      expect(unknown).toHaveLength(0);
    });
  });

  describe('valid expressions', () => {
    it('returns no diagnostics for a valid expression', () => {
      const diags = lang.diagnose(
        'history.count("purchase", "card_number", event.metadata.card_number, "24h") > 5',
      );
      expect(diags).toHaveLength(0);
    });

    it('returns no diagnostics for simple boolean', () => {
      const diags = lang.diagnose('true');
      expect(diags).toHaveLength(0);
    });
  });
});
