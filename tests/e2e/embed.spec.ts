import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { expect, test } from '@playwright/test';

import { site } from '@/lib/config/site';
import { buildEmbedSnippet } from '@/lib/embed/snippet';
import { findTool, tools } from '@/lib/registry';

import { gotoTool } from './helpers';

/**
 * The embed feature's acceptance criterion (SEO brief §7):
 *
 *   "pasting the snippet on a *different* domain renders the working tool AND a
 *    crawlable <a> link back to the tool page."
 *
 * Both halves matter, and the second is the one that is easy to lose. The
 * backlink is the entire commercial point of the feature, and it only counts
 * because it sits in the *host* page's HTML. A link inside our own iframe is an
 * internal link; a link written by JavaScript is not reliably crawled. So these
 * tests assert the anchor is in the framing document, as served, before any
 * script runs.
 *
 * The host page is served by a real HTTP server on its own port, which makes it
 * a genuinely different origin: the browser applies `frame-ancestors`, the
 * same-origin policy and `X-Frame-Options` between it and the site under test
 * exactly as it would between two registered domains.
 *
 * An earlier version served the host page from the invented domain
 * `partner-site.test` through request interception. Chromium refused to load
 * the frame with ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS: Private Network
 * Access forbids a page in *public* address space from reaching 127.0.0.1. That
 * is a property of testing against a loopback server, not of the product — in
 * production both the host page and the embed are public — so the fix is to put
 * the host page in the same address space rather than to weaken the browser.
 */

const TOOL_SLUG = 'loan-calculator';

/** Serves whatever HTML the current test asked for, on its own origin. */
let hostServer: Server;
let hostOrigin: string;
let hostBody = '';

test.beforeAll(async () => {
  hostServer = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(hostBody);
  });
  await new Promise<void>((resolve) => hostServer.listen(0, '127.0.0.1', resolve));
  hostOrigin = `http://127.0.0.1:${(hostServer.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => hostServer.close(() => resolve()));
});

/**
 * The snippet as a visitor would copy it, repointed at the server under test.
 *
 * The snippet is built with whatever canonical origin this *test process* has
 * configured, which is not the origin the server under test is listening on, so
 * the substitution is against `site.url` rather than a literal. Hard-coding the
 * production domain here made the replacement silently do nothing.
 */
function snippetForTest(baseURL: string, slug: string): string {
  const tool = findTool(slug);
  if (!tool) throw new Error(`no such tool: ${slug}`);
  return buildEmbedSnippet(tool).replaceAll(site.url.replace(/\/$/, ''), baseURL);
}

function hostPage(snippet: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>A partner site</title></head><body><h1>An article on someone else's site</h1>${snippet}</body></html>`;
}

function serveHostPage(baseURL: string, slug = TOOL_SLUG): string {
  const snippet = snippetForTest(baseURL, slug);
  hostBody = hostPage(snippet);
  return snippet;
}

// The host server holds one body at a time, so these share state and must not
// interleave.
test.describe.configure({ mode: 'serial' });

test.describe('embed snippet on a third-party site', () => {
  test('renders a working tool inside the frame', async ({ page, baseURL }) => {
    serveHostPage(baseURL!);
    await page.goto(`${hostOrigin}/`);

    const frame = page.frameLocator('iframe[title="Loan Calculator"]');

    // The frame loaded at all — this is what `frame-ancestors` and
    // `X-Frame-Options` would have blocked.
    const amount = frame.getByLabel(/loan amount/i);
    await expect(amount).toBeVisible();

    // And it is hydrated and computing, not just server-rendered markup.
    await amount.fill('25000');
    await frame.getByLabel(/annual interest rate/i).fill('6');
    await frame.getByLabel(/term/i).first().fill('5');

    // Scoped to the result region: the figure also appears in every row of the
    // amortisation schedule, and an unscoped match is ambiguous.
    await expect(
      frame.getByRole('region', { name: /loan result/i }).getByText('$483.32'),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('puts a crawlable backlink in the host page, outside the iframe', async ({
    page,
    baseURL,
  }) => {
    serveHostPage(baseURL!);
    const response = await page.goto(`${hostOrigin}/`);

    // Present in the bytes the server sent, before any script could run. This
    // is the property a crawler depends on.
    const html = await response!.text();
    expect(html).toContain(`href="${baseURL}/tools/${TOOL_SLUG}"`);
    expect(html).not.toContain('<script');

    // In the host document, not the iframe.
    const link = page.locator(`a[href="${baseURL}/tools/${TOOL_SLUG}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Loan Calculator/i);

    // A crawler follows it to the canonical tool page.
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/tools/${TOOL_SLUG}$`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Loan Calculator');
  });

  test('every tool offers an embed snippet that names its own canonical URL', ({ baseURL }) => {
    // Cheap guard against a snippet that silently points everyone at one tool.
    for (const tool of tools) {
      const snippet = snippetForTest(baseURL!, tool.slug);
      expect(snippet, tool.slug).toContain(`${baseURL}/embed/${tool.slug}`);
      expect(snippet, tool.slug).toContain(`href="${baseURL}/tools/${tool.slug}"`);
    }
  });
});

test.describe('the embed route itself', () => {
  test('is framable by anyone but never indexable', async ({ page, request }) => {
    const response = await request.get(`/embed/${TOOL_SLUG}`);
    const headers = response.headers();

    expect(headers['content-security-policy']).toContain('frame-ancestors *');
    // No "allow any origin" value exists for this header, so it must be absent.
    expect(headers['x-frame-options']).toBeUndefined();

    await page.goto(`/embed/${TOOL_SLUG}`);

    // Stripped of a copy of a page that already ranks, so it must not compete.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/tools/${TOOL_SLUG}$`),
    );
  });

  test('carries no site navigation', async ({ page }) => {
    await page.goto(`/embed/${TOOL_SLUG}`);
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.locator('footer')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /skip to/i })).toHaveCount(0);
  });

  test('is excluded from the sitemap', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/embed/');
    expect(sitemap).toContain(`/tools/${TOOL_SLUG}`);
  });
});

test.describe('the embed dialog', () => {
  test('offers a snippet for the tool the visitor is looking at', async ({ page }) => {
    await gotoTool(page, `/tools/${TOOL_SLUG}`);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: /embed this tool/i }).click();
    await expect(dialog).toBeVisible();

    const code = dialog.getByLabel('Embed code');
    // The snippet names this tool, not whichever tool happened to be first.
    await expect(code).toHaveValue(new RegExp(`/embed/${TOOL_SLUG}"`));
    await expect(code).toHaveValue(new RegExp(`href="[^"]*/tools/${TOOL_SLUG}"`));

    // The theme control changes the snippet rather than only the dialog.
    await dialog.getByRole('radio', { name: /always dark/i }).check();
    await expect(code).toHaveValue(/\?theme=dark/);
    await dialog.getByRole('radio', { name: /match the visitor/i }).check();
    await expect(code).not.toHaveValue(/\?theme=/);

    // Escape closes it, which is the behaviour people expect of a modal and the
    // reason this is a native <dialog> rather than a hand-rolled overlay.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('is reachable by keyboard alone', async ({ page }) => {
    await gotoTool(page, `/tools/${TOOL_SLUG}`);

    const trigger = page.getByRole('button', { name: /embed this tool/i });
    await trigger.focus();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Focus is inside the dialog, so tabbing cannot wander into the page behind
    // it — the property a native <dialog> gives us and a <div> would not.
    const focusedIsInside = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? Boolean(active.closest('dialog')) : false;
    });
    expect(focusedIsInside).toBe(true);
  });
});
