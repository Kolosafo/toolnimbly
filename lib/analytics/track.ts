'use client';

import type { AnalyticsEvent, AllowedOutputKind } from './events';

export const COPY_EVENT = 'toolnimbly:copy';
export const DOWNLOAD_EVENT = 'toolnimbly:download';
export const ANALYTICS_READY_EVENT = 'toolnimbly:analytics-ready';
export const ANALYTICS_CONSENT_EVENT = 'toolnimbly:analytics-consent-change';
export const ANALYTICS_CONSENT_KEY = 'toolnimbly:analytics-consent';

type Consent = 'allowed' | 'denied' | 'unset';
let memoryConsent: Consent = 'unset';
let analyticsReady = false;

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
export function trackAnalyticsEvent(event: AnalyticsEvent): boolean {
  if (!isAnalyticsReady()) return false;
  const { name, ...parameters } = event;
  window.gtag?.('event', name, parameters);
  return true;
}

/** Persistent consent takes precedence so a choice made in another tab is honoured. */
export function readAnalyticsConsent(): Consent {
  if (typeof window === 'undefined') return 'unset';
  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return stored === 'allowed' || stored === 'denied' ? stored : 'unset';
  } catch {
    return memoryConsent;
  }
}

export function setAnalyticsConsent(next: 'allowed' | 'denied'): void {
  memoryConsent = next;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, next);
  } catch {
    // Storage can be unavailable in private browsing; keep the choice in memory.
  }
  if (next === 'denied') analyticsReady = false;
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}

/** Called only after the consent-gated GA4 script is loaded and configured. */
export function announceAnalyticsReady(): void {
  if (typeof window === 'undefined' || readAnalyticsConsent() !== 'allowed') return;
  analyticsReady = true;
  window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
}

export function resetAnalyticsReady(): void {
  analyticsReady = false;
}

export function isAnalyticsReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    analyticsReady &&
    readAnalyticsConsent() === 'allowed' &&
    typeof window.gtag === 'function'
  );
}

export function announceCopy(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COPY_EVENT));
}

export function announceDownload(outputKind: AllowedOutputKind): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DOWNLOAD_EVENT, { detail: { outputKind } }));
}
