'use client';

import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';
import { toolSlugFromArticleClick } from '@/lib/analytics/blog-tool-click';
import {
  ANALYTICS_CONSENT_EVENT,
  announceAnalyticsReady,
  isAnalyticsReady,
  readAnalyticsConsent,
  resetAnalyticsReady,
  setAnalyticsConsent,
  trackAnalyticsEvent,
} from '@/lib/analytics/track';

type Consent = 'loading' | 'unset' | 'allowed' | 'denied';

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
  };
}

/**
 * Consent-gated GA4 loader.
 *
 * The component is rendered only when the deployment explicitly selects GA4
 * and provides a valid measurement ID. Before consent there is no request to a
 * Google origin and no cookie. Page paths and the coarse events from the
 * analytics contract are the only data sent after consent.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const consent: Consent = useSyncExternalStore(
    subscribeToConsent,
    readAnalyticsConsent,
    () => 'loading',
  );
  const [readyVersion, setReadyVersion] = useState(0);

  useEffect(() => {
    if (consent === 'loading') return;
    // A choice made in another tab must also stop the already-loaded Google tag.
    (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] =
      consent !== 'allowed';
    if (consent !== 'allowed') resetAnalyticsReady();
  }, [consent, measurementId]);

  useEffect(() => {
    if (!readyVersion || consent !== 'allowed' || !isAnalyticsReady()) return;
    window.gtag?.('event', 'page_view', {
      page_path: pathname,
      page_title: document.title,
    });
  }, [consent, pathname, readyVersion]);

  useEffect(() => {
    if (!/^\/blog\/[a-z0-9-]+\/?$/.test(pathname)) return;

    const onArticleLinkClick = (event: MouseEvent) => {
      const tool = toolSlugFromArticleClick(event.target);
      if (tool) trackAnalyticsEvent({ name: 'blog_tool_click', tool });
    };

    document.addEventListener('click', onArticleLinkClick, true);
    return () => document.removeEventListener('click', onArticleLinkClick, true);
  }, [pathname]);

  function initialize() {
    if (readAnalyticsConsent() !== 'allowed') return;
    const firstReady = !isAnalyticsReady();
    (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });
    announceAnalyticsReady();
    if (firstReady) setReadyVersion((version) => version + 1);
  }

  return (
    <>
      {consent === 'allowed' ? (
        <Script
          id="toolnimbly-ga4"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
          strategy="afterInteractive"
          onReady={initialize}
        />
      ) : null}

      {consent === 'unset' ? (
        <aside
          aria-label="Analytics preference"
          className="border-border-strong bg-surface fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-xl border p-4 shadow-xl sm:p-5"
        >
          <p className="text-sm font-semibold">Help improve ToolNimbly?</p>
          <p className="measure text-muted mt-1 text-sm">
            Allow anonymous Google Analytics events such as which tool opened and whether it
            completed. Inputs, pasted text, filenames, document contents and calculated values are
            never included. Read the{' '}
            <Link href="/privacy" className="underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setAnalyticsConsent('allowed')}>
              Allow analytics
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setAnalyticsConsent('denied')}>
              No thanks
            </Button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
