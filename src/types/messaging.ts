import { type CompactBookmark, type BulkOrganizeResult, type DestinationFolder } from './organize';
import { type FolderPathMap } from './bookmarks';

export type OrganizeMessageType =
  | 'START_ORGANIZE'
  | 'CANCEL_ORGANIZE'
  | 'GET_ORGANIZE_STATUS'
  | 'ORGANIZE_PROGRESS'
  | 'ORGANIZE_COMPLETE'
  | 'ORGANIZE_ERROR';

export interface OrganizeMessage {
  type: OrganizeMessageType;
  payload?: unknown;
}

export interface StartOrganizePayload {
  serviceId: string;
  modelId: string;
  bookmarks: CompactBookmark[];
  folderTree: string;
  pathToIdMap: FolderPathMap;
  defaultParentId: string;
  maxOutputTokens?: number;
  // Optional so a payload from an older popup still runs unscoped
  destinationFolderId?: string | null;
  destinationFolders?: DestinationFolder[];
}

export interface OrganizeProgressPayload {
  processedCount: number;
  totalCount: number;
}

export interface OrganizeCompletePayload {
  result: BulkOrganizeResult;
}

export interface OrganizeErrorPayload {
  errorMessage: string;
}
