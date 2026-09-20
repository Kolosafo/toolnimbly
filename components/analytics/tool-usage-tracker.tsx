'use client';

import { useEffect, useRef } from 'react';

import type { AllowedOutputKind } from '@/lib/analytics/events';
import { COPY_EVENT, DOWNLOAD_EVENT, trackAnalyticsEvent } from '@/lib/analytics/track';

/**
 * Measures use without reading values.
 *
 * A first form interaction records `tool_started`. A later result-region DOM
 * update records one `tool_success`. Clipboard and download helpers announce
 * their completed action as a valueless browser event. The tracker never reads
 * an input, filename, result, free-form error or document payload.
 */
export function ToolUsageTracker({ tool, children }: { tool: string; children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const successRef = useRef(false);

  useEffect(() => {
    trackAnalyticsEvent({ name: 'tool_view', tool });
  }, [tool]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new MutationObserver((mutations) => {
      if (!startedRef.current || successRef.current) return;
      const changedResult = mutations.some((mutation) => {
        const element =
          mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        return Boolean(element?.closest('[aria-live="polite"]'));
      });
      if (!changedResult) return;
      successRef.current = true;
      trackAnalyticsEvent({ name: 'tool_success', tool });
    });
    observer.observe(root, { subtree: true, childList: true, characterData: true });

    const onCopy = () => {
      trackAnalyticsEvent({ name: 'tool_copy', tool });
      if (!successRef.current) {
        successRef.current = true;
        trackAnalyticsEvent({ name: 'tool_success', tool });
      }
    };
    const onDownload = (event: Event) => {
      const outputKind = (event as CustomEvent<{ outputKind?: AllowedOutputKind }>).detail
        ?.outputKind;
      if (!outputKind) return;
      trackAnalyticsEvent({ name: 'tool_download', tool, outputKind });
      if (!successRef.current) {
        successRef.current = true;
        trackAnalyticsEvent({ name: 'tool_success', tool, outputKind });
      }
    };
    window.addEventListener(COPY_EVENT, onCopy);
    window.addEventListener(DOWNLOAD_EVENT, onDownload);

    return () => {
      observer.disconnect();
      window.removeEventListener(COPY_EVENT, onCopy);
      window.removeEventListener(DOWNLOAD_EVENT, onDownload);
    };
  }, [tool]);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackAnalyticsEvent({ name: 'tool_started', tool });
  }

  return (
    <div
      ref={rootRef}
      onInputCapture={markStarted}
      onChangeCapture={markStarted}
      onClickCapture={markStarted}
    >
      {children}
    </div>
  );
}
