import { expect, test, type Page } from '@playwright/test';

import { fillAndConfirm, gotoTool } from './helpers';

/**
 * Calculator journeys (spec §10.5, item 1) plus the privacy regression test
 * (spec §10.8).
 */

/**
 * Replaces a field's contents, since these inputs recalculate as you type.
 *
 * Label matching is exact. Substring matching is ambiguous here: "Percentage"
 * would also match the "Percentage change" radio, and "Term" would match
 * "Term unit".
 */
async function setField(page: Page, label: string | RegExp, value: string) {
  await fillAndConfirm(page.getByLabel(label, { exact: true }), value);
}

test.describe('percentage calculator', () => {
  test('calculates, shows its working, copies and resets', async ({
    page,
    context,
    browserName,
  }) => {
    // Only Chromium implements these permission names; elsewhere the clipboard
    // write still works, so the assertion on its contents is skipped below.
    if (browserName === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await gotoTool(page, '/tools/percentage-calculator');

    // The default state is the worked example from the page: 15% of 68.40.
    const results = page.getByRole('region', { name: 'Percentage result' });
    await expect(results).toContainText('10.26');
    await expect(results).toContainText('68.4 × 15 ÷ 100');

    await setField(page, 'Percentage', '20');
    await setField(page, 'Of this number', '50');
    await expect(results).toContainText('10.00');

    await page.getByRole('button', { name: 'Copy result' }).click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();

    if (browserName === 'chromium') {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('10');
    }

    await page.getByRole('button', { name: /reset to defaults/i }).click();
    await expect(results).toContainText('10.26');
  });

  test('switches mode and refuses an undefined calculation', async ({ page }) => {
    await gotoTool(page, '/tools/percentage-calculator');

    await page.getByRole('radio', { name: /X is what percent of Y/i }).check();
    await setField(page, 'This number', '25');
    await setField(page, 'Is what percent of', '50');
    await expect(page.getByRole('region', { name: 'Percentage result' })).toContainText('50.00%');

    await setField(page, 'Is what percent of', '0');
    // Scoped to the result region: Next.js renders its route announcer as
    // another role="alert", so an unscoped query is ambiguous.
    await expect(
      page.getByRole('region', { name: 'Percentage result' }).getByRole('alert'),
    ).toContainText(/cannot be zero/i);
  });

  test('honours the display precision control', async ({ page }) => {
    await gotoTool(page, '/tools/percentage-calculator');
    await page.getByRole('radio', { name: /Percentage change/i }).check();
    await setField(page, 'Starting value', '3');
    await setField(page, 'Ending value', '7');

    const results = page.getByRole('region', { name: 'Percentage result' });
    await expect(results).toContainText('133.33%');

    await page.getByLabel('Decimal places shown').selectOption('0');
    await expect(results).toContainText('133%');
  });
});

test.describe('loan calculator', () => {
  test('produces the published reference figures and an amortisation schedule', async ({ page }) => {
    await gotoTool(page, '/tools/loan-calculator');

    const results = page.getByRole('region', { name: 'Loan result' });
    // Defaults match the worked example: 25,000 at 7.5% over 5 years.
    await expect(results).toContainText('$500.95');
    await expect(results).toContainText('$5,056.92');
    await expect(results).toContainText('$30,056.92');

    await expect(page.getByRole('heading', { name: 'Full amortisation schedule' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Yearly summary' })).toBeVisible();
  });

  test('an extra payment shortens the term and reports the saving', async ({ page }) => {
    await gotoTool(page, '/tools/loan-calculator');
    await setField(page, 'Extra monthly payment (optional)', '100');

    const results = page.getByRole('region', { name: 'Loan result' });
    await expect(results).toContainText('4 years 1 month');
    await expect(results).toContainText(/saves/i);
    await expect(results).toContainText('$1,013.61');
  });

  test('a zero-interest loan divides evenly', async ({ page }) => {
    await gotoTool(page, '/tools/loan-calculator');
    await setField(page, 'Loan amount', '1200');
    await setField(page, 'Annual interest rate', '0');
    await setField(page, 'Term', '12');
    await page.getByLabel('Term unit').selectOption('months');

    const results = page.getByRole('region', { name: 'Loan result' });
    await expect(results).toContainText('$100.00');
    await expect(results).toContainText('$1,200.00');
  });

  test('offers a CSV download of the schedule', async ({ page }) => {
    await gotoTool(page, '/tools/loan-calculator');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).last().click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^loan-schedule\.csv$/);
  });

  test('explains an invalid amount rather than showing a broken result', async ({ page }) => {
    await gotoTool(page, '/tools/loan-calculator');
    await setField(page, 'Loan amount', '0');
    await expect(
      page.getByRole('region', { name: 'Loan result' }).getByRole('alert'),
    ).toContainText(/greater than zero/i);
  });
});

test.describe('date and age calculators', () => {
  test('age calculation handles the leap-day case as documented', async ({ page }) => {
    await gotoTool(page, '/tools/age-calculator');

    await setField(page, 'Date of birth', '2004-02-29');
    await setField(page, 'Age on this date', '2026-03-01');

    const results = page.getByRole('region', { name: 'Age result' });
    await expect(results).toContainText('22 years, 0 months, 1 day');
    await expect(results).toContainText('Sunday');
    await expect(results).toContainText('28 February 2027');
  });

  test('date difference answers the inclusive question explicitly', async ({ page }) => {
    await gotoTool(page, '/tools/date-difference-calculator');

    await setField(page, 'Start date', '2026-03-03');
    await setField(page, 'End date', '2026-04-17');

    const results = page.getByRole('region', { name: 'Date difference result' });
    await expect(results).toContainText('45 days');

    await page.getByLabel('Include the end date').check();
    await expect(results).toContainText('46 days');

    await page.getByLabel('Count business days only').check();
    await expect(results).toContainText('34');
  });

  test('a day count spanning a daylight-saving change is exact', async ({ page }) => {
    await gotoTool(page, '/tools/date-difference-calculator');
    // 8 March 2026 is a spring-forward date in US timezones.
    await setField(page, 'Start date', '2026-03-07');
    await setField(page, 'End date', '2026-03-09');
    await expect(page.getByRole('region', { name: 'Date difference result' })).toContainText(
      '2 days',
    );
  });
});

test.describe('health calculators', () => {
  test('BMI matches the reference case and shows a healthy range', async ({ page }) => {
    await gotoTool(page, '/tools/bmi-calculator');

    await setField(page, 'Weight', '70');
    await setField(page, 'Height', '175');

    const results = page.getByRole('region', { name: 'BMI result' });
    await expect(results).toContainText('22.9');
    await expect(results).toContainText('Healthy weight');
    await expect(results).toContainText('56.7');
    await expect(results).toContainText('76.3');
  });

  test('BMI withholds an adult category under 20 and explains why', async ({ page }) => {
    await gotoTool(page, '/tools/bmi-calculator');

    await setField(page, 'Weight', '60');
    await setField(page, 'Height', '170');
    await setField(page, 'Age (optional)', '16');

    const results = page.getByRole('region', { name: 'BMI result' });
    await expect(results).toContainText(/growth charts/i);

    // Neither the adult category nor the adult-derived healthy weight range is
    // shown, so the phrase is absent from the region entirely.
    await expect(results).not.toContainText('Healthy weight');
    // The BMI figure itself is still reported.
    await expect(results).toContainText('20.8');
  });

  test('health pages show a disclaimer beside the result, not only in Terms', async ({ page }) => {
    await gotoTool(page, '/tools/bmi-calculator');
    const disclaimer = page.getByRole('complementary', {
      name: /important information about these results/i,
    });
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText(/not medical advice/i);
  });

  test('calorie calculator warns when a target falls below the safe floor', async ({ page }) => {
    await gotoTool(page, '/tools/calorie-calculator');

    await page.getByRole('radio', { name: /Female equation/i }).check();
    await setField(page, 'Age', '30');
    await setField(page, 'Weight', '45');
    await setField(page, 'Height', '150');
    await page.getByLabel('Activity level').selectOption('sedentary');

    const results = page.getByRole('region', { name: 'Calorie estimate' });
    await expect(results).toContainText(/qualified health professional/i);
  });

  test('calorie calculator refuses under-18 with an explanation', async ({ page }) => {
    await gotoTool(page, '/tools/calorie-calculator');
    await setField(page, 'Age', '15');
    await setField(page, 'Weight', '60');
    await setField(page, 'Height', '165');
    await expect(
      page.getByRole('region', { name: 'Calorie estimate' }).getByRole('alert'),
    ).toContainText(/adults aged 18/i);
  });
});

test.describe('keyboard operation', () => {
  test('a calculator is fully operable without a mouse', async ({ page }) => {
    await gotoTool(page, '/tools/salary-calculator');

    const amount = page.getByLabel('Pay amount');
    await amount.focus();
    await amount.fill('62000');

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('This amount is')).toBeFocused();

    const results = page.getByRole('region', { name: 'Pay equivalents' });
    await expect(results).toContainText('$29.81');
    await expect(results).toContainText('$2,384.62');
    await expect(results).toContainText('$2,583.33');
  });
});

/**
 * Privacy regression (spec §10.8): no request may carry a value the user typed.
 */
test.describe('privacy', () => {
  test('no network request contains a sentinel value from any calculator', async ({ page }) => {
    const SENTINELS = ['919293949', '1987-06-13', '777888999'];
    const offending: string[] = [];

    page.on('request', (request) => {
      const haystack = [
        request.url(),
        JSON.stringify(request.headers()),
        request.postData() ?? '',
      ].join(' ');

      for (const sentinel of SENTINELS) {
        if (haystack.includes(sentinel)) {
          offending.push(`${sentinel} found in ${request.method()} ${request.url()}`);
        }
      }
    });

    await gotoTool(page, '/tools/loan-calculator');
    await setField(page, 'Loan amount', '919293949');
    await expect(page.getByRole('region', { name: 'Loan result' })).toContainText('$');

    await gotoTool(page, '/tools/age-calculator');
    await setField(page, 'Date of birth', '1987-06-13');
    await expect(page.getByRole('region', { name: 'Age result' })).toContainText('years');

    await gotoTool(page, '/tools/salary-calculator');
    await setField(page, 'Pay amount', '777888999');
    await expect(page.getByRole('region', { name: 'Pay equivalents' })).toContainText('$');

    expect(offending, 'user input appeared in a network request').toEqual([]);
  });
});
