/**
 * Password generation (spec §6.11).
 *
 * Generated passwords exist only in page memory: never stored, never logged,
 * never transmitted, and never included in an analytics event.
 */

import { randomInt, secureShuffle } from './random';

export const CHARACTER_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
} as const;

export type CharacterSetKey = keyof typeof CHARACTER_SETS;

/**
 * Characters that are easily confused in print or when read aloud.
 * Excluding them shrinks the alphabet slightly, which the entropy figure
 * accounts for.
 */
export const AMBIGUOUS_CHARACTERS = 'Il1O0o|`\'"{}[]()/\\~,;:.<>';

export const PASSWORD_LENGTH = { min: 8, max: 128, default: 20 } as const;

export type PasswordOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  /** Guarantee at least one character from each selected set. */
  requireEachSet: boolean;
};

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: PASSWORD_LENGTH.default,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
  requireEachSet: true,
};

export type PasswordStrength = 'very weak' | 'weak' | 'fair' | 'strong' | 'very strong';

export type PasswordResult =
  | {
      ok: true;
      password: string;
      /** log2 of the number of equally likely passwords these settings allow. */
      entropyBits: number;
      alphabetSize: number;
      strength: PasswordStrength;
    }
  | { ok: false; error: string };

/** The pools actually drawn from, after ambiguity filtering. */
export function resolveAlphabets(options: PasswordOptions): Record<CharacterSetKey, string> {
  const filter = (set: string) =>
    options.excludeAmbiguous
      ? [...set].filter((character) => !AMBIGUOUS_CHARACTERS.includes(character)).join('')
      : set;

  return {
    lowercase: options.lowercase ? filter(CHARACTER_SETS.lowercase) : '',
    uppercase: options.uppercase ? filter(CHARACTER_SETS.uppercase) : '',
    numbers: options.numbers ? filter(CHARACTER_SETS.numbers) : '',
    symbols: options.symbols ? filter(CHARACTER_SETS.symbols) : '',
  };
}

export function calculateEntropyBits(alphabetSize: number, length: number): number {
  if (alphabetSize <= 1 || length <= 0) return 0;
  return Math.log2(alphabetSize) * length;
}

/**
 * A transparent strength label derived only from entropy.
 *
 * It describes this generator's settings, not your overall security: it cannot
 * know whether a site stores passwords badly or whether you reuse this one
 * elsewhere. No claim about breach resistance is made.
 */
export function describeStrength(entropyBits: number): PasswordStrength {
  if (entropyBits < 40) return 'very weak';
  if (entropyBits < 60) return 'weak';
  if (entropyBits < 80) return 'fair';
  if (entropyBits < 110) return 'strong';
  return 'very strong';
}

export function generatePassword(options: PasswordOptions): PasswordResult {
  const { length } = options;

  if (!Number.isInteger(length) || length < PASSWORD_LENGTH.min || length > PASSWORD_LENGTH.max) {
    return {
      ok: false,
      error: `Choose a length between ${PASSWORD_LENGTH.min} and ${PASSWORD_LENGTH.max} characters.`,
    };
  }

  const alphabets = resolveAlphabets(options);
  const selected = (Object.keys(alphabets) as CharacterSetKey[]).filter(
    (key) => alphabets[key].length > 0,
  );

  if (selected.length === 0) {
    return {
      ok: false,
      error:
        'Select at least one character set. With every set turned off there are no characters to choose from.',
    };
  }

  if (options.requireEachSet && selected.length > length) {
    return {
      ok: false,
      error: `A ${length}-character password cannot contain one character from each of ${selected.length} sets. Increase the length or select fewer sets.`,
    };
  }

  const pool = selected.map((key) => alphabets[key]).join('');
  const characters: string[] = [];

  // Guarantee one from each selected set first, then fill the remainder from
  // the combined pool. The guaranteed characters are shuffled into place below
  // so they do not sit predictably at the front.
  if (options.requireEachSet) {
    for (const key of selected) {
      const set = alphabets[key];
      characters.push(set[randomInt(set.length)] as string);
    }
  }

  while (characters.length < length) {
    characters.push(pool[randomInt(pool.length)] as string);
  }

  const password = secureShuffle(characters).join('');
  const entropyBits = calculateEntropyBits(pool.length, length);

  return {
    ok: true,
    password,
    entropyBits,
    alphabetSize: pool.length,
    strength: describeStrength(entropyBits),
  };
}
