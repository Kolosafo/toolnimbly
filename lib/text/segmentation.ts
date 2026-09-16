/**
 * Unicode-aware text segmentation (spec §6.13, §6.14, Appendix A).
 *
 * `Intl.Segmenter` applies the Unicode segmentation rules, which is what makes
 * counting correct for scripts that do not separate words with spaces —
 * Japanese, Chinese, Thai — and what makes a family emoji count as one visible
 * character rather than eleven.
 *
 * Every function here has a documented fallback, and `segmenterSupport` reports
 * which path was used so the interface can say so rather than quietly being
 * less accurate.
 */

export type SegmentationSupport = {
  graphemes: boolean;
  words: boolean;
  sentences: boolean;
};

function hasSegmenter(granularity: 'grapheme' | 'word' | 'sentence'): boolean {
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return false;
  try {
    new Intl.Segmenter(undefined, { granularity });
    return true;
  } catch {
    return false;
  }
}

export function segmenterSupport(): SegmentationSupport {
  return {
    graphemes: hasSegmenter('grapheme'),
    words: hasSegmenter('word'),
    sentences: hasSegmenter('sentence'),
  };
}

const segmenterCache = new Map<string, Intl.Segmenter>();

function getSegmenter(
  granularity: 'grapheme' | 'word' | 'sentence',
  locale?: string,
): Intl.Segmenter | null {
  if (!hasSegmenter(granularity)) return null;
  const key = `${granularity}:${locale ?? 'default'}`;
  const cached = segmenterCache.get(key);
  if (cached) return cached;
  const segmenter = new Intl.Segmenter(locale, { granularity });
  segmenterCache.set(key, segmenter);
  return segmenter;
}

/**
 * Splits into graphemes — what a reader perceives as single characters.
 *
 * Fallback: `Array.from`, which splits by code point. That keeps astral
 * characters intact but separates emoji sequences and combining marks, so a
 * family emoji would count as seven rather than one. The interface discloses
 * this when `segmenterSupport().graphemes` is false.
 */
export function splitGraphemes(text: string, locale?: string): string[] {
  const segmenter = getSegmenter('grapheme', locale);
  if (!segmenter) return Array.from(text);
  return Array.from(segmenter.segment(text), (segment) => segment.segment);
}

export function countGraphemes(text: string, locale?: string): number {
  if (text.length === 0) return 0;
  const segmenter = getSegmenter('grapheme', locale);
  if (!segmenter) return Array.from(text).length;

  let count = 0;
  for (const _segment of segmenter.segment(text)) count += 1;
  return count;
}

/**
 * Word-like segments only.
 *
 * `isWordLike` is what excludes punctuation and whitespace, so "Hello, world!"
 * is two words rather than four segments.
 *
 * Fallback: split on whitespace and count non-empty runs containing at least
 * one letter or digit. That is wrong for scripts without spaces, which is
 * disclosed in the interface.
 */
export function splitWords(text: string, locale?: string): string[] {
  const segmenter = getSegmenter('word', locale);

  if (!segmenter) {
    return text
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0 && /[\p{L}\p{N}]/u.test(token));
  }

  const words: string[] = [];
  for (const segment of segmenter.segment(text)) {
    if (segment.isWordLike) words.push(segment.segment);
  }
  return words;
}

export function countWords(text: string, locale?: string): number {
  return splitWords(text, locale).length;
}

/**
 * Splits into sentences.
 *
 * Fallback: split after `.`, `!` or `?` followed by whitespace. Both paths are
 * rule-based and can be fooled by abbreviations such as "e.g." and by decimal
 * points, which the page documents as a limitation.
 */
export function splitSentences(text: string, locale?: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];

  const segmenter = getSegmenter('sentence', locale);

  if (!segmenter) {
    return trimmed
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }

  const sentences: string[] = [];
  for (const segment of segmenter.segment(trimmed)) {
    const sentence = segment.segment.trim();
    if (sentence.length > 0) sentences.push(sentence);
  }
  return sentences;
}

export function countSentences(text: string, locale?: string): number {
  return splitSentences(text, locale).length;
}

/** Paragraphs are blocks separated by one or more blank lines. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

export function countParagraphs(text: string): number {
  return splitParagraphs(text).length;
}

/** Lines, counted the way an editor shows them. A trailing newline adds none. */
export function countLines(text: string): number {
  if (text.length === 0) return 0;
  const withoutTrailingNewline = text.replace(/\r?\n$/, '');
  return withoutTrailingNewline.split(/\r?\n/).length;
}

/** UTF-8 byte length, which is what storage and network limits measure. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
