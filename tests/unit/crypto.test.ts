import { describe, expect, it, vi } from 'vitest';

import {
  calculateEntropyBits,
  CHARACTER_SETS,
  DEFAULT_PASSWORD_OPTIONS,
  describeStrength,
  generatePassword,
  PASSWORD_LENGTH,
  resolveAlphabets,
  type PasswordOptions,
} from '@/lib/crypto/password';
import { randomInt, secureShuffle } from '@/lib/crypto/random';
import {
  formatUuid,
  generateUuids,
  generateUuidV4,
  isValidUuidV4,
  UUID_V4_PATTERN,
} from '@/lib/crypto/uuid';

const options = (overrides: Partial<PasswordOptions> = {}): PasswordOptions => ({
  ...DEFAULT_PASSWORD_OPTIONS,
  ...overrides,
});

describe('random primitives', () => {
  it('never calls Math.random', () => {
    const spy = vi.spyOn(Math, 'random');

    generatePassword(options({ length: 32 }));
    generateUuids(20);
    secureShuffle([1, 2, 3, 4, 5, 6, 7, 8]);
    for (let i = 0; i < 50; i += 1) randomInt(37);

    expect(spy).not.toHaveBeenCalled();
  });

  it('stays within bounds', () => {
    for (const bound of [1, 2, 7, 26, 92, 1000]) {
      for (let i = 0; i < 200; i += 1) {
        const value = randomInt(bound);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(bound);
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });

  it('rejects an invalid bound', () => {
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(-5)).toThrow(RangeError);
    expect(() => randomInt(2.5)).toThrow(RangeError);
  });

  it('distributes roughly uniformly, with no modulo bias at the low end', () => {
    // A modulo implementation biases towards low values. With 92 buckets and
    // 92,000 draws, each bucket should be near 1,000; a biased generator skews
    // the first 20 or so buckets measurably above the rest over many runs.
    const buckets = new Array<number>(92).fill(0);
    const draws = 92_000;
    for (let i = 0; i < draws; i += 1) {
      const bucket = randomInt(92);
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    }

    const expected = draws / 92;
    for (const count of buckets) {
      // ±25% is loose enough to be stable and tight enough to catch a
      // systematic skew.
      expect(count).toBeGreaterThan(expected * 0.75);
      expect(count).toBeLessThan(expected * 1.25);
    }

    const firstTwenty = buckets.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
    const rest = buckets.slice(20).reduce((a, b) => a + b, 0) / 72;
    expect(Math.abs(firstTwenty - rest) / expected).toBeLessThan(0.1);
  });

  it('shuffles without losing or duplicating elements', () => {
    const input = Array.from({ length: 50 }, (_, i) => i);
    for (let run = 0; run < 20; run += 1) {
      const shuffled = secureShuffle(input);
      expect(shuffled).toHaveLength(input.length);
      expect([...shuffled].sort((a, b) => a - b)).toEqual(input);
    }
  });

  it('does not modify the input array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    secureShuffle(input);
    expect(input).toEqual(copy);
  });

  it('actually reorders over repeated runs', () => {
    const input = Array.from({ length: 24 }, (_, i) => i);
    const identical = Array.from({ length: 30 }, () =>
      secureShuffle(input).every((value, index) => value === input[index]),
    ).filter(Boolean).length;
    // The chance of even one identity permutation of 24 elements is negligible.
    expect(identical).toBe(0);
  });
});

describe('password generation', () => {
  it('honours the requested length exactly', () => {
    for (const length of [8, 12, 20, 64, 128]) {
      const result = generatePassword(options({ length }));
      expect(result.ok, `length ${length}`).toBe(true);
      if (result.ok) expect([...result.password]).toHaveLength(length);
    }
  });

  it('draws only from the selected sets', () => {
    const result = generatePassword(
      options({ length: 60, uppercase: false, symbols: false, requireEachSet: false }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const allowed = CHARACTER_SETS.lowercase + CHARACTER_SETS.numbers;
    for (const character of result.password) {
      expect(allowed.includes(character), `unexpected "${character}"`).toBe(true);
    }
  });

  it('includes one character from every selected set when required', () => {
    for (let run = 0; run < 40; run += 1) {
      const result = generatePassword(options({ length: 8, requireEachSet: true }));
      expect(result.ok).toBe(true);
      if (!result.ok) continue;

      expect([...result.password].some((c) => CHARACTER_SETS.lowercase.includes(c))).toBe(true);
      expect([...result.password].some((c) => CHARACTER_SETS.uppercase.includes(c))).toBe(true);
      expect([...result.password].some((c) => CHARACTER_SETS.numbers.includes(c))).toBe(true);
      expect([...result.password].some((c) => CHARACTER_SETS.symbols.includes(c))).toBe(true);
    }
  });

  it('shuffles the guaranteed characters rather than leaving them at the front', () => {
    // Without a shuffle the first four characters would always be
    // lowercase, uppercase, digit, symbol in that order.
    let inOriginalOrder = 0;
    const runs = 60;

    for (let run = 0; run < runs; run += 1) {
      const result = generatePassword(options({ length: 16, requireEachSet: true }));
      if (!result.ok) continue;
      const [a, b, c, d] = [...result.password];
      if (
        a !== undefined &&
        b !== undefined &&
        c !== undefined &&
        d !== undefined &&
        CHARACTER_SETS.lowercase.includes(a) &&
        CHARACTER_SETS.uppercase.includes(b) &&
        CHARACTER_SETS.numbers.includes(c) &&
        CHARACTER_SETS.symbols.includes(d)
      ) {
        inOriginalOrder += 1;
      }
    }

    // Some coincidences are expected; a missing shuffle gives all 60.
    expect(inOriginalOrder).toBeLessThan(runs / 4);
  });

  it('excludes ambiguous characters when asked', () => {
    const result = generatePassword(options({ length: 128, excludeAmbiguous: true }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const character of 'Il1O0o') {
      expect(result.password.includes(character), `found "${character}"`).toBe(false);
    }
  });

  it('shrinks the alphabet when ambiguous characters are excluded', () => {
    const full = resolveAlphabets(options({ excludeAmbiguous: false }));
    const filtered = resolveAlphabets(options({ excludeAmbiguous: true }));
    expect(filtered.lowercase.length).toBeLessThan(full.lowercase.length);
    expect(filtered.numbers.length).toBeLessThan(full.numbers.length);
  });

  it('refuses a configuration with no character sets', () => {
    const result = generatePassword(
      options({ lowercase: false, uppercase: false, numbers: false, symbols: false }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/at least one character set/i);
  });

  it('refuses when required sets outnumber the length', () => {
    const result = generatePassword(options({ length: 8, requireEachSet: true }));
    expect(result.ok).toBe(true); // 4 sets fit in 8

    // Force the impossible case by shortening below the set count.
    const impossible = generatePassword({
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 3,
      requireEachSet: true,
    });
    expect(impossible.ok).toBe(false);
  });

  it('refuses a length outside the documented range', () => {
    expect(generatePassword(options({ length: PASSWORD_LENGTH.min - 1 })).ok).toBe(false);
    expect(generatePassword(options({ length: PASSWORD_LENGTH.max + 1 })).ok).toBe(false);
    expect(generatePassword(options({ length: 12.5 })).ok).toBe(false);
  });

  it('produces a different password each time', () => {
    const seen = new Set<string>();
    for (let run = 0; run < 100; run += 1) {
      const result = generatePassword(options({ length: 20 }));
      if (result.ok) seen.add(result.password);
    }
    expect(seen.size).toBe(100);
  });

  it('reports the exact alphabet and entropy figures published on the page', () => {
    // The page states "lowercase 26 · uppercase 26 · digits 10 · symbols 27"
    // and "89 characters → about 6.48 bits per character". Pinned here so the
    // prose cannot drift away from the implementation.
    expect(CHARACTER_SETS.lowercase).toHaveLength(26);
    expect(CHARACTER_SETS.uppercase).toHaveLength(26);
    expect(CHARACTER_SETS.numbers).toHaveLength(10);
    expect(CHARACTER_SETS.symbols).toHaveLength(27);

    const result = generatePassword(options({ length: 20 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.alphabetSize).toBe(89);
    expect(Math.log2(89)).toBeCloseTo(6.48, 2);
    expect(result.entropyBits).toBeCloseTo(calculateEntropyBits(89, 20), 6);
  });

  it('matches the published entropy table exactly', () => {
    // 8 → 52 bits, 12 → 78, 16 → 104, 20 → 130.
    const expected: Record<number, number> = { 8: 52, 12: 78, 16: 104, 20: 130 };
    for (const [length, bits] of Object.entries(expected)) {
      const result = generatePassword(options({ length: Number(length) }));
      expect(result.ok, length).toBe(true);
      if (result.ok) expect(Math.round(result.entropyBits), `${length} characters`).toBe(bits);
    }
  });

  it('labels strength from entropy alone', () => {
    expect(describeStrength(30)).toBe('very weak');
    expect(describeStrength(50)).toBe('weak');
    expect(describeStrength(70)).toBe('fair');
    expect(describeStrength(100)).toBe('strong');
    expect(describeStrength(130)).toBe('very strong');
  });
});

describe('UUID generation', () => {
  it('produces canonical version 4 values', () => {
    for (let run = 0; run < 300; run += 1) {
      const uuid = generateUuidV4();
      expect(uuid).toMatch(UUID_V4_PATTERN);
      expect(uuid).toHaveLength(36);
      // Version nibble and variant nibble, checked positionally.
      expect(uuid[14]).toBe('4');
      expect('89ab').toContain(uuid[19] as string);
    }
  });

  it('works through the Web Crypto fallback path', () => {
    // Remove randomUUID so the manual bit-setting path is exercised.
    const original = globalThis.crypto.randomUUID;
    // @ts-expect-error deliberately removing an optional method for the test
    globalThis.crypto.randomUUID = undefined;

    try {
      for (let run = 0; run < 200; run += 1) {
        const uuid = generateUuidV4();
        expect(uuid).toMatch(UUID_V4_PATTERN);
      }
    } finally {
      globalThis.crypto.randomUUID = original;
    }
  });

  it('generates the requested quantity, clamped to the documented range', () => {
    expect(generateUuids(1)).toHaveLength(1);
    expect(generateUuids(100)).toHaveLength(100);
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(500)).toHaveLength(100);
  });

  it('does not repeat within a batch', () => {
    const uuids = generateUuids(100);
    expect(new Set(uuids).size).toBe(100);
  });

  it('validates correctly, rejecting near misses', () => {
    expect(isValidUuidV4('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
    // Version 1, not 4.
    expect(isValidUuidV4('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(false);
    // Invalid variant nibble.
    expect(isValidUuidV4('3f2504e0-4f89-41d3-1a0c-0305e82c3301')).toBe(false);
    // Uppercase is not the canonical form.
    expect(isValidUuidV4('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(false);
    expect(isValidUuidV4('not-a-uuid')).toBe(false);
    expect(isValidUuidV4('')).toBe(false);
  });

  it('applies formatting only as presentation', () => {
    const uuid = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

    expect(formatUuid(uuid, { uppercase: false, braces: false, hyphens: true })).toBe(uuid);
    expect(formatUuid(uuid, { uppercase: true, braces: false, hyphens: true })).toBe(
      uuid.toUpperCase(),
    );
    expect(formatUuid(uuid, { uppercase: false, braces: true, hyphens: true })).toBe(`{${uuid}}`);
    expect(formatUuid(uuid, { uppercase: false, braces: false, hyphens: false })).toBe(
      '3f2504e04f8941d39a0c0305e82c3301',
    );
    expect(formatUuid(uuid, { uppercase: true, braces: true, hyphens: false })).toBe(
      '{3F2504E04F8941D39A0C0305E82C3301}',
    );
  });

  it('keeps the underlying value valid whatever the formatting', () => {
    for (const uppercase of [true, false]) {
      for (const braces of [true, false]) {
        for (const hyphens of [true, false]) {
          const uuid = generateUuidV4();
          const formatted = formatUuid(uuid, { uppercase, braces, hyphens });
          // Strip decoration and confirm it still maps back to a valid UUID.
          const bare = formatted.replace(/[{}]/g, '').toLowerCase();
          const withHyphens = hyphens
            ? bare
            : `${bare.slice(0, 8)}-${bare.slice(8, 12)}-${bare.slice(12, 16)}-${bare.slice(16, 20)}-${bare.slice(20)}`;
          expect(isValidUuidV4(withHyphens)).toBe(true);
        }
      }
    }
  });
});
