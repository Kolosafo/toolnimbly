/**
 * File type detection from content, not filename (spec §6 "Shared image rules",
 * §7.9).
 *
 * A filename extension is user-controlled and proves nothing. Every file this
 * product accepts is identified by its magic bytes before any expensive decode
 * is attempted, so a renamed or malformed file fails cheaply and clearly.
 */

export type DetectedType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/avif'
  | 'image/heic'
  | 'application/pdf'
  | 'application/zip'
  | 'unknown';

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return '';
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

/**
 * Identifies a file from its leading bytes.
 *
 * Only the first few dozen bytes are needed, so callers should pass a slice
 * rather than the whole file.
 */
export function detectFileType(bytes: Uint8Array): DetectedType {
  // JPEG: SOI marker.
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';

  // PNG: 8-byte signature.
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';

  // RIFF container — WebP is RIFF....WEBP.
  if (asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WEBP') return 'image/webp';

  if (asciiAt(bytes, 0, 6) === 'GIF87a' || asciiAt(bytes, 0, 6) === 'GIF89a') return 'image/gif';

  // ISO base media file format: the brand sits after the 4-byte box size.
  if (asciiAt(bytes, 4, 4) === 'ftyp') {
    const brand = asciiAt(bytes, 8, 4);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) {
      return 'image/heic';
    }
  }

  if (asciiAt(bytes, 0, 5) === '%PDF-') return 'application/pdf';

  // ZIP local file header, including the empty and spanned variants.
  if (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  ) {
    return 'application/zip';
  }

  return 'unknown';
}

/** Reads only the bytes needed for detection. */
export async function detectFileTypeFromBlob(file: Blob): Promise<DetectedType> {
  const header = await file.slice(0, 32).arrayBuffer();
  return detectFileType(new Uint8Array(header));
}

/** Human-readable name for an error message. */
export const TYPE_LABELS: Record<DetectedType, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'image/avif': 'AVIF',
  'image/heic': 'HEIC',
  'application/pdf': 'PDF',
  'application/zip': 'ZIP',
  unknown: 'an unrecognised format',
};
