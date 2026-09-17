import { join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

/**
 * PDF tool journeys (spec §10.5 item 5, §10.4 file fixtures).
 *
 * Fixtures come from tests/fixtures/generate-pdfs.mjs and contain no personal
 * data.
 */

const PDFS = join(process.cwd(), 'tests/fixtures/pdfs');
const IMAGES = join(process.cwd(), 'tests/fixtures/images');

async function addPdfs(page: Page, ...names: string[]) {
  await page.locator('input[type="file"]').setInputFiles(names.map((n) => join(PDFS, n)));
}

async function addImages(page: Page, ...names: string[]) {
  await page.locator('input[type="file"]').setInputFiles(names.map((n) => join(IMAGES, n)));
}

function tool(page: Page, name: string) {
  return page.getByRole('region', { name: `${name} tool` });
}

test.describe('PDF merger', () => {
  test('merges two documents and reports the page count', async ({ page }) => {
    await page.goto('/tools/pdf-merger');
    await addPdfs(page, 'three-page.pdf', 'two-page.pdf');

    const result = page.getByRole('region', { name: 'Merge result' });
    await expect(result).toContainText('5-page', { timeout: 20_000 });

    await page.getByRole('button', { name: 'Merge PDFs' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download merged\.pdf/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('merged.pdf');
  });

  test('reorders files with the keyboard-accessible controls', async ({ page }) => {
    await page.goto('/tools/pdf-merger');
    await addPdfs(page, 'three-page.pdf', 'two-page.pdf');

    const panel = tool(page, 'PDF Merger');
    await expect(panel.locator('li p.truncate')).toHaveText([
      'three-page.pdf',
      'two-page.pdf',
    ]);

    await page.getByRole('button', { name: /Move two-page\.pdf earlier/ }).click();
    await expect(panel.locator('li p.truncate')).toHaveText([
      'two-page.pdf',
      'three-page.pdf',
    ]);
  });

  test('refuses an encrypted PDF, naming the file', async ({ page }) => {
    await page.goto('/tools/pdf-merger');
    await addPdfs(page, 'three-page.pdf', 'encrypted.pdf');

    const alert = tool(page, 'PDF Merger').getByRole('alert');
    await expect(alert).toContainText('encrypted.pdf', { timeout: 20_000 });
    await expect(alert).toContainText(/authorised PDF editor/i);

    // The valid file stays in the queue.
    await expect(tool(page, 'PDF Merger').locator('li p.truncate')).toHaveText(['three-page.pdf']);
  });

  test('fails cleanly on a corrupt PDF', async ({ page }) => {
    await page.goto('/tools/pdf-merger');
    await addPdfs(page, 'truncated.pdf');

    await expect(tool(page, 'PDF Merger').getByRole('alert')).toContainText(
      /damaged or incomplete/i,
      { timeout: 20_000 },
    );
  });

  test('requires at least two files before merging', async ({ page }) => {
    await page.goto('/tools/pdf-merger');
    await addPdfs(page, 'three-page.pdf');

    await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
    await expect(page.getByText(/Add at least 2 PDFs to merge/i)).toBeVisible();
  });
});

test.describe('PDF splitter', () => {
  test('previews what each mode will produce', async ({ page }) => {
    await page.goto('/tools/pdf-splitter');
    await addPdfs(page, 'ten-page.pdf');

    const result = page.getByRole('region', { name: 'Split result' });

    await page.getByLabel('Pages to keep').fill('1-3, 5');
    await expect(result).toContainText('One PDF containing pages 1-3, 5');

    await page.getByRole('radio', { name: 'Split by ranges' }).check();
    await page.getByLabel('Pages to keep').fill('1-3, 7-9');
    await expect(result).toContainText('2 PDFs: 1-3, 7-9');

    await page.getByRole('radio', { name: 'Every page separately' }).check();
    await expect(result).toContainText('10 PDFs, one per page');
  });

  test('extracts a page range and downloads it', async ({ page }) => {
    await page.goto('/tools/pdf-splitter');
    await addPdfs(page, 'ten-page.pdf');

    await page.getByLabel('Pages to keep').fill('2-4');
    await page.getByRole('button', { name: 'Split PDF' }).click();

    const result = page.getByRole('region', { name: 'Split result' });
    await expect(result).toContainText('3 pages', { timeout: 20_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^Download ten-page/ }).click();
    expect((await downloadPromise).suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('zips multiple outputs with zero-padded names', async ({ page }) => {
    await page.goto('/tools/pdf-splitter');
    await addPdfs(page, 'ten-page.pdf');

    await page.getByRole('radio', { name: 'Every page separately' }).check();
    await page.getByRole('button', { name: 'Split PDF' }).click();

    const result = page.getByRole('region', { name: 'Split result' });
    await expect(result).toContainText('ten-page-page-001.pdf', { timeout: 30_000 });
    // Zero padding means page 10 sorts after page 2, not before.
    await expect(result).toContainText('ten-page-page-010.pdf');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download all 10 as ZIP/ }).click();
    expect((await downloadPromise).suggestedFilename()).toMatch(/\.zip$/);
  });

  test('removes pages and keeps the remainder', async ({ page }) => {
    await page.goto('/tools/pdf-splitter');
    await addPdfs(page, 'ten-page.pdf');

    await page.getByRole('radio', { name: 'Remove pages' }).check();
    await page.getByLabel('Pages to remove').fill('2, 4, 6');

    await expect(page.getByRole('region', { name: 'Split result' })).toContainText(
      '1, 3, 5, 7-10 — 7 of 10',
    );
  });

  test('explains an out-of-range page rather than ignoring it', async ({ page }) => {
    await page.goto('/tools/pdf-splitter');
    await addPdfs(page, 'three-page.pdf');

    await page.getByLabel('Pages to keep').fill('1-3, 15');
    await expect(page.getByText(/Page 15 is outside this 3-page document/)).toBeVisible();
  });

  test('explains an invalid token', async ({ page }) => {
    await page.goto('/tools/pdf-splitter');
    await addPdfs(page, 'three-page.pdf');

    await page.getByLabel('Pages to keep').fill('1, abc');
    await expect(page.getByText(/"abc" is not a page or a range/)).toBeVisible();
  });
});

test.describe('image to PDF', () => {
  test('builds a PDF with one page per image', async ({ page }) => {
    await page.goto('/tools/image-to-pdf');
    await addImages(page, 'gradient-64x32.png', 'tall-20x100.png');

    const result = page.getByRole('region', { name: 'PDF result' });
    await expect(result).toContainText('2-page');

    await page.getByRole('button', { name: 'Create PDF' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download images\.pdf/ }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('images.pdf');
  });

  test('warns before cover mode crops content', async ({ page }) => {
    await page.goto('/tools/image-to-pdf');
    await addImages(page, 'wide-100x20.png');

    await page.getByLabel('Image fit').selectOption('cover');
    await expect(page.getByText(/crops whatever falls outside/i)).toBeVisible();
  });

  test('reorders images before assembly', async ({ page }) => {
    await page.goto('/tools/image-to-pdf');
    await addImages(page, 'gradient-64x32.png', 'wide-100x20.png');

    const panel = tool(page, 'Image to PDF Converter');
    await expect(panel.locator('li p.truncate')).toHaveText([
      'gradient-64x32.png',
      'wide-100x20.png',
    ]);

    await page.getByRole('button', { name: /Move wide-100x20\.png earlier/ }).click();
    await expect(panel.locator('li p.truncate')).toHaveText([
      'wide-100x20.png',
      'gradient-64x32.png',
    ]);
  });

  test('the JPG route refuses a PNG', async ({ page }) => {
    await page.goto('/tools/jpg-to-pdf');
    await addImages(page, 'gradient-64x32.png');

    const alert = tool(page, 'JPG to PDF Converter').getByRole('alert');
    await expect(alert).toContainText('PNG');
    await expect(alert).toContainText('JPG and JPEG only');
  });
});

test.describe('PDF to JPG', () => {
  test('renders selected pages and offers a ZIP', async ({ page }) => {
    await page.goto('/tools/pdf-to-jpg');
    await addPdfs(page, 'three-page.pdf');

    // Scoped to the panel: the editorial section "How pages are rendered" is
    // labelled by its own heading, so an unscoped label query matches it too.
    await tool(page, 'PDF to JPG Converter').getByLabel('Pages', { exact: true }).fill('1-2');
    await expect(page.getByRole('region', { name: 'Render result' })).toContainText('2 pages');

    await page.getByRole('button', { name: 'Convert to JPG' }).click();

    const result = page.getByRole('region', { name: 'Render result' });
    await expect(result.getByRole('img')).toHaveCount(2, { timeout: 40_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download all 2 as ZIP/ }).click();
    expect((await downloadPromise).suggestedFilename()).toMatch(/\.zip$/);
  });

  test('names files with zero-padded page numbers', async ({ page }) => {
    await page.goto('/tools/pdf-to-jpg');
    await addPdfs(page, 'ten-page.pdf');

    await tool(page, 'PDF to JPG Converter').getByLabel('Pages', { exact: true }).fill('10');
    await page.getByRole('button', { name: 'Convert to JPG' }).click();

    const result = page.getByRole('region', { name: 'Render result' });
    await expect(result.getByRole('img')).toHaveCount(1, { timeout: 40_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /^Download ten-page-page-010\.jpg$/ }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('ten-page-page-010.jpg');
  });

  test('states that text becomes pixels', async ({ page }) => {
    await page.goto('/tools/pdf-to-jpg');
    await addPdfs(page, 'three-page.pdf');
    await expect(page.getByText(/Selectable text becomes pixels/i)).toBeVisible();
  });
});

test.describe('PDF compressor', () => {
  test('defaults to the safe mode and explains its limits', async ({ page }) => {
    await page.goto('/tools/pdf-compressor');
    await addPdfs(page, 'three-page.pdf');

    await expect(page.getByRole('radio', { name: /Optimise structure/ })).toBeChecked();
    await expect(page.getByText(/expect a small saving, sometimes none at all/i)).toBeVisible();
  });

  test('reports the real byte change rather than claiming success', async ({ page }) => {
    await page.goto('/tools/pdf-compressor');
    await addPdfs(page, 'three-page.pdf');

    await page.getByRole('button', { name: 'Compress PDF' }).click();

    const result = page.getByRole('region', { name: 'Compression result' });
    await expect(result).toContainText('Before', { timeout: 30_000 });
    await expect(result).toContainText('After');
    // Whichever way it went, it is stated.
    await expect(result).toContainText(/smaller|larger|no change/);
    // And the output was verified by re-reading it.
    await expect(result).toContainText(/re-read and checked/i);
  });

  test('warns before rasterising and lists what is lost', async ({ page }) => {
    await page.goto('/tools/pdf-compressor');
    await addPdfs(page, 'three-page.pdf');

    await page.getByRole('radio', { name: /Rasterise pages/ }).check();
    await expect(page.getByText(/will convert all 3 pages into images/i)).toBeVisible();
    await expect(page.getByText(/no longer be selectable or searchable/i)).toBeVisible();
  });

  test('rasterises and reports the trade-offs it made', async ({ page }) => {
    await page.goto('/tools/pdf-compressor');
    await addPdfs(page, 'three-page.pdf');

    await page.getByRole('radio', { name: /Rasterise pages/ }).check();
    await page.getByRole('button', { name: 'Compress PDF' }).click();

    const result = page.getByRole('region', { name: 'Compression result' });
    await expect(result).toContainText('What this mode did', { timeout: 60_000 });
    await expect(result).toContainText(/each page is now a picture/i);
    await expect(result).toContainText(/Physical page sizes are preserved/i);
  });

  test('refuses an encrypted PDF', async ({ page }) => {
    await page.goto('/tools/pdf-compressor');
    await addPdfs(page, 'encrypted.pdf');

    await expect(tool(page, 'PDF Compressor').getByRole('alert')).toContainText(
      /authorised PDF editor/i,
      { timeout: 20_000 },
    );
  });
});

test.describe('privacy', () => {
  test('no PDF bytes leave the device', async ({ page }) => {
    const suspicious: string[] = [];

    page.on('request', (request) => {
      const host = new URL(request.url()).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') {
        suspicious.push(`third party: ${request.url()}`);
      }
      const post = request.postData();
      if (post && post.length > 500) suspicious.push(`large body: ${request.url()}`);
    });

    await page.goto('/tools/pdf-merger');
    await addPdfs(page, 'three-page.pdf', 'two-page.pdf');
    await page.getByRole('button', { name: 'Merge PDFs' }).click();
    await expect(page.getByRole('button', { name: /Download merged\.pdf/ })).toBeVisible({
      timeout: 20_000,
    });

    expect(suspicious, 'PDF data may have left the device').toEqual([]);
  });
});
