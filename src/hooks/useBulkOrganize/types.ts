import { type StatusType } from '../../types/common';
import { type OrganizeSession } from '../../types/organize';
import { type BookmarkStats } from '../../types/bookmarks';

export interface UseBulkOrganizeReturn {
  session: OrganizeSession;
  bookmarkStats: BookmarkStats | null;
  statusMessage: string;
  statusType: StatusType;
  handleStartScan: () => Promise<void>;
  handleToggleFolder: (folderId: string) => void;
  handleSelectAllFolders: () => void;
  handleDeselectAllFolders: () => void;
  handleStartOrganizing: () => Promise<void>;
  handleApprovePlan: () => void;
  handleRejectPlan: () => void;
  handleTogglePlanFolder: (folderPath: string) => void;
  handleToggleAssignment: (bookmarkId: string) => void;
  handleApplyMoves: () => Promise<void>;
  handleReset: () => void;
}
