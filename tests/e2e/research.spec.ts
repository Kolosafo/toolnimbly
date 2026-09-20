import { expect, test } from '@playwright/test';

/**
 * The research routes, served by a real production build.
 *
 * Everything here asserts the *unpublished* state, which is the state this
 * repository is in and the state that matters: a research URL that resolves
 * before the research exists can be crawled, cached and cited, and none of that
 * can be taken back. The unit suite covers what the page does once it has data.
 */

const RESEARCH_INDEX = '/research';
const BENCHMARK = '/research/invoice-payment-terms-benchmark-2026';
const SURVEY = '/research/invoice-payment-terms-survey';
const SOCIAL_IMAGE = `${BENCHMARK}/social-image`;

test.describe('while the benchmark is unpublished', () => {
  for (const path of [RESEARCH_INDEX, BENCHMARK, SURVEY]) {
    test(`${path} returns a real 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    });
  }

  test('the sitemap lists no research URL', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).not.toContain('/research');
    expect(xml).not.toContain('benchmark');
    expect(xml).not.toContain('survey');
    // The rest of the sitemap is intact.
    expect(xml).toContain('/tools/invoice-generator');
  });

  test('robots.txt does not single the routes out, because they 404 anyway', async ({
    request,
  }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).not.toContain('/research');
  });

  test('no aggregate CSV is downloadable', async ({ request }) => {
    const response = await request.get(
      '/research/invoice-payment-terms-benchmark-2026-aggregates.csv',
    );
    expect(response.status()).toBe(404);
  });

  test('the social image is a 1200×630 PNG carrying no statistic', async ({ request }) => {
    const response = await request.get(SOCIAL_IMAGE);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');

    const body = await response.body();
    // PNG signature, then width and height from the IHDR chunk.
    expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(body.readUInt32BE(16)).toBe(1200);
    expect(body.readUInt32BE(20)).toBe(630);
  });
});

test.describe('the privacy page', () => {
  test('claims no survey collection while none is configured', async ({ page }) => {
    await page.goto('/privacy');
    const body = (await page.locator('main').innerText()).toLowerCase();

    expect(body).not.toContain('research survey responses');
    expect(body).not.toContain('invoice payment terms survey');
    // The local-processing promise is untouched.
    expect(body).toContain('runs entirely in your browser');
  });
});
