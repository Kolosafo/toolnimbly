'use client';

import { Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * A drop zone that is also a real file input (spec §5.3).
 *
 * The visible control is a `<label>` wrapping a genuine `<input type="file">`,
 * so it is keyboard-operable, announced correctly and usable without
 * drag-and-drop. Dropping is an enhancement layered on top, never the only way
 * in.
 */
export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  label,
  hint,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  /** `accept` attribute value, e.g. "image/jpeg,image/png". */
  accept: string;
  multiple?: boolean;
  label: string;
  hint: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const id = useId();
  const hintId = `${id}-hint`;

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    onFiles(Array.from(list));
    // Clearing the value means selecting the same file twice still fires.
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        'rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus-ring)]',
        dragging ? 'border-brand bg-brand-surface' : 'border-border-strong bg-surface',
        disabled && 'opacity-55',
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          'flex flex-col items-center gap-3',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-surface">
          <Upload className="size-5 text-brand" aria-hidden="true" />
        </span>
        <span className="text-base font-medium">{label}</span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={hintId}
          onChange={(event) => handleFiles(event.target.files)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 text-sm font-medium text-brand-contrast"
        >
          Choose {multiple ? 'files' : 'a file'}
        </span>
      </label>
      <p id={hintId} className="mt-3 text-sm text-muted">
        {hint}
      </p>
      <p className="mt-2 text-xs text-subtle">
        Files are processed on your device and are never uploaded.
      </p>
    </div>
  );
}
