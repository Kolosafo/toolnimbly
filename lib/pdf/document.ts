/**
 * PDF loading, page copying and output validation (spec §6 "Shared PDF rules",
 * Appendix A).
 *
 * Pages are copied rather than re-rendered wherever a tool is not explicitly
 * rasterising, which is what keeps text selectable and page geometry exact.
 *
 * Encrypted documents are detected and refused. `ignoreEncryption` is never
 * used: it does not decrypt anything, it just produces a document whose content
 * streams are unreadable — and circumventing protection is out of scope by
 * design (spec §2 non-goals, SECURITY.md).
 */

import { PDFDocument, type PDFPage } from 'pdf-lib';

import type { AllowedErrorCode } from '@/lib/analytics/events';
import { pdfLimits } from '@/lib/config/limits';

export type PdfFailure = { code: AllowedErrorCode; message: string };

export class PdfError extends Error {
  readonly failure: PdfFailure;

  constructor(failure: PdfFailure) {
    super(failure.message);
    this.name = 'PdfError';
    this.failure = failure;
  }
}

export type PageGeometry = {
  /** One-based, matching what a viewer displays. */
  pageNumber: number;
  width: number;
  height: number;
  /** Rotation in degrees: 0, 90, 180 or 270. */
  rotation: number;
};

export type LoadedPdf = {
  document: PDFDocument;
  pageCount: number;
  pages: PageGeometry[];
  bytes: number;
};

/** pdf-lib signals encryption through its message rather than a typed error. */
function isEncryptionError(error: unknown): boolean {
  return error instanceof Error && /encrypted/i.test(error.message);
}

/**
 * Loads a PDF, refusing encrypted and corrupt files with messages that say what
 * to do next (spec §5.6).
 */
export async function loadPdf(data: ArrayBuffer | Uint8Array): Promise<LoadedPdf> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

  let document: PDFDocument;

  try {
    document = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      ...DOCUMENT_OPTIONS,
    });
  } catch (error) {
    if (isEncryptionError(error)) {
      throw new PdfError({
        code: 'encrypted_document',
        message:
          'This PDF is encrypted. Remove its password in an authorised PDF editor, then try again. This tool does not remove password protection.',
      });
    }

    throw new PdfError({
      code: 'corrupt_document',
      message:
        'This PDF could not be read. It may be damaged or incomplete — try re-downloading or re-exporting it.',
    });
  }

  const pageCount = document.getPageCount();

  if (pageCount === 0) {
    throw new PdfError({
      code: 'corrupt_document',
      message: 'This PDF contains no pages.',
    });
  }

  if (pageCount > pdfLimits.maxPages) {
    throw new PdfError({
      code: 'too_large',
      message: `This PDF has ${pageCount} pages. The limit is ${pdfLimits.maxPages} pages, to keep memory use within what a phone can handle.`,
    });
  }

  return {
    document,
    pageCount,
    pages: document.getPages().map((page, index) => geometryOf(page, index + 1)),
    bytes: bytes.byteLength,
  };
}

function geometryOf(page: PDFPage, pageNumber: number): PageGeometry {
  const { width, height } = page.getSize();
  return {
    pageNumber,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    // Normalised into [0, 360) so a negative or over-rotated value reads sanely.
    rotation: ((page.getRotation().angle % 360) + 360) % 360,
  };
}

/**
 * Minimal output metadata.
 *
 * Producer and creator are set deliberately and nothing else: a local file path
 * or author name copied from a source document would leak information the user
 * did not choose to share (spec §6.27).
 *
 * Must be paired with `DOCUMENT_OPTIONS`. pdf-lib rewrites the Producer and
 * modification date on save unless `updateMetadata: false` was passed when the
 * document was created or loaded — which silently undoes everything set here.
 */
/**
 * Passed to every `PDFDocument.create` and `PDFDocument.load` call.
 *
 * `updateMetadata: false` stops pdf-lib stamping its own Producer and a fresh
 * modification date over ours when the document is saved. It is a create/load
 * option rather than a save option, which is easy to miss.
 */
export const DOCUMENT_OPTIONS = { updateMetadata: false } as const;

export function applyOutputMetadata(document: PDFDocument, title?: string): void {
  document.setProducer('ToolNimbly');
  document.setCreator('ToolNimbly');
  if (title) document.setTitle(title);
  const now = new Date();
  document.setCreationDate(now);
  document.setModificationDate(now);
}

/**
 * Copies the given one-based pages from `source` into a new document.
 * Page dimensions and rotation come across with the page.
 */
export async function extractPages(
  source: PDFDocument,
  pageNumbers: readonly number[],
  title?: string,
): Promise<Uint8Array> {
  const target = await PDFDocument.create(DOCUMENT_OPTIONS);
  const indices = pageNumbers.map((pageNumber) => pageNumber - 1);

  const copied = await target.copyPages(source, indices);
  for (const page of copied) target.addPage(page);

  applyOutputMetadata(target, title);
  return target.save();
}

export type MergeInput = { name: string; data: Uint8Array };

export type MergeResult = {
  bytes: Uint8Array;
  pageCount: number;
  /** Per-input page counts, in the order they were merged. */
  contributions: { name: string; pages: number }[];
};

/**
 * Merges documents in the order given.
 *
 * A failure names the file responsible so the rest of the queue stays usable
 * (spec §6.27).
 */
export async function mergePdfs(inputs: readonly MergeInput[], title?: string): Promise<MergeResult> {
  if (inputs.length < pdfLimits.minMergeInputs) {
    throw new PdfError({
      code: 'invalid_input',
      message: `Add at least ${pdfLimits.minMergeInputs} PDFs to merge.`,
    });
  }

  if (inputs.length > pdfLimits.maxMergeInputs) {
    throw new PdfError({
      code: 'too_many_files',
      message: `This tool merges up to ${pdfLimits.maxMergeInputs} PDFs at a time. Merge in stages for a larger set.`,
    });
  }

  const target = await PDFDocument.create(DOCUMENT_OPTIONS);
  const contributions: { name: string; pages: number }[] = [];

  for (const input of inputs) {
    let loaded: LoadedPdf;
    try {
      loaded = await loadPdf(input.data);
    } catch (error) {
      if (error instanceof PdfError) {
        throw new PdfError({
          code: error.failure.code,
          message: `${input.name}: ${error.failure.message}`,
        });
      }
      throw error;
    }

    const indices = Array.from({ length: loaded.pageCount }, (_, index) => index);
    const copied = await target.copyPages(loaded.document, indices);
    for (const page of copied) target.addPage(page);

    contributions.push({ name: input.name, pages: loaded.pageCount });
  }

  applyOutputMetadata(target, title);

  return {
    bytes: await target.save(),
    pageCount: target.getPageCount(),
    contributions,
  };
}

/**
 * Re-parses generated output before it is offered for download.
 *
 * A tool must never claim success because a process completed (spec §6.26): the
 * result is loaded again and its page geometry compared against what was
 * intended.
 */
export async function verifyOutput(
  bytes: Uint8Array,
  expected: { pageCount: number; geometry?: readonly PageGeometry[] },
): Promise<{ ok: true; pages: PageGeometry[] } | { ok: false; error: string }> {
  try {
    const loaded = await loadPdf(bytes);

    if (loaded.pageCount !== expected.pageCount) {
      return {
        ok: false,
        error: `The generated PDF has ${loaded.pageCount} pages but should have ${expected.pageCount}.`,
      };
    }

    if (expected.geometry) {
      for (const [index, want] of expected.geometry.entries()) {
        const got = loaded.pages[index];
        if (!got) return { ok: false, error: `Page ${index + 1} is missing from the output.` };

        // A tolerance of a point absorbs the rounding pdf-lib applies when it
        // writes sizes back out.
        const sizeMatches =
          Math.abs(got.width - want.width) < 1 && Math.abs(got.height - want.height) < 1;

        if (!sizeMatches || got.rotation !== want.rotation) {
          return {
            ok: false,
            error: `Page ${index + 1} changed size or rotation during processing.`,
          };
        }
      }
    }

    return { ok: true, pages: loaded.pages };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof PdfError
          ? `The generated PDF could not be re-read: ${error.failure.message}`
          : 'The generated PDF could not be re-read.',
    };
  }
}

/** Human-readable page size, e.g. "A4 portrait" or "612 × 792 pt". */
export function describePageSize(geometry: PageGeometry): string {
  const swap = geometry.rotation === 90 || geometry.rotation === 270;
  const width = swap ? geometry.height : geometry.width;
  const height = swap ? geometry.width : geometry.height;

  const named = namedSize(geometry.width, geometry.height);
  const orientation = width > height ? 'landscape' : 'portrait';

  if (named) return `${named} ${orientation}`;
  return `${Math.round(width)} × ${Math.round(height)} pt`;
}

function namedSize(width: number, height: number): string | null {
  const matches = (a: number, b: number) =>
    (Math.abs(width - a) < 2 && Math.abs(height - b) < 2) ||
    (Math.abs(width - b) < 2 && Math.abs(height - a) < 2);

  if (matches(595.28, 841.89)) return 'A4';
  if (matches(612, 792)) return 'US Letter';
  if (matches(612, 1008)) return 'US Legal';
  if (matches(841.89, 1190.55)) return 'A3';
  if (matches(419.53, 595.28)) return 'A5';
  return null;
}
