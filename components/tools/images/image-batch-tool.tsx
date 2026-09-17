'use client';

import { Download, Package } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { FileQueue } from '@/components/files/file-queue';
import { ProgressBar } from '@/components/files/progress-bar';
import { NumberField } from '@/components/forms/number-field';
import { SelectField } from '@/components/forms/select-field';
import { SwitchField } from '@/components/forms/switch-field';
import { formatBytes, imageLimits } from '@/lib/config/limits';
import type { DetectedType } from '@/lib/files/signatures';
import {
  FORMAT_LABELS,
  formatUsesQuality,
  type OutputFormat,
} from '@/lib/image/codec';
import { describeSizeChange } from '@/lib/image/geometry';
import type { ProcessOptions } from '@/lib/image/process';
import { parseNumericInput } from '@/lib/formatting/number';
import { cn } from '@/lib/utils/cn';

import { useImageBatch, type BatchEntry } from './use-image-batch';

export type BatchToolConfig = {
  accept: readonly DetectedType[];
  acceptLabel: string;
  acceptAttribute: string;
  /** Formats offered in the output picker. `null` means "keep the original". */
  formats: (OutputFormat | null)[];
  defaultFormat: OutputFormat | null;
  defaultQuality: number;
  showQuality: boolean;
  showDimensionCaps: boolean;
  showMatte: boolean;
  actionLabel: string;
  archiveName: string;
  dropzoneLabel: string;
  /** Rendered above the action button — format-specific guidance. */
  notice?: ReactNode;
  /** Extra controls, e.g. the PNG compressor's mode switch. */
  extraControls?: (state: { quality: number }) => ReactNode;
  /** Lets a tool override the options before processing. */
  buildOptions?: (base: ProcessOptions) => ProcessOptions;
};

/**
 * The shared interface for every batch image tool (spec §6.16–§6.22).
 *
 * The seven image routes differ in which formats they accept, which controls
 * they expose and what they say — not in how they decode, transform, encode or
 * report results. Those all live here and in `useImageBatch`.
 */
export function ImageBatchTool({ config }: { config: BatchToolConfig }) {
  const [format, setFormat] = useState<OutputFormat | null>(config.defaultFormat);
  const [quality, setQuality] = useState(config.defaultQuality);
  const [maxWidth, setMaxWidth] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [matte, setMatte] = useState('#ffffff');
  const [stripMetadata, setStripMetadata] = useState(true);

  const batch = useImageBatch({
    accept: config.accept,
    acceptLabel: config.acceptLabel,
  });

  const formatOptions = useMemo(
    () =>
      config.formats.map((value) => ({
        value: value ?? 'same',
        label: value === null ? 'Keep original format' : FORMAT_LABELS[value],
      })),
    [config.formats],
  );

  const qualityApplies = format === null ? true : formatUsesQuality(format);
  const matteApplies = config.showMatte && format === 'image/jpeg';

  function start() {
    const base: ProcessOptions = {
      format,
      quality: quality / 100,
      maxWidth: parseNumericInput(maxWidth),
      maxHeight: parseNumericInput(maxHeight),
      matte,
    };
    void batch.run(config.buildOptions ? config.buildOptions(base) : base);
  }

  const totalBefore = batch.successful.reduce((sum, entry) => sum + (entry.result?.inputBytes ?? 0), 0);
  const totalAfter = batch.successful.reduce((sum, entry) => sum + (entry.result?.outputBytes ?? 0), 0);
  const overall = describeSizeChange(totalBefore, totalAfter);

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      <FileDropzone
        onFiles={(files) => void batch.addFiles(files)}
        accept={config.acceptAttribute}
        multiple
        label={config.dropzoneLabel}
        hint={`${config.acceptLabel}. Up to ${formatBytes(imageLimits.maxFileBytes)} each, ${imageLimits.maxQueueLength} files at a time.`}
        disabled={batch.isWorking}
      />

      {batch.rejections.length > 0 ? (
        <div aria-label="Files that were not accepted" className="mt-4 space-y-2">
          {batch.rejections.map((message) => (
            <InlineError key={message} message={message} />
          ))}
        </div>
      ) : null}

      {batch.entries.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {config.formats.length > 1 ? (
              <SelectField
                label="Output format"
                value={format ?? 'same'}
                onChange={(value) => setFormat(value === 'same' ? null : (value as OutputFormat))}
                options={formatOptions}
              />
            ) : null}

            {matteApplies ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="matte-colour" className="text-sm font-medium">
                  Background for transparent areas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="matte-colour"
                    type="color"
                    value={matte}
                    onChange={(event) => setMatte(event.target.value)}
                    className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
                  />
                  <span className="text-xs text-muted">
                    JPEG cannot store transparency, so transparent pixels are flattened onto this
                    colour.
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {config.showQuality && qualityApplies ? (
            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="quality" className="text-sm font-medium">
                  Quality
                </label>
                <output htmlFor="quality" className="tabular text-sm font-semibold">
                  {quality}
                </output>
              </div>
              <input
                id="quality"
                type="range"
                min={10}
                max={100}
                step={1}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="mt-2 h-11 w-full accent-[color:var(--brand)]"
              />
              {quality < 60 ? (
                <p className="text-xs text-warning">
                  Below about 60, compression artefacts usually become visible around sharp edges.
                </p>
              ) : (
                <p className="text-xs text-muted">
                  75 to 85 is the usual sweet spot for photographs.
                </p>
              )}
            </div>
          ) : null}

          {config.showQuality && !qualityApplies ? (
            <p className="mt-4 rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
              PNG is a lossless format, so a quality setting does not apply. Savings come from the
              encoder alone and are often small.
            </p>
          ) : null}

          {config.showDimensionCaps ? (
            <fieldset className="mt-4 border-t border-border-default pt-4">
              <legend className="text-sm font-medium">Maximum dimensions (optional)</legend>
              <p className="mt-1 text-xs text-muted">
                Scales oversized images down before encoding, which usually saves far more than
                quality alone. Images are never enlarged.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <NumberField label="Max width" value={maxWidth} onChange={setMaxWidth} unit="px" />
                <NumberField
                  label="Max height"
                  value={maxHeight}
                  onChange={setMaxHeight}
                  unit="px"
                />
              </div>
            </fieldset>
          ) : null}

          {config.extraControls ? (
            <div className="mt-4">{config.extraControls({ quality })}</div>
          ) : null}

          <div className="mt-4">
            <SwitchField
              label="Strip metadata"
              checked={stripMetadata}
              onChange={setStripMetadata}
              helper="Removes GPS coordinates, camera model and timestamps. Orientation is applied to the pixels first, so photos stay upright."
            />
            {!stripMetadata ? (
              <p className="mt-2 rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-xs">
                Metadata cannot be carried through a browser re-encode, so it is removed regardless.
                This switch is here to make that explicit rather than to offer a choice the browser
                cannot honour.
              </p>
            ) : null}
          </div>

          {config.notice ? (
            <div className="mt-4 rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
              {config.notice}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={start}
              disabled={batch.isWorking}
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
            >
              {config.actionLabel}
            </button>

            {batch.successful.length >= 2 ? (
              <button
                type="button"
                onClick={() => void batch.downloadAllAsZip(config.archiveName)}
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
              >
                <Package className="size-4" aria-hidden="true" />
                Download all as ZIP
              </button>
            ) : null}
          </div>

          {batch.progress ? (
            <ProgressBar
              completed={batch.progress.completed}
              total={batch.progress.total}
              label={config.actionLabel}
              onCancel={batch.cancel}
            />
          ) : null}

          {batch.successful.length > 0 ? (
            <div
              role="status"
              aria-live="polite"
              aria-label="Batch summary"
              className="mt-4 rounded-lg border border-border-default bg-surface-sunken p-4"
            >
              <p className="text-sm">
                <span className="font-medium">
                  {batch.successful.length} of {batch.entries.length} processed.
                </span>{' '}
                {formatBytes(totalBefore)} became {formatBytes(totalAfter)} —{' '}
                <span className={overall.larger ? 'text-warning' : 'text-success'}>
                  {overall.label}
                </span>
                .
              </p>
              {overall.larger ? (
                <p className="mt-2 text-sm">
                  The output is larger than the input. These files were already efficiently
                  compressed, so keeping the originals is the better choice.
                </p>
              ) : null}
            </div>
          ) : null}

          <FileQueue
            items={batch.entries}
            onRemove={batch.removeEntry}
            onClearAll={batch.clearAll}
            renderDetail={(item) => <EntryDetail entry={item as BatchEntry} onDownload={batch.downloadOne} />}
          />
        </>
      ) : null}
    </div>
  );
}

function EntryDetail({
  entry,
  onDownload,
}: {
  entry: BatchEntry;
  onDownload: (entry: BatchEntry) => void;
}) {
  if (!entry.result) return null;

  const change = describeSizeChange(entry.result.inputBytes, entry.result.outputBytes);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="tabular">
        {entry.result.inputDimensions.width} × {entry.result.inputDimensions.height}
        {' → '}
        {entry.result.outputDimensions.width} × {entry.result.outputDimensions.height}
      </span>
      <span className={cn('tabular', change.larger ? 'text-warning' : 'text-success')}>
        {formatBytes(entry.result.outputBytes)} ({change.label})
      </span>
      {entry.result.notice ? <span className="text-muted">{entry.result.notice}</span> : null}
      <button
        type="button"
        onClick={() => onDownload(entry)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 font-medium transition-colors hover:bg-surface-sunken"
      >
        <Download className="size-3.5" aria-hidden="true" />
        Download
      </button>
    </div>
  );
}
