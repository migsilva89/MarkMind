import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeBatchSize, getBatchSize, splitFailedBatch, organizeBookmarks } from './bulkOrganize';
import { callProvider, getApiKey } from './providerUtils';
import { type CompactBookmark } from '../../types/organize';
import { createRetryableError } from '../../utils/helpers';

vi.mock('./providerUtils', () => ({ callProvider: vi.fn(), getApiKey: vi.fn() }));

describe('computeBatchSize', () => {
  it('uses a safe fallback when the model limit is unknown', () => {
    // 4096 * 0.6 / 70 = 35.1 -> 35
    expect(computeBatchSize(undefined)).toBe(35);
  });

  it('clamps tiny models up to the minimum batch size', () => {
    // 1000 * 0.6 / 70 = 8.5 -> clamped to 25
    expect(computeBatchSize(1000)).toBe(25);
  });

  it('clamps huge models down to the maximum batch size', () => {
    expect(computeBatchSize(1_000_000)).toBe(150);
  });

  it('scales with a mid-range model output limit', () => {
    // 8192 * 0.6 / 70 = 70.2 -> 70
    expect(computeBatchSize(8192)).toBe(70);
  });
});

describe('local provider batching', () => {
  it('uses small fixed groups for the Custom provider', () => {
    expect(getBatchSize('custom', undefined)).toBe(15);
    expect(getBatchSize('custom', 1_000_000)).toBe(15);
  });

  it('leaves cloud providers on the token-based size', () => {
    expect(getBatchSize('google', 8192)).toBe(computeBatchSize(8192));
    expect(getBatchSize('openai', undefined)).toBe(35);
  });

  it('splits a failed local batch in half', () => {
    const halves = splitFailedBatch('custom', [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(halves).toEqual([[1, 2, 3, 4, 5], [6, 7, 8, 9]]);
  });

  it('stops splitting below the minimum size', () => {
    expect(splitFailedBatch('custom', [1, 2, 3, 4, 5, 6, 7])).toBeNull();
  });

  it('never splits for cloud providers', () => {
    expect(splitFailedBatch('anthropic', Array.from({ length: 40 }, (_, i) => i))).toBeNull();
  });
});

const makeBookmarks = (count: number): CompactBookmark[] =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    title: `Site ${index + 1}`,
    url: `https://example${index + 1}.com`,
    currentFolderPath: 'Misc',
  }) as CompactBookmark);

// Answers with valid JSON only for batches up to `maxGoodBatch` bookmarks —
// mimics a small local model that breaks its JSON on larger groups.
const fakeModel = (maxGoodBatch: number) =>
  vi.fn(async (...args: unknown[]) => {
    const bookmarkCount = args[6] as number;
    const userPrompt = args[3] as string;
    if (bookmarkCount > maxGoodBatch) return '{"folders": [ { "path": "Dev" "oops" ';
    const ids = [...userPrompt.matchAll(/ID: (\d+) \|/g)].map(match => match[1]);
    return JSON.stringify({
      folders: [{ path: 'Dev', description: 'Dev', isNew: true }],
      assignments: ids.map(id => ({ bookmarkId: id, suggestedPath: 'Dev' })),
      summary: 'ok',
    });
  });

describe('organizeBookmarks with a local provider', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', { storage: { local: { get: vi.fn(async () => ({})) } } });
    vi.mocked(getApiKey).mockResolvedValue('');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(callProvider).mockReset();
  });

  it('recovers a failed group by splitting it instead of dropping it', async () => {
    vi.mocked(callProvider).mockImplementation(fakeModel(8));

    const result = await organizeBookmarks('custom', 'qwen2.5:3b', makeBookmarks(30), '', {});

    expect(result.assignments).toHaveLength(30);
    expect(result.folderPlan.summary).not.toContain("couldn't be processed");
  });

  it('reports bookmarks it still cannot organize after splitting', async () => {
    // 15 -> 8 + 7. The 8 succeed as 4 + 4; the 7 are below the split minimum and fail.
    vi.mocked(callProvider).mockImplementation(fakeModel(6));

    const result = await organizeBookmarks('custom', 'qwen2.5:3b', makeBookmarks(15), '', {});

    expect(result.assignments).toHaveLength(8);
    expect(result.folderPlan.summary).toContain("7 couldn't be processed");
  });

  it('surfaces the real error when no piece succeeds', async () => {
    vi.mocked(callProvider).mockImplementation(fakeModel(3));

    await expect(organizeBookmarks('custom', 'qwen2.5:3b', makeBookmarks(15), '', {}))
      .rejects.toThrow("wasn't readable");
  });

  it('keeps one group per pass for cloud providers', async () => {
    vi.mocked(callProvider).mockImplementation(fakeModel(8));

    // 30 bookmarks fit one cloud batch (35); the broken reply is not split.
    await expect(organizeBookmarks('openai', 'gpt', makeBookmarks(30), '', {}))
      .rejects.toThrow("wasn't readable");
    expect(callProvider).toHaveBeenCalledTimes(1);
  });
});

describe('organizeBookmarks cancellation', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', { storage: { local: { get: vi.fn(async () => ({})) } } });
    vi.mocked(getApiKey).mockResolvedValue('');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(callProvider).mockReset();
  });

  it('passes the cancel signal down to the provider call', async () => {
    const controller = new AbortController();
    vi.mocked(callProvider).mockImplementation(fakeModel(15));

    await organizeBookmarks('openai', 'gpt', makeBookmarks(5), '', {}, undefined, undefined, controller.signal);

    expect(vi.mocked(callProvider).mock.calls[0][8]).toBe(controller.signal);
  });

  it('stops scheduling further batches once cancelled', async () => {
    const controller = new AbortController();
    const answer = fakeModel(15);
    vi.mocked(callProvider).mockImplementation(async (...args: unknown[]) => {
      const reply = await answer(...args);
      controller.abort();
      return reply;
    });

    // 45 bookmarks = 3 local batches of 15; cancel lands during the first.
    await expect(organizeBookmarks('custom', 'qwen2.5:3b', makeBookmarks(45), '', {}, undefined, undefined, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(callProvider).toHaveBeenCalledTimes(1);
  });

  it('does not retry or split a cancelled batch', async () => {
    const controller = new AbortController();
    vi.mocked(callProvider).mockImplementation(async () => {
      controller.abort();
      throw new DOMException('Organizing was cancelled.', 'AbortError');
    });

    await expect(organizeBookmarks('custom', 'qwen2.5:3b', makeBookmarks(15), '', {}, undefined, undefined, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(callProvider).toHaveBeenCalledTimes(1);
  });

  it('stops waiting to retry when cancelled during the backoff', async () => {
    const controller = new AbortController();
    vi.mocked(callProvider).mockImplementation(async () => {
      setTimeout(() => controller.abort(), 10);
      throw createRetryableError('The AI service is busy.');
    });

    await expect(organizeBookmarks('openai', 'gpt', makeBookmarks(5), '', {}, undefined, undefined, controller.signal))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(callProvider).toHaveBeenCalledTimes(1);
  });
});

describe('organizeBookmarks assignment validation', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', { storage: { local: { get: vi.fn(async () => ({})) } } });
    vi.mocked(getApiKey).mockResolvedValue('');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(callProvider).mockReset();
    vi.restoreAllMocks();
  });

  it('keeps only real bookmark IDs from the batch, once each', async () => {
    // Bug: an invented ID ("999") and a repeated one were counted — "207 moved" for 206.
    vi.mocked(callProvider).mockResolvedValue(JSON.stringify({
      folders: [{ path: 'Dev', description: 'Dev', isNew: true }],
      assignments: [
        { bookmarkId: '1', suggestedPath: 'Dev' },
        { bookmarkId: '2', suggestedPath: 'Dev' },
        { bookmarkId: '999', suggestedPath: 'Dev' },
        { bookmarkId: '2', suggestedPath: 'Reading' },
        { bookmarkId: '3', suggestedPath: 'Dev' },
      ],
      summary: 'ok',
    }));

    const result = await organizeBookmarks('openai', 'gpt', makeBookmarks(3), '', {});

    expect(result.assignments.map(assignment => assignment.bookmarkId)).toEqual(['1', '2', '3']);
    expect(result.assignments[1].suggestedPath).toBe('Dev');
  });

  it('reports organized progress with real bookmarks only', async () => {
    vi.mocked(callProvider).mockResolvedValue(JSON.stringify({
      folders: [{ path: 'Dev', description: 'Dev', isNew: true }],
      assignments: [
        { bookmarkId: '1', suggestedPath: 'Dev' },
        { bookmarkId: '1', suggestedPath: 'Dev' },
        { bookmarkId: '42', suggestedPath: 'Dev' },
      ],
      summary: 'ok',
    }));
    const onProgress = vi.fn();

    await organizeBookmarks('openai', 'gpt', makeBookmarks(2), '', {}, undefined, onProgress);

    expect(onProgress).toHaveBeenLastCalledWith(1, 2);
  });
});
