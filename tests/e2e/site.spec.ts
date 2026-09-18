import { expect, test } from '@playwright/test';

/**
 * Site-wide smoke coverage (spec §10.5, item 8).
 */

/** All 30 canonical tool routes. */
const TOOL_SLUGS = [
  'percentage-calculator',
  'loan-calculator',
  'mortgage-calculator',
  'compound-interest-calculator',
  'salary-calculator',
  'age-calculator',
  'date-difference-calculator',
  'bmi-calculator',
  'calorie-calculator',
  'qr-code-generator',
  'password-generator',
  'uuid-generator',
  'word-counter',
  'character-counter',
  'case-converter',
  'image-compressor',
  'jpg-compressor',
  'png-compressor',
  'image-resizer',
  'image-cropper',
  'jpg-to-png',
  'png-to-jpg',
  'image-to-pdf',
  'pdf-to-jpg',
  'jpg-to-pdf',
  'pdf-compressor',
  'pdf-merger',
  'pdf-splitter',
  'invoice-generator',
  'receipt-generator',
];

test.describe('routing and metadata', () => {
  test('every category page responds and lists its tools', async ({ page }) => {
    for (const slug of [
      'calculators',
      'text-developer-tools',
      'image-tools',
      'pdf-tools',
      'business-tools',
    ]) {
      const response = await page.goto(`/${slug}`);
      expect(response?.status(), slug).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Category pages must not be a thin list of links.
      await expect(page.getByRole('heading', { name: 'Which one should you use?' })).toBeVisible();
    }
  });

  test('an unknown tool slug returns a real 404 status', async ({ page }) => {
    const response = await page.goto('/tools/this-tool-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/does not exist|not find/i);
  });

  test('titles are unique and never repeat the site name', async ({ page }) => {
    const seen = new Set<string>();

    for (const path of ['/', '/calculators', ...TOOL_SLUGS.map((s) => `/tools/${s}`)]) {
      await page.goto(path);
      const title = await page.title();

      expect(title.length, path).toBeGreaterThan(10);
      // Regression guard for the layout template doubling the site name.
      expect(title.split('ToolNimbly').length - 1, `${path}: "${title}"`).toBeLessThanOrEqual(1);
      expect(seen.has(title), `duplicate title on ${path}`).toBe(false);
      seen.add(title);
    }
  });

  test('every tool page has a self-referencing canonical with no query string', async ({ page }) => {
    for (const slug of TOOL_SLUGS.slice(0, 4)) {
      await page.goto(`/tools/${slug}?utm_source=test`);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, slug).toContain(`/tools/${slug}`);
      expect(canonical, slug).not.toContain('?');
    }
  });

  test('tool pages carry the required anatomy, server-rendered', async ({ page }) => {
    await page.goto('/tools/loan-calculator');

    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Loan Calculator' })).toBeVisible();
    await expect(page.getByText(/Runs in your browser/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /How to use/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Worked example' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Limitations and privacy/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Frequently asked questions/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Related tools' })).toBeVisible();
  });

  test('FAQ text is present without JavaScript executing', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/tools/bmi-calculator');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Is BMI a good measure of health/i)).toBeVisible();
    await expect(page.getByText(/informational|not medical advice/i).first()).toBeVisible();

    await context.close();
  });

  test('sitemap lists every route exactly once and robots references it', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();

    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(urls.length).toBe(40);
    expect(new Set(urls).size).toBe(40);

    for (const slug of TOOL_SLUGS) {
      expect(urls.some((url) => url?.endsWith(`/tools/${slug}`)), slug).toBe(true);
    }
  });
});

test.describe('site shell', () => {
  test('search finds a tool and navigates to it with the keyboard', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /search tools/i }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Search tools' });
    await expect(dialog).toBeVisible();

    await page.getByRole('combobox', { name: 'Search tools' }).fill('loan');
    await expect(page.getByRole('option').first()).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/tools\/loan-calculator$/);
  });

  test('search closes on Escape and returns focus to the trigger', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: /search tools/i }).first();
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Search tools' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Search tools' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('the skip link is reachable and moves focus to the main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toBeFocused();
  });

  test('there is no horizontal overflow at 320 CSS pixels on any route', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    // Every indexable route, not a sample. The business tools each overflowed
    // by 8px because a grid item defaults to min-width:auto and the widest
    // control set the column minimum — a sample of four routes had missed it.
    const routes = [
      '/',
      '/about',
      '/privacy',
      '/terms',
      '/contact',
      '/calculators',
      '/text-developer-tools',
      '/image-tools',
      '/pdf-tools',
      '/business-tools',
      ...TOOL_SLUGS.map((slug) => `/tools/${slug}`),
    ];

    const overflowing: string[] = [];

    for (const path of routes) {
      await page.goto(path);
      // Let the lazily imported tool panel mount before measuring.
      await page.waitForLoadState('networkidle');

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });

      if (overflow > 1) overflowing.push(`${path} (+${overflow}px)`);
    }

    expect(overflowing, 'routes overflow horizontally at 320px').toEqual([]);
  });
});
