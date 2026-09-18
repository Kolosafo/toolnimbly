'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { ToolIcon } from '@/components/ui/tool-icon';
import { searchTools, type SearchEntry } from '@/lib/registry/search-index';
import { cn } from '@/lib/utils/cn';

/**
 * Site search (spec §7.4).
 *
 * Implemented as a combobox over a listbox: arrow keys move the active option,
 * Enter navigates, Escape closes and returns focus to the trigger. Results are
 * grouped by category, and every result is a real link so it works without the
 * keyboard handling too.
 */
export function ToolSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Cmd/Ctrl+K is a convenience only — the visible trigger is the real control.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-md border border-border-default bg-surface px-3 text-sm text-muted transition-colors hover:text-foreground',
          className,
        )}
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Search tools</span>
        <span className="sr-only sm:hidden">Search tools</span>
        <kbd className="ml-2 hidden rounded border border-border-default px-1.5 py-0.5 font-mono text-[0.6875rem] lg:inline">
          ⌘K
        </kbd>
      </button>
      {open ? <SearchDialog onClose={close} /> : null}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const statusId = useId();

  const results = useMemo(() => searchTools(query, 8), [query]);

  // Reset the highlighted option whenever the query changes. Adjusted during
  // render rather than in an effect so the list never paints a stale highlight.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setActiveIndex(0);
  }

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      // Simple focus trap: the dialog holds only the input and the close
      // button, so keeping focus on the input is both correct and predictable.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), [tabindex="0"]',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (event.key === 'Enter') {
      const active = results[activeIndex];
      if (active) {
        event.preventDefault();
        onClose();
        router.push(`/tools/${active.slug}`);
      }
    }
  }

  const grouped = groupByCategory(results);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-[10vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border-default bg-surface shadow-lg"
      >
        <div className="flex items-center gap-2 border-b border-border-default px-3">
          <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={
              results.length > 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            aria-describedby={statusId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search 30 tools…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-12 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
            aria-label="Search tools"
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close search</span>
          </button>
        </div>

        <p id={statusId} role="status" aria-live="polite" className="sr-only">
          {query.trim()
            ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for ${query}`
            : 'Type to search tools'}
        </p>

        {/* tabIndex makes the scrollable results reachable by keyboard for
            anyone who cannot use the arrow keys to scroll it. */}
        <div tabIndex={0} className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <p className="px-4 py-6 text-sm text-muted">
              Start typing to find a calculator, converter or generator.
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">
              No tool matches “{query}”. Try a shorter word, such as “pdf”, “image” or “loan”.
            </p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label="Search results" className="py-2">
              {grouped.map(({ categoryName, entries }) => (
                <li key={categoryName} role="presentation">
                  <p
                    role="presentation"
                    className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-subtle uppercase"
                  >
                    {categoryName}
                  </p>
                  <ul role="presentation">
                    {entries.map((entry) => {
                      const index = results.indexOf(entry);
                      const active = index === activeIndex;
                      return (
                        <li key={entry.slug} role="presentation">
                          {/* role="option" sits on the link, not on a wrapping
                              <li>. An option must not contain an interactive
                              element — axe flags that as nested-interactive. */}
                          <Link
                            href={`/tools/${entry.slug}`}
                            id={`${listboxId}-option-${index}`}
                            role="option"
                            aria-selected={active}
                            onClick={onClose}
                            onMouseEnter={() => setActiveIndex(index)}
                            tabIndex={-1}
                            className={cn(
                              'flex items-start gap-3 px-4 py-2.5 transition-colors',
                              active ? 'bg-brand-surface' : 'hover:bg-surface-sunken',
                            )}
                          >
                            <ToolIcon name={entry.icon} className="mt-0.5 size-4 shrink-0 text-brand" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{entry.name}</span>
                              <span className="block truncate text-xs text-muted">
                                {entry.description}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function groupByCategory(entries: SearchEntry[]): { categoryName: string; entries: SearchEntry[] }[] {
  const groups = new Map<string, SearchEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.categoryName);
    if (existing) existing.push(entry);
    else groups.set(entry.categoryName, [entry]);
  }
  return [...groups.entries()].map(([categoryName, grouped]) => ({
    categoryName,
    entries: grouped,
  }));
}
