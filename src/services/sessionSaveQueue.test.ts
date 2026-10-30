import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSessionSaveQueue } from './sessionSaveQueue';

describe('createSessionSaveQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('batches quick selection changes into one write', async () => {
    const saved: string[] = [];
    const queue = createSessionSaveQueue(async (value: string) => { saved.push(value); }, 500);

    queue.schedule('selection A');
    queue.schedule('selection B');
    await vi.advanceTimersByTimeAsync(600);

    expect(saved).toEqual(['selection B']);
  });

  it('does not let a pending selection save overwrite a later state change', async () => {
    // Bug: picking a folder and clicking "Organize Selected" within 0.5 s let the
    // stale "selecting" write land after "organizing", so the run was discarded.
    const saved: string[] = [];
    const queue = createSessionSaveQueue(async (value: string) => { saved.push(value); }, 500);

    queue.schedule('selecting');
    await vi.advanceTimersByTimeAsync(400);
    await queue.saveNow('organizing');
    await vi.advanceTimersByTimeAsync(600);

    expect(saved).toEqual(['organizing']);
  });

  it('drops a pending save when cancelled', async () => {
    const saved: string[] = [];
    const queue = createSessionSaveQueue(async (value: string) => { saved.push(value); }, 500);

    queue.schedule('selecting');
    queue.cancel();
    await vi.advanceTimersByTimeAsync(600);

    expect(saved).toEqual([]);
  });
});
