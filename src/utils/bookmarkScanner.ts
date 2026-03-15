import { type ChromeBookmarkNode, type BookmarkStats } from '../types/bookmarks';
import { type CompactBookmark, type FolderTreeNode } from '../types/organize';
import { stripRootSegment } from './folderDisplay';
import { splitFolderPath } from './folders';

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

export const getAllBookmarksInNode = (node: FolderTreeNode): CompactBookmark[] => {
  const bookmarks = [...node.bookmarks];
  for (const child of node.children) {
    bookmarks.push(...getAllBookmarksInNode(child));
  }
  return bookmarks;
};

export const buildFolderTree = (bookmarks: CompactBookmark[]): FolderTreeNode => {
  const root: FolderTreeNode = { name: '', path: '', bookmarks: [], children: [] };
  const childrenByPath = new Map<string, Map<string, FolderTreeNode>>();
  childrenByPath.set('', new Map());

  for (const bookmark of bookmarks) {
    const strippedPath = stripRootSegment(bookmark.currentFolderPath);
    const segments = splitFolderPath(strippedPath);
    let currentNode = root;

    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
      const segment = segments[segmentIndex];
      const isLeafFolder = segmentIndex === segments.length - 1;
      const nodePath = segments.slice(0, segmentIndex + 1).join('/');

      const siblingMap = childrenByPath.get(currentNode.path)!;
      let childNode = siblingMap.get(segment);
      if (!childNode) {
        childNode = { name: segment, path: nodePath, bookmarks: [], children: [] };
        siblingMap.set(segment, childNode);
        childrenByPath.set(nodePath, new Map());
        currentNode.children.push(childNode);
      }

      if (isLeafFolder) {
        childNode.bookmarks.push(bookmark);
      }

      currentNode = childNode;
    }
  }

  return root;
};

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
