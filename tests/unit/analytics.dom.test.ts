// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toolSlugFromArticleClick } from '@/lib/analytics/blog-tool-click';
import {
  ANALYTICS_CONSENT_KEY,
  announceAnalyticsReady,
  readAnalyticsConsent,
  resetAnalyticsReady,
  setAnalyticsConsent,
  trackAnalyticsEvent,
} from '@/lib/analytics/track';

beforeEach(() => {
  window.localStorage.clear();
  resetAnalyticsReady();
  delete window.gtag;
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('consent-gated analytics', () => {
  it('drops events until consent and script configuration are both ready', () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    expect(trackAnalyticsEvent({ name: 'tool_view', tool: 'invoice-generator' })).toBe(false);
    setAnalyticsConsent('allowed');
    expect(trackAnalyticsEvent({ name: 'tool_view', tool: 'invoice-generator' })).toBe(false);

    announceAnalyticsReady();
    expect(trackAnalyticsEvent({ name: 'tool_view', tool: 'invoice-generator' })).toBe(true);
    expect(gtag).toHaveBeenCalledWith('event', 'tool_view', { tool: 'invoice-generator' });
  });

  it('honours a denial saved in another tab even when the tag is already ready', () => {
    const gtag = vi.fn();
    window.gtag = gtag;
    setAnalyticsConsent('allowed');
    announceAnalyticsReady();

    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'denied');
    window.dispatchEvent(new StorageEvent('storage', { key: ANALYTICS_CONSENT_KEY }));

    expect(readAnalyticsConsent()).toBe('denied');
    expect(trackAnalyticsEvent({ name: 'tool_view', tool: 'invoice-generator' })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });
});

describe('blog-to-tool click filtering', () => {
  it('accepts an article link to a first-party tool, including clicks on child elements', () => {
    document.body.innerHTML =
      '<article><a href="/tools/compound-interest-calculator"><span>Try the tool</span></a></article>';
    const target = document.querySelector('span');
    expect(toolSlugFromArticleClick(target)).toBe('compound-interest-calculator');
  });

  it('ignores footer links, off-site links and non-tool links', () => {
    document.body.innerHTML =
      '<article><a class="external" href="https://example.com/tools/invoice-generator">Other site</a><a class="guide" href="/guides/invoices">Guide</a></article><footer><a class="footer" href="/tools/invoice-generator">Tool</a></footer>';
    expect(toolSlugFromArticleClick(document.querySelector('.external'))).toBeNull();
    expect(toolSlugFromArticleClick(document.querySelector('.guide'))).toBeNull();
    expect(toolSlugFromArticleClick(document.querySelector('.footer'))).toBeNull();
  });
});
