import { describe, expect, it } from 'vitest';

import {
  describePages,
  groupIntoRuns,
  invertPages,
  parsePageRanges,
} from '@/lib/pdf/page-ranges';

describe('page range parsing', () => {
  it('matches the spec reference case without an off-by-one', () => {
    const result = parsePageRanges('1-3, 5', 10);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.pages).toEqual([1, 2, 3, 5]);
  });

  it('parses the example published on the splitter page', () => {
    const result = parsePageRanges('1-3, 5, 8-10', 12);
    expect(result.ok && result.pages).toEqual([1, 2, 3, 5, 8, 9, 10]);
  });

  it('is one-based, matching what a viewer shows', () => {
    const result = parsePageRanges('1', 5);
    expect(result.ok && result.pages).toEqual([1]);
  });

  it('ignores whitespace entirely', () => {
    const compact = parsePageRanges('1-3,5', 10);
    const spaced = parsePageRanges('  1 - 3 ,   5  ', 10);
    expect(compact.ok && compact.pages).toEqual(spaced.ok && spaced.pages);
  });

  it('reads a reversed range ascending and says so', () => {
    const result = parsePageRanges('5-3', 10);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pages).toEqual([3, 4, 5]);
    expect(result.notes.join(' ')).toMatch(/ascending/i);
  });

  it('collapses duplicates and says so', () => {
    const result = parsePageRanges('2, 2, 4', 10);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pages).toEqual([2, 4]);
    expect(result.notes.join(' ')).toMatch(/once/i);
  });

  it('merges overlapping ranges', () => {
    const result = parsePageRanges('1-3, 2-5', 10);
    expect(result.ok && result.pages).toEqual([1, 2, 3, 4, 5]);
  });

  it('accepts "all"', () => {
    const result = parsePageRanges('all', 4);
    expect(result.ok && result.pages).toEqual([1, 2, 3, 4]);
    expect(parsePageRanges('ALL', 3).ok).toBe(true);
  });

  it('refuses a page beyond the document, quoting the valid range', () => {
    const result = parsePageRanges('1-3, 15', 12);
    expect(result.ok).toBe(false);
    // The spec's example error phrasing.
    if (!result.ok) {
      expect(result.error).toContain('Page 15 is outside this 12-page document');
      expect(result.error).toContain('from 1 to 12');
    }
  });

  it('refuses page zero', () => {
    expect(parsePageRanges('0', 10).ok).toBe(false);
    expect(parsePageRanges('0-3', 10).ok).toBe(false);
  });

  it('explains an invalid token rather than dropping it', () => {
    const result = parsePageRanges('1, abc, 3', 10);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('"abc"');
      expect(result.error).toMatch(/1-3, 5, 8-10/);
    }
  });

  it('refuses malformed range syntax', () => {
    for (const input of ['1--3', '1-', '-3', '1-2-3', '1.5']) {
      expect(parsePageRanges(input, 10).ok, input).toBe(false);
    }
  });

  it('refuses an empty selection', () => {
    expect(parsePageRanges('', 10).ok).toBe(false);
    expect(parsePageRanges('   ', 10).ok).toBe(false);
    expect(parsePageRanges(',,,', 10).ok).toBe(false);
  });

  it('refuses any selection against an empty document', () => {
    expect(parsePageRanges('1', 0).ok).toBe(false);
  });

  it('normalises back into compact notation', () => {
    const result = parsePageRanges('5, 1, 2, 3, 9', 10);
    expect(result.ok && result.normalized).toBe('1-3, 5, 9');
  });
});

describe('page list formatting', () => {
  it('collapses consecutive runs', () => {
    expect(describePages([1, 2, 3, 5, 8, 9, 10])).toBe('1-3, 5, 8-10');
    expect(describePages([1])).toBe('1');
    expect(describePages([1, 3, 5])).toBe('1, 3, 5');
    expect(describePages([])).toBe('');
  });

  it('round-trips through the parser', () => {
    for (const pages of [[1, 2, 3, 5], [2], [1, 4, 5, 6, 9]]) {
      const text = describePages(pages);
      const parsed = parsePageRanges(text, 20);
      expect(parsed.ok && parsed.pages, text).toEqual(pages);
    }
  });
});

describe('inverting a selection', () => {
  it('returns the pages that were not selected', () => {
    expect(invertPages([2, 4], 6)).toEqual([1, 3, 5, 6]);
    expect(invertPages([1], 3)).toEqual([2, 3]);
  });

  it('returns nothing when every page is selected', () => {
    expect(invertPages([1, 2, 3], 3)).toEqual([]);
  });

  it('returns everything when nothing is selected', () => {
    expect(invertPages([], 3)).toEqual([1, 2, 3]);
  });
});

describe('grouping into runs', () => {
  it('splits a selection into contiguous documents', () => {
    expect(groupIntoRuns([1, 2, 3, 7, 8, 9])).toEqual([
      [1, 2, 3],
      [7, 8, 9],
    ]);
  });

  it('treats isolated pages as their own runs', () => {
    expect(groupIntoRuns([1, 3, 5])).toEqual([[1], [3], [5]]);
  });

  it('returns a single run for consecutive pages', () => {
    expect(groupIntoRuns([4, 5, 6])).toEqual([[4, 5, 6]]);
  });

  it('handles an empty selection', () => {
    expect(groupIntoRuns([])).toEqual([]);
  });

  it('never loses a page', () => {
    const pages = [1, 2, 5, 6, 7, 10];
    expect(groupIntoRuns(pages).flat()).toEqual(pages);
  });
});
