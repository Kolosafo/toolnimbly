// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import {
  ANALYTICS_CONSENT_KEY,
  announceAnalyticsReady,
  resetAnalyticsReady,
  setAnalyticsConsent,
} from '@/lib/analytics/track';

vi.mock('next/navigation', () => ({ usePathname: () => '/blog/sample-article' }));

const disableKey = 'ga-disable-G-TEST123';

beforeEach(() => {
  window.localStorage.clear();
  resetAnalyticsReady();
  delete (window as unknown as Record<string, boolean>)[disableKey];
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('GA4 consent revocation', () => {
  it('disables an already loaded tag when another tab denies consent', () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'allowed');
    render(<GoogleAnalytics measurementId="G-TEST123" />);
    expect((window as unknown as Record<string, boolean>)[disableKey]).toBe(false);

    act(() => {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'denied');
      window.dispatchEvent(new StorageEvent('storage', { key: ANALYTICS_CONSENT_KEY }));
    });

    expect((window as unknown as Record<string, boolean>)[disableKey]).toBe(true);
  });

  it('records an article-to-tool click without sending link text or article content', () => {
    const gtag = vi.fn();
    setAnalyticsConsent('allowed');
    window.gtag = gtag;
    announceAnalyticsReady();
    render(<GoogleAnalytics measurementId="G-TEST123" />);

    document.body.insertAdjacentHTML(
      'beforeend',
      '<article><a href="/tools/invoice-generator"><span>Try this calculator</span></a></article>',
    );
    document
      .querySelector('article a')
      ?.addEventListener('click', (event) => event.preventDefault());
    document
      .querySelector('article span')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(gtag).toHaveBeenCalledWith('event', 'blog_tool_click', {
      tool: 'invoice-generator',
    });
  });
});
