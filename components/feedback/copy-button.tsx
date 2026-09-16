'use client';

import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils/cn';

type CopyState = 'idle' | 'copied' | 'error';

/**
 * Copies text to the clipboard with a non-colour-only confirmation (spec §5.3).
 *
 * The status change is announced politely, and a failure is reported rather
 * than swallowed — the Clipboard API rejects without a user gesture, in some
 * embedded browsers, and over plain HTTP.
 */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  className,
  size = 'md',
  disabled,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const [state, setState] = useState<CopyState>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function copy() {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('error');
    }
    timerRef.current = setTimeout(() => setState('idle'), 2400);
  }

  const Icon = state === 'copied' ? Check : state === 'error' ? TriangleAlert : Copy;

  return (
    <>
      <button
        type="button"
        onClick={copy}
        disabled={disabled || value.length === 0}
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 font-medium transition-colors',
          'hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-55',
          size === 'sm' ? 'text-xs' : 'text-sm',
          state === 'copied' && 'border-success-border bg-success-surface',
          state === 'error' && 'border-danger-border bg-danger-surface',
          className,
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {state === 'copied' ? copiedLabel : state === 'error' ? 'Copy failed' : label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied'
          ? `${copiedLabel} to clipboard`
          : state === 'error'
            ? 'Could not copy to the clipboard. Select the text and copy it manually.'
            : ''}
      </span>
    </>
  );
}
