'use client';

import { Download, Package } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { ProgressBar } from '@/components/files/progress-bar';
import { Field, controlClasses } from '@/components/forms/field';
import { SelectField } from '@/components/forms/select-field';
import { formatBytes, pdfLimits } from '@/lib/config/limits';
import { downloadBlob, padIndex, sanitizeFilename } from '@/lib/download/file';
import { PdfError } from '@/lib/pdf/document';
import { describePages, parsePageRanges } from '@/lib/pdf/page-ranges';
import { checkRenderBudget, openForRendering, SCALE_PRESETS } from '@/lib/pdf/render';
import { createZip } from '@/lib/zip/archive';

import { usePdfFiles } from './use-pdf-files';

type RenderedOutput = { name: string; blob: Blob; previewUrl: string; pageNumber: number };

export function PdfToJpg() {
  const files = usePdfFiles({ multiple: false, maxFiles: 1 });
  const [selection, setSelection] = useState('all');
  const [scale, setScale] = useState('2');
  const [quality, setQuality] = useState(85);
  const [background, setBackground] = useState('#ffffff');
  const [outputs, setOutputs] = useState<RenderedOutput[]>([]);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const objectUrls = useRef<Set<string>>(new Set());

  const entry = files.entries[0] ?? null;
  const pageCount = entry?.pageCount ?? 0;
  const scaleValue = Number(scale);

  const parsed = useMemo(() => {
    if (!entry) return null;
    return parsePageRanges(selection, pageCount);
  }, [entry, selection, pageCount]);

  // Checked before rendering starts, so an impossible job is refused up front
  // rather than part-way through.
  const budget = useMemo(() => {
    if (!entry || !parsed?.ok) return null;
    const pages = parsed.pages
      .map((page) => entry.pages[page - 1])
      .filter((page): page is NonNullable<typeof page> => Boolean(page));
    return checkRenderBudget(pages, scaleValue);
  }, [entry, parsed, scaleValue]);

  function releaseOutputs() {
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
    setOutputs([]);
  }

  async function render() {
    if (!entry || !parsed?.ok || budget?.ok === false) return;

    releaseOutputs();
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ completed: 0, total: parsed.pages.length });

    let renderer: Awaited<ReturnType<typeof openForRendering>> | null = null;

    try {
      renderer = await openForRendering(entry.data);
      const baseName = sanitizeFilename(entry.name.replace(/\.pdf$/i, '')) || 'document';
      const produced: RenderedOutput[] = [];

      for (const [index, pageNumber] of parsed.pages.entries()) {
        if (controller.signal.aborted) break;

        const page = await renderer.renderPage(pageNumber, {
          scale: scaleValue,
          format: 'image/jpeg',
          quality: quality / 100,
          background,
          signal: controller.signal,
        });

        const previewUrl = URL.createObjectURL(page.blob);
        objectUrls.current.add(previewUrl);

        produced.push({
          // Zero-padded so page 10 does not sort before page 2.
          name: `${baseName}-page-${padIndex(pageNumber, pageCount)}.jpg`,
          blob: page.blob,
          previewUrl,
          pageNumber,
        });

        setProgress({ completed: index + 1, total: parsed.pages.length });
        setOutputs([...produced]);
      }
    } catch (renderError) {
      if (renderError instanceof DOMException && renderError.name === 'AbortError') {
        // Cancelling is not an error; whatever completed stays available.
      } else {
        setError(
          renderError instanceof PdfError
            ? renderError.failure.message
            : 'These pages could not be rendered.',
        );
      }
    } finally {
      await renderer?.destroy();
      setProgress(null);
      abortRef.current = null;
    }
  }

  async function downloadAll() {
    if (outputs.length === 1) {
      const only = outputs[0];
      if (only) downloadBlob(only.blob, only.name);
      return;
    }

    const entries = await Promise.all(
      outputs.map(async (output) => ({
        name: output.name,
        data: new Uint8Array(await output.blob.arrayBuffer()),
      })),
    );

    const archive = await createZip(entries);
    downloadBlob(
      new Blob([archive as BlobPart], { type: 'application/zip' }),
      `${sanitizeFilename(entry?.name.replace(/\.pdf$/i, '') ?? 'pages')}-pages.zip`,
    );
  }

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
              onClick={() => {
                releaseOutputs();
                files.clear();
              }}
              className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
            >
              Choose a different PDF
            </button>
          </div>

          <Field
            label="Pages"
            helper={`"all", or numbers and ranges such as 1-3, 5, 8-10. This document has ${pageCount} pages.`}
            error={parsed && !parsed.ok ? parsed.error : null}
          >
            {(props) => (
              <input
                {...props}
                type="text"
                autoComplete="off"
                value={selection}
                onChange={(event) => setSelection(event.target.value)}
                className={controlClasses}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Resolution"
              value={scale}
              onChange={setScale}
              options={SCALE_PRESETS.map((preset) => ({
                value: preset.value,
                label: preset.label,
              }))}
              helper="A PDF page is measured in points, 72 to the inch, so 2× is about 150 DPI."
            />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="jpeg-quality" className="text-sm font-medium">
                  JPEG quality
                </label>
                <output htmlFor="jpeg-quality" className="tabular text-sm font-semibold">
                  {quality}
                </output>
              </div>
              <input
                id="jpeg-quality"
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="h-11 w-full accent-[color:var(--brand)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="page-background" className="text-sm font-medium">
              Page background
            </label>
            <div className="flex items-center gap-2">
              <input
                id="page-background"
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-md border border-border-strong bg-surface p-1"
              />
              <span className="text-xs text-muted">
                PDF pages are transparent. Without a background they would encode as black.
              </span>
            </div>
          </div>

          <section
            aria-label="Render result"
            aria-live="polite"
            className="rounded-lg border border-border-default bg-surface-sunken p-4"
          >
            {parsed?.ok ? (
              <p className="text-sm">
                Will render{' '}
                <span className="font-semibold">
                  {parsed.pages.length} {parsed.pages.length === 1 ? 'page' : 'pages'}
                </span>{' '}
                ({describePages(parsed.pages)}) to JPEG. Selectable text becomes pixels.
              </p>
            ) : (
              <p className="text-sm text-muted">Enter a page selection.</p>
            )}

            {budget?.ok === false ? (
              <div className="mt-3">
                <InlineError message={budget.error} />
              </div>
            ) : null}

            {error ? (
              <div className="mt-3">
                <InlineError message={error} />
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void render()}
                disabled={progress !== null || !parsed?.ok || budget?.ok === false}
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
              >
                {progress ? 'Rendering…' : 'Convert to JPG'}
              </button>

              {outputs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => void downloadAll()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
                >
                  {outputs.length > 1 ? (
                    <Package className="size-4" aria-hidden="true" />
                  ) : (
                    <Download className="size-4" aria-hidden="true" />
                  )}
                  {outputs.length > 1
                    ? `Download all ${outputs.length} as ZIP`
                    : `Download ${outputs[0]?.name}`}
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

            {outputs.length > 0 ? (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {outputs.map((output) => (
                  <li
                    key={output.name}
                    className="rounded-lg border border-border-default bg-surface p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={output.previewUrl}
                      alt={`Page ${output.pageNumber} rendered as an image`}
                      loading="lazy"
                      className="w-full rounded border border-border-default"
                    />
                    <p className="mt-1.5 truncate text-xs" title={output.name}>
                      Page {output.pageNumber}
                    </p>
                    <p className="text-xs text-muted">{formatBytes(output.blob.size)}</p>
                    <button
                      type="button"
                      onClick={() => downloadBlob(output.blob, output.name)}
                      className="mt-1 inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-2 text-xs font-medium hover:bg-surface-sunken"
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
