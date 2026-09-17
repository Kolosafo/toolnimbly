import { describe, expect, it, vi } from 'vitest';

import { moveItem, runQueue } from '@/lib/files/queue';

describe('bounded job queue', () => {
  it('processes every item and preserves input order in the results', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];

    const results = await runQueue(
      items,
      async (item) => {
        // Reverse the natural completion order so out-of-order finishing is
        // actually exercised.
        await new Promise((resolve) => setTimeout(resolve, (10 - item) * 2));
        return item * 10;
      },
      { concurrency: 3 },
    );

    expect(results.map((r) => (r.status === 'done' ? r.value : null))).toEqual([
      10, 20, 30, 40, 50, 60, 70, 80,
    ]);
  });

  it('never exceeds the configured concurrency', async () => {
    let active = 0;
    let peak = 0;

    await runQueue(
      Array.from({ length: 12 }, (_, i) => i),
      async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return null;
      },
      { concurrency: 2 },
    );

    expect(peak).toBeLessThanOrEqual(2);
    expect(peak).toBe(2);
  });

  it('isolates a failure to its own item', async () => {
    const results = await runQueue(
      [1, 2, 3],
      async (item) => {
        if (item === 2) throw new Error('this one is broken');
        return item;
      },
      { concurrency: 2 },
    );

    expect(results[0]?.status).toBe('done');
    expect(results[1]?.status).toBe('failed');
    expect(results[2]?.status).toBe('done');
    if (results[1]?.status === 'failed') {
      expect(results[1].error.message).toBe('this one is broken');
    }
  });

  it('stops starting new work once cancelled', async () => {
    const controller = new AbortController();
    const started: number[] = [];

    const results = await runQueue(
      Array.from({ length: 20 }, (_, i) => i),
      async (item) => {
        started.push(item);
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (item === 2) controller.abort();
        return item;
      },
      { concurrency: 1, signal: controller.signal },
    );

    // Far fewer than 20 items were ever begun.
    expect(started.length).toBeLessThan(10);
    expect(results.some((r) => r.status === 'cancelled')).toBe(true);
  });

  it('reports progress once per completed item', async () => {
    const onProgress = vi.fn();

    await runQueue([1, 2, 3, 4], async (item) => item, { concurrency: 2, onProgress });

    expect(onProgress).toHaveBeenCalledTimes(4);
    const last = onProgress.mock.calls.at(-1)?.[0];
    expect(last).toMatchObject({ completed: 4, total: 4 });
  });

  it('handles an empty input list', async () => {
    const results = await runQueue([], async () => null, { concurrency: 2 });
    expect(results).toEqual([]);
  });

  it('passes a signal the worker can observe', async () => {
    const controller = new AbortController();
    controller.abort();

    const results = await runQueue([1, 2, 3], async (item) => item, {
      concurrency: 1,
      signal: controller.signal,
    });

    expect(results.every((r) => r.status === 'cancelled')).toBe(true);
  });
});

describe('reordering', () => {
  it('moves an item forwards and backwards', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(items, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('is a no-op when the position does not change', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 1, 1)).toEqual(items);
  });

  it('clamps an out-of-range destination', () => {
    const items = ['a', 'b', 'c'];
    expect(moveItem(items, 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveItem(items, 2, -5)).toEqual(['c', 'a', 'b']);
  });

  it('never loses or duplicates an item', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    for (let from = 0; from < items.length; from += 1) {
      for (let to = 0; to < items.length; to += 1) {
        const moved = moveItem(items, from, to);
        expect(moved).toHaveLength(items.length);
        expect([...moved].sort()).toEqual([...items].sort());
      }
    }
  });

  it('does not modify the input', () => {
    const items = ['a', 'b', 'c'];
    moveItem(items, 0, 2);
    expect(items).toEqual(['a', 'b', 'c']);
  });
});
