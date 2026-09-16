'use client';

import { Download, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { NumberField } from '@/components/forms/number-field';
import { SwitchField } from '@/components/forms/switch-field';
import { CalculatorShell, ResultPanel } from '@/components/tool-shell/calculator-shell';
import {
  DEFAULT_UUID_FORMAT,
  formatUuid,
  generateUuids,
  UUID_QUANTITY,
  type UuidFormatOptions,
} from '@/lib/crypto/uuid';
import { downloadText } from '@/lib/download/file';
import { parseNumericInput } from '@/lib/formatting/number';

export function UuidGenerator() {
  const [quantityInput, setQuantityInput] = useState(String(UUID_QUANTITY.default));
  const [format, setFormat] = useState<UuidFormatOptions>(DEFAULT_UUID_FORMAT);
  const [uuids, setUuids] = useState<string[]>([]);

  const quantity = parseNumericInput(quantityInput) ?? UUID_QUANTITY.default;

  const regenerate = useCallback((count: number) => {
    setUuids(generateUuids(count));
  }, []);

  /*
   * Web Crypto is a browser capability, so generation happens after mount.
   * Server-rendering these values would produce a hydration mismatch and would
   * mean identifiers were minted somewhere other than the user's device.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    regenerate(quantity);
  }, [quantity, regenerate]);

  const formatted = uuids.map((uuid) => formatUuid(uuid, format));
  const text = formatted.join('\n');

  function update<K extends keyof UuidFormatOptions>(key: K, value: UuidFormatOptions[K]) {
    setFormat((current) => ({ ...current, [key]: value }));
  }

  return (
    <CalculatorShell
      onReset={() => {
        setQuantityInput(String(UUID_QUANTITY.default));
        setFormat(DEFAULT_UUID_FORMAT);
      }}
      results={
        <ResultPanel title="Generated UUIDs">
          {formatted.length === 0 ? (
            // Generation happens after mount because Web Crypto is a browser
            // capability, so there is a brief moment with nothing to show.
            // Saying "0 UUIDs" here would be misleading.
            <p className="py-6 text-sm text-muted">Generating…</p>
          ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {formatted.length} {formatted.length === 1 ? 'UUID' : 'UUIDs'}, version 4
            </p>

            <pre className="max-h-80 overflow-auto rounded-md border border-border-default bg-surface p-3 font-mono text-sm">
              <code>{text}</code>
            </pre>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => regenerate(quantity)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-hover"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Generate new
              </button>
              <CopyButton value={text} label="Copy all" />
              <button
                type="button"
                onClick={() => downloadText(text, 'uuids', 'txt')}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken"
              >
                <Download className="size-4" aria-hidden="true" />
                Download .txt
              </button>
            </div>
          </div>
          )}
        </ResultPanel>
      }
    >
      <NumberField
        label="How many"
        value={quantityInput}
        onChange={setQuantityInput}
        helper={`Between ${UUID_QUANTITY.min} and ${UUID_QUANTITY.max} per batch.`}
      />

      <fieldset className="space-y-3 border-t border-border-default pt-4">
        <legend className="text-sm font-medium">Formatting</legend>
        <p className="text-xs text-muted">
          Applied after generation as presentation only. The underlying value is always a valid
          version 4 UUID.
        </p>
        <SwitchField
          label="Uppercase"
          checked={format.uppercase}
          onChange={(value) => update('uppercase', value)}
        />
        <SwitchField
          label="Wrap in braces"
          checked={format.braces}
          onChange={(value) => update('braces', value)}
        />
        <SwitchField
          label="Include hyphens"
          checked={format.hyphens}
          onChange={(value) => update('hyphens', value)}
          helper="Turn off for systems that store UUIDs as 32 hex characters."
        />
      </fieldset>
    </CalculatorShell>
  );
}
