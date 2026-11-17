// @vitest-environment jsdom

import { act, cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToolUsageTracker } from '@/components/analytics/tool-usage-tracker';
import {
  announceAnalyticsReady,
  resetAnalyticsReady,
  setAnalyticsConsent,
} from '@/lib/analytics/track';

beforeEach(() => {
  window.localStorage.clear();
  resetAnalyticsReady();
  delete window.gtag;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('tool view measurement', () => {
  it('records one view when GA4 becomes ready after the tool has mounted', () => {
    const gtag = vi.fn();
    render(
      <ToolUsageTracker tool="invoice-generator">
        <button type="button">Create invoice</button>
      </ToolUsageTracker>,
    );

    expect(gtag).not.toHaveBeenCalled();
    act(() => {
      setAnalyticsConsent('allowed');
      window.gtag = gtag;
      announceAnalyticsReady();
      announceAnalyticsReady();
    });

    expect(gtag.mock.calls.filter((call) => call[1] === 'tool_view')).toEqual([
      ['event', 'tool_view', { tool: 'invoice-generator' }],
    ]);
  });

  it('does not duplicate a ready view during Strict Mode effect replay', () => {
    const gtag = vi.fn();
    setAnalyticsConsent('allowed');
    window.gtag = gtag;
    announceAnalyticsReady();

    render(
      <StrictMode>
        <ToolUsageTracker tool="invoice-generator">
          <button type="button">Create invoice</button>
        </ToolUsageTracker>
      </StrictMode>,
    );

    expect(gtag.mock.calls.filter((call) => call[1] === 'tool_view')).toHaveLength(1);
  });
});
