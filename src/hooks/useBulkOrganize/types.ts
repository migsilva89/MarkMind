import { type StatusType } from '../../types/common';
import { type OrganizeSession } from '../../types/organize';
import { type BookmarkStats } from '../../types/bookmarks';

export interface UseBulkOrganizeReturn {
  session: OrganizeSession;
  bookmarkStats: BookmarkStats | null;
  statusMessage: string;
  statusType: StatusType;
  handleStartScan: () => Promise<void>;
  handleToggleBookmarks: (bookmarkIds: string[]) => void;
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
  handleStartOrganizing: () => Promise<void>;
  handleCancelOrganizing: () => void;
  handleApprovePlan: () => void;
  handleRejectPlan: () => void;
  handleTogglePlanFolder: (folderPath: string) => void;
  handleToggleGroupPlanFolders: (folderPaths: string[]) => void;
  handleSelectAllPlanFolders: () => void;
  handleDeselectAllPlanFolders: () => void;
  handleToggleGroupAssignments: (bookmarkIds: string[]) => void;
  handleSelectAllAssignments: () => void;
  handleDeselectAllAssignments: () => void;
  handleToggleAssignment: (bookmarkId: string) => void;
  handleApplyMoves: () => Promise<void>;
  handleReset: () => void;
}
