import { describe, expect, it } from 'vitest';

import {
  CASE_MODES,
  convertCase,
  splitIntoWords,
  toAlternatingCase,
  toSentenceCase,
  toTitleCase,
} from '@/lib/text/case-converter';
import {
  countGraphemes,
  countLines,
  countParagraphs,
  countSentences,
  countWords,
  segmenterSupport,
  splitGraphemes,
  splitWords,
  utf8ByteLength,
} from '@/lib/text/segmentation';
import { analyseText, formatDuration, topKeywordsFrom } from '@/lib/text/word-counter';

const FAMILY = '\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}'; // 👨‍👩‍👧‍👦
const E_ACUTE_COMBINING = 'é'; // e + combining acute

describe('segmentation support', () => {
  it('reports Intl.Segmenter availability in this runtime', () => {
    const support = segmenterSupport();
    expect(support.graphemes).toBe(true);
    expect(support.words).toBe(true);
    expect(support.sentences).toBe(true);
  });
});

describe('grapheme counting', () => {
  it('counts a family emoji as one visible character', () => {
    // The spec reference case. UTF-16 length is 11 and UTF-8 is 25 bytes.
    expect(countGraphemes(FAMILY)).toBe(1);
    expect(FAMILY.length).toBe(11);
    expect(utf8ByteLength(FAMILY)).toBe(25);
  });

  it('counts a combining accent as one character', () => {
    expect(countGraphemes(E_ACUTE_COMBINING)).toBe(1);
    expect(E_ACUTE_COMBINING.length).toBe(2);
  });

  it('counts a skin-tone emoji as one character', () => {
    const wave = '\u{1F44B}\u{1F3FD}';
    expect(countGraphemes(wave)).toBe(1);
    expect(wave.length).toBe(4);
  });

  it('agrees with plain length for ASCII', () => {
    expect(countGraphemes('hello')).toBe(5);
    expect('hello'.length).toBe(5);
  });

  it('handles the empty string', () => {
    expect(countGraphemes('')).toBe(0);
    expect(splitGraphemes('')).toEqual([]);
  });

  it('splits into the same number of graphemes it counts', () => {
    const text = `a${FAMILY}b${E_ACUTE_COMBINING}c`;
    expect(splitGraphemes(text)).toHaveLength(countGraphemes(text));
    expect(countGraphemes(text)).toBe(5);
  });
});

describe('UTF-8 byte length', () => {
  it('matches the documented per-script costs', () => {
    expect(utf8ByteLength('abc')).toBe(3); // 1 byte each
    expect(utf8ByteLength('é')).toBe(2); // 2 bytes
    expect(utf8ByteLength('日')).toBe(3); // 3 bytes
    expect(utf8ByteLength('\u{1F600}')).toBe(4); // 4 bytes
  });
});

describe('word counting', () => {
  it('counts English words, excluding punctuation', () => {
    expect(countWords('Hello, world!')).toBe(2);
    expect(countWords('One two three four five')).toBe(5);
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('splits a hyphenated compound, following Unicode rules', () => {
    // Documented on the page: Unicode segmentation breaks on a hyphen, so this
    // reports 2 where a word processor reports 1. Pinned so the behaviour and
    // the prose stay in agreement.
    expect(countWords('well-known')).toBe(2);
    expect(countWords('state-of-the-art')).toBe(4);
  });

  it('does not join words across an em dash', () => {
    expect(countWords('this—that')).toBe(2);
  });

  it('counts scripts that do not separate words with spaces', () => {
    // A space-splitting implementation would report 1 for each of these.
    expect(countWords('私は学生です')).toBeGreaterThan(1);
    expect(countWords('这是一个测试')).toBeGreaterThan(1);
  });

  it('counts numbers and mixed tokens as words', () => {
    expect(countWords('I have 3 apples')).toBe(4);
  });

  it('is not confused by repeated whitespace or newlines', () => {
    expect(countWords('one   two\n\nthree\tfour')).toBe(4);
  });

  it('returns the words it counted', () => {
    expect(splitWords('Hello, world!')).toEqual(['Hello', 'world']);
  });
});

describe('sentence and paragraph counting', () => {
  it('counts sentences', () => {
    expect(countSentences('One. Two. Three.')).toBe(3);
    expect(countSentences('Just one')).toBe(1);
    expect(countSentences('')).toBe(0);
  });

  it('handles question and exclamation marks', () => {
    expect(countSentences('Really? Yes! Indeed.')).toBe(3);
  });

  it('counts paragraphs separated by blank lines', () => {
    expect(countParagraphs('First para.\n\nSecond para.')).toBe(2);
    expect(countParagraphs('One line only')).toBe(1);
    expect(countParagraphs('')).toBe(0);
    expect(countParagraphs('A\n\n\n\nB')).toBe(2);
  });

  it('counts lines the way an editor shows them', () => {
    expect(countLines('a\nb\nc')).toBe(3);
    expect(countLines('a\nb\nc\n')).toBe(3); // trailing newline adds none
    expect(countLines('single')).toBe(1);
    expect(countLines('')).toBe(0);
  });
});

describe('word counter statistics', () => {
  it('produces a consistent set of figures', () => {
    const text = 'The quick brown fox. It jumps over the lazy dog.';
    const result = analyseText(text);

    expect(result.words).toBe(10);
    expect(result.sentences).toBe(2);
    expect(result.paragraphs).toBe(1);
    expect(result.charactersWithSpaces).toBe(text.length);
    expect(result.charactersWithoutWhitespace).toBe(text.replace(/\s/g, '').length);
  });

  it('derives reading and speaking time from the default rates', () => {
    const text = Array.from({ length: 400 }, () => 'word').join(' ');
    const result = analyseText(text);

    expect(result.words).toBe(400);
    expect(result.readingMinutes).toBeCloseTo(400 / 200, 6);
    expect(result.speakingMinutes).toBeCloseTo(400 / 130, 6);
    // Speaking is always slower than reading at the defaults.
    expect(result.speakingMinutes).toBeGreaterThan(result.readingMinutes);
  });

  it('matches the worked example published on the page', () => {
    // 2,600 words: about 13 minutes reading, about 20 minutes speaking.
    const text = Array.from({ length: 2600 }, () => 'word').join(' ');
    const result = analyseText(text);
    expect(Math.round(result.readingMinutes)).toBe(13);
    expect(Math.round(result.speakingMinutes)).toBe(20);
  });

  it('honours custom rates', () => {
    const text = Array.from({ length: 300 }, () => 'word').join(' ');
    const result = analyseText(text, { readingRate: 300, speakingRate: 150 });
    expect(result.readingMinutes).toBeCloseTo(1, 6);
    expect(result.speakingMinutes).toBeCloseTo(2, 6);
  });

  it('excludes stop words from the keyword list', () => {
    const keywords = topKeywordsFrom(
      ['the', 'the', 'the', 'garden', 'garden', 'and', 'of', 'roses'],
      5,
    );
    expect(keywords.map((k) => k.word)).not.toContain('the');
    expect(keywords.map((k) => k.word)).not.toContain('and');
    expect(keywords[0]).toEqual({ word: 'garden', count: 2 });
  });

  it('counts keywords case-insensitively but does not stem', () => {
    const keywords = topKeywordsFrom(['Run', 'run', 'RUN', 'running'], 5);
    expect(keywords[0]).toEqual({ word: 'run', count: 3 });
    // No stemming: "running" is its own entry, as the page states.
    expect(keywords.map((k) => k.word)).toContain('running');
  });

  it('breaks keyword ties alphabetically for a stable list', () => {
    const keywords = topKeywordsFrom(['beta', 'alpha'], 5);
    expect(keywords.map((k) => k.word)).toEqual(['alpha', 'beta']);
  });

  it('formats durations readably', () => {
    expect(formatDuration(0)).toBe('0 sec');
    expect(formatDuration(0.5)).toBe('30 sec');
    expect(formatDuration(1)).toBe('1 min');
    expect(formatDuration(2.5)).toBe('2 min 30 sec');
    expect(formatDuration(0.001)).toBe('1 sec');
  });
});

describe('case conversion', () => {
  const source = 'user profile image URL';

  it('produces every convention from the published example', () => {
    expect(convertCase(source, 'lowercase')).toBe('user profile image url');
    expect(convertCase(source, 'uppercase')).toBe('USER PROFILE IMAGE URL');
    expect(convertCase(source, 'camel')).toBe('userProfileImageUrl');
    expect(convertCase(source, 'pascal')).toBe('UserProfileImageUrl');
    expect(convertCase(source, 'snake')).toBe('user_profile_image_url');
    expect(convertCase(source, 'kebab')).toBe('user-profile-image-url');
    expect(convertCase(source, 'constant')).toBe('USER_PROFILE_IMAGE_URL');
  });

  it('applies sentence case', () => {
    expect(toSentenceCase('hello world. goodbye world.')).toBe('Hello world. Goodbye world.');
    expect(toSentenceCase('ALL CAPS TEXT')).toBe('All caps text');
  });

  it('applies title case, keeping minor words lowercase inside', () => {
    expect(toTitleCase('the lord of the rings')).toBe('The Lord of the Rings');
    expect(toTitleCase('a tale of two cities')).toBe('A Tale of Two Cities');
    // A minor word at the end is still capitalised.
    expect(toTitleCase('what are you waiting for')).toBe('What Are You Waiting For');
  });

  it('splits existing camelCase and PascalCase back into words', () => {
    expect(splitIntoWords('userProfileImage')).toEqual(['user', 'Profile', 'Image']);
    expect(splitIntoWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
    expect(convertCase('userProfileImage', 'snake')).toBe('user_profile_image');
    expect(convertCase('XMLHttpRequest', 'kebab')).toBe('xml-http-request');
  });

  it('keeps digits with the word they touch', () => {
    expect(convertCase('address line 2', 'snake')).toBe('address_line_2');
    expect(convertCase('utf8 encoding', 'camel')).toBe('utf8Encoding');
  });

  it('collapses punctuation and repeated whitespace in identifier conversions', () => {
    expect(convertCase('  hello,   world!  ', 'kebab')).toBe('hello-world');
    expect(convertCase('a/b\\c', 'snake')).toBe('a_b_c');
  });

  it('alternates deterministically, ignoring non-letters', () => {
    // The alternation advances only on letters, so the same input always
    // yields the same output regardless of punctuation placement.
    expect(toAlternatingCase('abcdef')).toBe('aBcDeF');
    expect(toAlternatingCase('a b c')).toBe('a B c');
    expect(toAlternatingCase('a-b-c')).toBe('a-B-c');
    expect(toAlternatingCase('ab12cd')).toBe('aB12cD');

    const text = 'Hello, World! 123';
    expect(toAlternatingCase(text)).toBe(toAlternatingCase(text));
  });

  it('is locale-aware for Turkish dotted and dotless i', () => {
    // The case the page calls out: in Turkish, "i" uppercases to "İ".
    expect(convertCase('istanbul', 'uppercase', 'tr')).toBe('İSTANBUL');
    expect(convertCase('istanbul', 'uppercase', 'en')).toBe('ISTANBUL');
    expect(convertCase('I', 'lowercase', 'tr')).toBe('ı');
    expect(convertCase('I', 'lowercase', 'en')).toBe('i');
  });

  it('handles German sharp s', () => {
    expect(convertCase('straße', 'uppercase', 'de')).toBe('STRASSE');
  });

  it('preserves emoji and passes them through every mode', () => {
    for (const mode of CASE_MODES) {
      const result = convertCase(`hello ${FAMILY} world`, mode);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
    expect(convertCase(`hello ${FAMILY} world`, 'uppercase')).toContain(FAMILY);
  });

  it('returns an empty string unchanged in every mode', () => {
    for (const mode of CASE_MODES) {
      expect(convertCase('', mode), mode).toBe('');
    }
  });

  it('preserves line breaks in the prose conversions', () => {
    const text = 'first line\nsecond line';
    expect(convertCase(text, 'uppercase')).toBe('FIRST LINE\nSECOND LINE');
    expect(convertCase(text, 'lowercase')).toContain('\n');
  });

  it('handles apostrophes without breaking the word', () => {
    expect(toTitleCase("it's a test")).toBe("It's a Test");
    expect(convertCase("it's", 'snake')).toBe('it_s');
  });
});
