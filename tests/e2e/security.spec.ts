import { expect, test } from '@playwright/test';

/**
 * Security-header and CSP regression suite (spec §7.9, §12, ADR 0006).
 *
 * The first CSP implementation used a nonce, which cannot work on prerendered
 * HTML: every script was refused, React never hydrated, and the tools were
 * invisible in production while passing every unit test. These tests fail on a
 * single CSP violation, so that cannot recur silently.
 */

const PAGES = ['/', '/calculators', '/tools/loan-calculator', '/tools/bmi-calculator'];

test.describe('content security policy', () => {
  for (const path of PAGES) {
    test(`loads ${path} with zero CSP violations and a hydrated page`, async ({ page }) => {
      const violations: string[] = [];

      page.on('console', (message) => {
        const text = message.text();
        if (/Content Security Policy|violates the following/i.test(text)) {
          violations.push(text.slice(0, 200));
        }
      });

      await page.goto(path, { waitUntil: 'networkidle' });

      expect(violations, `CSP violations on ${path}`).toEqual([]);

      // Hydration actually completed: React removes its streamed Suspense
      // wrappers once it takes over. A blocked bootstrap leaves them behind.
      const strandedSuspense = await page.evaluate(
        () => document.querySelectorAll('div[hidden][id^="S:"]').length,
      );
      expect(strandedSuspense, `unhydrated Suspense content on ${path}`).toBe(0);
    });
  }

  test('the tool panel is actually interactive after hydration', async ({ page }) => {
    await page.goto('/tools/loan-calculator');

    const amount = page.getByLabel('Loan amount');
    await expect(amount).toBeVisible();

    // Typing changes the result, which only happens if React is running.
    const results = page.getByRole('region', { name: 'Loan result' });
    await expect(results).toContainText('$500.95');
    await amount.fill('50000');
    await expect(results).not.toContainText('$500.95');
  });

  test('sends the expected security headers', async ({ request }) => {
    const response = await request.get('/tools/loan-calculator');
    const headers = response.headers();

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');

    const csp = headers['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    // The promise that no tool payload can reach another origin.
    expect(csp).toContain("connect-src 'self'");
  });

  test('carries no unsafe-eval and no nonce in the production policy', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';

    // A nonce on prerendered HTML disables 'unsafe-inline' and blocks
    // everything — the exact production failure ADR 0006 records.
    expect(csp, 'a nonce cannot work on prerendered HTML').not.toContain('nonce-');
    expect(csp, "'strict-dynamic' makes the browser ignore 'self'").not.toContain('strict-dynamic');

    // `wasm-unsafe-eval` is allowed and is a different token from `unsafe-eval`.
    const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc.replace(/'wasm-unsafe-eval'/g, '')).not.toContain('unsafe-eval');
  });

  test('does not load any third-party resource', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost' && url.protocol !== 'data:') {
        external.push(request.url());
      }
    });

    await page.goto('/tools/bmi-calculator', { waitUntil: 'networkidle' });
    expect(external, 'a third-party resource was requested').toEqual([]);
  });
});
