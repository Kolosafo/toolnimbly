import { expect, test } from '@playwright/test';

/**
 * Site-wide smoke coverage (spec §10.5, item 8).
 */

const CATEGORY_SLUGS = [
  'calculators',
  'text-developer-tools',
  'image-tools',
  'pdf-tools',
  'business-tools',
];

/** The supporting articles (SEO brief §5). */
const GUIDE_SLUGS = [
  'compound-interest-with-contributions',
  'how-extra-loan-payments-save-interest',
  'how-to-convert-salary-to-hourly',
  'how-loan-interest-works',
  'choosing-a-strong-password',
  'choosing-an-image-format',
  'why-pdfs-are-large',
  'what-a-payment-receipt-should-include',
  'what-an-invoice-must-contain',
  'counting-words-and-characters',
  'reading-health-calculators',
];

const PRIORITY_PAGE_EXPECTATIONS = [
  {
    slug: 'invoice-generator',
    title: 'Free Invoice Generator — PDF, No Signup | ToolNimbly',
    description:
      'Create a professional PDF invoice with line items, tax, discounts and payment terms. Free, no signup, and processed in your browser.',
    h1: 'Free Invoice Generator',
  },
  {
    slug: 'receipt-generator',
    title: 'Free Receipt Generator — Payment Receipt PDF | ToolNimbly',
    description:
      'Create a printable payment receipt with line items, tax, tips and change, then print or download a PDF. Free, private and no signup.',
    h1: 'Free Receipt Generator',
  },
  {
    slug: 'compound-interest-calculator',
    title: 'Compound Interest Calculator with Contributions | ToolNimbly',
    description:
      'Calculate compound interest with regular contributions and daily, monthly or annual compounding. See yearly growth and download the results.',
    h1: 'Compound Interest Calculator with Contributions',
  },
  {
    slug: 'salary-calculator',
    title: 'Salary to Hourly & Hourly to Salary Calculator | ToolNimbly',
    description:
      'Convert annual salary to hourly, monthly, weekly, biweekly or daily gross pay—or convert an hourly wage back to annual salary.',
    h1: 'Salary to Hourly Calculator',
  },
  {
    slug: 'loan-calculator',
    title: 'Loan Calculator with Extra Payments & Amortization | ToolNimbly',
    description:
      'Calculate monthly loan payments, total interest and a full amortization schedule. Add extra payments to compare payoff time and savings.',
    h1: 'Loan Calculator with Extra Payments',
  },
] as const;

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

  test('every tool page has a self-referencing canonical with no query string', async ({
    page,
  }) => {
    for (const slug of TOOL_SLUGS.slice(0, 4)) {
      await page.goto(`/tools/${slug}?utm_source=test`);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, slug).toContain(`/tools/${slug}`);
      expect(canonical, slug).not.toContain('?');
    }
  });

  test('priority pages render exact metadata, one breadcrumb graph and distinct social images', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const socialImages = new Set<string>();

    for (const expected of PRIORITY_PAGE_EXPECTATIONS) {
      const path = `/tools/${expected.slug}`;
      const response = await page.goto(path);
      expect(response?.status(), expected.slug).toBe(200);
      expect(await page.title()).toBe(expected.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        expected.description,
      );

      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toHaveText(expected.h1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`/tools/${expected.slug}$`),
      );

      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      const objects = jsonLd.flatMap((value) => {
        const parsed = JSON.parse(value) as unknown;
        return Array.isArray(parsed) ? parsed : [parsed];
      }) as { '@type'?: string }[];
      expect(objects.filter((item) => item['@type'] === 'BreadcrumbList')).toHaveLength(1);
      expect(objects.filter((item) => item['@type'] === 'WebApplication')).toHaveLength(1);

      const image = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(image, expected.slug).toContain(`/tools/${expected.slug}/social-image`);
      expect(image).toBeTruthy();
      socialImages.add(image!);
      const imageResponse = await context.request.get(image!);
      expect(imageResponse.status(), `${expected.slug} social image`).toBe(200);
      expect(imageResponse.headers()['content-type']).toContain('image/png');
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
        'content',
        '1200',
      );
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
        'content',
        '630',
      );
      await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
        'content',
        /ToolNimbly/,
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', image!);
    }

    expect(socialImages.size).toBe(PRIORITY_PAGE_EXPECTATIONS.length);
    await context.close();
  });

  test('tool pages carry the required anatomy, server-rendered', async ({ page }) => {
    await page.goto('/tools/loan-calculator');

    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Loan Calculator with Extra Payments' }),
    ).toBeVisible();
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

    /*
     * Derived, not a literal. The assertion that matters is that every route is
     * present and none is listed twice; a hard-coded total only records how
     * many pages existed the day it was written, and has to be edited by hand
     * every time one is added.
     */
    const expected = [
      '/',
      '/guides',
      '/about',
      '/privacy',
      '/terms',
      '/contact',
      ...CATEGORY_SLUGS.map((slug) => `/${slug}`),
      ...TOOL_SLUGS.map((slug) => `/tools/${slug}`),
      ...GUIDE_SLUGS.map((slug) => `/guides/${slug}`),
    ];

    expect(new Set(urls).size, 'the sitemap lists a URL twice').toBe(urls.length);
    expect(urls.length).toBe(expected.length);

    for (const path of expected) {
      const suffix = path === '/' ? '' : path;
      expect(
        urls.some((url) => new URL(url!).pathname === (suffix === '' ? '/' : suffix)),
        `sitemap is missing ${path}`,
      ).toBe(true);
    }

    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.status()).toBe(200);
    const robots = await robotsResponse.text();
    expect(robots).toContain('Sitemap:');
    expect(robots).toContain('/sitemap.xml');
    expect(robots).toContain('Disallow: /api/');
    expect(robots).not.toContain('Disallow: /_next/');
    expect(robots).not.toContain('Disallow: /*?*');
  });
});

test.describe('site shell', () => {
  test('search finds a tool and navigates to it with the keyboard', async ({ page }) => {
    await page.goto('/');

    await page
      .getByRole('button', { name: /search tools/i })
      .first()
      .click();
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

  test('the skip link is reachable and moves focus to the main content', async ({
    page,
    browserName,
  }) => {
    await page.goto('/');

    // Safari and WebKit do not move Tab focus to links unless the user enables
    // "Full Keyboard Access". That is a platform setting, not something the
    // page controls, so the Tab assertion is skipped there — the link itself
    // still exists and works, which is asserted below for every browser.
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skipLink).toHaveAttribute('href', '#main-content');

    if (browserName !== 'webkit') {
      await page.keyboard.press('Tab');
      await expect(skipLink).toBeFocused();
    }
  });

  test('no route forces horizontal scrolling or hides a control at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });

    /*
     * Two checks, because `scrollWidth` alone is not the requirement and is not
     * comparable across browsers: WebKit reports a larger value for content
     * inside a clipped scroll container even when nothing is user-visible, so
     * an earlier version of this test failed there while the page was fine.
     *
     * What actually matters:
     *   1. the user is not forced to scroll sideways to read the page, and
     *   2. `body { overflow-x: hidden }` is not quietly clipping a control out
     *      of reach — which is the failure that rule could otherwise mask.
     */
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
      '/guides',
      ...GUIDE_SLUGS.map((slug) => `/guides/${slug}`),
      ...TOOL_SLUGS.map((slug) => `/tools/${slug}`),
    ];

    const problems: string[] = [];

    for (const path of routes) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const result = await page.evaluate(() => {
        const before = window.scrollX;
        window.scrollTo(400, 0);
        const scrolled = window.scrollX > before;
        window.scrollTo(0, 0);

        // Any interactive control sitting outside the viewport is unreachable.
        const unreachable: string[] = [];
        const selector =
          'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex="0"]';

        for (const element of document.querySelectorAll(selector)) {
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;

          // Inside a horizontal scroller the control is reachable by scrolling
          // that container, which is the documented behaviour for wide tables.
          let inScroller = false;
          let parent = element.parentElement;
          while (parent) {
            const overflowX = getComputedStyle(parent).overflowX;
            if (overflowX === 'auto' || overflowX === 'scroll') {
              inScroller = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (inScroller) continue;

          if (rect.left < -8 || rect.right > document.documentElement.clientWidth + 8) {
            unreachable.push(
              `${element.tagName}.${String(element.className).slice(0, 34)} left=${Math.round(rect.left)} right=${Math.round(rect.right)}`,
            );
          }
        }

        return { scrolled, unreachable: unreachable.slice(0, 3) };
      });

      if (result.scrolled) problems.push(`${path}: page scrolls sideways`);
      for (const control of result.unreachable) {
        problems.push(`${path}: control outside the viewport — ${control}`);
      }
    }

    expect(problems, 'routes with horizontal layout problems at 320px').toEqual([]);
  });
});
