/**
 * The analytics event contract (spec §14).
 *
 * Analytics are disabled by default and send nothing. This module exists so
 * that the *shape* of what could ever be sent is defined in one place and is
 * enforced by the type system: a tool identifier and a value from a fixed
 * enumeration, never a value the user entered.
 *
 * Forbidden, by construction rather than by policy: raw inputs, pasted text,
 * passwords, generated UUIDs, filenames, file contents, invoice or customer
 * data, QR code contents, dates of birth, body measurements, exact financial
 * amounts, free-form error strings and document metadata.
 */

/** Coarse, predefined error codes. Never a library message or a stack trace. */
export const ERROR_CODES = [
  'unsupported_type',
  'too_large',
  'empty_file',
  'too_many_files',
  'decode_failed',
  'encode_failed',
  'invalid_input',
  'cancelled',
  'out_of_memory_guard',
  'encrypted_document',
  'corrupt_document',
] as const;

export type AllowedErrorCode = (typeof ERROR_CODES)[number];

/** The kinds of artefact a tool can produce. Never a filename. */
export const OUTPUT_KINDS = ['image', 'pdf', 'zip', 'text', 'csv', 'svg'] as const;

export type AllowedOutputKind = (typeof OUTPUT_KINDS)[number];

export type AnalyticsEvent =
  | { name: 'tool_view'; tool: string }
  | { name: 'tool_started'; tool: string }
  | { name: 'tool_success'; tool: string; outputKind?: AllowedOutputKind }
  | { name: 'tool_error'; tool: string; code: AllowedErrorCode }
  | { name: 'tool_copy'; tool: string }
  | { name: 'tool_download'; tool: string; outputKind: AllowedOutputKind }
  | { name: 'related_tool_click'; from: string; to: string };
