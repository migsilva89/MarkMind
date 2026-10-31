import { type ChromeBookmarkNode, type FolderPathMap } from '../types/bookmarks';
import { type DestinationFolder } from '../types/organize';
import { splitFolderPath } from './folders';

export interface ScopedFolderData {
  folderTree: string;
  pathToIdMap: FolderPathMap;
  defaultParentId: string;
}

/**
 * Lists every folder that can receive bookmarks, in tree order. Paths use the
 * same escaped format as pathToIdMap ("Bookmarks bar/AI\/ML"). Read-only
 * (managed) folders and everything under them are left out.
 */
export const listDestinationFolders = (tree: ChromeBookmarkNode[]): DestinationFolder[] => {
  const folders: DestinationFolder[] = [];

  const traverse = (node: ChromeBookmarkNode, parentPath: string, parentId: string | null): void => {
    if (node.url || !node.title || node.unmodifiable) return;

    const escapedTitle = node.title.replace(/\//g, '\\/');
    const path = parentPath ? `${parentPath}/${escapedTitle}` : escapedTitle;

    folders.push({ id: node.id, parentId, path });
    (node.children ?? []).forEach(child => traverse(child, path, node.id));
  };

  // tree[0] is the Chrome synthetic root — it cannot hold bookmarks itself
  (tree[0]?.children ?? []).forEach(container => traverse(container, '', null));

  return folders;
};

export const formatDestinationLabel = (path: string): string => splitFolderPath(path).join(' / ');

// IDs of the destination and every folder below it.
export const getDestinationSubtreeIds = (
  destinationId: string,
  folders: DestinationFolder[]
): Set<string> => {
  const childrenByParent = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder.id);
    childrenByParent.set(folder.parentId, siblings);
  }

  const subtreeIds = new Set<string>();
  const pending = [destinationId];
  while (pending.length > 0) {
    const folderId = pending.pop()!;
    if (subtreeIds.has(folderId)) continue;
    subtreeIds.add(folderId);
    pending.push(...(childrenByParent.get(folderId) ?? []));
  }
  return subtreeIds;
};

const buildTextTree = (relativePaths: string[]): string => {
  return relativePaths
    .map(path => {
      const segments = splitFolderPath(path);
      return `${'    '.repeat(segments.length - 1)}└── ${segments[segments.length - 1]}`;
    })
    .join('\n');
};

/**
 * Narrows the folder data the AI sees (and the apply step resolves against) to
 * the destination's subtree. Paths become relative to the destination, so any
 * path the AI returns — existing or new — resolves inside it. Matching is done
 * by folder ID, not by path prefix, so a same-named sibling cannot leak in.
 * Returns null when the destination is not in the list (deleted or read-only).
 */
export const scopeFolderDataToDestination = (
  destinationId: string,
  folders: DestinationFolder[]
): ScopedFolderData | null => {
  const destination = folders.find(folder => folder.id === destinationId);
  if (!destination) return null;

  const subtreeIds = getDestinationSubtreeIds(destinationId, folders);
  const prefix = `${destination.path}/`;
  const pathToIdMap: FolderPathMap = {};
  const relativePaths: string[] = [];

  for (const folder of folders) {
    if (folder.id === destinationId || !subtreeIds.has(folder.id)) continue;
    const relativePath = folder.path.slice(prefix.length);
    // Same-named siblings share a path; keep the first, as pathToIdMap does elsewhere
    if (pathToIdMap[relativePath]) continue;
    pathToIdMap[relativePath] = folder.id;
    relativePaths.push(relativePath);
  }

  return {
    folderTree: buildTextTree(relativePaths),
    pathToIdMap,
    defaultParentId: destinationId,
  };
};
