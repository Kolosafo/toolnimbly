import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { site } from '@/lib/config/site';
import { orderedCategories, toolsInCategory } from '@/lib/registry';

const legalLinks = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
];

export function SiteFooter() {
  const currentYear = new Date().getUTCFullYear();
  const yearRange =
    currentYear > site.foundedYear ? `${site.foundedYear}–${currentYear}` : `${site.foundedYear}`;

  return (
    <footer className="mt-16 border-t border-border-default bg-surface-sunken">
      <Container>
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span
                aria-hidden="true"
                className="inline-flex size-6 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-contrast"
              >
                T
              </span>
              {site.name}
            </p>
            <p className="mt-3 max-w-xs text-sm text-muted">{site.tagline}</p>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              <span>
                Files and text are processed on your device. Nothing you enter is uploaded to a
                server.
              </span>
            </p>
          </div>

          {orderedCategories()
            .slice(0, 3)
            .map((category) => (
              <nav key={category.slug} aria-labelledby={`footer-${category.slug}`}>
                <h2 id={`footer-${category.slug}`} className="text-sm font-semibold">
                  <Link
                    href={`/${category.slug}`}
                    className="inline-flex min-h-11 items-center hover:text-brand"
                  >
                    {category.name}
                  </Link>
                </h2>
                <ul className="mt-3 space-y-2">
                  {toolsInCategory(category.slug)
                    .slice(0, 6)
                    .map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="text-sm text-muted hover:text-foreground"
                        >
                          {tool.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </nav>
            ))}
        </div>

        <div className="grid gap-6 border-t border-border-default py-6 sm:grid-cols-2">
          {orderedCategories()
            .slice(3)
            .map((category) => (
              <nav key={category.slug} aria-labelledby={`footer-${category.slug}`}>
                <h2 id={`footer-${category.slug}`} className="text-sm font-semibold">
                  <Link
                    href={`/${category.slug}`}
                    className="inline-flex min-h-11 items-center hover:text-brand"
                  >
                    {category.name}
                  </Link>
                </h2>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {toolsInCategory(category.slug).map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="text-sm text-muted hover:text-foreground"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-border-default py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © {yearRange} {site.legalEntity || site.name}. All rights reserved.
          </p>
          <nav aria-label="Legal and company">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
