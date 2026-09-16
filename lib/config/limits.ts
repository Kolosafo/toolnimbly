/**
 * Processing limits (spec §6 "Shared image rules" / "Shared PDF rules", §7.10).
 *
 * Every size, count and pixel guard lives here so limits can be tuned in one
 * place and quoted verbatim in error messages and editorial copy.
 */

const MB = 1024 * 1024;

export const imageLimits = {
  /** Maximum accepted size for a single input image. */
  maxFileBytes: 20 * MB,
  /** Maximum decoded pixel count (width × height) for an input image. */
  maxInputPixels: 40_000_000,
  /** Maximum pixel count for a generated output canvas. */
  maxOutputPixels: 40_000_000,
  /** Maximum number of images queued in a batch tool. */
  maxQueueLength: 20,
  /** Concurrent decode/encode jobs. Kept low to protect mid-tier phones. */
  maxConcurrentJobs: 2,
} as const;

export const pdfLimits = {
  /** Maximum accepted size for a single input PDF. */
  maxFileBytes: 100 * MB,
  /** Maximum page count for an input PDF. */
  maxPages: 500,
  /** Maximum number of PDFs accepted by the merger. */
  maxMergeInputs: 10,
  /** Minimum number of PDFs accepted by the merger. */
  minMergeInputs: 2,
  /** Ceiling on total rasterised pixels across one PDF→image render job. */
  maxRenderPixelsTotal: 120_000_000,
  /** Ceiling on rasterised pixels for a single rendered page. */
  maxRenderPixelsPerPage: 30_000_000,
  /** Concurrent page renders. */
  maxConcurrentRenders: 2,
} as const;

export const documentLimits = {
  /** Maximum line items in an invoice or receipt. */
  maxLineItems: 200,
  /** Maximum accepted logo file size before client-side downscaling. */
  maxLogoBytes: 5 * MB,
  /** Longest edge, in pixels, of a logo embedded into a generated PDF. */
  maxLogoEdgePixels: 600,
} as const;

export const textLimits = {
  /**
   * Soft ceiling for the counter tools. Beyond this, segmentation is debounced
   * more aggressively rather than refused.
   */
  softCharacterCount: 200_000,
  /** Hard ceiling; text beyond this is refused with an explanation. */
  maxCharacterCount: 2_000_000,
} as const;

/** Human-readable byte size used in UI copy and error messages. */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = value >= 100 ? Math.round(value) : Number(value.toFixed(fractionDigits));
  return `${rounded} ${units[unitIndex]}`;
}
