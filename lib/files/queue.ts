/**
 * Bounded-concurrency job runner (spec §7.8).
 *
 * Image and PDF work is memory-hungry, so only one or two jobs run at a time.
 * Every job is cancellable, and cancellation is checked between jobs as well as
 * passed down via an `AbortSignal` so long operations can bail out mid-flight.
 */

export type JobResult<T> =
  | { status: 'done'; value: T }
  | { status: 'failed'; error: Error }
  | { status: 'cancelled' };

export type ProgressUpdate = {
  completed: number;
  total: number;
  /** Index of the item just finished, so the UI can update one row. */
  index: number;
};

/**
 * Runs `worker` over every item, at most `concurrency` at a time.
 *
 * Results keep their input order regardless of completion order, so a batch
 * always downloads in the sequence the user arranged.
 */
export async function runQueue<Input, Output>(
  items: readonly Input[],
  worker: (item: Input, index: number, signal: AbortSignal) => Promise<Output>,
  options: {
    concurrency: number;
    signal?: AbortSignal;
    onProgress?: (update: ProgressUpdate) => void;
  },
): Promise<JobResult<Output>[]> {
  const results = new Array<JobResult<Output>>(items.length);
  const concurrency = Math.max(1, Math.min(options.concurrency, items.length || 1));

  let nextIndex = 0;
  let completed = 0;

  const signal = options.signal ?? new AbortController().signal;

  async function runOne(): Promise<void> {
    for (;;) {
      if (signal.aborted) return;

      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;

      const item = items[index];
      if (item === undefined) continue;

      try {
        results[index] = { status: 'done', value: await worker(item, index, signal) };
      } catch (error) {
        results[index] = signal.aborted
          ? { status: 'cancelled' }
          : { status: 'failed', error: toError(error) };
      }

      completed += 1;
      options.onProgress?.({ completed, total: items.length, index });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, runOne));

  // Anything never reached because of cancellation is reported as cancelled
  // rather than left undefined.
  for (let index = 0; index < results.length; index += 1) {
    results[index] ??= { status: 'cancelled' };
  }

  return results;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(typeof value === 'string' ? value : 'Something went wrong.');
}

/** Moves an item within an array, returning a new array. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length) return [...items];
  const target = Math.max(0, Math.min(to, items.length - 1));

  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return [...items];
  next.splice(target, 0, moved);
  return next;
}
