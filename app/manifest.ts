import type { MetadataRoute } from 'next';

import { site } from '@/lib/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.shortName,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f8f9',
    theme_color: '#0e7490',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
