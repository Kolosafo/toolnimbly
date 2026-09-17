'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { pdfLimits } from '@/lib/config/limits';
import { validateFile, validateQueueLength } from '@/lib/files/validation';
import { loadPdf, PdfError, type PageGeometry } from '@/lib/pdf/document';

export type PdfEntry = {
  id: string;
  name: string;
  size: number;
  data: Uint8Array;
  pageCount: number;
  pages: PageGeometry[];
};

/**
 * Loading, validating and ordering PDF inputs.
 *
 * Shared by the merger, splitter, compressor and PDF-to-JPG tools. A file that
 * fails validation is reported by name and leaves the rest of the queue intact
 * (spec §6.27).
 */
export function usePdfFiles({ multiple, maxFiles }: { multiple: boolean; maxFiles: number }) {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Guards against a stale async add landing after a reset.
  const generation = useRef(0);

  useEffect(() => {
    return () => {
      generation.current += 1;
    };
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const current = multiple ? entries.length : 0;
      const queueFailure = validateQueueLength(current, files.length, maxFiles);
      if (queueFailure) {
        setRejections([queueFailure.message]);
        return;
      }

      const token = generation.current;
      setLoading(true);
      const accepted: PdfEntry[] = [];
      const messages: string[] = [];

      for (const file of files) {
        const header = new Uint8Array(await file.slice(0, 32).arrayBuffer());
        const validation = validateFile(file, header, {
          accept: ['application/pdf'],
          maxBytes: pdfLimits.maxFileBytes,
          acceptLabel: 'PDF files',
        });

        if (!validation.ok) {
          messages.push(`${file.name}: ${validation.failure.message}`);
          continue;
        }

        try {
          const data = new Uint8Array(await file.arrayBuffer());
          const loaded = await loadPdf(data);
          accepted.push({
            id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
            name: file.name,
            size: file.size,
            data,
            pageCount: loaded.pageCount,
            pages: loaded.pages,
          });
        } catch (error) {
          messages.push(
            `${file.name}: ${error instanceof PdfError ? error.failure.message : 'This PDF could not be read.'}`,
          );
        }
      }

      if (token !== generation.current) return;

      setRejections(messages);
      setEntries((existing) => (multiple ? [...existing, ...accepted] : accepted.slice(0, 1)));
      setLoading(false);
    },
    [entries.length, maxFiles, multiple],
  );

  const remove = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setEntries((current) => {
      const index = current.findIndex((entry) => entry.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) return current;

      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (!moved) return current;
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    generation.current += 1;
    setEntries([]);
    setRejections([]);
    setLoading(false);
  }, []);

  return { entries, rejections, loading, addFiles, remove, move, clear };
}
