import { type FolderPathMap } from './bookmarks';

export type OrganizeSessionStatus =
  | 'idle'
  | 'scanning'
  | 'selecting'
  | 'organizing'
  | 'reviewing_plan'
  | 'reviewing_assignments'
  | 'applying'
  | 'completed'
  | 'error';

export interface CompactBookmark {
  id: string;
  title: string;
  url: string;
  currentFolderPath: string;
  currentFolderId: string;
}

export interface ProposedFolder {
  path: string;
  description: string;
  isNew: boolean;
  isExcluded: boolean;
}

export interface FolderPlan {
  folders: ProposedFolder[];
  summary: string;
}

export interface BookmarkAssignment {
  bookmarkId: string;
  bookmarkTitle: string;
  bookmarkUrl: string;
  currentPath: string;
  suggestedPath: string;
  suggestedFolderId: string | null;
  isNewFolder: boolean;
  isApproved: boolean;
}

export interface BulkOrganizeResult {
  folderPlan: FolderPlan;
  assignments: BookmarkAssignment[];
}

export interface OrganizeSummary {
  folderPath: string;
  bookmarkCount: number;
  isNewFolder: boolean;
}

export interface OrganizeSession {
  status: OrganizeSessionStatus;
  allBookmarks: CompactBookmark[];
  selectedFolderIds: string[] | null;
  bookmarksToOrganize: CompactBookmark[];
  folderPlan: FolderPlan | null;
  folderTree: string;
  assignments: BookmarkAssignment[];
  appliedCount: number;
  skippedCount: number;
  errorMessage: string | null;
  startedAt: number | null;
  completedAt: number | null;
  // Stored so service worker can resume without popup context
  serviceId: string;
  pathToIdMap: FolderPathMap;
  defaultParentId: string;
}
