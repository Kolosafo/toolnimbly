import { expect, test } from '@playwright/test';

import { fillAndConfirm, gotoTool } from './helpers';

/**
 * Text and developer tool journeys (spec §10.5, items 2 and 3).
 */

test.describe('password generator', () => {
  test('generates a password locally with no network request carrying it', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) =>
      requests.push(`${request.url()} ${request.postData() ?? ''}`),
    );

    await gotoTool(page, '/tools/password-generator');

    const results = page.getByRole('region', { name: 'Generated password' });
    await page.getByRole('button', { name: 'Reveal' }).click();

    const passwordText = await results.locator('p.font-mono').innerText();
    expect(passwordText).toHaveLength(20);

    // Spec §10.8: the generated secret must appear in no request anywhere.
    for (const entry of requests) {
      expect(entry).not.toContain(passwordText);
    }
  });

  test('regenerates a different password each time', async ({ page }) => {
    await gotoTool(page, '/tools/password-generator');
    await page.getByRole('button', { name: 'Reveal' }).click();

    const results = page.getByRole('region', { name: 'Generated password' });
    const first = await results.locator('p.font-mono').innerText();

    await page.getByRole('button', { name: 'Generate new' }).click();
    await expect(results.locator('p.font-mono')).not.toHaveText(first);
  });

  test('honours the length control and reports entropy', async ({ page }) => {
    await gotoTool(page, '/tools/password-generator');
    await page.getByRole('button', { name: 'Reveal' }).click();

    const slider = page.getByLabel('Length');
    await slider.fill('32');

    const results = page.getByRole('region', { name: 'Generated password' });
    // Scoped to the slider's output: the phrase also appears in the entropy
    // sentence ("at 32 characters long").
    await expect(page.locator('output')).toHaveText('32 characters');
    await expect(results.locator('p.font-mono')).toHaveText(/^.{32}$/);
    await expect(results).toContainText(/bits of entropy/i);
  });

  test('refuses a configuration with no character sets', async ({ page }) => {
    await gotoTool(page, '/tools/password-generator');

    for (const label of ['Lowercase (a–z)', 'Uppercase (A–Z)', 'Numbers (0–9)', 'Symbols (!@#$…)']) {
      await page.getByLabel(label).uncheck();
    }

    await expect(
      page.getByRole('region', { name: 'Generated password' }).getByRole('alert'),
    ).toContainText(/at least one character set/i);
  });

  test('hides the password until revealed', async ({ page }) => {
    await gotoTool(page, '/tools/password-generator');
    const results = page.getByRole('region', { name: 'Generated password' });
    await expect(results.locator('p.font-mono')).toHaveText(/^•+$/);
  });
});

test.describe('UUID generator', () => {
  test('generates valid version 4 UUIDs', async ({ page }) => {
    await gotoTool(page, '/tools/uuid-generator');

    // Generation happens after mount, so wait for the count to appear rather
    // than racing it — reading too early gave a flaky empty result.
    const results = page.getByRole('region', { name: 'Generated UUIDs' });
    await expect(results).toContainText('10 UUIDs, version 4');

    const output = await results.locator('code').innerText();
    const uuids = output.trim().split('\n');

    expect(uuids).toHaveLength(10);
    for (const uuid of uuids) {
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
    expect(new Set(uuids).size).toBe(10);
  });

  test('applies formatting options', async ({ page }) => {
    await gotoTool(page, '/tools/uuid-generator');
    const code = page.getByRole('region', { name: 'Generated UUIDs' }).locator('code');
    await expect(code).toContainText('-');

    await page.getByLabel('Uppercase').check();
    await expect(code).toHaveText(/^[0-9A-F-]/);

    await page.getByLabel('Wrap in braces').check();
    await expect(code).toHaveText(/^\{/);

    await page.getByLabel('Include hyphens').uncheck();
    await expect(code).toHaveText(/^\{[0-9A-F]{32}\}/);
  });

  test('downloads a text file', async ({ page }) => {
    await gotoTool(page, '/tools/uuid-generator');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download .txt' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('uuids.txt');
  });
});

test.describe('QR code generator', () => {
  test('builds a correctly escaped Wi-Fi payload', async ({ page }) => {
    await gotoTool(page, '/tools/qr-code-generator');

    await page.getByRole('radio', { name: 'Wi-Fi network' }).check();
    await page.getByLabel('Network name (SSID)').fill('Cafe-Guest');
    await page.getByLabel('Password', { exact: true }).fill('pa;ss,word');

    // ResultPanel is a <section aria-label>, which maps to role="region".
    await page
      .getByRole('region', { name: 'QR code preview' })
      .getByText('What this code contains')
      .click();
    await expect(page.getByRole('region', { name: 'QR code preview' })).toContainText(
      // String.raw: each escaped character is a literal backslash followed
      // by that character, which is what the WIFI: format requires.
      String.raw`WIFI:T:WPA;S:Cafe-Guest;P:pa\;ss\,word;H:false;;`,
    );
  });

  test('warns that a Wi-Fi password is stored in plain text', async ({ page }) => {
    await gotoTool(page, '/tools/qr-code-generator');
    await page.getByRole('radio', { name: 'Wi-Fi network' }).check();
    await page.getByLabel('Network name (SSID)').fill('Net');
    await page.getByLabel('Password', { exact: true }).fill('secret');

    await expect(page.getByRole('region', { name: 'QR code preview' })).toContainText(
      /plain text/i,
    );
  });

  test('adds https and says so, rather than guessing silently', async ({ page }) => {
    await gotoTool(page, '/tools/qr-code-generator');
    await fillAndConfirm(page.getByLabel('Web address'), 'toolnimbly.com');

    const results = page.getByRole('region', { name: 'QR code preview' });
    await expect(results).toContainText(/https:\/\/ was added/i);
    await expect(results.getByRole('img')).toBeVisible();
  });

  test('warns about colours that will not scan', async ({ page }) => {
    await gotoTool(page, '/tools/qr-code-generator');
    await fillAndConfirm(page.getByLabel('Web address'), 'https://example.com');
    await page.getByLabel('Foreground hex value').fill('#cccccc');

    await expect(page.getByRole('region', { name: 'QR code preview' })).toContainText(
      /unlikely to scan/i,
    );
  });

  test('downloads PNG and SVG', async ({ page }) => {
    await gotoTool(page, '/tools/qr-code-generator');
    await fillAndConfirm(page.getByLabel('Web address'), 'https://example.com');
    await expect(page.getByRole('region', { name: 'QR code preview' }).getByRole('img')).toBeVisible();

    const pngPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PNG' }).click();
    expect((await pngPromise).suggestedFilename()).toBe('qr-code-url.png');

    const svgPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download SVG' }).click();
    expect((await svgPromise).suggestedFilename()).toBe('qr-code-url.svg');
  });

  test('contacts no third-party QR service', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const host = new URL(request.url()).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') external.push(request.url());
    });

    await gotoTool(page, '/tools/qr-code-generator');
    await fillAndConfirm(page.getByLabel('Web address'), 'https://example.com');
    await expect(page.getByRole('region', { name: 'QR code preview' }).getByRole('img')).toBeVisible();

    expect(external).toEqual([]);
  });
});

test.describe('counters and case converter', () => {
  test('word counter reports consistent statistics', async ({ page }) => {
    await gotoTool(page, '/tools/word-counter');

    await page.getByLabel('Your text').fill('The quick brown fox. It jumps over the lazy dog.');

    const results = page.getByRole('region', { name: 'Text statistics' });
    await expect(results).toContainText('10'); // words
    await expect(results.getByText('Sentences')).toBeVisible();
    await expect(results).toContainText(/Reading time/i);
  });

  test('character counter distinguishes visible from technical length', async ({ page }) => {
    await gotoTool(page, '/tools/character-counter');

    // A family emoji: 1 visible character, 11 UTF-16 units, 25 UTF-8 bytes.
    await page.getByLabel('Your text').fill('\u{1F468}‍\u{1F469}‍\u{1F467}‍\u{1F466}');

    const results = page.getByRole('region', { name: 'Character counts' });
    await expect(results).toContainText('11');
    await expect(results).toContainText('25');
    await expect(results).toContainText(/emoji, accented characters/i);
  });

  test('character counter tracks a limit and flags going over', async ({ page }) => {
    await gotoTool(page, '/tools/character-counter');

    await page.getByLabel('Character limit (optional)').fill('10');
    await page.getByLabel('Your text').fill('12345');
    await expect(page.getByRole('region', { name: 'Character counts' })).toContainText(
      '5 characters remaining',
    );

    await page.getByLabel('Your text').fill('1234567890123');
    await expect(page.getByRole('region', { name: 'Character counts' })).toContainText(
      '3 over the limit',
    );
  });

  test('case converter previews every mode and keeps the original', async ({ page }) => {
    await gotoTool(page, '/tools/case-converter');

    const original = page.getByLabel('Original text');
    await original.fill('user profile image URL');
    // Wait for the value to land before switching mode: WebKit occasionally
    // processed the radio change before React had applied the textarea update.
    await expect(original).toHaveValue('user profile image URL');

    await page.getByRole('radio', { name: 'snake_case' }).check();
    await expect(page.getByRole('region', { name: 'Converted text' })).toContainText(
      'user_profile_image_url',
    );

    await page.getByRole('radio', { name: 'camelCase' }).check();
    await expect(page.getByRole('region', { name: 'Converted text' })).toContainText(
      'userProfileImageUrl',
    );

    // The original is untouched.
    await expect(page.getByLabel('Original text')).toHaveValue('user profile image URL');
  });

  test('case converter applies Turkish casing rules', async ({ page }) => {
    await gotoTool(page, '/tools/case-converter');

    const field = page.getByLabel('Original text');
    await field.fill('istanbul');
    await expect(field).toHaveValue('istanbul');
    await page.getByRole('radio', { name: 'UPPERCASE' }).check();
    await expect(page.getByRole('region', { name: 'Converted text' })).toContainText('ISTANBUL');

    await page.getByLabel('Locale').selectOption('tr');
    await expect(page.getByRole('region', { name: 'Converted text' })).toContainText('İSTANBUL');
  });
});
