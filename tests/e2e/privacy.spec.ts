import { join } from 'node:path';

import { expect, test } from '@playwright/test';

import { gotoTool } from './helpers';

/**
 * Site-wide privacy regression (spec §10.8).
 *
 * Distinctive sentinel values are entered into every tool that accepts input,
 * and every request URL, header and body is inspected. Any appearance of a
 * sentinel, any third-party origin, or any large request body fails the suite.
 *
 * This is the test that makes the product's central claim checkable rather than
 * merely stated.
 */

const IMAGES = join(process.cwd(), 'tests/fixtures/images');
const PDFS = join(process.cwd(), 'tests/fixtures/pdfs');

/** Values unlikely to occur by chance anywhere in the application. */
const SENTINELS = [
  'Zorblatt-Sentinel-7741',
  '918273645546372819',
  'sentinel-9f3a@example.invalid',
  '1973-11-29',
];

test('no tool sends user input, file bytes or a third-party request', async ({ page }) => {
  const violations: string[] = [];
  const externalHosts = new Set<string>();

  page.on('request', (request) => {
    const url = new URL(request.url());

    // Only real remote origins count. `blob:` and `data:` URLs are our own
    // in-memory objects — a blob URL has an empty hostname, which an earlier
    // version of this check mistook for a third party.
    const isRemote =
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname !== '127.0.0.1' &&
      url.hostname !== 'localhost';

    if (isRemote) externalHosts.add(`${url.protocol}//${url.hostname}`);

    const haystack = [
      request.url(),
      JSON.stringify(request.headers()),
      request.postData() ?? '',
    ].join(' ');

    for (const sentinel of SENTINELS) {
      if (haystack.includes(sentinel)) {
        violations.push(`"${sentinel}" in ${request.method()} ${request.url()}`);
      }
    }

    // File bytes would show up as a large body. Nothing here should post at all.
    const body = request.postData();
    if (body && body.length > 1000) {
      violations.push(`large body (${body.length} bytes) to ${request.url()}`);
    }
  });

  const setFiles = (...paths: string[]) =>
    page.locator('input[type="file"]').setInputFiles(paths);

  // --- Calculators ---------------------------------------------------------
  await gotoTool(page, '/tools/loan-calculator');
  await page.getByLabel('Loan amount').fill('918273645546372819');
  await expect(page.getByRole('region', { name: 'Loan result' })).toContainText('$');

  await gotoTool(page, '/tools/age-calculator');
  await page.getByLabel('Date of birth').fill('1973-11-29');
  await expect(page.getByRole('region', { name: 'Age result' })).toContainText('years');

  await gotoTool(page, '/tools/bmi-calculator');
  await page.getByLabel('Weight').fill('70');
  await page.getByLabel('Height').fill('175');
  await expect(page.getByRole('region', { name: 'BMI result' })).toContainText('22.9');

  // --- Text and developer tools -------------------------------------------
  await gotoTool(page, '/tools/word-counter');
  await page.getByLabel('Your text').fill('Zorblatt-Sentinel-7741 appears only in this test.');
  await expect(page.getByRole('region', { name: 'Text statistics' })).toContainText('7');

  await gotoTool(page, '/tools/qr-code-generator');
  await page.getByRole('radio', { name: 'Wi-Fi network' }).check();
  await page.getByLabel('Network name (SSID)').fill('Zorblatt-Sentinel-7741');
  await page.getByLabel('Password', { exact: true }).fill('918273645546372819');
  await expect(
    page.getByRole('region', { name: 'QR code preview' }).getByRole('img'),
  ).toBeVisible();

  await gotoTool(page, '/tools/password-generator');
  await page.getByRole('button', { name: 'Reveal' }).click();
  const generated = await page
    .getByRole('region', { name: 'Generated password' })
    .locator('p.font-mono')
    .first()
    .innerText();
  expect(generated.length).toBeGreaterThan(8);

  // --- Image tools ---------------------------------------------------------
  await gotoTool(page, '/tools/image-compressor');
  await setFiles(join(IMAGES, 'gradient-64x32.png'), join(IMAGES, 'transparent-32x32.png'));
  await page.getByRole('button', { name: 'Compress images' }).click();
  await expect(page.getByRole('status', { name: 'Batch summary' })).toContainText(
    '2 of 2 processed',
    { timeout: 30_000 },
  );

  // --- PDF tools -----------------------------------------------------------
  await gotoTool(page, '/tools/pdf-merger');
  await setFiles(join(PDFS, 'three-page.pdf'), join(PDFS, 'two-page.pdf'));
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  await expect(page.getByRole('button', { name: /Download merged\.pdf/ })).toBeVisible({
    timeout: 30_000,
  });

  await gotoTool(page, '/tools/pdf-to-jpg');
  await setFiles(join(PDFS, 'three-page.pdf'));
  await page
    .getByRole('region', { name: 'PDF to JPG Converter tool' })
    .getByLabel('Pages', { exact: true })
    .fill('1');
  await page.getByRole('button', { name: 'Convert to JPG' }).click();
  await expect(
    page.getByRole('region', { name: 'Render result' }).getByRole('img'),
  ).toHaveCount(1, { timeout: 40_000 });

  // --- Business documents --------------------------------------------------
  await gotoTool(page, '/tools/invoice-generator');
  await page.getByLabel('Client name').fill('Zorblatt-Sentinel-7741');
  await page.getByLabel('Client email').fill('sentinel-9f3a@example.invalid');
  await page.getByLabel('Description 1', { exact: true }).fill('Confidential engagement');
  await page.getByLabel('Unit price 1', { exact: true }).fill('918273645546372819');
  await expect(page.locator('[data-document-preview]')).toContainText('Zorblatt-Sentinel-7741');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await download;

  // --- Assertions ----------------------------------------------------------
  expect(violations, 'user data appeared in a network request').toEqual([]);
  expect(
    [...externalHosts],
    'a third-party origin was contacted during tool use',
  ).toEqual([]);
});

test('the generated password never appears in any request', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(`${request.url()} ${JSON.stringify(request.headers())} ${request.postData() ?? ''}`),
  );

  await gotoTool(page, '/tools/password-generator');
  await page.getByRole('button', { name: 'Reveal' }).click();

  const password = await page
    .getByRole('region', { name: 'Generated password' })
    .locator('p.font-mono')
    .first()
    .innerText();

  // Regenerate a few times so several secrets have existed in the page.
  const secrets = [password];
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: 'Generate new' }).click();
    secrets.push(
      await page
        .getByRole('region', { name: 'Generated password' })
        .locator('p.font-mono')
        .first()
        .innerText(),
    );
  }

  for (const secret of secrets) {
    for (const entry of requests) {
      expect(entry, 'a generated password appeared in a request').not.toContain(secret);
    }
  }
});

test('no tool writes user content to storage unless explicitly asked', async ({ page }) => {
  await gotoTool(page, '/tools/word-counter');
  await page.getByLabel('Your text').fill('Zorblatt-Sentinel-7741');

  await gotoTool(page, '/tools/invoice-generator');
  await page.getByLabel('Client name').fill('Zorblatt-Sentinel-7741');

  const stored = await page.evaluate(() => {
    const entries: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key) entries.push(`${key}=${window.localStorage.getItem(key)}`);
    }
    return entries;
  });

  // Only the theme preference is ever stored without being asked for.
  for (const entry of stored) {
    expect(entry, 'unexpected data in localStorage').not.toContain('Zorblatt-Sentinel-7741');
    expect(entry.split('=')[0]).toBe('toolnimbly:theme');
  }
});
