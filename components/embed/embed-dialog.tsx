'use client';

import { Code2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { Button } from '@/components/ui/button';
import type { EmbedTheme } from '@/lib/embed/snippet';

const THEMES: readonly { value: EmbedTheme; label: string; hint: string }[] = [
  { value: 'auto', label: 'Match the visitor', hint: "Follows each visitor's own light or dark setting" },
  { value: 'light', label: 'Always light', hint: 'Fixed light appearance' },
  { value: 'dark', label: 'Always dark', hint: 'Fixed dark appearance' },
];

/**
 * "Embed this tool" (SEO brief §7).
 *
 * The snippets are built on the server and passed in already rendered, one per
 * theme, so the dialog never has to know the site's canonical origin and the
 * copied text is identical to what the page was generated with.
 *
 * Built on the native `<dialog>` element: it gives the focus trap, the Escape
 * handling and the inert background for free, which a hand-rolled modal gets
 * wrong far more often than it gets right.
 */
export function EmbedDialog({
  toolName,
  snippets,
}: {
  toolName: string;
  snippets: Record<EmbedTheme, string>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<EmbedTheme>('auto');

  const snippet = snippets[theme];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Code2 className="size-4 shrink-0" aria-hidden="true" />
        Embed this tool
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="embed-dialog-title"
        // `close` also fires for Escape and for the backdrop, so the React
        // state cannot drift out of step with the element's own open state.
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // A click landing on the dialog element itself is a backdrop click:
          // the content is in a child, so it would have been the target.
          if (event.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[min(42rem,calc(100vw-2rem))] rounded-xl border border-border-default bg-surface p-0 text-foreground backdrop:bg-black/50"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="embed-dialog-title" className="text-lg font-semibold">
                Embed the {toolName}
              </h2>
              <p className="measure mt-1 text-sm text-muted">
                Paste this into any page. The tool runs in place, and the credit line below it links
                back here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-surface-sunken"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">Appearance</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEMES.map((option) => (
                <label
                  key={option.value}
                  title={option.hint}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${
                    theme === option.value
                      ? 'border-brand-border bg-brand-surface font-medium'
                      : 'border-border-default bg-surface hover:bg-surface-sunken'
                  }`}
                >
                  <input
                    type="radio"
                    name="embed-theme"
                    value={option.value}
                    checked={theme === option.value}
                    onChange={() => setTheme(option.value)}
                    className="size-4 accent-[var(--color-brand)]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="embed-snippet" className="mt-5 block text-sm font-medium">
            Embed code
          </label>
          <textarea
            id="embed-snippet"
            readOnly
            rows={8}
            value={snippet}
            onFocus={(event) => event.currentTarget.select()}
            spellCheck={false}
            className="mt-2 w-full resize-y rounded-lg border border-border-default bg-surface-sunken p-3 font-mono text-xs leading-relaxed"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CopyButton value={snippet} label="Copy embed code" copiedLabel="Copied" />
            <p className="text-xs text-muted">
              Adjust <code className="font-mono">height</code> if your layout needs it.
            </p>
          </div>

          <p className="measure mt-4 border-t border-border-default pt-4 text-xs text-muted">
            Please keep the &ldquo;Powered by&rdquo; line. It is the only thing we ask in return, and
            it is what keeps the tool free to embed.
          </p>
        </div>
      </dialog>
    </>
  );
}
