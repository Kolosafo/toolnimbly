import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildContentSecurityPolicy } from '@/lib/config/security-headers';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('analytics content security policy', () => {
  it('keeps all Google origins out of the default policy', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'false');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'none');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_SITE_ID', '');

    const policy = buildContentSecurityPolicy(false);
    expect(policy).not.toContain('googletagmanager.com');
    expect(policy).not.toContain('google-analytics.com');
  });

  it('adds only the required GA4 origins when analytics is explicitly enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'ga4');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_SITE_ID', 'G-TEST123');

    const policy = buildContentSecurityPolicy(false);
    expect(policy).toContain('https://www.googletagmanager.com');
    expect(policy).toContain('https://www.google-analytics.com');
    expect(policy).toContain('https://region1.google-analytics.com');
  });

  it('never loads analytics inside third-party embeds', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_ENABLED', 'true');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_PROVIDER', 'ga4');
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_SITE_ID', 'G-TEST123');

    const policy = buildContentSecurityPolicy(false, true);
    expect(policy).not.toContain('googletagmanager.com');
    expect(policy).not.toContain('google-analytics.com');
    expect(policy).toContain('frame-ancestors *');
  });
});
