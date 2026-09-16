'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ToolIcon } from '@/components/ui/tool-icon';
import { cn } from '@/lib/utils/cn';

export type NavCategory = {
  slug: string;
  name: string;
  icon: string;
  toolCount: number;
};

/**
 * Mobile navigation. The panel is a modal dialog: focus moves into it, Escape
 * closes it and returns focus to the trigger, and background scrolling is
 * locked while it is open.
 */
export function MobileNav({ categories }: { categories: readonly NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on navigation so the panel never persists across a route change.
  // Adjusting state during render is React's documented pattern for reacting
  // to a prop change; an effect here would cause a cascading second render.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex size-11 items-center justify-center rounded-md text-foreground md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
        <span className="sr-only">Open menu</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                close();
              }
            }}
            className="ml-auto flex h-full w-[min(20rem,85vw)] flex-col bg-surface shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <p className="text-sm font-semibold">Browse tools</p>
              <button
                type="button"
                onClick={close}
                className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Close menu</span>
              </button>
            </div>

            <nav aria-label="Categories" className="flex-1 overflow-y-auto p-2">
              <ul>
                {categories.map((category) => {
                  const active = pathname === `/${category.slug}`;
                  return (
                    <li key={category.slug}>
                      <Link
                        href={`/${category.slug}`}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm',
                          active ? 'bg-brand-surface font-medium' : 'hover:bg-surface-sunken',
                        )}
                      >
                        <ToolIcon name={category.icon} className="size-4 text-brand" />
                        <span className="flex-1">{category.name}</span>
                        <span className="text-xs text-subtle">{category.toolCount}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <hr className="my-2 border-border-default" />

              <ul>
                {[
                  { href: '/about', label: 'About' },
                  { href: '/privacy', label: 'Privacy' },
                  { href: '/terms', label: 'Terms' },
                  { href: '/contact', label: 'Contact' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-sunken hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
