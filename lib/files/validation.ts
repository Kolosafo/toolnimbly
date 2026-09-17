/**
 * Centralised file validation (spec §5.3, §5.6, §7.5).
 *
 * Validation happens before any expensive decoding, and every message says what
 * happened and how to recover — quoting the actual limit rather than a generic
 * "file too large".
 */

import type { AllowedErrorCode } from '@/lib/analytics/events';
import { formatBytes } from '@/lib/config/limits';

import { detectFileType, TYPE_LABELS, type DetectedType } from './signatures';

export type ValidationFailure = {
  /**
   * A code from the analytics contract (spec §14). Deliberately coarse: it
   * never carries a filename, a library message or any file content.
   */
  code: AllowedErrorCode;
  /** Shown to the user. Says what happened and how to recover (spec §5.6). */
  message: string;
};

export type FileValidationResult =
  | { ok: true; type: DetectedType }
  | { ok: false; failure: ValidationFailure };

export type FileValidationOptions = {
  accept: readonly DetectedType[];
  maxBytes: number;
  /** Shown in the unsupported-type message, e.g. "JPG, PNG or WebP". */
  acceptLabel: string;
};

/**
 * Validates one file from its header bytes.
 *
 * `headerBytes` should be the first 32 bytes; the caller reads them so this
 * function stays synchronous and trivially testable.
 */
export function validateFile(
  file: { name: string; size: number },
  headerBytes: Uint8Array,
  options: FileValidationOptions,
): FileValidationResult {
  if (file.size === 0) {
    return {
      ok: false,
      failure: { code: 'empty_file', message: 'This file is empty, so there is nothing to process.' },
    };
  }

  if (file.size > options.maxBytes) {
    return {
      ok: false,
      failure: {
        code: 'too_large',
        message: `This file is ${formatBytes(file.size)}. The current limit is ${formatBytes(options.maxBytes)} per file.`,
      },
    };
  }

  const type = detectFileType(headerBytes);

  if (!options.accept.includes(type)) {
    const detected = TYPE_LABELS[type];
    return {
      ok: false,
      failure: {
        code: 'unsupported_type',
        message:
          type === 'unknown'
            ? `This file is not in a format this tool recognises. Supported formats are ${options.acceptLabel}.`
            : `This is a ${detected} file. This tool accepts ${options.acceptLabel}.`,
      },
    };
  }

  return { ok: true, type };
}

/** Enforces the queue length limit with a message that quotes it. */
export function validateQueueLength(
  currentCount: number,
  incomingCount: number,
  maxQueueLength: number,
): ValidationFailure | null {
  if (currentCount + incomingCount <= maxQueueLength) return null;

  const room = Math.max(0, maxQueueLength - currentCount);
  return {
    code: 'too_many_files',
    message:
      room === 0
        ? `The queue already holds the maximum of ${maxQueueLength} files. Remove some before adding more.`
        : `That would exceed the limit of ${maxQueueLength} files. There is room for ${room} more.`,
  };
}

/** Guards decoded pixel count before allocating output memory. */
export function validatePixelCount(
  width: number,
  height: number,
  maxPixels: number,
): ValidationFailure | null {
  const pixels = width * height;
  if (pixels <= maxPixels) return null;

  const megapixels = (pixels / 1_000_000).toFixed(1);
  const limit = (maxPixels / 1_000_000).toFixed(0);
  return {
    code: 'too_large',
    message: `This image is ${width} × ${height} pixels (${megapixels} megapixels). The limit is ${limit} megapixels, to keep memory use within what a phone can handle.`,
  };
}
