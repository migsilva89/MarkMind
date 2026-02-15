import {
  type ChromeBookmarkNode,
  type FolderDataForAI,
  type FolderDisplaySegment,
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

const MAX_VISIBLE_SEGMENTS = 3;

export const getDisplaySegments = (folderPath: string): FolderDisplaySegment[] => {
  const segments = folderPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  if (segments.length <= MAX_VISIBLE_SEGMENTS) {
    return segments.map((name, index) => ({
      name,
      isEllipsis: false,
      depth: index,
    }));
  }

  // Deep path: show first → ellipsis → last two (sequential depths for correct indentation)
  return [
    { name: segments[0], isEllipsis: false, depth: 0 },
    { name: '\u22EF', isEllipsis: true, depth: 1 },
    { name: segments[segments.length - 2], isEllipsis: false, depth: 2 },
    { name: segments[segments.length - 1], isEllipsis: false, depth: 3 },
  ];
};

export const buildIdToPathMap = (pathToIdMap: FolderPathMap): Record<string, string> => {
  const idToPathMap: Record<string, string> = {};
  for (const [path, id] of Object.entries(pathToIdMap)) {
    idToPathMap[id] = path;
  }
  return idToPathMap;
};

export const findFolderPathById = (idToPathMap: Record<string, string>, folderId: string): string | null => {
  return idToPathMap[folderId] ?? null;
};

export const getFolderDataForAI = async (): Promise<FolderDataForAI> => {
  const tree = await getBookmarkTree();

  if (!tree || tree.length === 0) {
    return { textTree: '', pathToIdMap: {}, idToPathMap: {}, defaultParentId: '', maxDepth: 0, totalFolderCount: 0 };
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
    idToPathMap: buildIdToPathMap(pathToIdMap),
    defaultParentId,
    maxDepth: stats.maxDepth,
    totalFolderCount: stats.totalCount,
  };
};
