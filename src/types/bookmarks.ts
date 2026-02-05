export type FolderPathMap = Record<string, string>;

export interface FolderDataForAI {
  textTree: string;
  pathToIdMap: FolderPathMap;
  maxDepth: number;
  totalFolderCount: number;
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

export const CHROME_ROOT_FOLDER_IDS = {
  ROOT: '0',
  BOOKMARKS_BAR: '1',
  OTHER_BOOKMARKS: '2',
  MOBILE_BOOKMARKS: '3',
} as const;

export const NATIVE_FOLDER_IDS = ['0', '1', '2', '3'] as const;
