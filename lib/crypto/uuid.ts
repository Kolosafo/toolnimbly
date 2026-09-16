/**
 * UUID version 4 generation (spec §6.12).
 *
 * RFC 4122 / RFC 9562 compatible. Uses `crypto.randomUUID` where available and
 * a Web Crypto fallback where it is not; both paths are validated before a
 * value is returned.
 */

import { getCrypto, randomBytes } from './random';

export const UUID_QUANTITY = { min: 1, max: 100, default: 10 } as const;

/**
 * Canonical form: 8-4-4-4-12 lowercase hex, with `4` opening the third group
 * and the variant nibble (8, 9, a or b) opening the fourth.
 */
export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type UuidFormatOptions = {
  uppercase: boolean;
  braces: boolean;
  hyphens: boolean;
};

export const DEFAULT_UUID_FORMAT: UuidFormatOptions = {
  uppercase: false,
  braces: false,
  hyphens: true,
};

/** True for a canonical, correctly versioned v4 UUID. */
export function isValidUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

/**
 * Generates one canonical v4 UUID.
 *
 * The fallback sets the version and variant bits by hand: byte 6 becomes
 * `0100xxxx` (version 4) and byte 8 becomes `10xxxxxx` (the RFC variant),
 * leaving 122 of the 128 bits random.
 */
export function generateUuidV4(): string {
  const cryptoObject = getCrypto();

  if (typeof cryptoObject.randomUUID === 'function') {
    const value = cryptoObject.randomUUID();
    // Trust but verify: a non-conforming implementation must not reach the UI.
    if (isValidUuidV4(value)) return value;
  }

  const bytes = randomBytes(16);
  bytes[6] = ((bytes[6] as number) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const value = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');

  if (!isValidUuidV4(value)) {
    throw new Error('Generated UUID failed validation');
  }

  return value;
}

export function generateUuids(quantity: number): string[] {
  const count = Math.min(Math.max(Math.trunc(quantity), UUID_QUANTITY.min), UUID_QUANTITY.max);
  return Array.from({ length: count }, () => generateUuidV4());
}

/**
 * Applies presentation options.
 *
 * Purely cosmetic and applied only after a value has passed validation, so a
 * decorated string always corresponds to a genuine v4 UUID.
 */
export function formatUuid(uuid: string, options: UuidFormatOptions): string {
  let value = options.hyphens ? uuid : uuid.replace(/-/g, '');
  if (options.uppercase) value = value.toUpperCase();
  if (options.braces) value = `{${value}}`;
  return value;
}
