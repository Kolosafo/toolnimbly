import type { Metadata, Viewport } from 'next';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SkipLink } from '@/components/layout/skip-link';
import { JsonLd } from '@/components/seo/json-ld';
import { isIndexable, site } from '@/lib/config/site';
import { organizationSchema, websiteSchema } from '@/lib/seo/structured-data';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: { telephone: false, address: false, email: false },
  robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

/**
 * Applied before first paint so an explicit theme choice does not flash the
 * system theme first. It is deliberately tiny, guarded, and touches nothing but
 * the root element's `data-theme` attribute.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('toolnimbly:theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <JsonLd data={[websiteSchema(), organizationSchema()]} />
      </body>
    </html>
  );
}
