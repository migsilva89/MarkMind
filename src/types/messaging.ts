import {
  type CompactBookmark,
  type FolderPlan,
  type BatchProgress,
  type BookmarkAssignment,
} from './organize';
import { type FolderPathMap } from './bookmarks';

export type OrganizeMessageType =
  | 'START_BULK_ORGANIZE'
  | 'PAUSE_BULK_ORGANIZE'
  | 'RESUME_BULK_ORGANIZE'
  | 'GET_ORGANIZE_STATUS'
  | 'ORGANIZE_BATCH_COMPLETE'
  | 'ORGANIZE_COMPLETE'
  | 'ORGANIZE_ERROR';

export interface OrganizeMessage {
  type: OrganizeMessageType;
  payload?: unknown;
}

export interface StartBulkOrganizePayload {
  serviceId: string;
  bookmarks: CompactBookmark[];
  approvedPlan: FolderPlan;
  folderTree: string;
  pathToIdMap: FolderPathMap;
  defaultParentId: string;
}

export interface OrganizeStatusUpdatePayload {
  batchProgress: BatchProgress;
  latestAssignments: BookmarkAssignment[];
}

export interface OrganizeCompletePayload {
  assignments: BookmarkAssignment[];
  batchProgress: BatchProgress;
}

export interface OrganizeErrorPayload {
  errorMessage: string;
  batchProgress: BatchProgress;
}
