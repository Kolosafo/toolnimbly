'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { QueueItem } from '@/components/files/file-queue';
import { imageLimits } from '@/lib/config/limits';
import { downloadBlob } from '@/lib/download/file';
import { validateFile, validateQueueLength } from '@/lib/files/validation';
import type { DetectedType } from '@/lib/files/signatures';
import { runQueue } from '@/lib/files/queue';
import { processImage, type ProcessOptions, type ProcessedImage } from '@/lib/image/process';
import { createZip } from '@/lib/zip/archive';

export type BatchEntry = QueueItem & {
  file: File;
  result?: ProcessedImage;
};

/**
 * The shared state machine behind every batch image tool.
 *
 * It owns validation, the bounded job queue, cancellation, object-URL
 * lifetimes and ZIP assembly, so each tool component contains only its own
 * controls and copy.
 */
export function useImageBatch({
  accept,
  acceptLabel,
  multiple = true,
}: {
  accept: readonly DetectedType[];
  acceptLabel: string;
  multiple?: boolean;
}) {
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  // Every object URL created for a preview, so none is leaked on reset.
  const objectUrls = useRef<Set<string>>(new Set());

  const revokeAll = useCallback(() => {
    for (const url of objectUrls.current) URL.revokeObjectURL(url);
    objectUrls.current.clear();
  }, []);

  // Release preview memory when the tool leaves the page.
  useEffect(() => () => revokeAll(), [revokeAll]);

  const addFiles = useCallback(
    async (files: File[]) => {
      const queueFailure = validateQueueLength(
        multiple ? entries.length : 0,
        files.length,
        multiple ? imageLimits.maxQueueLength : 1,
      );

      const messages: string[] = [];
      if (queueFailure) {
        setRejections([queueFailure.message]);
        return;
      }

      const accepted: BatchEntry[] = [];

      for (const file of files) {
        const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
        const validation = validateFile(file, header, {
          accept,
          maxBytes: imageLimits.maxFileBytes,
          acceptLabel,
        });

        if (!validation.ok) {
          messages.push(`${file.name}: ${validation.failure.message}`);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.add(previewUrl);

        accepted.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          name: file.name,
          size: file.size,
          status: 'pending',
          previewUrl,
          file,
        });
      }

      setRejections(messages);
      setEntries((current) => (multiple ? [...current, ...accepted] : accepted.slice(0, 1)));
    },
    [accept, acceptLabel, entries.length, multiple],
  );

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => {
      const entry = current.find((item) => item.id === id);
      if (entry?.previewUrl) {
        URL.revokeObjectURL(entry.previewUrl);
        objectUrls.current.delete(entry.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    revokeAll();
    setEntries([]);
    setRejections([]);
    setProgress(null);
  }, [revokeAll]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const run = useCallback(
    async (options: ProcessOptions) => {
      if (entries.length === 0) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setProgress({ completed: 0, total: entries.length });
      setEntries((current) =>
        current.map((entry) => ({ ...entry, status: 'working', error: undefined })),
      );

      const results = await runQueue(
        entries,
        async (entry, _index, signal) => processImage(entry.file, options, signal),
        {
          concurrency: imageLimits.maxConcurrentJobs,
          signal: controller.signal,
          onProgress: (update) => setProgress({ completed: update.completed, total: update.total }),
        },
      );

      setEntries((current) =>
        current.map((entry, index) => {
          const result = results[index];
          if (!result) return { ...entry, status: 'cancelled' as const };

          if (result.status === 'done') {
            return { ...entry, status: 'done' as const, result: result.value, error: undefined };
          }
          if (result.status === 'cancelled') {
            return { ...entry, status: 'cancelled' as const, error: undefined };
          }
          return { ...entry, status: 'failed' as const, error: result.error.message };
        }),
      );

      setProgress(null);
      abortRef.current = null;
    },
    [entries],
  );

  const downloadOne = useCallback((entry: BatchEntry) => {
    if (!entry.result) return;
    downloadBlob(entry.result.blob, entry.result.filename);
  }, []);

  const downloadAllAsZip = useCallback(
    async (archiveName: string) => {
      const successful = entries.filter((entry) => entry.result);
      if (successful.length === 0) return;

      const zipEntries = await Promise.all(
        successful.map(async (entry) => ({
          name: entry.result?.filename ?? entry.name,
          data: new Uint8Array(await (entry.result as ProcessedImage).blob.arrayBuffer()),
        })),
      );

      const archive = await createZip(zipEntries);
      downloadBlob(new Blob([archive as BlobPart], { type: 'application/zip' }), `${archiveName}.zip`);
    },
    [entries],
  );

  const successful = entries.filter((entry) => entry.status === 'done' && entry.result);

  return {
    entries,
    rejections,
    progress,
    successful,
    addFiles,
    removeEntry,
    clearAll,
    cancel,
    run,
    downloadOne,
    downloadAllAsZip,
    isWorking: progress !== null,
  };
}
