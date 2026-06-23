import { describe, it, expect } from 'vitest';
import {
  chunkArray,
  getAiTimeoutMs,
  hasArrayWithItems,
  extractApiErrorMessage,
  humanizeApiError,
  createRetryableError,
  isRetryableError,
  formatElapsedTime,
} from './helpers';

describe('chunkArray', () => {
  it('splits into chunks of the given size', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns empty for an empty array', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it('returns a single chunk when size exceeds length', () => {
    expect(chunkArray([1, 2], 10)).toEqual([[1, 2]]);
  });

  it('guards against zero or negative size', () => {
    expect(chunkArray([1, 2, 3], 0)).toEqual([[1], [2], [3]]);
  });
});

describe('formatElapsedTime', () => {
  it('formats as m:ss', () => {
    expect(formatElapsedTime(0)).toBe('0:00');
    expect(formatElapsedTime(5)).toBe('0:05');
    expect(formatElapsedTime(75)).toBe('1:15');
    expect(formatElapsedTime(600)).toBe('10:00');
  });

  it('clamps negative input', () => {
    expect(formatElapsedTime(-5)).toBe('0:00');
  });
});

describe('humanizeApiError', () => {
  it('maps 429 to a rate-limit message', () => {
    expect(humanizeApiError('whatever', 429)).toMatch(/rate limit/i);
  });

  it('maps 401 to an invalid-key message', () => {
    expect(humanizeApiError('x', 401)).toMatch(/api key/i);
  });

  it('maps 5xx to unavailable', () => {
    expect(humanizeApiError('x', 503)).toMatch(/unavailable/i);
  });

  it('never leaks raw API text or status code on unknown errors', () => {
    const raw = 'INTERNAL_TRACE: secret stack at 0xdeadbeef';
    const out = humanizeApiError(raw, 418);
    expect(out).not.toContain('secret');
    expect(out).not.toContain('418');
  });
});

describe('isRetryableError', () => {
  it('flags errors created as retryable', () => {
    expect(isRetryableError(createRetryableError('x'))).toBe(true);
  });

  it('does not flag plain errors', () => {
    expect(isRetryableError(new Error('x'))).toBe(false);
  });

  it('does not flag non-errors', () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
  });
});

describe('extractApiErrorMessage', () => {
  it('pulls error.message from a JSON body', () => {
    expect(extractApiErrorMessage('{"error":{"message":"boom"}}')).toBe('boom');
  });

  it('returns null for non-JSON bodies', () => {
    expect(extractApiErrorMessage('not json')).toBeNull();
  });
});

describe('hasArrayWithItems', () => {
  it('true for a non-empty array property', () => {
    expect(hasArrayWithItems({ items: [1] }, 'items')).toBe(true);
  });

  it('false for empty, missing, or non-object', () => {
    expect(hasArrayWithItems({ items: [] }, 'items')).toBe(false);
    expect(hasArrayWithItems({}, 'items')).toBe(false);
    expect(hasArrayWithItems(null, 'items')).toBe(false);
  });
});

describe('getAiTimeoutMs', () => {
  it('scales with bookmark count and caps at the ceiling', () => {
    expect(getAiTimeoutMs(0)).toBe(60000);
    expect(getAiTimeoutMs(10)).toBe(65000);
    expect(getAiTimeoutMs(100000)).toBe(300000);
  });
});
