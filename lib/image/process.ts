/**
 * The single image-processing path shared by all seven image tools
 * (Appendix A).
 *
 * Each tool configures this rather than reimplementing decode, orientation,
 * resize, matte compositing and encode. That is what keeps behaviour — and the
 * memory discipline — identical across them.
 */

import { imageLimits } from '@/lib/config/limits';
import { buildFilename, sanitizeFilename } from '@/lib/download/file';

import {
  decodeImage,
  encodeCanvas,
  FORMAT_DOWNLOAD_KINDS,
  formatSupportsAlpha,
  renderToCanvas,
  type OutputFormat,
} from './codec';
import { planResize, type Dimensions, type FitMode, type Rectangle } from './geometry';

export type ProcessOptions = {
  /** `null` keeps whatever the input was. */
  format: OutputFormat | null;
  quality: number;
  maxWidth?: number | null;
  maxHeight?: number | null;
  /** Exact target size, used by the resizer. Overrides the max-* caps. */
  targetWidth?: number | null;
  targetHeight?: number | null;
  lockAspectRatio?: boolean;
  fit?: FitMode;
  allowUpscale?: boolean;
  /** Background for transparent pixels when the output has no alpha channel. */
  matte?: string;
  /** Explicit crop in source coordinates, used by the cropper. */
  cropRect?: Rectangle | null;
  quarterTurns?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
};

export type ProcessedImage = {
  blob: Blob;
  filename: string;
  format: OutputFormat;
  inputBytes: number;
  outputBytes: number;
  inputDimensions: Dimensions;
  outputDimensions: Dimensions;
  /** True when the output is bigger than the input — reported, never hidden. */
  grewLarger: boolean;
  /** Set when a limit changed what the user asked for. */
  notice?: string;
};

const INPUT_FORMATS: Record<string, OutputFormat> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

/**
 * Decodes, transforms and re-encodes one image.
 *
 * The bitmap is closed in a `finally` block so a failure part-way through
 * cannot leak decoded pixels.
 */
export async function processImage(
  file: File,
  options: ProcessOptions,
  signal?: AbortSignal,
): Promise<ProcessedImage> {
  const decoded = await decodeImage(file);

  try {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

    const inputDimensions = { width: decoded.width, height: decoded.height };
    const source = options.cropRect ?? {
      x: 0,
      y: 0,
      width: decoded.width,
      height: decoded.height,
    };

    const format =
      options.format ?? INPUT_FORMATS[file.type] ?? guessFormatFromName(file.name) ?? 'image/png';

    const plan = planTargetSize(source, options);
    if (!plan.ok) throw new Error(plan.error);

    // JPEG cannot store transparency, so a matte is required rather than
    // optional — without one, transparent pixels encode as black.
    const matte = formatSupportsAlpha(format) ? null : (options.matte ?? '#ffffff');

    const canvas = renderToCanvas(decoded.bitmap, {
      sourceRect: source,
      output: plan.output,
      matte,
      quarterTurns: options.quarterTurns ?? 0,
      flipHorizontal: options.flipHorizontal ?? false,
      flipVertical: options.flipVertical ?? false,
    });

    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

    const blob = await encodeCanvas(canvas, format, clampQuality(options.quality));

    const baseName = sanitizeFilename(stripExtension(file.name) || 'image');

    return {
      blob,
      filename: buildFilename(baseName, FORMAT_DOWNLOAD_KINDS[format]),
      format,
      inputBytes: file.size,
      outputBytes: blob.size,
      inputDimensions,
      outputDimensions: plan.output,
      grewLarger: blob.size > file.size,
      ...(plan.notice ? { notice: plan.notice } : {}),
    };
  } finally {
    decoded.bitmap.close();
  }
}

function planTargetSize(
  source: Rectangle,
  options: ProcessOptions,
): { ok: true; output: Dimensions; notice?: string } | { ok: false; error: string } {
  const sourceSize = { width: source.width, height: source.height };

  // An exact target (the resizer) takes precedence over the max-* caps that the
  // compressors use.
  const hasExactTarget =
    (options.targetWidth ?? null) !== null || (options.targetHeight ?? null) !== null;

  if (hasExactTarget) {
    const result = planResize({
      source: sourceSize,
      width: options.targetWidth ?? null,
      height: options.targetHeight ?? null,
      lockAspectRatio: options.lockAspectRatio ?? true,
      fit: options.fit ?? 'contain',
      allowUpscale: options.allowUpscale ?? false,
      maxOutputPixels: imageLimits.maxOutputPixels,
    });

    if (!result.ok) return { ok: false, error: result.error };
    return {
      ok: true,
      output: result.output,
      ...(result.clampedByPixels
        ? {
            notice: `Scaled down to stay within the ${(imageLimits.maxOutputPixels / 1_000_000).toFixed(0)} megapixel limit.`,
          }
        : {}),
    };
  }

  // Dimension caps only ever shrink. Compressing must never enlarge.
  const maxWidth = options.maxWidth ?? null;
  const maxHeight = options.maxHeight ?? null;

  if (maxWidth === null && maxHeight === null) {
    return { ok: true, output: sourceSize };
  }

  const scale = Math.min(
    maxWidth !== null ? maxWidth / sourceSize.width : Number.POSITIVE_INFINITY,
    maxHeight !== null ? maxHeight / sourceSize.height : Number.POSITIVE_INFINITY,
    1,
  );

  return {
    ok: true,
    output: {
      width: Math.max(1, Math.round(sourceSize.width * scale)),
      height: Math.max(1, Math.round(sourceSize.height * scale)),
    },
  };
}

function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 0.8;
  return Math.min(Math.max(quality, 0.01), 1);
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function guessFormatFromName(name: string): OutputFormat | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}
