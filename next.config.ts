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
