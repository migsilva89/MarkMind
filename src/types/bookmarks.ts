export type FolderPathMap = Record<string, string>;

export interface FolderDataForAI {
  textTree: string;
  pathToIdMap: FolderPathMap;
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

