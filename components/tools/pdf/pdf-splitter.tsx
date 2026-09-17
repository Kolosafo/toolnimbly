'use client';

import { Download, Package, Split } from 'lucide-react';
import { useMemo, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { Field, controlClasses } from '@/components/forms/field';
import { SegmentedControl } from '@/components/forms/segmented-control';
import { formatBytes, pdfLimits } from '@/lib/config/limits';
import { downloadBlob, padIndex } from '@/lib/download/file';
import { extractPages, loadPdf, PdfError, verifyOutput } from '@/lib/pdf/document';
import {
  describePages,
  groupIntoRuns,
  invertPages,
  parsePageRanges,
} from '@/lib/pdf/page-ranges';
import { createZip } from '@/lib/zip/archive';

import { usePdfFiles } from './use-pdf-files';

type SplitMode = 'extract' | 'each' | 'ranges' | 'remove';

const MODE_OPTIONS = [
  {
    value: 'extract' as const,
    label: 'Extract pages',
    description: 'One new PDF containing the pages you choose',
  },
  {
    value: 'ranges' as const,
    label: 'Split by ranges',
    description: 'One PDF per range you list',
  },
  {
    value: 'each' as const,
    label: 'Every page separately',
    description: 'One PDF per page',
  },
  {
    value: 'remove' as const,
    label: 'Remove pages',
    description: 'Keep everything except the pages you list',
  },
];

type OutputFile = { name: string; bytes: Uint8Array; pageCount: number };

export function PdfSplitter() {
  const files = usePdfFiles({ multiple: false, maxFiles: 1 });
  const [mode, setMode] = useState<SplitMode>('extract');
  const [selection, setSelection] = useState('');
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const entry = files.entries[0] ?? null;
  const pageCount = entry?.pageCount ?? 0;

  const parsed = useMemo(() => {
    if (!entry) return null;
    if (mode === 'each') {
      return {
        ok: true as const,
        pages: Array.from({ length: pageCount }, (_, index) => index + 1),
        normalized: `all ${pageCount} pages`,
        notes: [],
      };
    }
    if (selection.trim() === '') return null;
    return parsePageRanges(selection, pageCount);
  }, [entry, mode, selection, pageCount]);

  /** What the chosen mode will actually produce, shown before generating. */
  const preview = useMemo(() => {
    if (!parsed?.ok || !entry) return null;

    if (mode === 'extract') {
      return { files: 1, description: `One PDF containing pages ${describePages(parsed.pages)}` };
    }
    if (mode === 'each') {
      return { files: pageCount, description: `${pageCount} PDFs, one per page` };
    }
    if (mode === 'ranges') {
      const runs = groupIntoRuns(parsed.pages);
      return {
        files: runs.length,
        description: `${runs.length} ${runs.length === 1 ? 'PDF' : 'PDFs'}: ${runs
          .map((run) => describePages(run))
          .join(', ')}`,
      };
    }

    const kept = invertPages(parsed.pages, pageCount);
    if (kept.length === 0) {
      return { files: 0, description: 'That would remove every page, leaving nothing.' };
    }
    return {
      files: 1,
      description: `One PDF containing pages ${describePages(kept)} — ${kept.length} of ${pageCount}`,
    };
  }, [parsed, mode, pageCount, entry]);

  async function split() {
    if (!entry || !parsed?.ok) return;

    setWorking(true);
    setError(null);
    setOutputs([]);

    try {
      const loaded = await loadPdf(entry.data);
      const baseName = entry.name.replace(/\.pdf$/i, '');
      const produced: OutputFile[] = [];

      const groups: number[][] =
        mode === 'extract'
          ? [parsed.pages]
          : mode === 'each'
            ? parsed.pages.map((page) => [page])
            : mode === 'ranges'
              ? groupIntoRuns(parsed.pages)
              : [invertPages(parsed.pages, pageCount)];

      if (groups.length === 0 || groups[0]?.length === 0) {
        setError('That selection would produce an empty document.');
        return;
      }

      for (const [index, pages] of groups.entries()) {
        const bytes = await extractPages(loaded.document, pages);

        // Confirm each output is a real PDF with the right page count.
        const verification = await verifyOutput(bytes, {
          pageCount: pages.length,
          geometry: pages
            .map((page) => loaded.pages[page - 1])
            .filter((geometry): geometry is NonNullable<typeof geometry> => Boolean(geometry)),
        });

        if (!verification.ok) {
          setError(verification.error);
          return;
        }

        const suffix =
          mode === 'each'
            ? `page-${padIndex(pages[0] ?? 1, pageCount)}`
            : groups.length > 1
              ? `part-${padIndex(index + 1, groups.length)}`
              : `pages-${describePages(pages).replace(/,\s*/g, '_').replace(/\s/g, '')}`;

        produced.push({
          name: `${baseName}-${suffix}.pdf`,
          bytes,
          pageCount: pages.length,
        });
      }

      setOutputs(produced);
    } catch (splitError) {
      setError(
        splitError instanceof PdfError ? splitError.failure.message : 'This PDF could not be split.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function downloadAll() {
    if (outputs.length === 1) {
      const only = outputs[0];
      if (only) {
        downloadBlob(new Blob([only.bytes as BlobPart], { type: 'application/pdf' }), only.name);
      }
      return;
    }

    const archive = await createZip(
      outputs.map((output) => ({ name: output.name, data: output.bytes })),
    );
    downloadBlob(
      new Blob([archive as BlobPart], { type: 'application/zip' }),
      `${entry?.name.replace(/\.pdf$/i, '') ?? 'split'}-split.zip`,
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
              onClick={files.clear}
              className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-sm text-muted hover:text-foreground"
            >
              Choose a different PDF
            </button>
          </div>

          <SegmentedControl
            legend="What do you want to do?"
            value={mode}
            onChange={(value) => {
              setMode(value);
              setOutputs([]);
            }}
            options={MODE_OPTIONS}
            columns="stack"
          />

          {mode !== 'each' ? (
            <Field
              label={mode === 'remove' ? 'Pages to remove' : 'Pages to keep'}
              helper={`Use numbers and ranges, for example 1-3, 5, 8-10. This document has ${pageCount} pages.`}
              error={parsed && !parsed.ok ? parsed.error : null}
            >
              {(props) => (
                <input
                  {...props}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={selection}
                  onChange={(event) => {
                    setSelection(event.target.value);
                    setOutputs([]);
                  }}
                  placeholder={`1-${Math.min(3, pageCount)}`}
                  className={controlClasses}
                />
              )}
            </Field>
          ) : null}

          {parsed?.ok && parsed.notes.length > 0 ? (
            <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
              {parsed.notes.join(' ')}
            </p>
          ) : null}

          <section
            aria-label="Split result"
            aria-live="polite"
            className="rounded-lg border border-border-default bg-surface-sunken p-4"
          >
            {preview ? (
              <p className="text-sm">
                <span className="font-medium">This will produce: </span>
                {preview.description}
              </p>
            ) : (
              <p className="text-sm text-muted">
                Enter a page selection to see what will be produced.
              </p>
            )}

            {error ? (
              <div className="mt-3">
                <InlineError message={error} />
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void split()}
                disabled={working || !parsed?.ok || preview?.files === 0}
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
              >
                <Split className="size-4" aria-hidden="true" />
                {working ? 'Splitting…' : 'Split PDF'}
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

            {outputs.length > 0 ? (
              <ul className="mt-4 space-y-1.5">
                {outputs.map((output) => (
                  <li key={output.name} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono">{output.name}</span>
                    <span className="text-muted">
                      {output.pageCount} {output.pageCount === 1 ? 'page' : 'pages'} ·{' '}
                      {formatBytes(output.bytes.byteLength)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          new Blob([output.bytes as BlobPart], { type: 'application/pdf' }),
                          output.name,
                        )
                      }
                      className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-2.5 font-medium hover:bg-surface-sunken"
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
