import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

describe('Marble image hosts', () => {
  /*
   * Two lists have to agree or images break, and each breaks silently in its
   * own way:
   *
   *   next.config.ts remotePatterns governs which hosts `next/image` will
   *   optimise. A missing host returns HTTP 400
   *   (INVALID_IMAGE_OPTIMIZE_REQUEST) — the page renders, the image does not,
   *   and nothing is logged server-side.
   *
   *   CSP img-src governs whether the browser fetches the bytes at all. That
   *   matters for raw <img> tags inside CMS-authored post bodies, which bypass
   *   the optimiser entirely. A missing host shows nothing and logs only a
   *   console violation.
   *
   * Production shipped allowing `images.` and `media.` while Marble actually
   * served from `cdn.`, so every cover image on every post 400'd. These keep
   * the two lists in step.
   */
  const configuredHosts = [
    ...readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8').matchAll(
      /hostname: '([^']+)'/g,
    ),
  ].map((match) => match[1]!);

  const marbleHosts = configuredHosts.filter((host) => host.endsWith('marblecms.com'));

  it('allows the host Marble actually serves from', () => {
    expect(configuredHosts).toContain('cdn.marblecms.com');
  });

  it('permits every configured Marble host in the CSP when the blog is on', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_ENABLED', 'true');

    const imgSrc =
      buildContentSecurityPolicy(false)
        .split(';')
        .map((directive) => directive.trim())
        .find((directive) => directive.startsWith('img-src')) ?? '';

    expect(marbleHosts.length).toBeGreaterThan(0);
    for (const host of marbleHosts) {
      expect(imgSrc, `img-src is missing ${host}`).toContain(`https://${host}`);
    }
  });

  it('names no Marble host while the blog is off', () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_ENABLED', 'false');
    expect(buildContentSecurityPolicy(false)).not.toContain('marblecms.com');
  });
});
