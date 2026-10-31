import { type FolderPathMap } from './bookmarks';

export type OrganizeSessionStatus =
  | 'idle'
  | 'scanning'
  | 'selecting'
  | 'organizing'
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

// A set of bookmarks that share the same URL. The first is kept; the rest are
// candidates for removal.
export interface DuplicateGroup {
  url: string;
  bookmarks: CompactBookmark[];
}

export interface FolderTreeNode {
  name: string;
  path: string;
  bookmarks: CompactBookmark[];
  children: FolderTreeNode[];
}

// A folder the user can pick as the destination for organized bookmarks.
// path uses the escaped pathToIdMap format, including the root container.
export interface DestinationFolder {
  id: string;
  parentId: string | null;
  path: string;
}

export interface OrganizeSession {
  status: OrganizeSessionStatus;
  allBookmarks: CompactBookmark[];
  selectedBookmarkIds: string[] | null;
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
  // null = no destination: the AI may use any folder (original behavior).
  // Otherwise every move lands in this folder or a subfolder of it.
  destinationFolderId: string | null;
  destinationFolders: DestinationFolder[];
}
