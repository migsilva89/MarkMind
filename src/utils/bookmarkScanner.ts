import { type ChromeBookmarkNode } from '../types/bookmarks';
import { type CompactBookmark } from '../types/organize';

const traverseBookmarks = (
  node: ChromeBookmarkNode,
  idToPathMap: Record<string, string>,
  results: CompactBookmark[]
): void => {
  if (node.url && node.title) {
    results.push({
      id: node.id,
      title: node.title,
      url: node.url,
      currentFolderPath: node.parentId ? (idToPathMap[node.parentId] ?? 'Root') : 'Root',
      currentFolderId: node.parentId ?? '',
    });
  }

  if (node.children) {
    node.children.forEach(child => traverseBookmarks(child, idToPathMap, results));
  }
};

export const flattenAllBookmarks = (
  tree: ChromeBookmarkNode[],
  idToPathMap: Record<string, string>
): CompactBookmark[] => {
  const results: CompactBookmark[] = [];
  tree.forEach(node => traverseBookmarks(node, idToPathMap, results));
  return results;
};

export const filterBookmarksByFolders = (
  bookmarks: CompactBookmark[],
  selectedFolderIds: string[]
): CompactBookmark[] => {
  const selectedSet = new Set(selectedFolderIds);
  return bookmarks.filter(bookmark => selectedSet.has(bookmark.currentFolderId));
};

export const createBatches = (
  bookmarks: CompactBookmark[],
  batchSize: number
): CompactBookmark[][] => {
  const batches: CompactBookmark[][] = [];
  for (let startIndex = 0; startIndex < bookmarks.length; startIndex += batchSize) {
    batches.push(bookmarks.slice(startIndex, startIndex + batchSize));
  }
  return batches;
};

export interface BookmarkStats {
  totalBookmarks: number;
  totalFolders: number;
  byFolder: Map<string, number>;
}

export const getBookmarkStats = (bookmarks: CompactBookmark[]): BookmarkStats => {
  const byFolder = new Map<string, number>();

  for (const bookmark of bookmarks) {
    const currentCount = byFolder.get(bookmark.currentFolderPath) ?? 0;
    byFolder.set(bookmark.currentFolderPath, currentCount + 1);
  }

  return {
    totalBookmarks: bookmarks.length,
    totalFolders: byFolder.size,
    byFolder,
  };
};
