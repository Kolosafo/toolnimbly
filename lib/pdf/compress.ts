/**
 * PDF compression (spec §6.26, ADR 0005).
 *
 * Two modes, named for what they actually do:
 *
 * 1. Structure optimisation rewrites the document without touching page
 *    content. Safe, and usually saves very little — most of a PDF's bytes are
 *    embedded images and fonts, which pdf-lib cannot recompress.
 * 2. Rasterising renders each page to an image and rebuilds the document.
 *    Large savings, but selectable text, links, bookmarks, annotations, form
 *    fields and accessibility tagging are all discarded.
 *
 * Neither mode declares success because it finished. Both compare the real byte
 * counts, re-parse the output, and say plainly when the result is larger.
 */

import { PDFDocument } from 'pdf-lib';

import {
  applyOutputMetadata,
  DOCUMENT_OPTIONS,
  loadPdf,
  PdfError,
  verifyOutput,
  type PageGeometry,
} from './document';
import { openForRendering } from './render';

export type CompressionMode = 'structure' | 'rasterise';

export type CompressOptions = {
  mode: CompressionMode;
  /** Render scale for rasterise mode. 2 is roughly 150 DPI. */
  scale: number;
  /** JPEG quality for rasterise mode. */
  quality: number;
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number) => void;
};

export type CompressResult = {
  bytes: Uint8Array;
  inputBytes: number;
  outputBytes: number;
  pageCount: number;
  /** True when the output is larger — reported, never hidden. */
  grewLarger: boolean;
  /** What the chosen mode gave up, stated in the result rather than implied. */
  tradeOffs: string[];
  /** Set when verification found a problem with the generated file. */
  verificationError?: string;
};

export async function compressPdf(
  data: Uint8Array,
  options: CompressOptions,
): Promise<CompressResult> {
  const loaded = await loadPdf(data);
  const geometry = loaded.pages;

  const result =
    options.mode === 'structure'
      ? await optimiseStructure(loaded.document, geometry)
      : await rasterisePages(data, geometry, options);

  // Confirm the output is a real, readable PDF with the page count and geometry
  // it should have (spec §6.26: verify each page is renderable, not just that a
  // header exists).
  const verification = await verifyOutput(result.bytes, {
    pageCount: geometry.length,
    // Rasterising intentionally normalises rotation into the pixels, so only
    // structure mode can promise geometry is untouched.
    ...(options.mode === 'structure' ? { geometry } : {}),
  });

  return {
    bytes: result.bytes,
    inputBytes: data.byteLength,
    outputBytes: result.bytes.byteLength,
    pageCount: geometry.length,
    grewLarger: result.bytes.byteLength > data.byteLength,
    tradeOffs: result.tradeOffs,
    ...(verification.ok ? {} : { verificationError: verification.error }),
  };
}

/**
 * Rewrites the document, dropping metadata and unused objects.
 *
 * `useObjectStreams` packs the cross-reference data more compactly, which is
 * essentially the only structural saving available here.
 */
async function optimiseStructure(
  document: PDFDocument,
  _geometry: readonly PageGeometry[],
): Promise<{ bytes: Uint8Array; tradeOffs: string[] }> {
  // Clear anything identifying carried over from the source document.
  document.setTitle('');
  document.setAuthor('');
  document.setSubject('');
  document.setKeywords([]);
  applyOutputMetadata(document);

  const bytes = await document.save({ useObjectStreams: true });

  return {
    bytes,
    tradeOffs: [
      'Pages are untouched: text stays selectable, vectors stay sharp, and page sizes and rotation are unchanged.',
      'Embedded images and fonts are not recompressed, which is why the saving is often small.',
    ],
  };
}

/**
 * Renders every page to a JPEG and rebuilds the document from those images.
 *
 * Physical page dimensions are preserved so the result still prints correctly,
 * but everything that was not a visible pixel is gone.
 */
async function rasterisePages(
  data: Uint8Array,
  geometry: readonly PageGeometry[],
  options: CompressOptions,
): Promise<{ bytes: Uint8Array; tradeOffs: string[] }> {
  const renderer = await openForRendering(data);

  try {
    const target = await PDFDocument.create(DOCUMENT_OPTIONS);

    for (let index = 0; index < geometry.length; index += 1) {
      if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

      const source = geometry[index];
      if (!source) continue;

      const rendered = await renderer.renderPage(index + 1, {
        scale: options.scale,
        format: 'image/jpeg',
        quality: options.quality,
        background: '#ffffff',
        ...(options.signal ? { signal: options.signal } : {}),
      });

      const embedded = await target.embedJpg(await rendered.blob.arrayBuffer());

      // A rotated page renders upright, so the new page takes the rotated
      // dimensions and needs no rotation of its own.
      const swap = source.rotation === 90 || source.rotation === 270;
      const width = swap ? source.height : source.width;
      const height = swap ? source.width : source.height;

      const page = target.addPage([width, height]);
      page.drawImage(embedded, { x: 0, y: 0, width, height });

      options.onProgress?.(index + 1, geometry.length);
    }

    applyOutputMetadata(target);

    return {
      bytes: await target.save(),
      tradeOffs: [
        'Selectable text, links, bookmarks, annotations, form fields and accessibility tagging are all gone — each page is now a picture.',
        'Physical page sizes are preserved, so printing is unaffected.',
        'A rotated page is rendered upright and its rotation baked into the image.',
      ],
    };
  } finally {
    await renderer.destroy();
  }
}

/** Guard used before offering rasterise mode on a text-heavy document. */
export function rasteriseWarning(pageCount: number): string {
  return `Rasterising will convert all ${pageCount} ${pageCount === 1 ? 'page' : 'pages'} into images. Text will no longer be selectable or searchable, and links and form fields will stop working. For a document made in a word processor this usually makes the file larger, not smaller.`;
}

export { PdfError };
