/**
 * Resize and crop geometry (spec §6.19, §6.20).
 *
 * Pure arithmetic, deliberately separate from any canvas work so the sizing
 * rules — aspect locking, fit modes, megapixel caps, crop clamping — are
 * testable without a browser.
 */

export type Dimensions = { width: number; height: number };
export type Rectangle = { x: number; y: number; width: number; height: number };

export type FitMode = 'contain' | 'cover' | 'stretch';

/** Scales `source` to fit inside `box` without exceeding either dimension. */
export function containWithin(source: Dimensions, box: Dimensions): Dimensions {
  const scale = Math.min(box.width / source.width, box.height / source.height);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

/** Scales `source` to fill `box` completely, overflowing on one axis. */
export function coverBox(source: Dimensions, box: Dimensions): Dimensions {
  const scale = Math.max(box.width / source.width, box.height / source.height);
  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

/**
 * The source rectangle to draw when filling `box` in cover mode, centred.
 * This is what gets cropped away at the edges.
 */
export function coverSourceRect(source: Dimensions, box: Dimensions): Rectangle {
  const sourceRatio = source.width / source.height;
  const boxRatio = box.width / box.height;

  if (sourceRatio > boxRatio) {
    // Source is wider: crop the sides.
    const width = Math.round(source.height * boxRatio);
    return { x: Math.round((source.width - width) / 2), y: 0, width, height: source.height };
  }

  // Source is taller: crop top and bottom.
  const height = Math.round(source.width / boxRatio);
  return { x: 0, y: Math.round((source.height - height) / 2), width: source.width, height };
}

export type ResizeRequest = {
  source: Dimensions;
  /** Target width in pixels. Omit to derive from height. */
  width?: number | null;
  /** Target height in pixels. Omit to derive from width. */
  height?: number | null;
  lockAspectRatio: boolean;
  fit: FitMode;
  /** Never enlarge beyond the source dimensions. */
  allowUpscale: boolean;
  /** Hard ceiling on output pixels, from the central limits config. */
  maxOutputPixels: number;
};

export type ResizeResult =
  | { ok: true; output: Dimensions; sourceRect: Rectangle; upscaled: boolean; clampedByPixels: boolean }
  | { ok: false; error: string };

export function planResize(request: ResizeRequest): ResizeResult {
  const { source, lockAspectRatio, fit, allowUpscale, maxOutputPixels } = request;

  if (source.width <= 0 || source.height <= 0) {
    return { ok: false, error: 'The image has no dimensions to resize.' };
  }

  let width = request.width ?? null;
  let height = request.height ?? null;

  if (width === null && height === null) {
    return { ok: false, error: 'Enter a width or a height.' };
  }

  for (const [label, value] of [
    ['width', width],
    ['height', height],
  ] as const) {
    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      return { ok: false, error: `Enter a ${label} greater than zero.` };
    }
  }

  const aspect = source.width / source.height;

  // With the aspect locked, one dimension always derives from the other.
  if (lockAspectRatio) {
    if (width !== null) height = Math.max(1, Math.round(width / aspect));
    else if (height !== null) width = Math.max(1, Math.round(height * aspect));
  } else {
    width = width ?? Math.max(1, Math.round((height as number) * aspect));
    height = height ?? Math.max(1, Math.round((width as number) / aspect));
  }

  let output: Dimensions = { width: width as number, height: height as number };
  let sourceRect: Rectangle = { x: 0, y: 0, width: source.width, height: source.height };

  if (!lockAspectRatio && fit === 'contain') {
    output = containWithin(source, output);
  } else if (!lockAspectRatio && fit === 'cover') {
    sourceRect = coverSourceRect(source, output);
  }
  // `stretch` leaves both the output box and the full source rect as they are,
  // which is what distorts the image. The interface warns about it.

  let upscaled = output.width > source.width || output.height > source.height;

  if (upscaled && !allowUpscale) {
    // Fit the requested *output* inside the source, not the other way round.
    // Passing these the wrong way round scales the output up to the request,
    // which is exactly the enlargement this branch exists to prevent.
    output = containWithin(output, source);
    upscaled = false;
  }

  let clampedByPixels = false;
  if (output.width * output.height > maxOutputPixels) {
    const scale = Math.sqrt(maxOutputPixels / (output.width * output.height));
    output = {
      width: Math.max(1, Math.floor(output.width * scale)),
      height: Math.max(1, Math.floor(output.height * scale)),
    };
    clampedByPixels = true;
  }

  return { ok: true, output, sourceRect, upscaled, clampedByPixels };
}

/** Percentage of the source dimensions, for the resizer's percent mode. */
export function scaleByPercent(source: Dimensions, percent: number): Dimensions {
  const factor = percent / 100;
  return {
    width: Math.max(1, Math.round(source.width * factor)),
    height: Math.max(1, Math.round(source.height * factor)),
  };
}

/**
 * Constrains a crop rectangle to the image, preserving its size where possible
 * and shrinking it only when it cannot fit (spec §6.20).
 */
export function clampCropRect(rect: Rectangle, bounds: Dimensions): Rectangle {
  const width = Math.max(1, Math.min(Math.round(rect.width), bounds.width));
  const height = Math.max(1, Math.min(Math.round(rect.height), bounds.height));
  const x = Math.max(0, Math.min(Math.round(rect.x), bounds.width - width));
  const y = Math.max(0, Math.min(Math.round(rect.y), bounds.height - height));
  return { x, y, width, height };
}

/** The largest rectangle of the given ratio that fits inside `bounds`. */
export function largestRectWithRatio(bounds: Dimensions, ratio: number): Rectangle {
  let width = bounds.width;
  let height = Math.round(width / ratio);

  if (height > bounds.height) {
    height = bounds.height;
    width = Math.round(height * ratio);
  }

  return {
    x: Math.round((bounds.width - width) / 2),
    y: Math.round((bounds.height - height) / 2),
    width,
    height,
  };
}

/**
 * Converts a crop rectangle expressed in preview coordinates into source-image
 * coordinates, so a small on-screen preview never costs export resolution.
 */
export function previewRectToSource(
  rect: Rectangle,
  previewSize: Dimensions,
  sourceSize: Dimensions,
): Rectangle {
  const scaleX = sourceSize.width / previewSize.width;
  const scaleY = sourceSize.height / previewSize.height;

  return clampCropRect(
    {
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    },
    sourceSize,
  );
}

/** Applies a 90-degree rotation count to a size. */
export function rotateDimensions(size: Dimensions, quarterTurns: number): Dimensions {
  return quarterTurns % 2 === 0 ? size : { width: size.height, height: size.width };
}

/** Formats a percentage change in file size, phrased honestly in both directions. */
export function describeSizeChange(before: number, after: number): {
  percent: number;
  larger: boolean;
  label: string;
} {
  if (before <= 0) return { percent: 0, larger: false, label: 'no change' };

  const difference = before - after;
  const percent = Math.abs((difference / before) * 100);
  const larger = after > before;

  if (Math.abs(difference) < 1) return { percent: 0, larger: false, label: 'no change' };

  return {
    percent,
    larger,
    label: larger ? `${percent.toFixed(1)}% larger` : `${percent.toFixed(1)}% smaller`,
  };
}
