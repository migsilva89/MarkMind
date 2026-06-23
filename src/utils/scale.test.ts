import { describe, it, expect } from 'vitest';
import { chunkArray } from './helpers';
import { findDuplicateBookmarks, countRemovableDuplicates } from './duplicates';
import { computeBatchSize } from '../services/ai/bulkOrganize';
import { type CompactBookmark } from '../types/organize';

// Simulates a heavy user's library at scale. These cover the pure logic only
// (no API calls) — they prove batching math and dedupe stay correct and fast
// for 5k–10k bookmarks.

const makeBookmarks = (count: number, urlFactory: (index: number) => string): CompactBookmark[] =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index),
    url: urlFactory(index),
    title: `bookmark ${index}`,
    currentFolderPath: 'Root',
    currentFolderId: 'folder',
  }));

describe('scale: batching math', () => {
  it('chunks 10,000 bookmarks into the expected number of batches', () => {
    const batchSize = computeBatchSize(1_000_000); // huge model -> 150 cap
    expect(batchSize).toBe(150);

    const bookmarks = makeBookmarks(10_000, i => `https://site.com/page${i}`);
    const batches = chunkArray(bookmarks, batchSize);

    expect(batches).toHaveLength(Math.ceil(10_000 / 150)); // 67
    expect(batches.flat()).toHaveLength(10_000); // nothing dropped
    expect(batches[batches.length - 1]).toHaveLength(10_000 - 66 * 150); // 100
  });

  it('a small/free model produces more, smaller batches for 5,000 bookmarks', () => {
    const batchSize = computeBatchSize(4096); // -> 35
    expect(batchSize).toBe(35);

    const batches = chunkArray(makeBookmarks(5_000, i => `https://site.com/p${i}`), batchSize);
    expect(batches).toHaveLength(Math.ceil(5_000 / 35)); // 143
    expect(batches.flat()).toHaveLength(5_000);
  });
});

describe('scale: duplicate detection', () => {
  it('finds every duplicate in a 10,000-bookmark library', () => {
    // Each URL appears exactly twice -> 5,000 groups, 5,000 removable.
    const bookmarks = makeBookmarks(10_000, i => `https://site.com/page${i % 5_000}`);
    const groups = findDuplicateBookmarks(bookmarks);

    expect(groups).toHaveLength(5_000);
    expect(countRemovableDuplicates(groups)).toBe(5_000);
  });

  it('handles a 10,000-bookmark library with no duplicates', () => {
    const bookmarks = makeBookmarks(10_000, i => `https://site.com/unique${i}`);
    expect(findDuplicateBookmarks(bookmarks)).toHaveLength(0);
  });
});
