import Link from 'next/link';

import { MobileNav, type NavCategory } from '@/components/layout/mobile-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ToolSearch } from '@/components/navigation/tool-search';
import { Container } from '@/components/ui/container';
import { site } from '@/lib/config/site';
import { orderedCategories, toolsInCategory } from '@/lib/registry';

import { HeaderNavLink } from './header-nav-link';

export function SiteHeader() {
  const navCategories: NavCategory[] = orderedCategories().map((category) => ({
    slug: category.slug,
    name: category.name,
    icon: category.icon,
    toolCount: toolsInCategory(category.slug).length,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-border-default bg-background/90 backdrop-blur-sm">
      <Container>
        <div className="flex min-h-16 items-center gap-3">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-2 text-base font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-contrast"
            >
              T
            </span>
            <span>{site.name}</span>
          </Link>

          <nav aria-label="Tool categories" className="hidden flex-1 md:block">
            <ul className="flex items-center gap-1">
              {orderedCategories().map((category) => (
                <li key={category.slug}>
                  <HeaderNavLink href={`/${category.slug}`}>{category.shortName}</HeaderNavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ToolSearch />
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <MobileNav categories={navCategories} />
          </div>
        </div>
      </Container>
    </header>
  );
}
