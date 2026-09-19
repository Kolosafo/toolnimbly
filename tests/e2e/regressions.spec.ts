import { expect, test, type Page } from '@playwright/test';

import { fillAndConfirm, gotoTool } from './helpers';

/**
 * Regressions for defects found by exploratory testing rather than by the
 * scripted suites. Each one shipped and was caught afterwards, so each gets a
 * test that would have caught it.
 */

/** Today in the browser's own local calendar, as the tools compute it. */
function browserToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * Collects anything the page reported as broken.
 *
 * React reports a hydration mismatch as a console error, which is how the
 * stale-date defect announced itself while every assertion still passed. A
 * suite that ignores console output cannot see that class of bug.
 */
function collectPageProblems(page: Page): string[] {
  const problems: string[] = [];

  page.on('pageerror', (error) => {
    problems.push(`uncaught error: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    // Favicon and asset 404s in the test environment are not product defects.
    if (/favicon|Failed to load resource/i.test(text)) return;
    problems.push(`console error: ${text}`);
  });

  return problems;
}

test.describe('date defaults are the visitor\'s date, not the build date', () => {
  /*
   * These pages are prerendered. A date computed during render is the date the
   * site was built, baked into static HTML and served unchanged from then on —
   * so from the next day every visitor saw a stale default and React reported a
   * hydration mismatch. Comparing against the browser's own clock is what makes
   * this catchable on any day after the build.
   */
  const DATE_FIELDS: [string, string][] = [
    ['/tools/age-calculator', 'Age on this date'],
    ['/tools/invoice-generator', 'Issue date'],
    ['/tools/receipt-generator', 'Transaction date'],
  ];

  for (const [path, label] of DATE_FIELDS) {
    test(`${path} defaults to today`, async ({ page }) => {
      const problems = collectPageProblems(page);

      await gotoTool(page, path);
      await expect(page.getByLabel(label)).toHaveValue(browserToday());

      expect(problems, `${path} reported errors`).toEqual([]);
    });
  }

  /*
   * This is the durable check of the three.
   *
   * The per-field tests above only fail on a build older than the current day:
   * run them against a build made this morning and a baked-in date matches
   * today, so they pass against the very defect they exist for. Asserting that
   * no date reaches the static HTML at all catches it on any day, including the
   * day it is introduced.
   */
  test('no date is baked into the prerendered HTML', async ({ request }) => {
    for (const [path] of DATE_FIELDS) {
      const html = await (await request.get(path)).text();
      const baked = html.match(/value="(20\d{2}-\d{2}-\d{2})"/);

      expect(
        baked?.[1] ?? null,
        `${path} ships a date in its static HTML, which will be stale tomorrow`,
      ).toBeNull();
    }
  });
});

test.describe('no tool page reports an error', () => {
  // One route per tool family, plus the two that were actually broken.
  const ROUTES = [
    '/tools/percentage-calculator',
    '/tools/age-calculator',
    '/tools/compound-interest-calculator',
    '/tools/word-counter',
    '/tools/qr-code-generator',
    '/tools/image-compressor',
    '/tools/pdf-merger',
    '/tools/invoice-generator',
    '/tools/receipt-generator',
  ];

  for (const path of ROUTES) {
    test(`${path} loads cleanly`, async ({ page }) => {
      const problems = collectPageProblems(page);

      await gotoTool(page, path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      expect(problems, `${path} reported errors`).toEqual([]);
    });
  }
});

test.describe('degenerate input does not produce NaN', () => {
  test('compound interest with nothing invested shows no share', async ({ page }) => {
    await gotoTool(page, '/tools/compound-interest-calculator');

    await fillAndConfirm(page.getByLabel('Starting amount', { exact: true }), '0');
    await fillAndConfirm(page.getByLabel('Annual rate', { exact: true }), '0');
    await fillAndConfirm(page.getByLabel('Amount', { exact: true }), '0');

    const result = page.getByRole('region', { name: 'Projection result' });
    // There is no share of nothing; the row must say so rather than divide 0/0.
    await expect(result).not.toContainText('NaN');
    await expect(result).toContainText('Interest as a share of the balance');
  });

  test('no calculator prints NaN or Infinity for zeroed input', async ({ page }) => {
    const cases: [string, string, [string, string][]][] = [
      [
        '/tools/compound-interest-calculator',
        'Projection result',
        [
          ['Starting amount', '0'],
          ['Annual rate', '0'],
          ['Amount', '0'],
          ['Duration', '1'],
        ],
      ],
      [
        '/tools/salary-calculator',
        'Pay equivalents',
        [['Pay amount', '0']],
      ],
      [
        '/tools/percentage-calculator',
        'Percentage result',
        [
          ['Percentage', '0'],
          ['Of this number', '0'],
        ],
      ],
    ];

    for (const [path, region, fields] of cases) {
      await gotoTool(page, path);
      for (const [label, value] of fields) {
        await fillAndConfirm(page.getByLabel(label, { exact: true }), value);
      }

      const text = await page.getByRole('region', { name: region }).innerText();
      expect(text, `${path} printed a non-finite value`).not.toMatch(/NaN|Infinity/);
    }
  });
});
