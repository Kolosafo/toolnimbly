'use client';

import { Combine, Download } from 'lucide-react';
import { useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { FileQueue } from '@/components/files/file-queue';
import { formatBytes, pdfLimits } from '@/lib/config/limits';
import { downloadBlob } from '@/lib/download/file';
import { describePageSize, mergePdfs, PdfError, verifyOutput } from '@/lib/pdf/document';

import { usePdfFiles } from './use-pdf-files';

export function PdfMerger() {
  const files = usePdfFiles({ multiple: true, maxFiles: pdfLimits.maxMergeInputs });
  const [result, setResult] = useState<{ bytes: Uint8Array; pageCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const totalPages = files.entries.reduce((sum, entry) => sum + entry.pageCount, 0);

  async function merge() {
    setWorking(true);
    setError(null);
    setResult(null);

    try {
      const merged = await mergePdfs(
        files.entries.map((entry) => ({ name: entry.name, data: entry.data })),
      );

      // Never claim success because the process finished: re-read the output
      // and confirm its page count before offering it.
      const verification = await verifyOutput(merged.bytes, { pageCount: totalPages });
      if (!verification.ok) {
        setError(verification.error);
        return;
      }

      setResult({ bytes: merged.bytes, pageCount: merged.pageCount });
    } catch (mergeError) {
      setError(
        mergeError instanceof PdfError
          ? mergeError.failure.message
          : 'The PDFs could not be merged.',
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      <FileDropzone
        onFiles={(incoming) => void files.addFiles(incoming)}
        accept="application/pdf"
        multiple
        label="Drop PDFs here"
        hint={`${pdfLimits.minMergeInputs} to ${pdfLimits.maxMergeInputs} PDFs, up to ${formatBytes(pdfLimits.maxFileBytes)} each.`}
        disabled={working}
      />

      {files.rejections.map((message) => (
        <div key={message} className="mt-4">
          <InlineError message={message} />
        </div>
      ))}

      {error ? (
        <div className="mt-4">
          <InlineError message={error} />
        </div>
      ) : null}

      <FileQueue
        items={files.entries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          size: entry.size,
          status: 'pending' as const,
        }))}
        onRemove={files.remove}
        onMove={files.move}
        onClearAll={files.clear}
        reorderable
        renderDetail={(item) => {
          const entry = files.entries.find((candidate) => candidate.id === item.id);
          if (!entry) return null;
          return (
            <p className="text-xs text-muted">
              {entry.pageCount} {entry.pageCount === 1 ? 'page' : 'pages'}
              {entry.pages[0] ? ` · ${describePageSize(entry.pages[0])}` : ''}
            </p>
          );
        }}
      />

      {files.entries.length > 0 ? (
        <section
          aria-label="Merge result"
          aria-live="polite"
          className="mt-6 rounded-lg border border-border-default bg-surface-sunken p-4"
        >
          <p className="text-sm">
            {files.entries.length} {files.entries.length === 1 ? 'file' : 'files'} in this order
            will produce a <span className="font-semibold">{totalPages}-page</span> document. Each
            page keeps its original size and rotation.
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void merge()}
              disabled={working || files.entries.length < pdfLimits.minMergeInputs}
              className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
            >
              <Combine className="size-4" aria-hidden="true" />
              {working ? 'Merging…' : 'Merge PDFs'}
            </button>

            {result ? (
              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    new Blob([result.bytes as BlobPart], { type: 'application/pdf' }),
                    'merged.pdf',
                  )
                }
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
              >
                <Download className="size-4" aria-hidden="true" />
                Download merged.pdf ({result.pageCount} pages)
              </button>
            ) : null}
          </div>

          {files.entries.length < pdfLimits.minMergeInputs ? (
            <p className="mt-2 text-xs text-muted">
              Add at least {pdfLimits.minMergeInputs} PDFs to merge.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
