import { describe, it, expect, beforeEach } from 'vitest';
import { CelLanguage } from '../src/language.js';

describe('hover', () => {
  let lang: CelLanguage;

  beforeEach(() => {
    lang = new CelLanguage();
    lang.registerVariable('amount', 'double');
    lang.registerVariable('card_number', 'string');
  });

  describe('function hover', () => {
    it('shows documentation for history.count', () => {
      const text = 'history.count("purchase", "card", "val", "24h")';
      // Position in the middle of "history" (offset 3)
      const info = lang.hover(text, 3);
      expect(info).not.toBeNull();
      expect(info?.content).toContain('history.count');
      expect(info?.content).toContain('Counts');
    });

    it('shows documentation for score.get', () => {
      const text = 'score.get("fraud_score", "key")';
      const info = lang.hover(text, 1);
      expect(info).not.toBeNull();
      expect(info?.content).toContain('score.get');
    });

    it('includes examples in hover', () => {
      const text = 'history.count("purchase", "card", "val", "24h")';
      const info = lang.hover(text, 3);
      expect(info?.content).toContain('Examples');
    });

    it('shows correct range for function', () => {
      const text = 'history.count("a", "b", "c", "d")';
      const info = lang.hover(text, 3);
      expect(info?.range.start).toBe(0);
      // "history.count" spans 0..13
      expect(info?.range.end).toBe(13);
    });
  });

  describe('variable hover', () => {
    it('shows type for event.metadata.amount', () => {
      const text = 'event.metadata.amount > 100';
      // Position within "event" (offset 2)
      const info = lang.hover(text, 2);
      expect(info).not.toBeNull();
      expect(info?.content).toContain('double');
    });

    it('shows event hover for bare "event"', () => {
      const text = 'event == "purchase"';
      const info = lang.hover(text, 2);
      expect(info).not.toBeNull();
      expect(info?.content).toContain('event');
    });
  });

  describe('keyword hover', () => {
    it('shows info for "true" keyword', () => {
      const text = 'true';
      const info = lang.hover(text, 1);
      expect(info).not.toBeNull();
      expect(info?.content).toContain('true');
      expect(info?.content).toContain('keyword');
    });

    it('shows info for "in" keyword', () => {
      const text = 'x in list';
      const info = lang.hover(text, 3);
      expect(info).not.toBeNull();
      expect(info?.content).toContain('in');
    });
  });

  describe('no hover', () => {
    it('returns null for operators', () => {
      const text = 'a > b';
      const info = lang.hover(text, 2);
      expect(info).toBeNull();
    });

    it('returns null for whitespace', () => {
      const text = 'a   b';
      const info = lang.hover(text, 2);
      expect(info).toBeNull();
    });

    it('returns null for empty text', () => {
      const info = lang.hover('', 0);
      expect(info).toBeNull();
    });
  });
});
