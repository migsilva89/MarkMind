import {
  type ChromeBookmarkNode,
  type FolderDataForAI,
  type FolderPathMap,
  CHROME_ROOT_FOLDER_IDS,
} from '../types/bookmarks';
import { getBookmarkTree } from '../services/bookmarks';

interface TraversalStats {
  maxDepth: number;
  totalCount: number;
}

const buildTextTreeAndMap = (
  node: ChromeBookmarkNode,
  parentPath: string,
  depth: number,
  lines: string[],
  pathMap: FolderPathMap,
  stats: TraversalStats
): void => {
  if (node.url || !node.title) {
    return;
  }

  const folderName = node.title;
  const escapedFolderName = folderName.replace(/\//g, '\\/');
  const currentPath = [parentPath, escapedFolderName].filter(Boolean).join('/');
  const indent = '  '.repeat(depth);

  lines.push(`${indent}${folderName}`);
  pathMap[currentPath] = node.id;

  stats.totalCount += 1;
  stats.maxDepth = Math.max(stats.maxDepth, depth);

  if (node.children) {
    for (const child of node.children) {
      buildTextTreeAndMap(child, currentPath, depth + 1, lines, pathMap, stats);
    }
  }
};

export const getFolderDataForAI = async (): Promise<FolderDataForAI> => {
  const tree = await getBookmarkTree();

  if (!tree || tree.length === 0) {
    return { textTree: '', pathToIdMap: {}, maxDepth: 0, totalFolderCount: 0 };
  }

  const rootNode = tree[0];
  const lines: string[] = [];
  const pathToIdMap: FolderPathMap = {};
  const stats: TraversalStats = { maxDepth: 0, totalCount: 0 };

  if (rootNode.children) {
    for (const child of rootNode.children) {
      if (child.id === CHROME_ROOT_FOLDER_IDS.MOBILE_BOOKMARKS) {
        continue;
      }

      buildTextTreeAndMap(child, '', 0, lines, pathToIdMap, stats);
    }
  }

  return {
    textTree: lines.join('\n'),
    pathToIdMap,
    maxDepth: stats.maxDepth,
    totalFolderCount: stats.totalCount,
  };
};
