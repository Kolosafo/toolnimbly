import type { NextConfig } from 'next';

import { securityHeaders } from './lib/config/security-headers';

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require('@next/bundle-analyzer') as (o: { enabled: boolean }) => (c: NextConfig) => NextConfig)({
        enabled: true,
      })
    : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    /*
     * Marble serves post cover images and in-content media from its own hosts.
     * Without these patterns `next/image` throws at runtime rather than
     * degrading, so the blog is unusable the moment a post has a cover.
     */
    remotePatterns: [
      /*
       * `cdn.` is the host Marble actually serves from — verified against live
       * post content, where every cover and in-content image is a
       * cdn.marblecms.com URL. The integration guide named `images.` and
       * `media.`, and production used neither: every image returned
       * INVALID_IMAGE_OPTIMIZE_REQUEST (HTTP 400) until this was added.
       *
       * The other two are kept because they cost nothing and the guide's
       * project evidently used them; if Marble moves hosts again the symptom
       * is the same 400, so check this list first.
       */
      { protocol: 'https', hostname: 'cdn.marblecms.com' },
      { protocol: 'https', hostname: 'images.marblecms.com' },
      { protocol: 'https', hostname: 'media.marblecms.com' },
    ],
  },
  poweredByHeader: false,
  // A consistent trailing-slash policy (spec §8.1): no trailing slash anywhere.
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/embed/:path*',
        headers: securityHeaders({ embeddable: true }),
      },
      {
        /*
         * Everything except `/embed`. The exclusion is explicit rather than
         * relying on rule order: Next.js applies *every* matching rule, so a
         * plain `/:path*` catch-all would also match the embed routes and
         * re-add the framing headers the rule above deliberately drops.
         */
        source: '/:path((?!embed$|embed/).*)',
        headers: securityHeaders(),
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
