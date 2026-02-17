import { type StatusType } from '../../types/common';
import { type OrganizeSession } from '../../types/organize';
import { type BookmarkStats } from '../../utils/bookmarkScanner';

export interface UseBulkOrganizeReturn {
  session: OrganizeSession;
  bookmarkStats: BookmarkStats | null;
  statusMessage: string;
  statusType: StatusType;
  handleStartScan: () => Promise<void>;
  handleToggleFolder: (folderId: string) => void;
  handleSelectAllFolders: () => void;
  handleDeselectAllFolders: () => void;
  handleStartPlanning: () => Promise<void>;
  handleApprovePlan: () => void;
  handleRejectPlan: () => void;
  handleStartAssigning: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleToggleAssignment: (bookmarkId: string) => void;
  handleApproveAllAssignments: () => void;
  handleRejectAllAssignments: () => void;
  handleApplyMoves: () => Promise<void>;
  handleReset: () => void;
}
