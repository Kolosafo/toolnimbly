import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import {
  assembleImagesToPdf,
  placeImage,
  resolvePageSize,
  PAGE_SIZES,
} from '@/lib/pdf/assemble';
import {
  describePageSize,
  extractPages,
  loadPdf,
  mergePdfs,
  PdfError,
  verifyOutput,
} from '@/lib/pdf/document';

const pdf = (name: string) =>
  new Uint8Array(readFileSync(join(process.cwd(), 'tests/fixtures/pdfs', name)));
const image = (name: string) =>
  new Uint8Array(readFileSync(join(process.cwd(), 'tests/fixtures/images', name)));

describe('loading', () => {
  it('reads a document and reports its page geometry', async () => {
    const loaded = await loadPdf(pdf('three-page.pdf'));
    expect(loaded.pageCount).toBe(3);
    expect(loaded.pages).toHaveLength(3);
    expect(loaded.pages[0]?.pageNumber).toBe(1);
    expect(Math.round(loaded.pages[0]?.width ?? 0)).toBe(595);
    expect(Math.round(loaded.pages[0]?.height ?? 0)).toBe(842);
  });

  it('reports mixed sizes and rotations exactly', async () => {
    const loaded = await loadPdf(pdf('mixed-sizes.pdf'));
    expect(loaded.pageCount).toBe(4);

    const summary = loaded.pages.map(
      (page) => `${Math.round(page.width)}x${Math.round(page.height)}@${page.rotation}`,
    );
    expect(summary).toEqual(['595x842@0', '612x792@0', '595x842@90', '612x792@270']);
  });

  it('refuses an encrypted PDF without attempting to bypass it', async () => {
    await expect(loadPdf(pdf('encrypted.pdf'))).rejects.toThrow(PdfError);

    try {
      await loadPdf(pdf('encrypted.pdf'));
    } catch (error) {
      expect(error).toBeInstanceOf(PdfError);
      if (error instanceof PdfError) {
        expect(error.failure.code).toBe('encrypted_document');
        expect(error.failure.message).toMatch(/authorised PDF editor/i);
        // The tool states plainly that it does not remove protection.
        expect(error.failure.message).toMatch(/does not remove password protection/i);
      }
    }
  });

  it('fails cleanly on a corrupt document', async () => {
    try {
      await loadPdf(pdf('truncated.pdf'));
      expect.unreachable('a truncated PDF should not load');
    } catch (error) {
      expect(error).toBeInstanceOf(PdfError);
      if (error instanceof PdfError) {
        expect(error.failure.code).toBe('corrupt_document');
        expect(error.failure.message).toMatch(/damaged or incomplete/i);
      }
    }
  });

  it('rejects a file that is not a PDF at all', async () => {
    const notPdf = new Uint8Array(
      readFileSync(join(process.cwd(), 'tests/fixtures/pdfs/not-a-pdf.txt')),
    );
    await expect(loadPdf(notPdf)).rejects.toThrow(PdfError);
  });

  it('names common page sizes', async () => {
    const loaded = await loadPdf(pdf('mixed-sizes.pdf'));
    expect(describePageSize(loaded.pages[0] as never)).toBe('A4 portrait');
    expect(describePageSize(loaded.pages[1] as never)).toBe('US Letter portrait');
    // A rotated A4 reads as landscape.
    expect(describePageSize(loaded.pages[2] as never)).toBe('A4 landscape');
  });
});

describe('page extraction', () => {
  it('extracts the selected pages in order', async () => {
    const loaded = await loadPdf(pdf('ten-page.pdf'));
    const bytes = await extractPages(loaded.document, [2, 4, 6]);

    const result = await loadPdf(bytes);
    expect(result.pageCount).toBe(3);
  });

  it('preserves page size and rotation through extraction', async () => {
    const loaded = await loadPdf(pdf('mixed-sizes.pdf'));
    // Pull out the Letter page and the rotated A4.
    const bytes = await extractPages(loaded.document, [2, 3]);

    const result = await loadPdf(bytes);
    const summary = result.pages.map(
      (page) => `${Math.round(page.width)}x${Math.round(page.height)}@${page.rotation}`,
    );
    expect(summary).toEqual(['612x792@0', '595x842@90']);
  });

  it('extracts a single page', async () => {
    const loaded = await loadPdf(pdf('three-page.pdf'));
    const bytes = await extractPages(loaded.document, [2]);
    expect((await loadPdf(bytes)).pageCount).toBe(1);
  });

  it('sets minimal metadata without leaking the source title', async () => {
    const loaded = await loadPdf(pdf('three-page.pdf'));
    const bytes = await extractPages(loaded.document, [1]);

    // Must load with updateMetadata: false. pdf-lib rewrites Producer and the
    // modification date on load by default, so reading it back any other way
    // measures pdf-lib rather than what we wrote.
    const result = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(result.getProducer()).toBe('ToolNimbly');
    expect(result.getCreator()).toBe('ToolNimbly');
  });

  it('does not carry the source document title into the output', async () => {
    const source = await PDFDocument.load(pdf('three-page.pdf'), { updateMetadata: false });
    expect(source.getTitle()).toBe('Three page');

    const loaded = await loadPdf(pdf('three-page.pdf'));
    const bytes = await extractPages(loaded.document, [1]);

    const result = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(result.getTitle() ?? '').not.toBe('Three page');
  });
});

describe('merging', () => {
  it('combines documents in the order given', async () => {
    const result = await mergePdfs([
      { name: 'three-page.pdf', data: pdf('three-page.pdf') },
      { name: 'two-page.pdf', data: pdf('two-page.pdf') },
    ]);

    expect(result.pageCount).toBe(5);
    expect(result.contributions).toEqual([
      { name: 'three-page.pdf', pages: 3 },
      { name: 'two-page.pdf', pages: 2 },
    ]);
  });

  it('respects a different order', async () => {
    const result = await mergePdfs([
      { name: 'two-page.pdf', data: pdf('two-page.pdf') },
      { name: 'three-page.pdf', data: pdf('three-page.pdf') },
    ]);
    expect(result.contributions[0]?.name).toBe('two-page.pdf');
    expect(result.pageCount).toBe(5);
  });

  it('keeps every page at its original size and rotation', async () => {
    // The mortgage-pack case from the merger page: mixed A4 and Letter, one
    // rotated page, all preserved rather than forced to a common size.
    const result = await mergePdfs([
      { name: 'mixed-sizes.pdf', data: pdf('mixed-sizes.pdf') },
      { name: 'single-page.pdf', data: pdf('single-page.pdf') },
    ]);

    const merged = await loadPdf(result.bytes);
    const summary = merged.pages.map(
      (page) => `${Math.round(page.width)}x${Math.round(page.height)}@${page.rotation}`,
    );
    expect(summary).toEqual(['595x842@0', '612x792@0', '595x842@90', '612x792@270', '595x842@0']);
  });

  it('names the file responsible when one input is unusable', async () => {
    try {
      await mergePdfs([
        { name: 'good.pdf', data: pdf('three-page.pdf') },
        { name: 'locked.pdf', data: pdf('encrypted.pdf') },
      ]);
      expect.unreachable('an encrypted input should stop the merge');
    } catch (error) {
      expect(error).toBeInstanceOf(PdfError);
      if (error instanceof PdfError) {
        expect(error.failure.message).toContain('locked.pdf');
        expect(error.failure.code).toBe('encrypted_document');
      }
    }
  });

  it('requires at least two documents', async () => {
    await expect(
      mergePdfs([{ name: 'one.pdf', data: pdf('three-page.pdf') }]),
    ).rejects.toThrow(PdfError);
  });

  it('refuses more than the documented maximum', async () => {
    const inputs = Array.from({ length: 11 }, (_, index) => ({
      name: `doc-${index}.pdf`,
      data: pdf('single-page.pdf'),
    }));
    await expect(mergePdfs(inputs)).rejects.toThrow(/up to 10 PDFs/);
  });
});

describe('output verification', () => {
  it('accepts output with the expected page count and geometry', async () => {
    const loaded = await loadPdf(pdf('mixed-sizes.pdf'));
    const bytes = await extractPages(loaded.document, [1, 2, 3, 4]);

    const verification = await verifyOutput(bytes, {
      pageCount: 4,
      geometry: loaded.pages,
    });
    expect(verification.ok).toBe(true);
  });

  it('rejects output with the wrong page count', async () => {
    const loaded = await loadPdf(pdf('three-page.pdf'));
    const bytes = await extractPages(loaded.document, [1]);

    const verification = await verifyOutput(bytes, { pageCount: 3 });
    expect(verification.ok).toBe(false);
    if (!verification.ok) expect(verification.error).toMatch(/1 pages but should have 3/);
  });

  it('rejects output whose geometry changed', async () => {
    const loaded = await loadPdf(pdf('three-page.pdf'));
    const bytes = await extractPages(loaded.document, [1]);

    const verification = await verifyOutput(bytes, {
      pageCount: 1,
      geometry: [{ pageNumber: 1, width: 100, height: 100, rotation: 0 }],
    });
    expect(verification.ok).toBe(false);
    if (!verification.ok) expect(verification.error).toMatch(/changed size or rotation/);
  });

  it('rejects bytes that are not a readable PDF', async () => {
    const verification = await verifyOutput(new Uint8Array([1, 2, 3, 4]), { pageCount: 1 });
    expect(verification.ok).toBe(false);
  });
});

describe('image to PDF assembly', () => {
  it('produces one page per image', async () => {
    const result = await assembleImagesToPdf(
      [
        { data: image('gradient-64x32.png'), type: 'image/png', name: 'a.png' },
        { data: image('tall-20x100.png'), type: 'image/png', name: 'b.png' },
      ],
      { pageSize: 'a4', orientation: 'auto', margin: 'small', fit: 'contain' },
    );

    expect(result.pageCount).toBe(2);
    const loaded = await loadPdf(result.bytes);
    expect(loaded.pageCount).toBe(2);
  });

  it('writes real physical page sizes', async () => {
    const result = await assembleImagesToPdf(
      [{ data: image('gradient-64x32.png'), type: 'image/png', name: 'a.png' }],
      { pageSize: 'a4', orientation: 'portrait', margin: 'none', fit: 'contain' },
    );

    const loaded = await loadPdf(result.bytes);
    expect(Math.round(loaded.pages[0]?.width ?? 0)).toBe(595);
    expect(Math.round(loaded.pages[0]?.height ?? 0)).toBe(842);
  });

  it('gives each page the orientation of its own image in auto mode', async () => {
    const result = await assembleImagesToPdf(
      [
        { data: image('wide-100x20.png'), type: 'image/png', name: 'wide.png' },
        { data: image('tall-20x100.png'), type: 'image/png', name: 'tall.png' },
      ],
      { pageSize: 'a4', orientation: 'auto', margin: 'none', fit: 'contain' },
    );

    const loaded = await loadPdf(result.bytes);
    // Landscape page first, portrait second.
    expect((loaded.pages[0]?.width ?? 0) > (loaded.pages[0]?.height ?? 0)).toBe(true);
    expect((loaded.pages[1]?.width ?? 0) < (loaded.pages[1]?.height ?? 0)).toBe(true);
  });

  it('fits each page to its image in fit mode', async () => {
    const result = await assembleImagesToPdf(
      [{ data: image('gradient-64x32.png'), type: 'image/png', name: 'a.png' }],
      { pageSize: 'fit', orientation: 'auto', margin: 'none', fit: 'contain' },
    );

    const loaded = await loadPdf(result.bytes);
    expect(Math.round(loaded.pages[0]?.width ?? 0)).toBe(64);
    expect(Math.round(loaded.pages[0]?.height ?? 0)).toBe(32);
  });

  it('embeds JPEG bytes directly, without re-encoding', async () => {
    const result = await assembleImagesToPdf(
      [{ data: image('plain.jpg'), type: 'image/jpeg', name: 'photo.jpg' }],
      { pageSize: 'a4', orientation: 'auto', margin: 'small', fit: 'contain' },
    );
    expect((await loadPdf(result.bytes)).pageCount).toBe(1);
  });

  it('reports when cover mode cropped an image', async () => {
    const contain = await assembleImagesToPdf(
      [{ data: image('wide-100x20.png'), type: 'image/png', name: 'wide.png' }],
      { pageSize: 'a4', orientation: 'portrait', margin: 'none', fit: 'contain' },
    );
    expect(contain.cropped).toBe(false);

    const cover = await assembleImagesToPdf(
      [{ data: image('wide-100x20.png'), type: 'image/png', name: 'wide.png' }],
      { pageSize: 'a4', orientation: 'portrait', margin: 'none', fit: 'cover' },
    );
    expect(cover.cropped).toBe(true);
  });

  it('refuses an empty input list', async () => {
    await expect(
      assembleImagesToPdf([], {
        pageSize: 'a4',
        orientation: 'auto',
        margin: 'none',
        fit: 'contain',
      }),
    ).rejects.toThrow(PdfError);
  });

  it('names the image responsible when one cannot be embedded', async () => {
    try {
      await assembleImagesToPdf(
        [{ data: image('corrupt.png'), type: 'image/png', name: 'broken.png' }],
        { pageSize: 'a4', orientation: 'auto', margin: 'none', fit: 'contain' },
      );
      expect.unreachable('a corrupt image should be refused');
    } catch (error) {
      expect(error).toBeInstanceOf(PdfError);
      if (error instanceof PdfError) expect(error.failure.message).toContain('broken.png');
    }
  });
});

describe('page size and placement arithmetic', () => {
  it('uses the documented point dimensions', () => {
    // 72 points to the inch: A4 is 210 × 297 mm, Letter is 8.5 × 11 in.
    expect(PAGE_SIZES.a4.width).toBeCloseTo(595.28, 1);
    expect(PAGE_SIZES.a4.height).toBeCloseTo(841.89, 1);
    expect(PAGE_SIZES.letter.width).toBe(612);
    expect(PAGE_SIZES.letter.height).toBe(792);
  });

  it('swaps dimensions for landscape', () => {
    const portrait = resolvePageSize({ pageSize: 'a4', orientation: 'portrait' }, 100, 50);
    const landscape = resolvePageSize({ pageSize: 'a4', orientation: 'landscape' }, 100, 50);
    expect(portrait.width).toBeLessThan(portrait.height);
    expect(landscape.width).toBeGreaterThan(landscape.height);
  });

  it('follows the image in auto mode', () => {
    const fromWide = resolvePageSize({ pageSize: 'a4', orientation: 'auto' }, 100, 50);
    const fromTall = resolvePageSize({ pageSize: 'a4', orientation: 'auto' }, 50, 100);
    expect(fromWide.width).toBeGreaterThan(fromWide.height);
    expect(fromTall.width).toBeLessThan(fromTall.height);
  });

  it('contains without cropping and covers with cropping', () => {
    const area = { width: 100, height: 100 };

    const contained = placeImage({ width: 200, height: 100 }, area, 'contain');
    expect(contained.width).toBeLessThanOrEqual(area.width);
    expect(contained.height).toBeLessThanOrEqual(area.height);
    expect(contained.cropped).toBe(false);

    const covered = placeImage({ width: 200, height: 100 }, area, 'cover');
    expect(covered.width).toBeGreaterThanOrEqual(area.width);
    expect(covered.cropped).toBe(true);
  });

  it('preserves the aspect ratio in both fit modes', () => {
    const source = { width: 300, height: 200 };
    for (const fit of ['contain', 'cover'] as const) {
      const placed = placeImage(source, { width: 100, height: 100 }, fit);
      expect(placed.width / placed.height).toBeCloseTo(source.width / source.height, 6);
    }
  });
});
