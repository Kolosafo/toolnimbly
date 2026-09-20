'use client';

import type { AnalyticsEvent, AllowedOutputKind } from './events';

export const COPY_EVENT = 'toolnimbly:copy';
export const DOWNLOAD_EVENT = 'toolnimbly:download';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Send only the allow-listed event shape from `events.ts`.
 *
 * If analytics are disabled, declined or not yet loaded this deliberately does
 * nothing. Tool values never reach this boundary: callers can provide only a
 * slug, an enum-like error code or a coarse output kind.
 */
export function trackAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  const { name, ...parameters } = event;
  window.gtag('event', name, parameters);
}

export function announceCopy(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COPY_EVENT));
}

export function announceDownload(outputKind: AllowedOutputKind): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DOWNLOAD_EVENT, { detail: { outputKind } }));
}
