/**
 * Image-to-PDF assembly (spec §6.23, §6.25).
 *
 * Shared by the image-to-PDF and JPG-to-PDF routes: both use this engine and
 * differ only in which formats they accept and what they say.
 */

import { PDFDocument, type PDFImage } from 'pdf-lib';

import { applyOutputMetadata, DOCUMENT_OPTIONS, PdfError } from './document';

/** Page sizes in PDF points, where 72 points make an inch. */
export const PAGE_SIZES = {
  fit: { label: 'Fit each image', width: 0, height: 0 },
  a4: { label: 'A4 (210 × 297 mm)', width: 595.28, height: 841.89 },
  letter: { label: 'US Letter (8.5 × 11 in)', width: 612, height: 792 },
  legal: { label: 'US Legal (8.5 × 14 in)', width: 612, height: 1008 },
  a3: { label: 'A3 (297 × 420 mm)', width: 841.89, height: 1190.55 },
  a5: { label: 'A5 (148 × 210 mm)', width: 419.53, height: 595.28 },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;

export type PageOrientation = 'auto' | 'portrait' | 'landscape';
export type ImageFit = 'contain' | 'cover';

export const MARGIN_PRESETS = {
  none: { label: 'None', points: 0 },
  small: { label: 'Small (10 mm)', points: 28.35 },
  medium: { label: 'Medium (20 mm)', points: 56.7 },
  large: { label: 'Large (30 mm)', points: 85.05 },
} as const;

export type MarginKey = keyof typeof MARGIN_PRESETS;

export type AssembleInput = {
  /** Raw file bytes, embedded directly where the format allows. */
  data: Uint8Array;
  type: 'image/jpeg' | 'image/png';
  name: string;
};

export type AssembleOptions = {
  pageSize: PageSizeKey;
  orientation: PageOrientation;
  margin: MarginKey;
  fit: ImageFit;
  title?: string;
};

export type AssembleResult = {
  bytes: Uint8Array;
  pageCount: number;
  /** True when cover mode cropped at least one image. */
  cropped: boolean;
};

/**
 * Builds a PDF with one image per page.
 *
 * JPEG and PNG bytes are embedded as they are, so a photo is not decoded and
 * re-encoded on its way into the document — no second round of quality loss,
 * and a smaller file.
 */
export async function assembleImagesToPdf(
  inputs: readonly AssembleInput[],
  options: AssembleOptions,
  signal?: AbortSignal,
): Promise<AssembleResult> {
  if (inputs.length === 0) {
    throw new PdfError({ code: 'invalid_input', message: 'Add at least one image.' });
  }

  const document = await PDFDocument.create(DOCUMENT_OPTIONS);
  const margin = MARGIN_PRESETS[options.margin].points;
  let cropped = false;

  for (const input of inputs) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

    let image: PDFImage;
    try {
      image =
        input.type === 'image/jpeg'
          ? await document.embedJpg(input.data)
          : await document.embedPng(input.data);
    } catch {
      throw new PdfError({
        code: 'decode_failed',
        message: `${input.name} could not be embedded. It may be damaged, or saved in a variant this tool cannot read.`,
      });
    }

    const pageSize = resolvePageSize(options, image.width, image.height);
    const page = document.addPage([pageSize.width, pageSize.height]);

    const available = {
      width: Math.max(1, pageSize.width - margin * 2),
      height: Math.max(1, pageSize.height - margin * 2),
    };

    const placement = placeImage(
      { width: image.width, height: image.height },
      available,
      options.fit,
    );

    if (placement.cropped) cropped = true;

    page.drawImage(image, {
      x: margin + (available.width - placement.width) / 2,
      y: margin + (available.height - placement.height) / 2,
      width: placement.width,
      height: placement.height,
    });
  }

  applyOutputMetadata(document, options.title);

  return {
    bytes: await document.save(),
    pageCount: document.getPageCount(),
    cropped,
  };
}

/**
 * Resolves the physical page size.
 *
 * `fit` gives each page the image's own proportions, which suits screenshots.
 * `auto` orientation gives each page the orientation of its own image, so a
 * portrait photo produces a portrait page even among landscape ones.
 */
export function resolvePageSize(
  options: Pick<AssembleOptions, 'pageSize' | 'orientation'>,
  imageWidth: number,
  imageHeight: number,
): { width: number; height: number } {
  if (options.pageSize === 'fit') {
    return { width: imageWidth, height: imageHeight };
  }

  const preset = PAGE_SIZES[options.pageSize];
  const imageIsLandscape = imageWidth > imageHeight;

  const wantsLandscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' && imageIsLandscape);

  return wantsLandscape
    ? { width: preset.height, height: preset.width }
    : { width: preset.width, height: preset.height };
}

/**
 * Scales an image into the available area.
 *
 * `contain` fits the whole image, which can leave space at the sides.
 * `cover` fills the area and crops the overflow — reported so the interface can
 * warn before it happens.
 */
export function placeImage(
  image: { width: number; height: number },
  available: { width: number; height: number },
  fit: ImageFit,
): { width: number; height: number; cropped: boolean } {
  const scale =
    fit === 'cover'
      ? Math.max(available.width / image.width, available.height / image.height)
      : Math.min(available.width / image.width, available.height / image.height);

  const width = image.width * scale;
  const height = image.height * scale;

  return {
    width,
    height,
    cropped: fit === 'cover' && (width > available.width + 0.5 || height > available.height + 0.5),
  };
}
