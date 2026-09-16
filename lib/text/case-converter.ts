/**
 * Case conversion (spec §6.15).
 *
 * Prose conversions change letter casing and leave structure alone. Identifier
 * conversions split into words first, then rejoin with the target separator —
 * which is lossy, and stated as such on the page.
 */

export const CASE_MODES = [
  'lowercase',
  'uppercase',
  'sentence',
  'title',
  'camel',
  'pascal',
  'snake',
  'kebab',
  'constant',
  'alternating',
] as const;

export type CaseMode = (typeof CASE_MODES)[number];

export const CASE_LABELS: Record<CaseMode, string> = {
  lowercase: 'lowercase',
  uppercase: 'UPPERCASE',
  sentence: 'Sentence case',
  title: 'Title Case',
  camel: 'camelCase',
  pascal: 'PascalCase',
  snake: 'snake_case',
  kebab: 'kebab-case',
  constant: 'CONSTANT_CASE',
  alternating: 'aLtErNaTiNg',
};

/**
 * Words kept lowercase inside a title unless they open or close it.
 * Documented on the page: this cannot know a proper noun or a brand name.
 */
const TITLE_MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'if', 'in', 'into',
  'nor', 'of', 'off', 'on', 'onto', 'or', 'over', 'per', 'the', 'to', 'up',
  'via', 'with', 'yet',
]);

/**
 * Splits text into words for the identifier conversions.
 *
 * Breaks on whitespace and punctuation, and on case boundaries so an existing
 * camelCase or PascalCase input round-trips sensibly. Digits are kept with the
 * word they touch, and an acronym run is treated as one word.
 */
export function splitIntoWords(text: string): string[] {
  return (
    text
      // Insert a break between a lowercase/digit and a following uppercase.
      .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
      // And between an acronym run and a following capitalised word.
      .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length > 0)
  );
}

function capitalise(word: string, locale?: string): string {
  if (word.length === 0) return word;
  const [first, ...rest] = [...word];
  if (first === undefined) return word;
  return (
    first.toLocaleUpperCase(locale) + rest.join('').toLocaleLowerCase(locale)
  );
}

export function toSentenceCase(text: string, locale?: string): string {
  const lowered = text.toLocaleLowerCase(locale);
  // Capitalise the first letter of the text and of anything following a
  // sentence terminator.
  return lowered.replace(
    /(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu,
    (_match, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase(locale),
  );
}

export function toTitleCase(text: string, locale?: string): string {
  const words = text.split(/(\s+)/);
  const wordIndices = words
    .map((token, index) => ({ token, index }))
    .filter(({ token }) => token.trim().length > 0)
    .map(({ index }) => index);

  const firstIndex = wordIndices[0];
  const lastIndex = wordIndices[wordIndices.length - 1];

  return words
    .map((token, index) => {
      if (token.trim().length === 0) return token;
      const bare = token.toLocaleLowerCase(locale);
      const isEdge = index === firstIndex || index === lastIndex;
      // Compare the word without surrounding punctuation, so "(the" is caught.
      const core = bare.replace(/[^\p{L}\p{N}]/gu, '');
      if (!isEdge && TITLE_MINOR_WORDS.has(core)) return bare;
      return token.replace(/\p{L}[\p{L}\p{N}']*/u, (word) => capitalise(word, locale));
    })
    .join('');
}

/**
 * Alternating case, starting lowercase.
 *
 * The alternation advances only on letters, so punctuation and digits never
 * flip the pattern. That makes the output deterministic for a given input,
 * which a position-based implementation is not.
 */
export function toAlternatingCase(text: string, locale?: string): string {
  let upper = false;
  let result = '';

  for (const character of text) {
    const lower = character.toLocaleLowerCase(locale);
    const upperCase = character.toLocaleUpperCase(locale);
    const isLetter = lower !== upperCase;

    if (!isLetter) {
      result += character;
      continue;
    }

    result += upper ? upperCase : lower;
    upper = !upper;
  }

  return result;
}

export function convertCase(text: string, mode: CaseMode, locale?: string): string {
  if (text.length === 0) return '';

  switch (mode) {
    case 'lowercase':
      return text.toLocaleLowerCase(locale);
    case 'uppercase':
      return text.toLocaleUpperCase(locale);
    case 'sentence':
      return toSentenceCase(text, locale);
    case 'title':
      return toTitleCase(text, locale);
    case 'camel': {
      const words = splitIntoWords(text);
      return words
        .map((word, index) =>
          index === 0 ? word.toLocaleLowerCase(locale) : capitalise(word, locale),
        )
        .join('');
    }
    case 'pascal':
      return splitIntoWords(text)
        .map((word) => capitalise(word, locale))
        .join('');
    case 'snake':
      return splitIntoWords(text)
        .map((word) => word.toLocaleLowerCase(locale))
        .join('_');
    case 'kebab':
      return splitIntoWords(text)
        .map((word) => word.toLocaleLowerCase(locale))
        .join('-');
    case 'constant':
      return splitIntoWords(text)
        .map((word) => word.toLocaleUpperCase(locale))
        .join('_');
    case 'alternating':
      return toAlternatingCase(text, locale);
    default:
      return text;
  }
}
