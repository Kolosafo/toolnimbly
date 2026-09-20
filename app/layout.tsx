import type { Metadata, Viewport } from 'next';

import { isIndexable, site } from '@/lib/config/site';

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

/**
 * The document shell, and nothing else.
 *
 * Navigation, the main landmark and the site-wide structured data live in
 * `SiteChrome`, applied by the `(site)` group layout. That keeps them off the
 * embed routes, which are framed on other domains and must carry no site
 * navigation of their own.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
