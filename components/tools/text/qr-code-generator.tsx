'use client';

import { Download, TriangleAlert } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { InlineError } from '@/components/feedback/inline-error';
import { Field, controlClasses } from '@/components/forms/field';
import { NumberField } from '@/components/forms/number-field';
import { SegmentedControl } from '@/components/forms/segmented-control';
import { SelectField } from '@/components/forms/select-field';
import { SwitchField } from '@/components/forms/switch-field';
import { CalculatorShell, ResultPanel } from '@/components/tool-shell/calculator-shell';
import { downloadBlob, downloadText } from '@/lib/download/file';
import { parseNumericInput } from '@/lib/formatting/number';
import {
  buildQrPayload,
  checkQrColours,
  QR_ERROR_CORRECTION,
  type QrErrorCorrection,
  type QrMode,
  type QrPayloadInput,
  type WifiEncryption,
} from '@/lib/qr/payloads';

const MODE_OPTIONS = [
  { value: 'url' as const, label: 'Website link' },
  { value: 'text' as const, label: 'Plain text' },
  { value: 'wifi' as const, label: 'Wi-Fi network' },
  { value: 'email' as const, label: 'Email' },
  { value: 'phone' as const, label: 'Phone number' },
  { value: 'sms' as const, label: 'SMS message' },
];

const ERROR_CORRECTION_OPTIONS = (
  Object.keys(QR_ERROR_CORRECTION) as QrErrorCorrection[]
).map((value) => ({ value, label: QR_ERROR_CORRECTION[value].label }));

const ENCRYPTION_OPTIONS = [
  { value: 'WPA' as const, label: 'WPA / WPA2 / WPA3' },
  { value: 'WEP' as const, label: 'WEP (legacy)' },
  { value: 'nopass' as const, label: 'None (open network)' },
];

export function QrCodeGenerator() {
  const [mode, setMode] = useState<QrMode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phone, setPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [encryption, setEncryption] = useState<WifiEncryption>('WPA');
  const [hidden, setHidden] = useState(false);

  const [size, setSize] = useState('512');
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrection>('M');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [quietZone, setQuietZone] = useState('4');

  /**
   * The rendered code is keyed by the exact payload it was produced from, so a
   * stale image is never shown while a new one is being encoded. Deriving
   * "is this current?" during render means the effect never has to clear state
   * synchronously.
   */
  const [rendered, setRendered] = useState<{ payload: string; png: string; svg: string } | null>(
    null,
  );
  const [renderError, setRenderError] = useState<{ payload: string; message: string } | null>(null);

  const payloadInput: QrPayloadInput = useMemo(() => {
    switch (mode) {
      case 'url':
        return { mode: 'url', url };
      case 'text':
        return { mode: 'text', text };
      case 'email':
        return { mode: 'email', address: emailAddress, subject: emailSubject, body: emailBody };
      case 'phone':
        return { mode: 'phone', number: phone };
      case 'sms':
        return { mode: 'sms', number: phone, message: smsMessage };
      case 'wifi':
        return { mode: 'wifi', ssid, password: wifiPassword, encryption, hidden };
      default:
        return { mode: 'text', text: '' };
    }
  }, [
    mode, url, text, emailAddress, emailSubject, emailBody, phone, smsMessage,
    ssid, wifiPassword, encryption, hidden,
  ]);

  const payload = useMemo(() => buildQrPayload(payloadInput), [payloadInput]);
  const colourWarning = useMemo(
    () => checkQrColours(foreground, background),
    [foreground, background],
  );

  const pixelSize = Math.min(Math.max(parseNumericInput(size) ?? 512, 64), 2048);
  const margin = Math.min(Math.max(parseNumericInput(quietZone) ?? 4, 0), 20);

  // Encoding happens locally with a bundled encoder. No QR service is called,
  // so the contents of the code never leave this page.
  useEffect(() => {
    if (!payload.ok) return;

    let cancelled = false;
    const current = payload.payload;
    const options = {
      errorCorrectionLevel: errorCorrection,
      margin,
      color: { dark: foreground, light: background },
    } as const;

    Promise.all([
      QRCode.toDataURL(current, { ...options, width: pixelSize }),
      QRCode.toString(current, { ...options, type: 'svg' as const, width: pixelSize }),
    ])
      .then(([png, svgMarkup]) => {
        if (cancelled) return;
        setRendered({ payload: current, png, svg: svgMarkup });
      })
      .catch(() => {
        if (cancelled) return;
        setRenderError({
          payload: current,
          message:
            'This content is too long to fit in a QR code at the selected error correction level. Shorten it, or choose a lower level such as L.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [payload, errorCorrection, margin, foreground, background, pixelSize]);

  // Only show artefacts that belong to the payload currently on screen.
  const isCurrent = payload.ok && rendered?.payload === payload.payload;
  const dataUrl = isCurrent ? (rendered?.png ?? null) : null;
  const svg = isCurrent ? (rendered?.svg ?? null) : null;
  const activeRenderError =
    payload.ok && renderError?.payload === payload.payload ? renderError.message : null;

  function downloadPng() {
    if (!dataUrl) return;
    // Convert the data URL to a Blob so the download helper owns the object
    // URL lifecycle rather than leaving a long data: href in the DOM.
    const [, base64] = dataUrl.split(',');
    if (!base64) return;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    downloadBlob(new Blob([bytes], { type: 'image/png' }), `qr-code-${mode}.png`);
  }

  function reset() {
    setMode('url');
    setUrl('');
    setText('');
    setEmailAddress('');
    setEmailSubject('');
    setEmailBody('');
    setPhone('');
    setSmsMessage('');
    setSsid('');
    setWifiPassword('');
    setEncryption('WPA');
    setHidden(false);
    setSize('512');
    setErrorCorrection('M');
    setForeground('#000000');
    setBackground('#ffffff');
    setQuietZone('4');
    setRendered(null);
    setRenderError(null);
  }

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="QR code preview">
          <div className="space-y-4">
            {dataUrl ? (
              <>
                <div className="flex justify-center rounded-md border border-border-default bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUrl}
                    alt={`QR code encoding ${mode === 'wifi' ? 'Wi-Fi network details' : 'the content you entered'}`}
                    width={256}
                    height={256}
                    className="size-64 max-w-full"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={downloadPng}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-hover"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => svg && downloadText(svg, `qr-code-${mode}`, 'svg')}
                    disabled={!svg}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken disabled:opacity-55"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download SVG
                  </button>
                  <CopyButton value={payload.ok ? payload.payload : ''} label="Copy payload" />
                </div>

                <details className="rounded-md border border-border-default bg-surface p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    What this code contains
                  </summary>
                  <p className="mt-2 font-mono text-xs break-all">
                    {payload.ok ? payload.payload : ''}
                  </p>
                </details>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted">
                Fill in the details to generate a code.
              </p>
            )}

            {!payload.ok && payloadHasInput(payloadInput) ? (
              <InlineError message={payload.error} />
            ) : null}
            {activeRenderError ? <InlineError message={activeRenderError} /> : null}

            {payload.ok && payload.note ? (
              <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
                {payload.note}
              </p>
            ) : null}

            {colourWarning ? (
              <p
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  colourWarning.level === 'error'
                    ? 'border-danger-border bg-danger-surface'
                    : 'border-warning-border bg-warning-surface'
                }`}
              >
                <TriangleAlert
                  className={`mt-0.5 size-4 shrink-0 ${
                    colourWarning.level === 'error' ? 'text-danger' : 'text-warning'
                  }`}
                  aria-hidden="true"
                />
                <span>{colourWarning.message}</span>
              </p>
            ) : null}
          </div>
        </ResultPanel>
      }
    >
      <SegmentedControl
        legend="What should this code do?"
        value={mode}
        onChange={setMode}
        options={MODE_OPTIONS}
      />

      {mode === 'url' ? (
        <Field label="Web address" required>
          {(props) => (
            <input
              {...props}
              type="text"
              inputMode="url"
              autoComplete="off"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="example.com"
              className={controlClasses}
            />
          )}
        </Field>
      ) : null}

      {mode === 'text' ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-text" className="text-sm font-medium">
            Text
          </label>
          <textarea
            id="qr-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
          />
        </div>
      ) : null}

      {mode === 'email' ? (
        <>
          <Field label="Email address" required>
            {(props) => (
              <input
                {...props}
                type="email"
                autoComplete="off"
                value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)}
                placeholder="name@example.com"
                className={controlClasses}
              />
            )}
          </Field>
          <Field label="Subject">
            {(props) => (
              <input
                {...props}
                type="text"
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
                className={controlClasses}
              />
            )}
          </Field>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="qr-email-body" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="qr-email-body"
              value={emailBody}
              onChange={(event) => setEmailBody(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
            />
          </div>
        </>
      ) : null}

      {mode === 'phone' || mode === 'sms' ? (
        <Field label="Phone number" required>
          {(props) => (
            <input
              {...props}
              type="tel"
              autoComplete="off"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+1 555 123 4567"
              className={controlClasses}
            />
          )}
        </Field>
      ) : null}

      {mode === 'sms' ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="qr-sms" className="text-sm font-medium">
            Message
          </label>
          <textarea
            id="qr-sms"
            value={smsMessage}
            onChange={(event) => setSmsMessage(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-border-strong bg-surface p-3 text-base"
          />
        </div>
      ) : null}

      {mode === 'wifi' ? (
        <>
          <Field label="Network name (SSID)" required>
            {(props) => (
              <input
                {...props}
                type="text"
                autoComplete="off"
                value={ssid}
                onChange={(event) => setSsid(event.target.value)}
                className={controlClasses}
              />
            )}
          </Field>
          <SelectField
            label="Encryption"
            value={encryption}
            onChange={setEncryption}
            options={ENCRYPTION_OPTIONS}
          />
          {encryption !== 'nopass' ? (
            <Field
              label="Password"
              required
              helper="Stored in the code as plain text. Anyone who can scan it can read it."
            >
              {(props) => (
                <input
                  {...props}
                  type="text"
                  autoComplete="off"
                  value={wifiPassword}
                  onChange={(event) => setWifiPassword(event.target.value)}
                  className={controlClasses}
                />
              )}
            </Field>
          ) : null}
          <SwitchField label="Hidden network" checked={hidden} onChange={setHidden} />
        </>
      ) : null}

      <fieldset className="border-t border-border-default pt-4">
        <legend className="text-sm font-medium">Appearance</legend>
        <div className="mt-3 space-y-4">
          <SelectField
            label="Error correction"
            value={errorCorrection}
            onChange={setErrorCorrection}
            options={ERROR_CORRECTION_OPTIONS}
            helper="Higher levels survive more damage but make the code denser."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Size" value={size} onChange={setSize} unit="px" />
            <NumberField
              label="Quiet zone"
              value={quietZone}
              onChange={setQuietZone}
              unit="modules"
              helper="The blank margin. Cropping it off stops codes scanning."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColourInput label="Foreground" value={foreground} onChange={setForeground} />
            <ColourInput label="Background" value={background} onChange={setBackground} />
          </div>
        </div>
      </fieldset>
    </CalculatorShell>
  );
}

function ColourInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      {(props) => (
        <div className="flex items-center gap-2">
          <input
            {...props}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
          />
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label} hex value`}
            className={`${controlClasses} font-mono`}
          />
        </div>
      )}
    </Field>
  );
}

/** True once the user has typed something, so errors are not shown on an empty form. */
function payloadHasInput(input: QrPayloadInput): boolean {
  switch (input.mode) {
    case 'url':
      return input.url.trim().length > 0;
    case 'text':
      return input.text.length > 0;
    case 'email':
      return input.address.trim().length > 0;
    case 'phone':
    case 'sms':
      return input.number.trim().length > 0;
    case 'wifi':
      return input.ssid.trim().length > 0 || input.password.length > 0;
    default:
      return false;
  }
}
