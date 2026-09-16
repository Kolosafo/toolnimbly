'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils/cn';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'toolnimbly:theme';
const CHANGE_EVENT = 'toolnimbly:themechange';

const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

/**
 * The stored preference is external state, so it is read through
 * `useSyncExternalStore` rather than mirrored into component state. This keeps
 * the server snapshot ("system") stable for hydration and picks up changes made
 * in another tab for free.
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage unavailable (private mode, blocked site data). The system
    // preference is the correct fallback and the page still works.
  }
  return 'system';
}

/** The server cannot know the preference; "system" matches the pre-paint script. */
function getServerSnapshot(): Theme {
  return 'system';
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function select(next: Theme): void {
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The preference simply will not persist across reloads.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="inline-flex items-center rounded-full border border-border-default bg-surface p-0.5"
    >
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            aria-pressed={active}
            title={`${label} theme`}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full transition-colors',
              active ? 'bg-brand text-brand-contrast' : 'text-muted hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="sr-only">{label} theme</span>
          </button>
        );
      })}
    </div>
  );
}
