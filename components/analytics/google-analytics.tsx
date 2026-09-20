'use client';

import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'toolnimbly:analytics-consent';
const CONSENT_EVENT = 'toolnimbly:analytics-consent-change';

type Consent = 'loading' | 'unset' | 'allowed' | 'denied';
let memoryConsent: 'allowed' | 'denied' | undefined;

function subscribeToConsent(onStoreChange: () => void): () => void {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(CONSENT_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(CONSENT_EVENT, onStoreChange);
  };
}

function readConsent(): Consent {
  if (memoryConsent) return memoryConsent;
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    return stored === 'allowed' || stored === 'denied' ? stored : 'unset';
  } catch {
    return 'unset';
  }
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
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => 'loading');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || consent !== 'allowed' || !window.gtag) return;
    window.gtag('event', 'page_view', {
      page_path: pathname,
      page_title: document.title,
    });
  }, [consent, pathname, ready]);

  function choose(next: 'allowed' | 'denied') {
    memoryConsent = next;
    try {
      window.localStorage.setItem(CONSENT_KEY, next);
    } catch {
      // A privacy mode may deny storage. Honour the choice for this page even
      // when it cannot be remembered for the next visit.
    }
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  function initialize() {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });
    setReady(true);
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
            <Button size="sm" onClick={() => choose('allowed')}>
              Allow analytics
            </Button>
            <Button variant="secondary" size="sm" onClick={() => choose('denied')}>
              No thanks
            </Button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
