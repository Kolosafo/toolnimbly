/**
 * Browser image decode and encode (spec §6 "Shared image rules").
 *
 * Everything here runs on the user's device. There is no upload path: a file is
 * read into memory, drawn onto a canvas, and encoded straight back out.
 *
 * Memory discipline is deliberate — `ImageBitmap`s are closed and canvases are
 * zeroed after use, because a batch of 20 photos otherwise holds hundreds of
 * megabytes of decoded pixels alive until garbage collection catches up.
 */

import { imageLimits } from '@/lib/config/limits';
import { validatePixelCount, type ValidationFailure } from '@/lib/files/validation';

import { orientationSwapsAxes, orientationTransform, readOrientationFromBlob } from './exif';
import type { Dimensions, Rectangle } from './geometry';

export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export type DecodedImage = {
  bitmap: ImageBitmap;
  /** Dimensions as displayed, after any EXIF rotation has been applied. */
  width: number;
  height: number;
};

/** Feature detection, tested rather than inferred from a user agent string. */
export function supportsCreateImageBitmap(): boolean {
  return typeof createImageBitmap === 'function';
}

export function supportsOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas === 'function';
}

/**
 * Returns the output formats this browser can actually encode.
 *
 * A browser that cannot encode WebP silently returns a PNG from
 * `toDataURL('image/webp')`, so the result is checked rather than assumed.
 */
export function detectEncodableFormats(): OutputFormat[] {
  const formats: OutputFormat[] = ['image/png', 'image/jpeg'];
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
      formats.push('image/webp');
    }
  } catch {
    // Leave WebP out if the probe fails for any reason.
  }
  return formats;
}

export class ImageDecodeError extends Error {
  readonly failure: ValidationFailure;

  constructor(failure: ValidationFailure) {
    super(failure.message);
    this.name = 'ImageDecodeError';
    this.failure = failure;
  }
}

/**
 * Decodes a file into an upright bitmap.
 *
 * Orientation is applied here, before anything else, so every later step —
 * resizing, cropping, encoding — works on the image as it appears rather than
 * as it happens to be stored. Metadata is not carried forward, which is what
 * strips GPS coordinates, camera model and timestamps from the output.
 */
export async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (!supportsCreateImageBitmap()) {
    throw new ImageDecodeError({
      code: 'decode_failed',
      message:
        'This browser cannot decode images in the page. Try a current version of Chrome, Edge, Firefox or Safari.',
    });
  }

  let bitmap: ImageBitmap;

  try {
    // Where supported, the browser applies EXIF orientation during decode,
    // which is both faster and more accurate than re-drawing afterwards.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
      // The browser ignored the orientation hint, so apply it ourselves.
      const orientation = await readOrientationFromBlob(file);
      if (orientation !== 1) {
        const rotated = await applyOrientation(bitmap, orientation);
        bitmap.close();
        bitmap = rotated;
      }
    } catch {
      throw new ImageDecodeError({
        code: 'decode_failed',
        message:
          'This file could not be read as an image. It may be corrupted, or saved in a format this browser does not support.',
      });
    }
  }

  const pixelFailure = validatePixelCount(bitmap.width, bitmap.height, imageLimits.maxInputPixels);
  if (pixelFailure) {
    bitmap.close();
    throw new ImageDecodeError(pixelFailure);
  }

  return { bitmap, width: bitmap.width, height: bitmap.height };
}

/** Redraws a bitmap with its EXIF rotation baked into the pixels. */
async function applyOrientation(bitmap: ImageBitmap, orientation: number): Promise<ImageBitmap> {
  const swap = orientationSwapsAxes(orientation as 1);
  const width = swap ? bitmap.height : bitmap.width;
  const height = swap ? bitmap.width : bitmap.height;

  const { canvas, context } = createCanvas(width, height);
  context.setTransform(...orientationTransform(orientation as 1, width, height));
  context.drawImage(bitmap, 0, 0);
  context.setTransform(1, 0, 0, 1, 0, 0);

  const rotated = await createImageBitmap(canvas as HTMLCanvasElement);
  releaseCanvas(canvas);
  return rotated;
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

/** Prefers an OffscreenCanvas, which keeps work off the layout path. */
export function createCanvas(
  width: number,
  height: number,
): { canvas: AnyCanvas; context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } {
  if (supportsOffscreenCanvas()) {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (context) return { canvas, context };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ImageDecodeError({
      code: 'decode_failed',
      message: 'This browser could not provide a drawing surface for the image.',
    });
  }
  return { canvas, context };
}

/**
 * Releases a canvas's backing store.
 *
 * Setting the dimensions to zero is the reliable way to make a browser free the
 * pixels immediately rather than at the next collection.
 */
export function releaseCanvas(canvas: AnyCanvas): void {
  canvas.width = 0;
  canvas.height = 0;
}

export type RenderOptions = {
  /** Region of the source to draw. Defaults to the whole image. */
  sourceRect?: Rectangle;
  output: Dimensions;
  /** Background composited beneath the image, for formats without alpha. */
  matte?: string | null;
  quarterTurns?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
};

/** Draws a bitmap into a new canvas at the requested size. */
export function renderToCanvas(bitmap: ImageBitmap, options: RenderOptions): AnyCanvas {
  const quarterTurns = ((options.quarterTurns ?? 0) % 4 + 4) % 4;
  const swap = quarterTurns % 2 === 1;

  const width = swap ? options.output.height : options.output.width;
  const height = swap ? options.output.width : options.output.height;

  const { canvas, context } = createCanvas(
    swap ? height : width,
    swap ? width : height,
  );

  // JPEG has no alpha, so transparent pixels must be resolved to a colour
  // before encoding rather than becoming black.
  if (options.matte) {
    context.fillStyle = options.matte;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((quarterTurns * Math.PI) / 2);
  context.scale(options.flipHorizontal ? -1 : 1, options.flipVertical ? -1 : 1);

  const source = options.sourceRect ?? {
    x: 0,
    y: 0,
    width: bitmap.width,
    height: bitmap.height,
  };

  context.drawImage(
    bitmap,
    source.x,
    source.y,
    source.width,
    source.height,
    -options.output.width / 2,
    -options.output.height / 2,
    options.output.width,
    options.output.height,
  );
  context.restore();

  return canvas;
}

/** Encodes a canvas, releasing its backing store afterwards either way. */
export async function encodeCanvas(
  canvas: AnyCanvas,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  try {
    if ('convertToBlob' in canvas) {
      return await canvas.convertToBlob({ type: format, quality });
    }

    return await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('encode failed'));
        },
        format,
        quality,
      );
    });
  } finally {
    releaseCanvas(canvas);
  }
}

export const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Maps an output MIME type to its key in `DOWNLOAD_TYPES`.
 *
 * Deliberately separate from `FORMAT_EXTENSIONS`: the file extension is `jpg`
 * but the download-kind key is `jpeg`, and conflating the two silently produced
 * an undefined lookup that crashed every JPEG and WebP export.
 */
export const FORMAT_DOWNLOAD_KINDS = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const satisfies Record<OutputFormat, 'jpeg' | 'png' | 'webp'>;

export const FORMAT_LABELS: Record<OutputFormat, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
};

/** True for formats that can store an alpha channel. */
export function formatSupportsAlpha(format: OutputFormat): boolean {
  return format !== 'image/jpeg';
}

/** PNG is lossless; a quality value is meaningless for it. */
export function formatUsesQuality(format: OutputFormat): boolean {
  return format !== 'image/png';
}
