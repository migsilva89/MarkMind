export type FolderPathMap = Record<string, string>;

export interface FolderDataForAI {
  textTree: string;
  pathToIdMap: FolderPathMap;
  idToPathMap: Record<string, string>;
  defaultParentId: string;
  maxDepth: number;
  totalFolderCount: number;
}

export interface PendingSuggestion {
  pageTitle: string;
  pageUrl: string;
  folderPath: string;
  folderId: string | null;
  isNewFolder: boolean;
}

export interface FolderDisplaySegment {
  name: string;
  isEllipsis: boolean;
  depth: number;
}

export interface ChromeBookmarkNode {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  index?: number;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: ChromeBookmarkNode[];
}

export interface BookmarkStats {
  totalBookmarks: number;
  totalFolders: number;
  byFolder: Map<string, number>;
}

export interface FolderGroup<T> {
  groupName: string;
  items: T[];
}

