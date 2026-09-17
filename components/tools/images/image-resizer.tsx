'use client';

import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { NumberField } from '@/components/forms/number-field';
import { SegmentedControl } from '@/components/forms/segmented-control';
import { SelectField } from '@/components/forms/select-field';
import { SwitchField } from '@/components/forms/switch-field';
import { formatBytes, imageLimits } from '@/lib/config/limits';
import { downloadBlob } from '@/lib/download/file';
import { validateFile } from '@/lib/files/validation';
import { decodeImage, FORMAT_LABELS, formatUsesQuality, type OutputFormat } from '@/lib/image/codec';
import { describeSizeChange, planResize, type FitMode } from '@/lib/image/geometry';
import { processImage, type ProcessedImage } from '@/lib/image/process';
import { parseNumericInput } from '@/lib/formatting/number';

const UNIT_OPTIONS = [
  { value: 'pixels' as const, label: 'Pixels', description: 'Set exact dimensions' },
  { value: 'percent' as const, label: 'Percentage', description: 'Scale relative to the original' },
];

const FIT_OPTIONS = [
  {
    value: 'contain' as const,
    label: 'Contain',
    description: 'Fit the whole image inside the box',
  },
  { value: 'cover' as const, label: 'Cover', description: 'Fill the box and crop the overflow' },
  { value: 'stretch' as const, label: 'Stretch', description: 'Distorts the image — rarely wanted' },
];

const FORMAT_OPTIONS = [
  { value: 'same', label: 'Keep original format' },
  { value: 'image/jpeg', label: FORMAT_LABELS['image/jpeg'] },
  { value: 'image/png', label: FORMAT_LABELS['image/png'] },
  { value: 'image/webp', label: FORMAT_LABELS['image/webp'] },
];

/** Presets always display their exact pixel dimensions (spec §6.19). */
const PRESETS = [
  { label: 'Full HD — 1920 × 1080', width: 1920, height: 1080 },
  { label: 'Web hero — 1600 × 900', width: 1600, height: 900 },
  { label: 'Content image — 1200 × 800', width: 1200, height: 800 },
  { label: 'Profile picture — 400 × 400', width: 400, height: 400 },
  { label: 'Thumbnail — 200 × 200', width: 200, height: 200 },
];

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<{ width: number; height: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [unit, setUnit] = useState<'pixels' | 'percent'>('pixels');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [percent, setPercent] = useState('50');
  const [lockAspect, setLockAspect] = useState(true);
  const [fit, setFit] = useState<FitMode>('contain');
  const [allowUpscale, setAllowUpscale] = useState(false);
  const [format, setFormat] = useState<string>('same');
  const [quality, setQuality] = useState(85);
  const [matte, setMatte] = useState('#ffffff');

  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [working, setWorking] = useState(false);
  const objectUrls = useRef<Set<string>>(new Set());

  useEffect(
    () => () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
      objectUrls.current.clear();
    },
    [],
  );

  async function addFile(files: File[]) {
    const candidate = files[0];
    if (!candidate) return;

    const header = new Uint8Array(await candidate.slice(0, 32).arrayBuffer());
    const validation = validateFile(candidate, header, {
      accept: ['image/jpeg', 'image/png', 'image/webp'],
      maxBytes: imageLimits.maxFileBytes,
      acceptLabel: 'JPG, PNG and WebP',
    });

    if (!validation.ok) {
      setError(validation.failure.message);
      return;
    }

    try {
      const decoded = await decodeImage(candidate);
      const dimensions = { width: decoded.width, height: decoded.height };
      decoded.bitmap.close();

      const url = URL.createObjectURL(candidate);
      objectUrls.current.add(url);

      setFile(candidate);
      setSource(dimensions);
      setPreviewUrl(url);
      setWidth(String(dimensions.width));
      setHeight(String(dimensions.height));
      setError(null);
      setResult(null);
    } catch (decodeError) {
      setError(
        decodeError instanceof Error
          ? decodeError.message
          : 'This image could not be read. It may be corrupted.',
      );
    }
  }

  /** With the aspect locked, editing one dimension derives the other. */
  function updateWidth(value: string) {
    setWidth(value);
    if (!lockAspect || !source) return;
    const parsed = parseNumericInput(value);
    if (parsed === null || parsed <= 0) return;
    setHeight(String(Math.max(1, Math.round(parsed / (source.width / source.height)))));
  }

  function updateHeight(value: string) {
    setHeight(value);
    if (!lockAspect || !source) return;
    const parsed = parseNumericInput(value);
    if (parsed === null || parsed <= 0) return;
    setWidth(String(Math.max(1, Math.round(parsed * (source.width / source.height)))));
  }

  const targetWidth =
    unit === 'percent'
      ? source
        ? Math.max(1, Math.round((source.width * (parseNumericInput(percent) ?? 100)) / 100))
        : null
      : parseNumericInput(width);

  const targetHeight =
    unit === 'percent'
      ? source
        ? Math.max(1, Math.round((source.height * (parseNumericInput(percent) ?? 100)) / 100))
        : null
      : parseNumericInput(height);

  // Shown before download so the resulting dimensions are never a surprise.
  const plan =
    source && targetWidth !== null
      ? planResize({
          source,
          width: targetWidth,
          height: unit === 'percent' ? targetHeight : lockAspect ? null : targetHeight,
          lockAspectRatio: unit === 'percent' ? true : lockAspect,
          fit,
          allowUpscale,
          maxOutputPixels: imageLimits.maxOutputPixels,
        })
      : null;

  async function resize() {
    if (!file || targetWidth === null) return;
    setWorking(true);
    setError(null);

    try {
      const outputFormat = format === 'same' ? null : (format as OutputFormat);
      const processed = await processImage(file, {
        format: outputFormat,
        quality: quality / 100,
        targetWidth,
        targetHeight: unit === 'percent' ? targetHeight : lockAspect ? null : targetHeight,
        lockAspectRatio: unit === 'percent' ? true : lockAspect,
        fit,
        allowUpscale,
        matte,
      });
      setResult(processed);
    } catch (resizeError) {
      setError(
        resizeError instanceof Error ? resizeError.message : 'The image could not be resized.',
      );
    } finally {
      setWorking(false);
    }
  }

  const change = result ? describeSizeChange(result.inputBytes, result.outputBytes) : null;
  const qualityApplies = format === 'same' || formatUsesQuality(format as OutputFormat);

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      {!file ? (
        <FileDropzone
          onFiles={(files) => void addFile(files)}
          accept="image/jpeg,image/png,image/webp"
          label="Drop an image here"
          hint={`JPG, PNG and WebP. Up to ${formatBytes(imageLimits.maxFileBytes)}.`}
        />
      ) : null}

      {error ? (
        <div className="mt-4">
          <InlineError message={error} />
        </div>
      ) : null}

      {file && source ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-lg border border-border-default bg-surface-sunken p-3">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="tabular mt-0.5 text-xs text-muted">
                {source.width} × {source.height} pixels · {formatBytes(file.size)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setSource(null);
                  setResult(null);
                  setPreviewUrl(null);
                }}
                className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
              >
                Choose a different image
              </button>
            </div>

            <SegmentedControl legend="Resize by" value={unit} onChange={setUnit} options={UNIT_OPTIONS} />

            {unit === 'pixels' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label="Width" value={width} onChange={updateWidth} unit="px" />
                  <NumberField label="Height" value={height} onChange={updateHeight} unit="px" />
                </div>
                <SwitchField
                  label="Lock aspect ratio"
                  checked={lockAspect}
                  onChange={setLockAspect}
                  helper="Keeps the original proportions by deriving one dimension from the other."
                />
                <SelectField
                  label="Presets"
                  value=""
                  onChange={(value) => {
                    const preset = PRESETS.find((item) => item.label === value);
                    if (!preset) return;
                    setWidth(String(preset.width));
                    setHeight(String(preset.height));
                    setLockAspect(false);
                  }}
                  options={[
                    { value: '', label: 'Choose a preset…' },
                    ...PRESETS.map((preset) => ({ value: preset.label, label: preset.label })),
                  ]}
                  helper="Every preset shows its exact pixel dimensions. Confirm against the platform's current guidance."
                />
              </>
            ) : (
              <NumberField
                label="Scale"
                value={percent}
                onChange={setPercent}
                unit="%"
                helper={
                  source
                    ? `${Math.round((source.width * (parseNumericInput(percent) ?? 100)) / 100)} × ${Math.round((source.height * (parseNumericInput(percent) ?? 100)) / 100)} pixels`
                    : undefined
                }
              />
            )}

            {unit === 'pixels' && !lockAspect ? (
              <>
                <SegmentedControl legend="Fit mode" value={fit} onChange={setFit} options={FIT_OPTIONS} />
                {fit === 'stretch' ? (
                  <p className="rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm">
                    Stretch distorts the image to match your dimensions exactly. Cover is almost
                    always the better choice.
                  </p>
                ) : null}
              </>
            ) : null}

            <SwitchField
              label="Allow enlarging"
              checked={allowUpscale}
              onChange={setAllowUpscale}
              helper="Upscaling invents pixels and always looks softer. Off by default."
            />

            <SelectField
              label="Output format"
              value={format}
              onChange={setFormat}
              options={FORMAT_OPTIONS}
            />

            {qualityApplies ? (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="resize-quality" className="text-sm font-medium">
                    Quality
                  </label>
                  <output htmlFor="resize-quality" className="tabular text-sm font-semibold">
                    {quality}
                  </output>
                </div>
                <input
                  id="resize-quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="mt-2 h-11 w-full accent-[color:var(--brand)]"
                />
              </div>
            ) : null}

            {format === 'image/jpeg' ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="resize-matte" className="text-sm font-medium">
                  Background for transparent areas
                </label>
                <input
                  id="resize-matte"
                  type="color"
                  value={matte}
                  onChange={(event) => setMatte(event.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
                />
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void resize()}
              disabled={working || targetWidth === null}
              className="inline-flex min-h-12 items-center rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
            >
              {working ? 'Resizing…' : 'Resize image'}
            </button>
          </div>

          <div>
            <section
              aria-label="Resize result"
              aria-live="polite"
              className="rounded-lg border border-border-default bg-surface-sunken p-4"
            >
              {plan?.ok ? (
                <p className="text-sm">
                  <span className="font-medium">Output will be </span>
                  <span className="tabular font-semibold">
                    {plan.output.width} × {plan.output.height}
                  </span>{' '}
                  pixels
                  {plan.clampedByPixels ? ' (scaled down to stay within the megapixel limit)' : ''}.
                </p>
              ) : plan && !plan.ok ? (
                <InlineError message={plan.error} />
              ) : null}

              {previewUrl ? (
                <div className="mt-3 flex justify-center rounded-md border border-border-default bg-surface p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="The image you selected"
                    className="max-h-64 w-auto object-contain"
                  />
                </div>
              ) : null}

              {result ? (
                <div className="mt-4 space-y-3">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Dimensions</dt>
                      <dd className="tabular font-medium">
                        {result.outputDimensions.width} × {result.outputDimensions.height}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">File size</dt>
                      <dd className="tabular font-medium">
                        {formatBytes(result.inputBytes)} → {formatBytes(result.outputBytes)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Change</dt>
                      <dd
                        className={`tabular font-medium ${change?.larger ? 'text-warning' : 'text-success'}`}
                      >
                        {change?.label}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => downloadBlob(result.blob, result.filename)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-contrast transition-colors hover:bg-brand-hover"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download {result.filename}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
