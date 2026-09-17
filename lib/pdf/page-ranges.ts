/**
 * Page selection parsing (spec §6.24, §6.28).
 *
 * Page numbers are one-based, matching what a PDF viewer displays, so there is
 * never an off-by-one between what the user types and what they get.
 *
 * Invalid tokens are explained rather than silently dropped: a selection that
 * quietly ignored "12" on a 10-page document would produce a wrong file with no
 * indication why.
 */

export type PageRangeResult =
  | { ok: true; pages: number[]; normalized: string; notes: string[] }
  | { ok: false; error: string };

/**
 * Parses a selection such as `1-3, 5, 8-10`.
 *
 * Whitespace is insignificant, reversed ranges are read ascending, and
 * duplicates and overlaps are merged — all unambiguous intents, so refusing
 * them would be pedantry rather than safety.
 */
export function parsePageRanges(input: string, pageCount: number): PageRangeResult {
  const trimmed = input.trim();

  if (pageCount <= 0) {
    return { ok: false, error: 'This document has no pages to select.' };
  }

  if (trimmed.length === 0) {
    return { ok: false, error: `Enter a page selection, for example 1-${Math.min(3, pageCount)}.` };
  }

  if (/^all$/i.test(trimmed)) {
    const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
    return { ok: true, pages, normalized: describePages(pages), notes: [] };
  }

  const selected = new Set<number>();
  const notes: string[] = [];
  let sawReversed = false;
  let sawDuplicate = false;

  const tokens = trimmed.split(',');

  for (const rawToken of tokens) {
    const token = rawToken.trim().replace(/\s+/g, '');
    if (token.length === 0) continue;

    const rangeMatch = /^(\d+)-(\d+)$/.exec(token);
    const singleMatch = /^(\d+)$/.exec(token);

    if (rangeMatch) {
      const first = Number(rangeMatch[1]);
      const second = Number(rangeMatch[2]);

      const outOfRange = [first, second].find((page) => page < 1 || page > pageCount);
      if (outOfRange !== undefined) {
        return { ok: false, error: outOfRangeMessage(outOfRange, pageCount) };
      }

      const start = Math.min(first, second);
      const end = Math.max(first, second);
      if (first > second) sawReversed = true;

      for (let page = start; page <= end; page += 1) {
        if (selected.has(page)) sawDuplicate = true;
        selected.add(page);
      }
      continue;
    }

    if (singleMatch) {
      const page = Number(singleMatch[1]);
      if (page < 1 || page > pageCount) {
        return { ok: false, error: outOfRangeMessage(page, pageCount) };
      }
      if (selected.has(page)) sawDuplicate = true;
      selected.add(page);
      continue;
    }

    return {
      ok: false,
      error: `"${rawToken.trim()}" is not a page or a range. Use numbers and ranges separated by commas, for example 1-3, 5, 8-10.`,
    };
  }

  if (selected.size === 0) {
    return { ok: false, error: `Enter a page selection, for example 1-${Math.min(3, pageCount)}.` };
  }

  if (sawReversed) notes.push('A reversed range was read in ascending order.');
  if (sawDuplicate) notes.push('Repeated pages were included once.');

  const pages = [...selected].sort((a, b) => a - b);
  return { ok: true, pages, normalized: describePages(pages), notes };
}

function outOfRangeMessage(page: number, pageCount: number): string {
  return `Page ${page} is outside this ${pageCount}-page document. Enter a range from 1 to ${pageCount}.`;
}

/** Renders a page list back into compact range notation. */
export function describePages(pages: readonly number[]): string {
  if (pages.length === 0) return '';

  const sorted = [...pages].sort((a, b) => a - b);
  const parts: string[] = [];

  let start = sorted[0] as number;
  let previous = start;

  for (let index = 1; index <= sorted.length; index += 1) {
    const current = sorted[index];

    if (current !== undefined && current === previous + 1) {
      previous = current;
      continue;
    }

    parts.push(start === previous ? String(start) : `${start}-${previous}`);
    if (current === undefined) break;
    start = current;
    previous = current;
  }

  return parts.join(', ');
}

/** The pages left after removing a selection, for the splitter's delete mode. */
export function invertPages(pages: readonly number[], pageCount: number): number[] {
  const removed = new Set(pages);
  const kept: number[] = [];
  for (let page = 1; page <= pageCount; page += 1) {
    if (!removed.has(page)) kept.push(page);
  }
  return kept;
}

/**
 * Splits a selection into contiguous runs.
 *
 * Used by the splitter's by-range mode, where `1-3, 7-9` produces two documents
 * rather than one of six pages.
 */
export function groupIntoRuns(pages: readonly number[]): number[][] {
  if (pages.length === 0) return [];

  const sorted = [...pages].sort((a, b) => a - b);
  const runs: number[][] = [];
  let current: number[] = [sorted[0] as number];

  for (let index = 1; index < sorted.length; index += 1) {
    const page = sorted[index] as number;
    const previous = sorted[index - 1] as number;

    if (page === previous + 1) {
      current.push(page);
    } else {
      runs.push(current);
      current = [page];
    }
  }

  runs.push(current);
  return runs;
}
