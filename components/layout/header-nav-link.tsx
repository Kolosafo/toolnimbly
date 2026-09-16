'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * A header link that marks itself as the current page. Split into its own
 * client component so the header itself stays a Server Component.
 */
export function HeaderNavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors',
        active ? 'bg-brand-surface font-medium text-foreground' : 'text-muted hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
