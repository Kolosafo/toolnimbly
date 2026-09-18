import { expect, test, type Page } from '@playwright/test';

import { fillAndConfirm, gotoTool } from './helpers';

/**
 * Invoice and receipt journeys (spec §10.5 item 6, §12 business gates).
 */

/** Fills one line item row by its numbered labels. */
async function fillLine(page: Page, index: number, description: string, qty: string, price: string) {
  await fillAndConfirm(page.getByLabel(`Description ${index}`, { exact: true }), description);
  await fillAndConfirm(page.getByLabel(`Quantity ${index}`, { exact: true }), qty);
  await fillAndConfirm(page.getByLabel(`Unit price ${index}`, { exact: true }), price);
}

test.describe('invoice generator', () => {
  test('calculates the published worked example', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    await fillLine(page, 1, 'Design work', '24', '65.00');
    await page.getByRole('button', { name: 'Add line item' }).click();
    await fillLine(page, 2, 'Revisions', '6', '65.00');

    await fillAndConfirm(page.getByLabel('Discount', { exact: true }), '10');
    await fillAndConfirm(page.getByLabel('Tax', { exact: true }), '20');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('$1,950.00'); // subtotal
    await expect(preview).toContainText('$195.00'); // discount
    await expect(preview).toContainText('$1,755.00'); // taxable amount
    await expect(preview).toContainText('$351.00'); // tax
    await expect(preview).toContainText('$2,106.00'); // total
  });

  test('shows the taxable amount so the tax order is visible', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');
    await fillLine(page, 1, 'Work', '1', '1000');
    await fillAndConfirm(page.getByLabel('Discount', { exact: true }), '10');
    await fillAndConfirm(page.getByLabel('Tax', { exact: true }), '20');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('Taxable amount');
    await expect(preview).toContainText('$900.00');
    // Tax after discount: 20% of 900 = 180, total 1,080. Not 1,100.
    await expect(preview).toContainText('$180.00');
    await expect(preview).toContainText('$1,080.00');
  });

  test('adds, reorders and removes line items', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    await fillLine(page, 1, 'First', '1', '10');
    await page.getByRole('button', { name: 'Add line item' }).click();
    await fillLine(page, 2, 'Second', '1', '20');

    const preview = page.locator('[data-document-preview]');
    await expect(preview.locator('tbody tr').first()).toContainText('First');

    await page.getByRole('button', { name: 'Move line 2 up' }).click();
    await expect(preview.locator('tbody tr').first()).toContainText('Second');

    await page.getByRole('button', { name: 'Remove line 1' }).click();
    await expect(preview.locator('tbody tr')).toHaveCount(1);
  });

  test('always leaves at least one line row', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');
    await page.getByRole('button', { name: 'Remove line 1' }).click();
    await expect(page.getByLabel('Description 1', { exact: true })).toBeVisible();
  });

  test('warns when the due date precedes the issue date', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    await page.getByLabel('Issue date').fill('2026-09-18');
    await page.getByLabel('Due date').fill('2026-09-01');

    await expect(page.getByText(/due date is before the issue date/i).first()).toBeVisible();
  });

  test('shows a balance due after a partial payment', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    await fillLine(page, 1, 'Work', '1', '500');
    await page.getByLabel('Amount already paid').fill('200');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('Balance due');
    await expect(preview).toContainText('$300.00');
  });

  test('changes currency formatting throughout', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');
    await fillLine(page, 1, 'Item', '1', '1234.56');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('$1,234.56');

    // JPY has no minor unit, so it rounds to whole yen.
    await page.getByLabel('Currency').selectOption('JPY');
    await expect(preview).toContainText('¥1,235');
  });

  test('downloads a PDF', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    await fillLine(page, 1, 'Consulting', '10', '150');
    await page.getByLabel('Invoice number').fill('INV-2026-004');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('invoice-INV-2026-004.pdf');
  });

  test('renders entered text as text, never as markup', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    // If this were injected as HTML it would become an element rather than text.
    await fillLine(page, 1, '<img src=x onerror=alert(1)>', '1', '10');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('<img src=x onerror=alert(1)>');
    await expect(preview.locator('img[src="x"]')).toHaveCount(0);
  });
});

test.describe('receipt generator', () => {
  test('calculates the published worked example including change', async ({ page }) => {
    await gotoTool(page, '/tools/receipt-generator');

    await fillLine(page, 1, 'Flat white', '2', '3.80');
    await page.getByRole('button', { name: 'Add line item' }).click();
    await fillLine(page, 2, 'Sandwich', '1', '8.50');
    await page.getByRole('button', { name: 'Add line item' }).click();
    await fillLine(page, 3, 'Pastry', '2', '3.20');

    await fillAndConfirm(page.getByLabel('Tax', { exact: true }), '8');
    await fillAndConfirm(page.getByLabel('Tip or service charge'), '15');
    await fillAndConfirm(page.getByLabel('Amount tendered'), '30');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('$22.50'); // subtotal
    await expect(preview).toContainText('$1.80'); // tax
    await expect(preview).toContainText('$3.38'); // tip on pre-tax subtotal
    await expect(preview).toContainText('$27.68'); // total
    await expect(preview).toContainText('$2.32'); // change
  });

  test('says no change is due when the payment is short', async ({ page }) => {
    await gotoTool(page, '/tools/receipt-generator');

    await fillLine(page, 1, 'Item', '1', '50');
    await page.getByLabel('Amount tendered').fill('20');

    await expect(page.getByText(/does not cover the total, so no change is due/i)).toBeVisible();
  });

  test('labels itself a receipt and carries the scope statement', async ({ page }) => {
    await gotoTool(page, '/tools/receipt-generator');

    const preview = page.locator('[data-document-preview]');
    await expect(preview).toContainText('RECEIPT');
    await expect(preview).not.toContainText('INVOICE');
    await expect(preview).toContainText(/not, by itself, proof that a transaction took place/i);
  });

  test('switches between compact and full layouts', async ({ page }) => {
    await gotoTool(page, '/tools/receipt-generator');
    await fillLine(page, 1, 'Item', '1', '10');

    await page.getByRole('radio', { name: 'Full page' }).check();
    await expect(page.locator('[data-document-preview]')).toContainText('Customer');

    await page.getByRole('radio', { name: 'Compact' }).check();
    await expect(page.locator('[data-document-preview]')).toContainText('RECEIPT');
  });

  test('downloads a receipt PDF', async ({ page }) => {
    await gotoTool(page, '/tools/receipt-generator');

    await fillLine(page, 1, 'Coffee', '2', '3.50');
    await page.getByLabel('Receipt number').fill('R-1042');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('receipt-R-1042.pdf');
  });
});

test.describe('drafts', () => {
  test('saves and deletes a draft on request only', async ({ page }) => {
    await gotoTool(page, '/tools/invoice-generator');

    // Nothing is stored until the user opts in.
    await fillLine(page, 1, 'Before opt-in', '1', '10');
    expect(
      await page.evaluate(() => window.localStorage.getItem('toolnimbly:invoice-draft')),
    ).toBeNull();

    await page.getByLabel('Keep a draft in this browser').check();
    await page.getByLabel('Description 1', { exact: true }).fill('After opt-in');

    await expect
      .poll(async () =>
        page.evaluate(() => window.localStorage.getItem('toolnimbly:invoice-draft')),
      )
      .toContain('After opt-in');

    await page.getByRole('button', { name: 'Delete saved draft' }).click();
    expect(
      await page.evaluate(() => window.localStorage.getItem('toolnimbly:invoice-draft')),
    ).toBeNull();
  });
});

test.describe('privacy', () => {
  test('no customer or pricing data leaves the device', async ({ page }) => {
    const sentinels = ['Acme Sentinel Ltd', '987654.32', 'sentinel@example.invalid'];
    const offending: string[] = [];

    page.on('request', (request) => {
      const haystack = [
        request.url(),
        JSON.stringify(request.headers()),
        request.postData() ?? '',
      ].join(' ');
      for (const sentinel of sentinels) {
        if (haystack.includes(sentinel)) offending.push(`${sentinel} in ${request.url()}`);
      }
    });

    await gotoTool(page, '/tools/invoice-generator');
    await fillAndConfirm(page.getByLabel('Client name'), 'Acme Sentinel Ltd');
    await fillAndConfirm(page.getByLabel('Client email'), 'sentinel@example.invalid');
    await fillLine(page, 1, 'Confidential work', '1', '987654.32');

    await expect(page.locator('[data-document-preview]')).toContainText('Acme Sentinel Ltd');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    await downloadPromise;

    expect(offending, 'invoice data may have left the device').toEqual([]);
  });
});
