import { type CompactBookmark, type DuplicateGroup } from '../types/organize';

// Normalizes a URL for exact-duplicate comparison: lowercases the scheme + host,
// drops a trailing slash, and keeps the path/query/hash intact (so ?id=1 and
// ?id=2 stay distinct).
export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const host = parsed.host.toLowerCase();
    const path = parsed.pathname.length > 1 && parsed.pathname.endsWith('/')
      ? parsed.pathname.slice(0, -1)
      : parsed.pathname;
    return `${parsed.protocol.toLowerCase()}//${host}${path}${parsed.search}${parsed.hash}`;
  } catch {
    // Not a parseable URL — fall back to a light normalization.
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
};

// Groups bookmarks that share the same normalized URL. Only groups with more
// than one bookmark (i.e. actual duplicates) are returned.
export const findDuplicateBookmarks = (bookmarks: CompactBookmark[]): DuplicateGroup[] => {
  const bookmarksByUrl = new Map<string, CompactBookmark[]>();

  for (const bookmark of bookmarks) {
    if (!bookmark.url) continue;
    const key = normalizeUrl(bookmark.url);
    const existing = bookmarksByUrl.get(key);
    if (existing) {
      existing.push(bookmark);
    } else {
      bookmarksByUrl.set(key, [bookmark]);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const group of bookmarksByUrl.values()) {
    if (group.length > 1) {
      groups.push({ url: group[0].url, bookmarks: group });
    }
  }

  return groups;
};

// Total number of bookmarks that would be removed (every copy except one per group).
export const countRemovableDuplicates = (groups: DuplicateGroup[]): number =>
  groups.reduce((total, group) => total + group.bookmarks.length - 1, 0);

// IDs to remove: every copy except the first (kept) in each group.
export const getDuplicateIdsToRemove = (groups: DuplicateGroup[]): string[] =>
  groups.flatMap(group => group.bookmarks.slice(1).map(bookmark => bookmark.id));
