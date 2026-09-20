import { SiteChrome } from '@/components/layout/site-chrome';

/**
 * Every visitor-facing page on the site itself. The embed routes deliberately
 * sit outside this group so they render without navigation.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
