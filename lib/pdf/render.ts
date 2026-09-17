/**
 * PDF page rendering with pdf.js (spec §6.24, §6.26).
 *
 * Parsing and rasterising run in a dedicated worker so a long document does not
 * block the interface. Every runtime asset — the worker, the standard fonts,
 * the CMaps — is served from our own origin, because the Content Security
 * Policy allows no third-party origin and a tool promising local processing
 * should not contact one.
 */

import type * as PdfJsTypes from 'pdfjs-dist';

import { pdfLimits } from '@/lib/config/limits';
import { createCanvas, encodeCanvas, releaseCanvas } from '@/lib/image/codec';

import { PdfError } from './document';

/** Served from `public/pdfjs`, populated by scripts/copy-pdfjs-assets.mjs. */
const PDFJS_ASSET_BASE = '/pdfjs';

type PdfJsModule = typeof PdfJsTypes;

let modulePromise: Promise<PdfJsModule> | null = null;

/**
 * Loads pdf.js on demand and points it at our own asset copies.
 *
 * Without `standardFontDataUrl` any document relying on the standard 14 fonts
 * renders with missing glyphs — confirmed during the Phase 0 proof-of-concept,
 * which logged exactly that warning.
 */
async function loadPdfJs(): Promise<PdfJsModule> {
  modulePromise ??= (async () => {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_ASSET_BASE}/pdf.worker.min.mjs`;
    return pdfjs;
  })();

  return modulePromise;
}

export type RenderablePdf = {
  pageCount: number;
  /** Renders one page, returning a canvas-encoded blob. */
  renderPage: (pageNumber: number, options: RenderPageOptions) => Promise<RenderedPage>;
  /** Releases the worker's copy of the document. */
  destroy: () => Promise<void>;
};

export type RenderPageOptions = {
  /** 1 gives 72 DPI; 2 is roughly 150 DPI. */
  scale: number;
  format: 'image/jpeg' | 'image/png';
  quality: number;
  /** Painted behind the page, since PDF pages have no inherent background. */
  background: string;
  signal?: AbortSignal;
};

export type RenderedPage = {
  pageNumber: number;
  blob: Blob;
  width: number;
  height: number;
};

/**
 * Opens a document for rendering.
 *
 * Every asset path points at our own origin. `wasmUrl` matters for the CSP:
 * pdf.js 5 compiles WebAssembly for image decoding, which is why the policy
 * carries `wasm-unsafe-eval` — a token that permits WebAssembly compilation
 * only, never `eval` (ADR 0006).
 */
export async function openForRendering(data: Uint8Array): Promise<RenderablePdf> {
  const pdfjs = await loadPdfJs();

  let document: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;

  try {
    // pdf.js transfers the buffer to the worker, so hand it a copy — the caller
    // usually still needs the original bytes.
    document = await pdfjs.getDocument({
      data: new Uint8Array(data),
      standardFontDataUrl: `${PDFJS_ASSET_BASE}/standard_fonts/`,
      cMapUrl: `${PDFJS_ASSET_BASE}/cmaps/`,
      cMapPacked: true,
      wasmUrl: `${PDFJS_ASSET_BASE}/wasm/`,
    }).promise;
  } catch (error) {
    if (error instanceof Error && /password/i.test(error.message)) {
      throw new PdfError({
        code: 'encrypted_document',
        message:
          'This PDF is password protected. Remove the password in an authorised PDF editor, then try again.',
      });
    }
    throw new PdfError({
      code: 'corrupt_document',
      message: 'This PDF could not be opened for rendering. It may be damaged or incomplete.',
    });
  }

  return {
    pageCount: document.numPages,

    async renderPage(pageNumber, options) {
      if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

      const page = await document.getPage(pageNumber);

      try {
        const viewport = page.getViewport({ scale: options.scale });
        const width = Math.max(1, Math.floor(viewport.width));
        const height = Math.max(1, Math.floor(viewport.height));

        if (width * height > pdfLimits.maxRenderPixelsPerPage) {
          throw new PdfError({
            code: 'out_of_memory_guard',
            message: `Page ${pageNumber} would render at ${width} × ${height} pixels, beyond the per-page limit. Choose a lower resolution.`,
          });
        }

        const { canvas, context } = createCanvas(width, height);

        // PDF pages are transparent; without this they encode as black in JPEG.
        context.fillStyle = options.background;
        context.fillRect(0, 0, width, height);

        try {
          await page.render({
            canvas: canvas as HTMLCanvasElement,
            canvasContext: context as CanvasRenderingContext2D,
            viewport,
          }).promise;

          if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');

          // encodeCanvas releases the backing store on the way out.
          const blob = await encodeCanvas(canvas, options.format, options.quality);
          return { pageNumber, blob, width, height };
        } catch (renderError) {
          releaseCanvas(canvas);
          throw renderError;
        }
      } finally {
        // Frees the worker-side page object rather than waiting for collection.
        page.cleanup();
      }
    },

    async destroy() {
      await document.destroy();
    },
  };
}

/**
 * Guards a whole render job before it starts.
 *
 * Checking the total up front means a selection that would exhaust memory is
 * refused with an explanation rather than part-way through.
 */
export function checkRenderBudget(
  pages: readonly { width: number; height: number }[],
  scale: number,
): { ok: true } | { ok: false; error: string } {
  const totalPixels = pages.reduce(
    (sum, page) => sum + Math.floor(page.width * scale) * Math.floor(page.height * scale),
    0,
  );

  if (totalPixels > pdfLimits.maxRenderPixelsTotal) {
    const megapixels = (totalPixels / 1_000_000).toFixed(0);
    const limit = (pdfLimits.maxRenderPixelsTotal / 1_000_000).toFixed(0);
    return {
      ok: false,
      error: `Rendering these pages at this resolution would produce ${megapixels} megapixels, beyond the ${limit} megapixel limit. Select fewer pages or choose a lower resolution.`,
    };
  }

  return { ok: true };
}

/** Resolution presets, labelled with their approximate DPI. */
export const SCALE_PRESETS = [
  { value: '1', label: 'Screen — 72 DPI', scale: 1 },
  { value: '2', label: 'Standard — 150 DPI', scale: 2 },
  { value: '3', label: 'High — 216 DPI', scale: 3 },
  { value: '4', label: 'Print — 288 DPI', scale: 4 },
] as const;
