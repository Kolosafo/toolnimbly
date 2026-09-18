import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Fills a field and confirms the value landed before the test continues.
 *
 * Under parallel load — the full matrix runs four browsers at once — WebKit can
 * process a following interaction before React has applied the previous
 * controlled-input update, and the earlier value is lost. Typing by hand and
 * filling in isolation were both verified not to drop input, so this is a
 * harness timing artifact rather than a product defect; confirming the value is
 * the correct way to remove the race without weakening what is asserted.
 */
export async function fillAndConfirm(field: Locator, value: string): Promise<void> {
  await field.fill(value);
  await expect(field).toHaveValue(value);
}

/**
 * Navigates to a tool page and waits for its panel to be interactive.
 *
 * The tool panel is a lazily imported Client Component, so there is a window
 * after navigation where the inputs exist in the server-rendered HTML but React
 * has not hydrated them. Filling a field during that window sets the DOM value
 * without React ever seeing it: the input looks correct and the derived output
 * never updates. Under parallel load WebKit hit this reliably enough to make
 * two tests flaky.
 *
 * Waiting for the network to settle is what makes the interaction land on a
 * hydrated page rather than a static one.
 */
export async function gotoTool(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/** Scopes a query to a tool's interactive panel, away from the page's prose. */
export function toolPanel(page: Page, toolName: string): Locator {
  return page.getByRole('region', { name: `${toolName} tool` });
}
