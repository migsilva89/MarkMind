import { describe, it, expect } from 'vitest';
import { computeBatchSize } from './bulkOrganize';

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
