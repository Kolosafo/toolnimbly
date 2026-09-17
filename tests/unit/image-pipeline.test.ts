import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { imageLimits } from '@/lib/config/limits';
import { detectFileType, TYPE_LABELS } from '@/lib/files/signatures';
import {
  validateFile,
  validatePixelCount,
  validateQueueLength,
} from '@/lib/files/validation';
import {
  ORIENTATION_DESCRIPTIONS,
  orientationSwapsAxes,
  orientationTransform,
  readJpegOrientation,
  type ExifOrientation,
} from '@/lib/image/exif';
import {
  clampCropRect,
  containWithin,
  coverSourceRect,
  describeSizeChange,
  largestRectWithRatio,
  planResize,
  previewRectToSource,
  rotateDimensions,
  scaleByPercent,
} from '@/lib/image/geometry';
import { uniqueName } from '@/lib/zip/archive';

const fixture = (name: string) =>
  new Uint8Array(readFileSync(join(process.cwd(), 'tests/fixtures/images', name)));

describe('file type detection', () => {
  it('identifies real fixtures by their magic bytes', () => {
    expect(detectFileType(fixture('gradient-64x32.png'))).toBe('image/png');
    expect(detectFileType(fixture('plain.jpg'))).toBe('image/jpeg');
    expect(detectFileType(fixture('orientation-6.jpg'))).toBe('image/jpeg');
    expect(detectFileType(fixture('not-an-image.txt'))).toBe('unknown');
  });

  it('identifies a file renamed to the wrong extension', () => {
    // The whole point of sniffing: the name says nothing.
    const png = fixture('gradient-64x32.png');
    expect(detectFileType(png)).toBe('image/png');
  });

  it('recognises formats from their signatures', () => {
    expect(detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectFileType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toBe(
      'application/pdf',
    );
    expect(detectFileType(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe('application/zip');

    const webp = new Uint8Array(16);
    webp.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0);
    webp.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8);
    expect(detectFileType(webp)).toBe('image/webp');

    const gif = new Uint8Array([...'GIF89a'].map((c) => c.charCodeAt(0)));
    expect(detectFileType(gif)).toBe('image/gif');
  });

  it('distinguishes HEIC and AVIF by their ftyp brand', () => {
    const build = (brand: string) => {
      const bytes = new Uint8Array(16);
      bytes.set([...'ftyp'].map((c) => c.charCodeAt(0)), 4);
      bytes.set([...brand].map((c) => c.charCodeAt(0)), 8);
      return bytes;
    };
    expect(detectFileType(build('avif'))).toBe('image/avif');
    expect(detectFileType(build('heic'))).toBe('image/heic');
  });

  it('returns unknown for short or empty input rather than throwing', () => {
    expect(detectFileType(new Uint8Array([]))).toBe('unknown');
    expect(detectFileType(new Uint8Array([0xff]))).toBe('unknown');
  });

  it('has a readable label for every type', () => {
    for (const label of Object.values(TYPE_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('file validation', () => {
  const options = {
    accept: ['image/jpeg', 'image/png', 'image/webp'] as const,
    maxBytes: imageLimits.maxFileBytes,
    acceptLabel: 'JPG, PNG and WebP',
  };

  it('accepts a supported file', () => {
    const result = validateFile(
      { name: 'photo.png', size: 2513 },
      fixture('gradient-64x32.png'),
      options,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.type).toBe('image/png');
  });

  it('quotes the actual limit when a file is too large', () => {
    const result = validateFile(
      { name: 'huge.png', size: 27 * 1024 * 1024 },
      fixture('gradient-64x32.png'),
      options,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.code).toBe('too_large');
    // The spec's example phrasing: state the size and the limit.
    expect(result.failure.message).toMatch(/27 MB/);
    expect(result.failure.message).toMatch(/20 MB/);
  });

  it('names the detected format when it is not accepted', () => {
    const result = validateFile(
      { name: 'doc.pdf', size: 1000 },
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      options,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failure.code).toBe('unsupported_type');
    expect(result.failure.message).toContain('PDF');
    expect(result.failure.message).toContain('JPG, PNG and WebP');
  });

  it('rejects an empty file', () => {
    const result = validateFile({ name: 'empty.png', size: 0 }, new Uint8Array(), options);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe('empty_file');
  });

  it('enforces the queue limit and says how much room is left', () => {
    expect(validateQueueLength(0, 5, 20)).toBeNull();
    expect(validateQueueLength(18, 2, 20)).toBeNull();

    const partial = validateQueueLength(18, 5, 20);
    expect(partial?.code).toBe('too_many_files');
    expect(partial?.message).toMatch(/room for 2 more/);

    const full = validateQueueLength(20, 1, 20);
    expect(full?.message).toMatch(/already holds the maximum/);
  });

  it('guards decoded pixel count before allocating memory', () => {
    expect(validatePixelCount(4032, 3024, imageLimits.maxInputPixels)).toBeNull();

    const tooBig = validatePixelCount(10_000, 10_000, imageLimits.maxInputPixels);
    expect(tooBig?.code).toBe('too_large');
    expect(tooBig?.message).toMatch(/100\.0 megapixels/);
    expect(tooBig?.message).toMatch(/limit is 40 megapixels/);
  });
});

describe('EXIF orientation', () => {
  it('reads every orientation from the generated fixtures', () => {
    for (let orientation = 1; orientation <= 8; orientation += 1) {
      expect(readJpegOrientation(fixture(`orientation-${orientation}.jpg`)), `orientation ${orientation}`).toBe(
        orientation,
      );
    }
  });

  it('returns 1 for a JPEG with no EXIF block', () => {
    expect(readJpegOrientation(fixture('plain.jpg'))).toBe(1);
  });

  it('returns 1 rather than throwing on malformed input', () => {
    expect(readJpegOrientation(fixture('truncated.jpg'))).toBe(1);
    expect(readJpegOrientation(fixture('not-an-image.txt'))).toBe(1);
    expect(readJpegOrientation(new Uint8Array([]))).toBe(1);
    expect(readJpegOrientation(new Uint8Array([0xff, 0xd8]))).toBe(1);
  });

  it('knows which orientations exchange width and height', () => {
    for (const orientation of [1, 2, 3, 4] as ExifOrientation[]) {
      expect(orientationSwapsAxes(orientation), String(orientation)).toBe(false);
    }
    for (const orientation of [5, 6, 7, 8] as ExifOrientation[]) {
      expect(orientationSwapsAxes(orientation), String(orientation)).toBe(true);
    }
  });

  it('gives an identity transform for an upright image', () => {
    expect(orientationTransform(1, 100, 50)).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('produces a transform for every orientation', () => {
    for (let orientation = 1; orientation <= 8; orientation += 1) {
      const transform = orientationTransform(orientation as ExifOrientation, 100, 50);
      expect(transform).toHaveLength(6);
      for (const value of transform) expect(Number.isFinite(value)).toBe(true);
      // The linear part must be invertible, or the image would collapse.
      const [a, b, c, d] = transform;
      expect(Math.abs(a * d - b * c)).toBeCloseTo(1, 10);
    }
  });

  it('describes every orientation in words', () => {
    for (let orientation = 1; orientation <= 8; orientation += 1) {
      expect(ORIENTATION_DESCRIPTIONS[orientation as ExifOrientation].length).toBeGreaterThan(0);
    }
  });
});

describe('resize geometry', () => {
  const source = { width: 4000, height: 3000 };
  const base = {
    source,
    lockAspectRatio: true,
    fit: 'contain' as const,
    allowUpscale: false,
    maxOutputPixels: imageLimits.maxOutputPixels,
  };

  it('derives the second dimension when the aspect is locked', () => {
    const byWidth = planResize({ ...base, width: 2000 });
    expect(byWidth.ok && byWidth.output).toEqual({ width: 2000, height: 1500 });

    const byHeight = planResize({ ...base, height: 600 });
    expect(byHeight.ok && byHeight.output).toEqual({ width: 800, height: 600 });
  });

  it('never upscales unless asked', () => {
    const clamped = planResize({ ...base, width: 8000 });
    expect(clamped.ok).toBe(true);
    if (!clamped.ok) return;
    // Clamped back to the source, preserving the aspect ratio exactly.
    expect(clamped.output).toEqual({ width: 4000, height: 3000 });
    expect(clamped.upscaled).toBe(false);

    // The same holds when only a height is given.
    const byHeight = planResize({ ...base, height: 9000 });
    expect(byHeight.ok && byHeight.output).toEqual({ width: 4000, height: 3000 });

    // Upscaling is honoured when asked for and the result fits the ceiling.
    const allowed = planResize({
      ...base,
      width: 8000,
      allowUpscale: true,
      maxOutputPixels: 60_000_000,
    });
    expect(allowed.ok && allowed.output).toEqual({ width: 8000, height: 6000 });
    expect(allowed.ok && allowed.upscaled).toBe(true);

    // The megapixel ceiling still binds: 8000 × 6000 is 48 MP, over the 40 MP
    // default, so the output is scaled back and the clamp is reported.
    const capped = planResize({ ...base, width: 8000, allowUpscale: true });
    expect(capped.ok && capped.clampedByPixels).toBe(true);
    expect(
      capped.ok && capped.output.width * capped.output.height,
    ).toBeLessThanOrEqual(imageLimits.maxOutputPixels);
  });

  it('matches the hero-image example published on the resizer page', () => {
    // A 5472 × 3648 photo into a 1600 × 900 banner.
    const photo = { width: 5472, height: 3648 };
    const box = { width: 1600, height: 900 };

    const contain = planResize({
      ...base,
      source: photo,
      width: box.width,
      height: box.height,
      lockAspectRatio: false,
      fit: 'contain',
    });
    expect(contain.ok && contain.output).toEqual({ width: 1350, height: 900 });

    const cover = planResize({
      ...base,
      source: photo,
      width: box.width,
      height: box.height,
      lockAspectRatio: false,
      fit: 'cover',
    });
    // Cover fills the box exactly and crops the overflow.
    expect(cover.ok && cover.output).toEqual({ width: 1600, height: 900 });
    expect(cover.ok && cover.sourceRect.height).toBeLessThan(photo.height);
  });

  it('stretch distorts, which is why it is warned about', () => {
    const stretched = planResize({
      ...base,
      source: { width: 100, height: 100 },
      width: 300,
      height: 100,
      lockAspectRatio: false,
      fit: 'stretch',
      allowUpscale: true,
    });
    expect(stretched.ok && stretched.output).toEqual({ width: 300, height: 100 });
    // The whole source is drawn into a different aspect ratio.
    expect(stretched.ok && stretched.sourceRect).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  it('clamps output by the megapixel ceiling', () => {
    const result = planResize({
      ...base,
      source: { width: 20_000, height: 20_000 },
      width: 20_000,
      allowUpscale: true,
      maxOutputPixels: 1_000_000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.clampedByPixels).toBe(true);
    expect(result.output.width * result.output.height).toBeLessThanOrEqual(1_000_000);
  });

  it('rejects zero, negative and missing dimensions', () => {
    expect(planResize({ ...base, width: 0 }).ok).toBe(false);
    expect(planResize({ ...base, width: -100 }).ok).toBe(false);
    expect(planResize({ ...base }).ok).toBe(false);
    expect(planResize({ ...base, source: { width: 0, height: 0 }, width: 100 }).ok).toBe(false);
  });

  it('scales by percentage', () => {
    expect(scaleByPercent(source, 50)).toEqual({ width: 2000, height: 1500 });
    expect(scaleByPercent(source, 25)).toEqual({ width: 1000, height: 750 });
    expect(scaleByPercent(source, 200)).toEqual({ width: 8000, height: 6000 });
  });

  it('contains and covers correctly', () => {
    expect(containWithin({ width: 100, height: 50 }, { width: 50, height: 50 })).toEqual({
      width: 50,
      height: 25,
    });
    expect(coverSourceRect({ width: 100, height: 50 }, { width: 50, height: 50 })).toEqual({
      x: 25,
      y: 0,
      width: 50,
      height: 50,
    });
  });
});

describe('crop geometry', () => {
  const bounds = { width: 4000, height: 3000 };

  it('keeps a crop inside the image', () => {
    expect(clampCropRect({ x: -50, y: -50, width: 100, height: 100 }, bounds)).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    expect(clampCropRect({ x: 3990, y: 2990, width: 100, height: 100 }, bounds)).toEqual({
      x: 3900,
      y: 2900,
      width: 100,
      height: 100,
    });
  });

  it('shrinks a crop larger than the image', () => {
    const result = clampCropRect({ x: 0, y: 0, width: 9000, height: 9000 }, bounds);
    expect(result).toEqual({ x: 0, y: 0, width: 4000, height: 3000 });
  });

  it('never produces a zero-sized crop', () => {
    const result = clampCropRect({ x: 0, y: 0, width: 0, height: 0 }, bounds);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('finds the largest centred rectangle of a given ratio', () => {
    // The square profile-picture example from the cropper page.
    const square = largestRectWithRatio(bounds, 1);
    expect(square.width).toBe(3000);
    expect(square.height).toBe(3000);
    expect(square.x).toBe(500);

    const wide = largestRectWithRatio(bounds, 16 / 9);
    expect(wide.width).toBe(4000);
    expect(wide.height).toBe(2250);
  });

  it('exports at source resolution, not preview resolution', () => {
    // The guarantee the cropper page makes: a small preview costs nothing.
    const preview = { width: 400, height: 300 };
    const rect = { x: 110, y: 15, width: 240, height: 240 };

    const source = previewRectToSource(rect, preview, bounds);
    expect(source).toEqual({ x: 1100, y: 150, width: 2400, height: 2400 });
  });

  it('rotates dimensions in quarter turns', () => {
    expect(rotateDimensions({ width: 100, height: 50 }, 0)).toEqual({ width: 100, height: 50 });
    expect(rotateDimensions({ width: 100, height: 50 }, 1)).toEqual({ width: 50, height: 100 });
    expect(rotateDimensions({ width: 100, height: 50 }, 2)).toEqual({ width: 100, height: 50 });
    expect(rotateDimensions({ width: 100, height: 50 }, 3)).toEqual({ width: 50, height: 100 });
  });
});

describe('size change reporting', () => {
  it('reports a saving honestly', () => {
    const smaller = describeSizeChange(1000, 400);
    expect(smaller.larger).toBe(false);
    expect(smaller.percent).toBeCloseTo(60, 1);
    expect(smaller.label).toBe('60.0% smaller');
  });

  it('says plainly when the output got larger', () => {
    // The case the image pages promise to report rather than hide.
    const larger = describeSizeChange(400, 1000);
    expect(larger.larger).toBe(true);
    expect(larger.label).toContain('larger');
  });

  it('reports no change for an identical size', () => {
    expect(describeSizeChange(1000, 1000).label).toBe('no change');
  });

  it('handles a zero starting size without dividing by zero', () => {
    expect(describeSizeChange(0, 100).label).toBe('no change');
  });
});

describe('ZIP entry naming', () => {
  it('keeps distinct names untouched', () => {
    const used = new Set<string>();
    expect(uniqueName('a.jpg', used)).toBe('a.jpg');
    expect(uniqueName('b.jpg', used)).toBe('b.jpg');
  });

  it('disambiguates collisions rather than overwriting', () => {
    const used = new Set<string>();
    expect(uniqueName('photo.jpg', used)).toBe('photo.jpg');
    expect(uniqueName('photo.jpg', used)).toBe('photo (2).jpg');
    expect(uniqueName('photo.jpg', used)).toBe('photo (3).jpg');
  });

  it('handles names with no extension', () => {
    const used = new Set<string>();
    expect(uniqueName('README', used)).toBe('README');
    expect(uniqueName('README', used)).toBe('README (2)');
  });
});
