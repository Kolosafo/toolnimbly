'use client';

import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { SelectField } from '@/components/forms/select-field';
import { CalculatorShell, ResultPanel } from '@/components/tool-shell/calculator-shell';
import { downloadText } from '@/lib/download/file';
import { CASE_LABELS, CASE_MODES, convertCase, type CaseMode } from '@/lib/text/case-converter';
import { cn } from '@/lib/utils/cn';

/** Locales where casing rules differ from the default in a way that matters. */
const LOCALE_OPTIONS = [
  { value: 'browser', label: 'Browser default' },
  { value: 'en', label: 'English (en)' },
  { value: 'tr', label: 'Turkish (tr) — dotted and dotless i' },
  { value: 'az', label: 'Azerbaijani (az) — dotted and dotless i' },
  { value: 'lt', label: 'Lithuanian (lt) — accented i' },
  { value: 'de', label: 'German (de) — sharp s' },
  { value: 'el', label: 'Greek (el) — final sigma' },
];

export function CaseConverter() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<CaseMode>('title');
  const [locale, setLocale] = useState('browser');

  const effectiveLocale = locale === 'browser' ? undefined : locale;

  // Every mode is previewed, so you can see what a convention does before
  // committing to it.
  const previews = useMemo(
    () =>
      CASE_MODES.map((candidate) => ({
        mode: candidate,
        label: CASE_LABELS[candidate],
        output: convertCase(text, candidate, effectiveLocale),
      })),
    [text, effectiveLocale],
  );

  const output = previews.find((preview) => preview.mode === mode)?.output ?? '';

  return (
    <CalculatorShell
      onReset={() => {
        setText('');
        setMode('title');
        setLocale('browser');
      }}
      results={
        <ResultPanel title="Converted text">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted">{CASE_LABELS[mode]}</p>
              <p className="mt-2 max-h-64 overflow-auto rounded-md border border-border-default bg-surface p-3 text-base break-words whitespace-pre-wrap">
                {output || <span className="text-subtle">Converted text appears here.</span>}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <CopyButton value={output} label="Copy result" />
              <button
                type="button"
                onClick={() => downloadText(output, `converted-${mode}`, 'txt')}
                disabled={output.length === 0}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Download className="size-4" aria-hidden="true" />
                Download .txt
              </button>
            </div>

            <p className="text-xs text-muted">
              Your original text is untouched in the field on the left, so a conversion is never
              destructive.
            </p>
          </div>
        </ResultPanel>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="case-converter-input" className="text-sm font-medium">
          Original text
        </label>
        <textarea
          id="case-converter-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={8}
          spellCheck={false}
          placeholder="Paste or type your text here."
          className="min-h-36 w-full rounded-md border border-border-strong bg-surface p-3 text-base leading-relaxed placeholder:text-subtle"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Choose a case</legend>
        <div className="mt-2 grid gap-2">
          {previews.map((preview) => {
            const selected = preview.mode === mode;
            return (
              <label
                key={preview.mode}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-md border p-3 transition-colors',
                  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus-ring)]',
                  selected
                    ? 'border-brand-border bg-brand-surface'
                    : 'border-border-default bg-surface hover:border-border-strong',
                )}
              >
                <input
                  type="radio"
                  name="case-mode"
                  value={preview.mode}
                  checked={selected}
                  onChange={() => setMode(preview.mode)}
                  className="mt-0.5 size-4 shrink-0 accent-[color:var(--brand)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm font-medium">{preview.label}</span>
                  {text ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {preview.output}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <SelectField
        label="Locale"
        value={locale}
        onChange={setLocale}
        options={LOCALE_OPTIONS}
        helper="Casing is language-specific. In Turkish, lowercase i uppercases to İ rather than I."
      />
    </CalculatorShell>
  );
}
