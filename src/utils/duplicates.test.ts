import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  findDuplicateBookmarks,
  countRemovableDuplicates,
  getDuplicateIdsToRemove,
} from './duplicates';
import { type CompactBookmark } from '../types/organize';

const bm = (id: string, url: string, folder = 'Root'): CompactBookmark => ({
  id,
  url,
  title: `title-${id}`,
  currentFolderPath: folder,
  currentFolderId: 'folder',
});

describe('normalizeUrl', () => {
  it('strips a trailing slash', () => {
    expect(normalizeUrl('https://example.com/page/')).toBe(normalizeUrl('https://example.com/page'));
  });

  it('lowercases the host but preserves path case', () => {
    expect(normalizeUrl('https://EXAMPLE.com/Page')).toBe('https://example.com/Page');
  });

  it('keeps query strings distinct (?id=1 vs ?id=2)', () => {
    expect(normalizeUrl('https://e.com/p?id=1')).not.toBe(normalizeUrl('https://e.com/p?id=2'));
  });

  it('handles non-URL strings without throwing', () => {
    expect(normalizeUrl('  not a url/  ')).toBe('not a url');
  });
});

describe('findDuplicateBookmarks', () => {
  it('groups exact-duplicate URLs', () => {
    const groups = findDuplicateBookmarks([
      bm('1', 'https://a.com'),
      bm('2', 'https://a.com'),
      bm('3', 'https://b.com'),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].bookmarks.map(b => b.id)).toEqual(['1', '2']);
  });

  it('treats trailing slash and host case as the same', () => {
    const groups = findDuplicateBookmarks([bm('1', 'https://A.com/x'), bm('2', 'https://a.com/x/')]);
    expect(groups).toHaveLength(1);
  });

  it('ignores bookmarks with empty URLs', () => {
    expect(findDuplicateBookmarks([bm('1', ''), bm('2', '')])).toHaveLength(0);
  });

  it('returns nothing when all URLs are unique', () => {
    expect(findDuplicateBookmarks([bm('1', 'https://a.com'), bm('2', 'https://b.com')])).toHaveLength(0);
  });
});

describe('countRemovableDuplicates / getDuplicateIdsToRemove', () => {
  it('keeps the first of each group and removes the rest', () => {
    const groups = findDuplicateBookmarks([
      bm('1', 'https://a.com'),
      bm('2', 'https://a.com'),
      bm('3', 'https://a.com'),
    ]);
    expect(countRemovableDuplicates(groups)).toBe(2);
    expect(getDuplicateIdsToRemove(groups)).toEqual(['2', '3']);
  });

  it('zero when there are no groups', () => {
    expect(countRemovableDuplicates([])).toBe(0);
    expect(getDuplicateIdsToRemove([])).toEqual([]);
  });
});
