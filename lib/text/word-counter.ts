/**
 * Word counter statistics (spec §6.13).
 */

import {
  countGraphemes,
  countParagraphs,
  countSentences,
  splitWords,
  utf8ByteLength,
} from './segmentation';

export const READING_RATE_DEFAULT = 200;
export const SPEAKING_RATE_DEFAULT = 130;

/**
 * A small, deliberately English-only stop-word list.
 *
 * Documented as approximate on the page: keyword frequency in other languages
 * will include their own common function words.
 */
export const STOP_WORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'but', 'by', 'can', 'could', 'do', 'does', 'for',
  'from', 'had', 'has', 'have', 'he', 'her', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'it', 'its', 'just', 'me', 'more', 'most', 'my', 'no', 'not',
  'of', 'on', 'one', 'only', 'or', 'other', 'our', 'out', 'over', 'said', 'she',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'this', 'those', 'to', 'up', 'was', 'we', 'were', 'what',
  'when', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
]);

export type KeywordCount = { word: string; count: number };

export type WordCountResult = {
  words: number;
  charactersWithSpaces: number;
  charactersWithoutWhitespace: number;
  sentences: number;
  paragraphs: number;
  bytes: number;
  readingMinutes: number;
  speakingMinutes: number;
  keywords: KeywordCount[];
};

export function analyseText(
  text: string,
  options: { readingRate?: number; speakingRate?: number; locale?: string; topKeywords?: number } = {},
): WordCountResult {
  const readingRate = options.readingRate ?? READING_RATE_DEFAULT;
  const speakingRate = options.speakingRate ?? SPEAKING_RATE_DEFAULT;
  const topKeywords = options.topKeywords ?? 8;

  const words = splitWords(text, options.locale);

  return {
    words: words.length,
    charactersWithSpaces: countGraphemes(text, options.locale),
    charactersWithoutWhitespace: countGraphemes(text.replace(/\s/g, ''), options.locale),
    sentences: countSentences(text, options.locale),
    paragraphs: countParagraphs(text),
    bytes: utf8ByteLength(text),
    readingMinutes: readingRate > 0 ? words.length / readingRate : 0,
    speakingMinutes: speakingRate > 0 ? words.length / speakingRate : 0,
    keywords: topKeywordsFrom(words, topKeywords),
  };
}

/**
 * Literal string frequency, lowercased, with stop words removed.
 *
 * There is no stemming, so "run" and "running" count separately — stated on the
 * page rather than silently approximated.
 */
export function topKeywordsFrom(words: readonly string[], limit: number): KeywordCount[] {
  const counts = new Map<string, number>();

  for (const word of words) {
    const normalised = word.toLowerCase();
    if (normalised.length < 2) continue;
    if (STOP_WORDS.has(normalised)) continue;
    counts.set(normalised, (counts.get(normalised) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => (b.count === a.count ? a.word.localeCompare(b.word) : b.count - a.count))
    .slice(0, limit);
}

/** "about 3 minutes", or seconds when the text is short. */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 sec';
  if (minutes < 1) {
    const seconds = Math.max(1, Math.round(minutes * 60));
    return `${seconds} sec`;
  }
  const whole = Math.floor(minutes);
  const seconds = Math.round((minutes - whole) * 60);
  if (seconds === 0) return `${whole} min`;
  return `${whole} min ${seconds} sec`;
}
