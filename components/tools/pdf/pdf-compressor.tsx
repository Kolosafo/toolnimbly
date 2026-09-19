'use client';

import { Download, FileArchive, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { ProgressBar } from '@/components/files/progress-bar';
import { SegmentedControl } from '@/components/forms/segmented-control';
import { SelectField } from '@/components/forms/select-field';
import { formatBytes, pdfLimits } from '@/lib/config/limits';
import { downloadBlob } from '@/lib/download/file';
import { describeSizeChange } from '@/lib/image/geometry';
import { compressPdf, rasteriseWarning, type CompressResult, type CompressionMode } from '@/lib/pdf/compress';
import { PdfError } from '@/lib/pdf/document';
import { SCALE_PRESETS } from '@/lib/pdf/render';

import { usePdfFiles } from './use-pdf-files';

const MODE_OPTIONS = [
  {
    value: 'structure' as const,
    label: 'Optimise structure',
    description: 'Safe. Pages untouched, text stays selectable. Often saves very little.',
  },
  {
    value: 'rasterise' as const,
    label: 'Rasterise pages',
    description: 'Large saving. Every page becomes an image — text, links and forms are lost.',
  },
];

export function PdfCompressor() {
  const files = usePdfFiles({ multiple: false, maxFiles: 1 });
  const [mode, setMode] = useState<CompressionMode>('structure');
  const [scale, setScale] = useState('2');
  const [quality, setQuality] = useState(75);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const entry = files.entries[0] ?? null;

  async function compress() {
    if (!entry) return;

    setError(null);
    setResult(null);

    const controller = new AbortController();
    abortRef.current = controller;
    if (mode === 'rasterise') setProgress({ completed: 0, total: entry.pageCount });

    try {
      const compressed = await compressPdf(entry.data, {
        mode,
        scale: Number(scale),
        quality: quality / 100,
        signal: controller.signal,
        onProgress: (completed, total) => setProgress({ completed, total }),
      });
      setResult(compressed);
    } catch (compressError) {
      if (compressError instanceof DOMException && compressError.name === 'AbortError') {
        // Cancelling is not a failure.
      } else {
        setError(
          compressError instanceof PdfError
            ? compressError.failure.message
            : 'This PDF could not be compressed.',
        );
      }
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }

  const change = result ? describeSizeChange(result.inputBytes, result.outputBytes) : null;

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      {!entry ? (
        <FileDropzone
          onFiles={(incoming) => void files.addFiles(incoming)}
          accept="application/pdf"
          label="Drop a PDF here"
          hint={`One PDF, up to ${formatBytes(pdfLimits.maxFileBytes)} and ${pdfLimits.maxPages} pages.`}
        />
      ) : null}

      {files.rejections.map((message) => (
        <div key={message} className="mt-4">
          <InlineError message={message} />
        </div>
      ))}

      {entry ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-border-default bg-surface-sunken p-3">
            <p className="truncate text-sm font-medium">{entry.name}</p>
            <p className="mt-0.5 text-xs text-muted">
              {entry.pageCount} pages · {formatBytes(entry.size)}
            </p>
            <button
              type="button"
              onClick={files.clear}
              className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
            >
              Choose a different PDF
            </button>
          </div>

          <SegmentedControl
            legend="Compression mode"
            value={mode}
            onChange={(value) => {
              setMode(value);
              setResult(null);
            }}
            options={MODE_OPTIONS}
            columns="stack"
          />

          {mode === 'rasterise' ? (
            <>
              <p className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <span>{rasteriseWarning(entry.pageCount)}</span>
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Render resolution"
                  value={scale}
                  onChange={setScale}
                  options={SCALE_PRESETS.map((preset) => ({
                    value: preset.value,
                    label: preset.label,
                  }))}
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="raster-quality" className="text-sm font-medium">
                      Image quality
                    </label>
                    <output htmlFor="raster-quality" className="tabular text-sm font-semibold">
                      {quality}
                    </output>
                  </div>
                  <input
                    id="raster-quality"
                    type="range"
                    min={10}
                    max={100}
                    value={quality}
                    onChange={(event) => setQuality(Number(event.target.value))}
                    className="h-11 w-full accent-[color:var(--brand)]"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
              Structure optimisation removes metadata and unused objects and repacks the
              cross-reference data. It cannot recompress embedded images or fonts, which is where
              most of a PDF&apos;s size usually sits — so expect a small saving, sometimes none at
              all.
            </p>
          )}

          <section
            aria-label="Compression result"
            aria-live="polite"
            className="rounded-lg border border-border-default bg-surface-sunken p-4"
          >
            {error ? <InlineError message={error} /> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void compress()}
                disabled={progress !== null}
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
              >
                <FileArchive className="size-4" aria-hidden="true" />
                {progress ? 'Compressing…' : 'Compress PDF'}
              </button>

              {result && !result.grewLarger ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([result.bytes as BlobPart], { type: 'application/pdf' }),
                      entry.name.replace(/\.pdf$/i, '-compressed.pdf'),
                    )
                  }
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download compressed PDF
                </button>
              ) : null}
            </div>

            {progress ? (
              <ProgressBar
                completed={progress.completed}
                total={progress.total}
                label="Rendering pages"
                onCancel={() => abortRef.current?.abort()}
              />
            ) : null}

            {result ? (
              <div className="mt-4 space-y-3">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Before</dt>
                    <dd className="tabular font-medium">{formatBytes(result.inputBytes)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">After</dt>
                    <dd className="tabular font-medium">{formatBytes(result.outputBytes)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Change</dt>
                    <dd
                      className={`tabular font-semibold ${result.grewLarger ? 'text-warning' : 'text-success'}`}
                    >
                      {change?.label}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Pages</dt>
                    <dd className="tabular font-medium">{result.pageCount}</dd>
                  </div>
                </dl>

                {result.grewLarger ? (
                  <p className="rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm">
                    The result is larger than the original, so there is nothing to gain here. Keep
                    your original file — it is the better choice. This is common when rasterising a
                    document made in a word processor, where crisp text compresses far better as
                    text than as an image.
                  </p>
                ) : null}

                {result.verificationError ? (
                  <InlineError message={result.verificationError} />
                ) : (
                  <p className="text-xs text-success">
                    The generated PDF was re-read and checked: {result.pageCount} pages, all
                    readable.
                  </p>
                )}

                <div>
                  {/* h2: no heading sits above this in the panel, so an h3
                      would skip a level once a result appears. */}
                  <h2 className="text-sm font-medium">What this mode did</h2>
                  <ul className="mt-2 space-y-1.5">
                    {result.tradeOffs.map((tradeOff) => (
                      <li key={tradeOff} className="flex gap-2 text-xs text-muted">
                        <span
                          aria-hidden="true"
                          className="mt-1.5 size-1 shrink-0 rounded-full bg-subtle"
                        />
                        <span>{tradeOff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
