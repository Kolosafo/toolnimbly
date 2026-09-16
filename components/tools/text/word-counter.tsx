'use client';

import { useDeferredValue, useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { NumberField } from '@/components/forms/number-field';
import { CalculatorShell, ResultPanel } from '@/components/tool-shell/calculator-shell';
import { textLimits } from '@/lib/config/limits';
import { formatInteger, parseNumericInput } from '@/lib/formatting/number';
import { segmenterSupport } from '@/lib/text/segmentation';
import {
  analyseText,
  formatDuration,
  READING_RATE_DEFAULT,
  SPEAKING_RATE_DEFAULT,
} from '@/lib/text/word-counter';

export function WordCounter() {
  const [text, setText] = useState('');
  const [readingRate, setReadingRate] = useState(String(READING_RATE_DEFAULT));
  const [speakingRate, setSpeakingRate] = useState(String(SPEAKING_RATE_DEFAULT));

  // Keeps typing responsive on long documents: the textarea updates
  // immediately while the statistics recompute at a lower priority.
  const deferredText = useDeferredValue(text);
  const support = useMemo(() => segmenterSupport(), []);

  const overLimit = text.length > textLimits.maxCharacterCount;

  const stats = useMemo(
    () =>
      analyseText(deferredText, {
        readingRate: parseNumericInput(readingRate) ?? READING_RATE_DEFAULT,
        speakingRate: parseNumericInput(speakingRate) ?? SPEAKING_RATE_DEFAULT,
      }),
    [deferredText, readingRate, speakingRate],
  );

  const summary = [
    `Words: ${stats.words}`,
    `Characters: ${stats.charactersWithSpaces}`,
    `Sentences: ${stats.sentences}`,
    `Paragraphs: ${stats.paragraphs}`,
    `Reading time: ${formatDuration(stats.readingMinutes)}`,
    `Speaking time: ${formatDuration(stats.speakingMinutes)}`,
  ].join('\n');

  return (
    <CalculatorShell
      onReset={() => {
        setText('');
        setReadingRate(String(READING_RATE_DEFAULT));
        setSpeakingRate(String(SPEAKING_RATE_DEFAULT));
      }}
      results={
        <ResultPanel title="Text statistics">
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3">
              <Stat label="Words" value={formatInteger(stats.words)} primary />
              <Stat label="Characters" value={formatInteger(stats.charactersWithSpaces)} primary />
              <Stat
                label="Characters, no spaces"
                value={formatInteger(stats.charactersWithoutWhitespace)}
              />
              <Stat label="Sentences" value={formatInteger(stats.sentences)} />
              <Stat label="Paragraphs" value={formatInteger(stats.paragraphs)} />
              <Stat label="Reading time" value={formatDuration(stats.readingMinutes)} />
              <Stat label="Speaking time" value={formatDuration(stats.speakingMinutes)} />
            </dl>

            {stats.keywords.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium">Most frequent words</h3>
                <p className="mt-1 text-xs text-muted">
                  Approximate. Common filler words are excluded and there is no stemming.
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {stats.keywords.map((keyword) => (
                    <li
                      key={keyword.word}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface px-3 py-1 text-xs"
                    >
                      <span>{keyword.word}</span>
                      <span className="tabular font-semibold text-brand">{keyword.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <CopyButton value={summary} label="Copy statistics" disabled={stats.words === 0} />

            {!support.words ? (
              <p className="rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-xs">
                This browser does not provide Unicode word segmentation, so counts fall back to
                splitting on spaces. That is less accurate for languages written without spaces
                between words.
              </p>
            ) : null}
          </div>
        </ResultPanel>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="word-counter-input" className="text-sm font-medium">
          Your text
        </label>
        <textarea
          id="word-counter-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={14}
          spellCheck={false}
          aria-describedby="word-counter-help"
          placeholder="Paste or type your text here. The statistics update as you go."
          className="min-h-56 w-full rounded-md border border-border-strong bg-surface p-3 font-sans text-base leading-relaxed placeholder:text-subtle"
        />
        <p id="word-counter-help" className="text-xs text-muted">
          Your text stays in this page. It is never uploaded, stored or logged.
        </p>
        {overLimit ? (
          <p role="alert" className="text-xs text-danger">
            This text is longer than {formatInteger(textLimits.maxCharacterCount)} characters.
            Counts may become slow.
          </p>
        ) : null}
      </div>

      <fieldset className="border-t border-border-default pt-4">
        <legend className="text-sm font-medium">Reading and speaking rates</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Reading rate"
            value={readingRate}
            onChange={setReadingRate}
            unit="wpm"
          />
          <NumberField
            label="Speaking rate"
            value={speakingRate}
            onChange={setSpeakingRate}
            unit="wpm"
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Defaults are 200 words a minute for silent reading and 130 for speaking aloud.
        </p>
      </fieldset>
    </CalculatorShell>
  );
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <div className="rounded-md border border-border-default bg-surface p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`tabular mt-0.5 font-semibold ${primary ? 'text-2xl' : 'text-lg'}`}>{value}</dd>
    </div>
  );
}
