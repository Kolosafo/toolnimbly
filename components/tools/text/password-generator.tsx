'use client';

import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { InlineError } from '@/components/feedback/inline-error';
import { SwitchField } from '@/components/forms/switch-field';
import { CalculatorShell, ResultPanel } from '@/components/tool-shell/calculator-shell';
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  PASSWORD_LENGTH,
  type PasswordOptions,
  type PasswordResult,
} from '@/lib/crypto/password';
import { cn } from '@/lib/utils/cn';

const STRENGTH_STYLES: Record<string, string> = {
  'very weak': 'border-danger-border bg-danger-surface',
  weak: 'border-danger-border bg-danger-surface',
  fair: 'border-warning-border bg-warning-surface',
  strong: 'border-success-border bg-success-surface',
  'very strong': 'border-success-border bg-success-surface',
};

export function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [result, setResult] = useState<PasswordResult | null>(null);
  const [revealed, setRevealed] = useState(false);

  const regenerate = useCallback((next: PasswordOptions) => {
    setResult(generatePassword(next));
  }, []);

  /*
   * Generate once on mount, and again whenever the settings change.
   *
   * This has to be an effect. The value comes from the operating system's
   * random source through Web Crypto, which is a browser capability, and a
   * password must never be server-rendered — a server-generated value would
   * either mismatch on hydration or, worse, mean the secret existed outside the
   * user's device. One extra render on mount is the correct trade.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    regenerate(options);
  }, [options, regenerate]);

  function update<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }));
  }

  const password = result?.ok ? result.password : '';

  return (
    <CalculatorShell
      onReset={() => {
        setOptions(DEFAULT_PASSWORD_OPTIONS);
        setRevealed(false);
      }}
      results={
        <ResultPanel title="Generated password">
          {result === null ? (
            <p className="py-6 text-sm text-muted">Generating…</p>
          ) : result.ok ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted">Your password</p>
                <p
                  className={cn(
                    'mt-2 rounded-md border border-border-default bg-surface p-3 font-mono text-lg break-all',
                    !revealed && 'select-none',
                  )}
                >
                  {revealed ? password : '•'.repeat(password.length)}
                </p>
                {/* Announced separately rather than nested inside the password
                    element, so the element's text is only ever the password or
                    its mask. */}
                <p className="sr-only">
                  {revealed
                    ? 'Password revealed.'
                    : 'Password hidden. Use the reveal button to show it.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => regenerate(options)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-hover"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Generate new
                </button>
                <button
                  type="button"
                  onClick={() => setRevealed((value) => !value)}
                  aria-pressed={revealed}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken"
                >
                  {revealed ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                  {revealed ? 'Hide' : 'Reveal'}
                </button>
                <CopyButton value={password} label="Copy password" />
              </div>

              <div className={cn('rounded-md border p-3 text-sm', STRENGTH_STYLES[result.strength])}>
                <p className="font-medium">Strength: {result.strength}</p>
                <p className="mt-1">
                  About {Math.round(result.entropyBits)} bits of entropy, from an alphabet of{' '}
                  {result.alphabetSize} characters at {options.length} characters long.
                </p>
                <p className="mt-2 text-xs">
                  This describes these settings, not your overall security. It cannot know whether a
                  site stores passwords badly or whether you reuse this one elsewhere.
                </p>
              </div>
            </div>
          ) : (
            <InlineError message={result.error} />
          )}
        </ResultPanel>
      }
    >
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="password-length" className="text-sm font-medium">
            Length
          </label>
          <output
            htmlFor="password-length"
            className="tabular text-sm font-semibold"
            aria-live="polite"
          >
            {options.length} characters
          </output>
        </div>
        <input
          id="password-length"
          type="range"
          min={PASSWORD_LENGTH.min}
          max={PASSWORD_LENGTH.max}
          step={1}
          value={options.length}
          onChange={(event) => update('length', Number(event.target.value))}
          className="mt-3 h-11 w-full accent-[color:var(--brand)]"
        />
        <p className="text-xs text-muted">
          {PASSWORD_LENGTH.min} to {PASSWORD_LENGTH.max}. Length buys more than complexity does.
        </p>
      </div>

      <fieldset className="space-y-3 border-t border-border-default pt-4">
        <legend className="text-sm font-medium">Character sets</legend>
        <SwitchField
          label="Lowercase (a–z)"
          checked={options.lowercase}
          onChange={(value) => update('lowercase', value)}
        />
        <SwitchField
          label="Uppercase (A–Z)"
          checked={options.uppercase}
          onChange={(value) => update('uppercase', value)}
        />
        <SwitchField
          label="Numbers (0–9)"
          checked={options.numbers}
          onChange={(value) => update('numbers', value)}
        />
        <SwitchField
          label="Symbols (!@#$…)"
          checked={options.symbols}
          onChange={(value) => update('symbols', value)}
        />
      </fieldset>

      <fieldset className="space-y-3 border-t border-border-default pt-4">
        <legend className="text-sm font-medium">Options</legend>
        <SwitchField
          label="Exclude ambiguous characters"
          checked={options.excludeAmbiguous}
          onChange={(value) => update('excludeAmbiguous', value)}
          helper="Removes characters that are easy to confuse in print, such as I, l, 1, O and 0."
        />
        <SwitchField
          label="Require one from every selected set"
          checked={options.requireEachSet}
          onChange={(value) => update('requireEachSet', value)}
          helper="Guarantees the password satisfies sites that demand one of each type."
        />
      </fieldset>
    </CalculatorShell>
  );
}
