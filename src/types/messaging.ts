import { type CompactBookmark, type BulkOrganizeResult } from './organize';
import { type FolderPathMap } from './bookmarks';

export type OrganizeMessageType =
  | 'START_ORGANIZE'
  | 'GET_ORGANIZE_STATUS'
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
}

export interface OrganizeCompletePayload {
  result: BulkOrganizeResult;
}

export interface OrganizeErrorPayload {
  errorMessage: string;
}
