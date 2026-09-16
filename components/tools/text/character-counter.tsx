'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { NumberField } from '@/components/forms/number-field';
import { CalculatorShell, ResultPanel } from '@/components/tool-shell/calculator-shell';
import { formatInteger, parseNumericInput } from '@/lib/formatting/number';
import {
  countGraphemes,
  countLines,
  countParagraphs,
  segmenterSupport,
  utf8ByteLength,
} from '@/lib/text/segmentation';
import { cn } from '@/lib/utils/cn';

export function CharacterCounter() {
  const [text, setText] = useState('');
  const [limitInput, setLimitInput] = useState('');

  const deferredText = useDeferredValue(text);
  const support = useMemo(() => segmenterSupport(), []);
  const limit = parseNumericInput(limitInput);

  const stats = useMemo(() => {
    const graphemes = countGraphemes(deferredText);
    return {
      graphemes,
      utf16: deferredText.length,
      withoutWhitespace: countGraphemes(deferredText.replace(/\s/g, '')),
      bytes: utf8ByteLength(deferredText),
      lines: countLines(deferredText),
      paragraphs: countParagraphs(deferredText),
    };
  }, [deferredText]);

  const remaining = limit !== null ? limit - stats.graphemes : null;
  const isOver = remaining !== null && remaining < 0;

  return (
    <CalculatorShell
      onReset={() => {
        setText('');
        setLimitInput('');
      }}
      results={
        <ResultPanel title="Character counts">
          <div className="space-y-4">
            {limit !== null && remaining !== null ? (
              <div
                className={cn(
                  'rounded-md border p-3',
                  isOver
                    ? 'border-danger-border bg-danger-surface'
                    : 'border-success-border bg-success-surface',
                )}
              >
                <p className="text-sm font-medium">
                  {isOver
                    ? `${formatInteger(Math.abs(remaining))} over the limit`
                    : `${formatInteger(remaining)} characters remaining`}
                </p>
                <p className="tabular mt-1 text-xs">
                  {formatInteger(stats.graphemes)} of {formatInteger(limit)}
                </p>
              </div>
            ) : null}

            <dl className="space-y-3">
              <Row
                label="Visible characters"
                value={formatInteger(stats.graphemes)}
                hint="What a reader perceives as one character"
                primary
              />
              <Row
                label="Technical length"
                value={formatInteger(stats.utf16)}
                hint="UTF-16 code units, what most programming languages report"
              />
              <Row
                label="UTF-8 bytes"
                value={formatInteger(stats.bytes)}
                hint="What storage and network limits measure"
              />
              <Row
                label="Excluding whitespace"
                value={formatInteger(stats.withoutWhitespace)}
              />
              <Row label="Lines" value={formatInteger(stats.lines)} />
              <Row label="Paragraphs" value={formatInteger(stats.paragraphs)} />
            </dl>

            {stats.graphemes !== stats.utf16 ? (
              <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-xs">
                The visible and technical counts differ here, which means your text contains emoji,
                accented characters or other sequences that software measures differently from
                people. If a form rejects text that looks within its limit, this is usually why.
              </p>
            ) : null}

            <CopyButton
              value={`Visible characters: ${stats.graphemes}\nTechnical length: ${stats.utf16}\nUTF-8 bytes: ${stats.bytes}`}
              label="Copy counts"
              disabled={stats.graphemes === 0}
            />

            {!support.graphemes ? (
              <p className="rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-xs">
                This browser does not provide Unicode grapheme segmentation, so the visible count
                falls back to counting code points. Emoji sequences will be counted as several
                characters.
              </p>
            ) : null}
          </div>
        </ResultPanel>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="character-counter-input" className="text-sm font-medium">
          Your text
        </label>
        <textarea
          id="character-counter-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={14}
          spellCheck={false}
          aria-describedby="character-counter-help"
          placeholder="Paste or type your text here."
          className="min-h-56 w-full rounded-md border border-border-strong bg-surface p-3 font-sans text-base leading-relaxed placeholder:text-subtle"
        />
        <p id="character-counter-help" className="text-xs text-muted">
          Held in memory only. Never uploaded, never stored.
        </p>
      </div>

      <NumberField
        label="Character limit (optional)"
        value={limitInput}
        onChange={setLimitInput}
        helper="Enter the limit your platform enforces to track how much room is left."
      />
    </CalculatorShell>
  );
}

function Row({
  label,
  value,
  hint,
  primary,
}: {
  label: string;
  value: string;
  hint?: string;
  primary?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-default pb-2 last:border-0">
      <dt className="text-sm">
        <span className={primary ? 'font-medium' : undefined}>{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-subtle">{hint}</span> : null}
      </dt>
      <dd className={cn('tabular font-semibold', primary ? 'text-2xl' : 'text-base')}>{value}</dd>
    </div>
  );
}
