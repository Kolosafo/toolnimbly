/**
 * Cryptographic randomness (spec §6.11, §6.12).
 *
 * `Math.random` is never used anywhere in this module or by anything that
 * depends on it. It is not a cryptographic generator, and a password produced
 * from it is predictable given enough output.
 */

export class CryptoUnavailableError extends Error {
  constructor() {
    super(
      'This browser does not provide the Web Crypto API, so a secure random value cannot be generated here.',
    );
    this.name = 'CryptoUnavailableError';
  }
}

/** Returns the Web Crypto implementation, or throws a message users can act on. */
export function getCrypto(): Crypto {
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject || typeof cryptoObject.getRandomValues !== 'function') {
    throw new CryptoUnavailableError();
  }
  return cryptoObject;
}

export function isCryptoAvailable(): boolean {
  try {
    getCrypto();
    return true;
  } catch {
    return false;
  }
}

/** Fills a buffer with cryptographically secure random bytes. */
export function randomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  getCrypto().getRandomValues(buffer);
  return buffer;
}

/**
 * A uniformly distributed integer in [0, maxExclusive).
 *
 * Taking a random value modulo `maxExclusive` would bias the result towards the
 * low end whenever `maxExclusive` does not divide 2^32 evenly — with a 92
 * character alphabet, the first 20 characters would each be about 0.000002%
 * more likely than the rest. Tiny, but avoidable: values at or above the
 * largest exact multiple of `maxExclusive` are discarded and redrawn, which is
 * rejection sampling.
 */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('randomInt requires a positive integer bound');
  }
  if (maxExclusive === 1) return 0;

  const range = 2 ** 32;
  const limit = Math.floor(range / maxExclusive) * maxExclusive;
  const buffer = new Uint32Array(1);
  const cryptoObject = getCrypto();

  // The expected number of iterations is below 2 for every realistic bound.
  for (;;) {
    cryptoObject.getRandomValues(buffer);
    const value = buffer[0];
    if (value === undefined) continue;
    if (value < limit) return value % maxExclusive;
  }
}

/** Picks one element uniformly at random. */
export function randomElement<T>(items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('Cannot pick from an empty list');
  const item = items[randomInt(items.length)];
  if (item === undefined) throw new Error('Unexpected empty selection');
  return item;
}

/**
 * Fisher-Yates shuffle driven by the same cryptographic source.
 *
 * Returns a new array; the input is not modified. Used to place the characters
 * guaranteed by "require one from every set" at unpredictable positions rather
 * than leaving them at the front (spec §6.11).
 */
export function secureShuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    const a = result[index];
    const b = result[swapIndex];
    if (a === undefined || b === undefined) continue;
    result[index] = b;
    result[swapIndex] = a;
  }
  return result;
}
