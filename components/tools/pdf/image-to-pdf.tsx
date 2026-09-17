'use client';

import { Download, FilePlus2 } from 'lucide-react';
import { useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { FileDropzone } from '@/components/files/file-dropzone';
import { FileQueue } from '@/components/files/file-queue';
import { SelectField } from '@/components/forms/select-field';
import { formatBytes, imageLimits } from '@/lib/config/limits';
import { downloadBlob } from '@/lib/download/file';
import type { DetectedType } from '@/lib/files/signatures';
import { validateFile, validateQueueLength } from '@/lib/files/validation';
import {
  assembleImagesToPdf,
  MARGIN_PRESETS,
  PAGE_SIZES,
  type ImageFit,
  type MarginKey,
  type PageOrientation,
  type PageSizeKey,
} from '@/lib/pdf/assemble';
import { loadPdf, PdfError } from '@/lib/pdf/document';
import { moveItem } from '@/lib/files/queue';

type Entry = {
  id: string;
  name: string;
  size: number;
  data: Uint8Array;
  type: 'image/jpeg' | 'image/png';
  previewUrl: string;
};

export type ImageToPdfConfig = {
  accept: readonly DetectedType[];
  acceptAttribute: string;
  acceptLabel: string;
  dropzoneLabel: string;
  outputName: string;
};

const PAGE_SIZE_OPTIONS = (Object.keys(PAGE_SIZES) as PageSizeKey[]).map((key) => ({
  value: key,
  label: PAGE_SIZES[key].label,
}));

const ORIENTATION_OPTIONS = [
  { value: 'auto' as const, label: 'Auto — match each image' },
  { value: 'portrait' as const, label: 'Portrait' },
  { value: 'landscape' as const, label: 'Landscape' },
];

const MARGIN_OPTIONS = (Object.keys(MARGIN_PRESETS) as MarginKey[]).map((key) => ({
  value: key,
  label: MARGIN_PRESETS[key].label,
}));

const FIT_OPTIONS = [
  { value: 'contain' as const, label: 'Contain — show the whole image' },
  { value: 'cover' as const, label: 'Cover — fill the page and crop' },
];

/**
 * Shared by the image-to-PDF and JPG-to-PDF routes (spec §6.23, §6.25).
 *
 * The JPG route exists for a distinct, common intent but reuses this engine
 * rather than duplicating it.
 */
export function ImageToPdfTool({ config }: { config: ImageToPdfConfig }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeKey>('a4');
  const [orientation, setOrientation] = useState<PageOrientation>('auto');
  const [margin, setMargin] = useState<MarginKey>('small');
  const [fit, setFit] = useState<ImageFit>('contain');
  const [result, setResult] = useState<{ bytes: Uint8Array; pageCount: number; cropped: boolean } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function addFiles(files: File[]) {
    const queueFailure = validateQueueLength(entries.length, files.length, imageLimits.maxQueueLength);
    if (queueFailure) {
      setRejections([queueFailure.message]);
      return;
    }

    const accepted: Entry[] = [];
    const messages: string[] = [];

    for (const file of files) {
      const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
      const validation = validateFile(file, header, {
        accept: config.accept,
        maxBytes: imageLimits.maxFileBytes,
        acceptLabel: config.acceptLabel,
      });

      if (!validation.ok) {
        messages.push(`${file.name}: ${validation.failure.message}`);
        continue;
      }

      accepted.push({
        id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        data: new Uint8Array(await file.arrayBuffer()),
        type: validation.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
        previewUrl: URL.createObjectURL(file),
      });
    }

    setRejections(messages);
    setEntries((current) => [...current, ...accepted]);
    setResult(null);
  }

  function remove(id: string) {
    setEntries((current) => {
      const entry = current.find((candidate) => candidate.id === id);
      if (entry) URL.revokeObjectURL(entry.previewUrl);
      return current.filter((candidate) => candidate.id !== id);
    });
    setResult(null);
  }

  function move(id: string, direction: -1 | 1) {
    setEntries((current) => {
      const index = current.findIndex((entry) => entry.id === id);
      if (index === -1) return current;
      return moveItem(current, index, index + direction);
    });
    setResult(null);
  }

  function clearAll() {
    for (const entry of entries) URL.revokeObjectURL(entry.previewUrl);
    setEntries([]);
    setRejections([]);
    setResult(null);
  }

  async function create() {
    setWorking(true);
    setError(null);

    try {
      const assembled = await assembleImagesToPdf(
        entries.map((entry) => ({ data: entry.data, type: entry.type, name: entry.name })),
        { pageSize, orientation, margin, fit },
      );

      // Confirm the document parses and has one page per image before offering it.
      const verified = await loadPdf(assembled.bytes);
      if (verified.pageCount !== entries.length) {
        setError(
          `The generated PDF has ${verified.pageCount} pages but should have ${entries.length}.`,
        );
        return;
      }

      setResult(assembled);
    } catch (createError) {
      setError(
        createError instanceof PdfError
          ? createError.failure.message
          : 'The PDF could not be created.',
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      <FileDropzone
        onFiles={(files) => void addFiles(files)}
        accept={config.acceptAttribute}
        multiple
        label={config.dropzoneLabel}
        hint={`${config.acceptLabel}. Up to ${formatBytes(imageLimits.maxFileBytes)} each, ${imageLimits.maxQueueLength} images per document.`}
        disabled={working}
      />

      {rejections.map((message) => (
        <div key={message} className="mt-4">
          <InlineError message={message} />
        </div>
      ))}

      <FileQueue
        items={entries.map((entry) => ({
          id: entry.id,
          name: entry.name,
          size: entry.size,
          status: 'pending' as const,
          previewUrl: entry.previewUrl,
        }))}
        onRemove={remove}
        onMove={move}
        onClearAll={clearAll}
        reorderable
      />

      {entries.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Page size"
              value={pageSize}
              onChange={setPageSize}
              options={PAGE_SIZE_OPTIONS}
              helper="A4 and Letter are written as real physical sizes, so printing is accurate."
            />
            <SelectField
              label="Orientation"
              value={orientation}
              onChange={setOrientation}
              options={ORIENTATION_OPTIONS}
              {...(pageSize === 'fit' ? { helper: 'Not used when each page fits its image.' } : {})}
            />
            <SelectField label="Margins" value={margin} onChange={setMargin} options={MARGIN_OPTIONS} />
            <SelectField label="Image fit" value={fit} onChange={setFit} options={FIT_OPTIONS} />
          </div>

          {fit === 'cover' ? (
            <p className="mt-3 rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm">
              Cover fills each page edge to edge and crops whatever falls outside. For photographed
              documents or receipts this will cut off content — use contain instead.
            </p>
          ) : null}

          <section
            aria-label="PDF result"
            aria-live="polite"
            className="mt-6 rounded-lg border border-border-default bg-surface-sunken p-4"
          >
            <p className="text-sm">
              {entries.length} {entries.length === 1 ? 'image' : 'images'} in this order will produce
              a <span className="font-semibold">{entries.length}-page</span> PDF, one image per page.
            </p>

            {error ? (
              <div className="mt-3">
                <InlineError message={error} />
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void create()}
                disabled={working}
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-brand px-5 text-base font-medium text-brand-contrast transition-colors hover:bg-brand-hover disabled:opacity-55"
              >
                <FilePlus2 className="size-4" aria-hidden="true" />
                {working ? 'Creating…' : 'Create PDF'}
              </button>

              {result ? (
                <button
                  type="button"
                  onClick={() =>
                    downloadBlob(
                      new Blob([result.bytes as BlobPart], { type: 'application/pdf' }),
                      config.outputName,
                    )
                  }
                  className="inline-flex min-h-12 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download {config.outputName} ({formatBytes(result.bytes.byteLength)})
                </button>
              ) : null}
            </div>

            {result?.cropped ? (
              <p className="mt-3 rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm">
                At least one image was cropped to fill its page. Switch to contain if you need the
                whole image visible.
              </p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}

export function ImageToPdf() {
  return (
    <ImageToPdfTool
      config={{
        accept: ['image/jpeg', 'image/png'],
        acceptAttribute: 'image/jpeg,image/png',
        acceptLabel: 'JPG and PNG',
        dropzoneLabel: 'Drop images here',
        outputName: 'images.pdf',
      }}
    />
  );
}

export function JpgToPdf() {
  return (
    <ImageToPdfTool
      config={{
        accept: ['image/jpeg'],
        acceptAttribute: 'image/jpeg',
        acceptLabel: 'JPG and JPEG only',
        dropzoneLabel: 'Drop JPG photos here',
        outputName: 'photos.pdf',
      }}
    />
  );
}
