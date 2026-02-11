import {
  type ChromeBookmarkNode,
  type FolderDataForAI,
  type FolderPathMap,
} from '../types/bookmarks';
import { getBookmarkTree } from '../services/bookmarks';

interface TraversalStats {
  maxDepth: number;
  totalCount: number;
}

const getFolderChildren = (node: ChromeBookmarkNode): ChromeBookmarkNode[] => {
  return (node.children ?? []).filter(child => !child.url && child.title);
};

const buildTreeLines = (
  node: ChromeBookmarkNode,
  parentPath: string,
  prefix: string,
  isLastChild: boolean,
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

  const connector = isLastChild ? '└── ' : '├── ';
  lines.push(`${prefix}${connector}${folderName}`);
  pathMap[currentPath] = node.id;

  stats.totalCount += 1;
  stats.maxDepth = Math.max(stats.maxDepth, depth);

  const folderChildren = getFolderChildren(node);
  const childPrefix = prefix + (isLastChild ? '    ' : '│   ');

  folderChildren.forEach((child, index) => {
    const isLast = index === folderChildren.length - 1;
    buildTreeLines(child, currentPath, childPrefix, isLast, depth + 1, lines, pathMap, stats);
  });
};

export const getFolderDataForAI = async (): Promise<FolderDataForAI> => {
  const tree = await getBookmarkTree();

  if (!tree || tree.length === 0) {
    return { textTree: '', pathToIdMap: {}, defaultParentId: '', maxDepth: 0, totalFolderCount: 0 };
  }

  const rootNode = tree[0];
  const rootChildren = rootNode.children ?? [];
  const lines: string[] = [];
  const pathToIdMap: FolderPathMap = {};
  const stats: TraversalStats = { maxDepth: 0, totalCount: 0 };

  // Use the first root folder (typically Bookmarks Bar) as default parent for new folders
  const defaultParentId = rootChildren.length > 0 ? rootChildren[0].id : rootNode.id;

  const rootFolders = getFolderChildren(rootNode);

  rootFolders.forEach((child, index) => {
    const isLast = index === rootFolders.length - 1;
    buildTreeLines(child, '', '', isLast, 0, lines, pathToIdMap, stats);
  });

  return {
    textTree: lines.join('\n'),
    pathToIdMap,
    defaultParentId,
    maxDepth: stats.maxDepth,
    totalFolderCount: stats.totalCount,
  };
};
