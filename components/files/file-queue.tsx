'use client';

import { ArrowDown, ArrowUp, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { formatBytes } from '@/lib/config/limits';
import { cn } from '@/lib/utils/cn';

export type QueueItemStatus = 'pending' | 'working' | 'done' | 'failed' | 'cancelled';

export type QueueItem = {
  id: string;
  name: string;
  size: number;
  status: QueueItemStatus;
  /** User-facing message when the status is `failed`. */
  error?: string;
  /** Preview URL, owned and revoked by the tool that created it. */
  previewUrl?: string;
};

const STATUS_LABELS: Record<QueueItemStatus, string> = {
  pending: 'Waiting',
  working: 'Processing',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/**
 * The list of queued files.
 *
 * Reordering is exposed as real buttons rather than drag-only, so the order can
 * be changed with a keyboard or a screen reader (spec §5.5). Each move is
 * announced through the live region the parent provides.
 */
export function FileQueue({
  items,
  onRemove,
  onMove,
  onClearAll,
  reorderable = false,
  renderDetail,
}: {
  items: readonly QueueItem[];
  onRemove: (id: string) => void;
  onMove?: (id: string, direction: -1 | 1) => void;
  onClearAll?: () => void;
  reorderable?: boolean;
  /** Extra content per row, such as before/after sizes. */
  renderDetail?: (item: QueueItem) => ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">
          {items.length} {items.length === 1 ? 'file' : 'files'}
        </h3>
        {onClearAll ? (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3',
              item.status === 'failed'
                ? 'border-danger-border bg-danger-surface'
                : 'border-border-default bg-surface',
            )}
          >
            {item.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.previewUrl}
                alt=""
                loading="lazy"
                className="size-12 shrink-0 rounded border border-border-default object-cover"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={item.name}>
                {item.name}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {formatBytes(item.size)}
                <span aria-hidden="true"> · </span>
                <span
                  className={cn(
                    item.status === 'done' && 'text-success',
                    item.status === 'failed' && 'text-danger',
                  )}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </p>
              {renderDetail ? <div className="mt-1">{renderDetail(item)}</div> : null}
              {item.error ? (
                <p className="mt-1 flex items-start gap-1.5 text-xs">
                  <TriangleAlert
                    className="mt-0.5 size-3.5 shrink-0 text-danger"
                    aria-hidden="true"
                  />
                  <span>{item.error}</span>
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {reorderable && onMove ? (
                <>
                  <button
                    type="button"
                    onClick={() => onMove(item.id, -1)}
                    disabled={index === 0}
                    className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-foreground disabled:opacity-40"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                    <span className="sr-only">Move {item.name} earlier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(item.id, 1)}
                    disabled={index === items.length - 1}
                    className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-foreground disabled:opacity-40"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                    <span className="sr-only">Move {item.name} later</span>
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Remove {item.name}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
