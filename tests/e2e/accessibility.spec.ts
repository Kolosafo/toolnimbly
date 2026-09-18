import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { fillAndConfirm } from './helpers';

/**
 * Automated accessibility scans (spec §10.6).
 *
 * One representative route per tool family, plus the shell and both business
 * templates. The gate is zero critical or serious violations.
 */

async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}

function serious(results: Awaited<ReturnType<typeof scan>>) {
  return results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
}

/** Compact, readable failure output: rule, impact and the offending selector. */
function describe(violations: ReturnType<typeof serious>) {
  return violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help} → ${violation.nodes
        .slice(0, 2)
        .map((node) => node.target.join(' '))
        .join(' | ')}`,
  );
}

const ROUTES: [string, string][] = [
  ['homepage', '/'],
  ['category page', '/calculators'],
  ['about', '/about'],
  ['privacy', '/privacy'],
  ['404', '/tools/does-not-exist'],
  ['calculator', '/tools/loan-calculator'],
  ['health calculator', '/tools/bmi-calculator'],
  ['text tool', '/tools/word-counter'],
  ['generator', '/tools/password-generator'],
  ['QR generator', '/tools/qr-code-generator'],
  ['image batch tool', '/tools/image-compressor'],
  ['image cropper', '/tools/image-cropper'],
  ['PDF merger', '/tools/pdf-merger'],
  ['PDF splitter', '/tools/pdf-splitter'],
  ['invoice', '/tools/invoice-generator'],
  ['receipt', '/tools/receipt-generator'],
];

test.describe('accessibility', () => {
  for (const [label, path] of ROUTES) {
    test(`${label} has no critical or serious violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const violations = serious(await scan(page));
      expect(describe(violations), `${path} accessibility violations`).toEqual([]);
    });
  }

  test('the search dialog is accessible when open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /search tools/i }).first().click();
    await expect(page.getByRole('dialog', { name: 'Search tools' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Search tools' }).fill('pdf');
    await expect(page.getByRole('option').first()).toBeVisible();

    const violations = serious(await scan(page));
    expect(describe(violations), 'search dialog violations').toEqual([]);
  });

  test('a tool with results rendered is accessible', async ({ page }) => {
    await page.goto('/tools/percentage-calculator');
    await page.waitForLoadState('networkidle');

    // Default state already produces a result; confirm then scan.
    await expect(page.getByRole('region', { name: 'Percentage result' })).toContainText('10.26');

    const violations = serious(await scan(page));
    expect(describe(violations), 'result state violations').toEqual([]);
  });

  test('a validation error state is accessible', async ({ page }) => {
    await page.goto('/tools/loan-calculator');
    await fillAndConfirm(page.getByLabel('Loan amount'), '0');
    await expect(
      page.getByRole('region', { name: 'Loan result' }).getByRole('alert'),
    ).toBeVisible();

    const violations = serious(await scan(page));
    expect(describe(violations), 'error state violations').toEqual([]);
  });

  test('is usable at 200% zoom without losing content', async ({ page }) => {
    // 200% zoom at a 1280px viewport behaves like a 640px one.
    await page.setViewportSize({ width: 640, height: 720 });

    for (const path of ['/', '/tools/invoice-generator', '/tools/image-compressor']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Measured as forced sideways scrolling rather than scrollWidth, which
      // is not comparable across browsers — see the 320px test in site.spec.ts.
      const scrollsSideways = await page.evaluate(() => {
        const before = window.scrollX;
        window.scrollTo(400, 0);
        const moved = window.scrollX > before;
        window.scrollTo(0, 0);
        return moved;
      });
      expect(scrollsSideways, `${path} scrolls sideways at 200% zoom`).toBe(false);

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('every interactive control meets the 44px touch target minimum', async ({ page }) => {
    await page.goto('/tools/image-compressor');
    await page.waitForLoadState('networkidle');

    const undersized = await page.evaluate(() => {
      const offenders: string[] = [];
      const selector = 'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex="0"]';

      for (const element of document.querySelectorAll(selector)) {
        const rect = element.getBoundingClientRect();
        // Skip anything not rendered.
        if (rect.width === 0 && rect.height === 0) continue;
        // Visually hidden until focused — the skip link measures 1px until
        // then, which is the intended behaviour, not a small target.
        if (rect.height <= 2 && rect.width <= 2) continue;
        // Inline links inside prose are exempt: they are text, not targets.
        if (element.tagName === 'A' && element.closest('p, li')) continue;
        // Range and colour inputs are sized by their track.
        if (element instanceof HTMLInputElement && ['range', 'color', 'file'].includes(element.type)) {
          continue;
        }

        if (rect.height < 44 - 0.5) {
          offenders.push(
            `${element.tagName}.${String(element.className).slice(0, 40)} h=${Math.round(rect.height)}`,
          );
        }
      }
      return offenders.slice(0, 10);
    });

    expect(undersized, 'controls below the 44px minimum').toEqual([]);
  });
});
