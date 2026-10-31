import { type BookmarkAssignment } from '../types/organize';
import { type FolderPathMap } from '../types/bookmarks';
import { moveBookmark, createFolderPath, getBookmarkTree } from './bookmarks';
import { listDestinationFolders, scopeFolderDataToDestination, getDestinationSubtreeIds } from '../utils/destination';

export interface ApplyAssignmentsOptions {
  assignments: BookmarkAssignment[];
  // The bookmarks the user selected for this run — nothing else may move,
  // whatever the AI or a stored session says.
  allowedBookmarkIds: Set<string>;
  pathToIdMap: FolderPathMap;
  defaultParentId: string;
  // Set when a destination was chosen: every target must be one of these
  // folders (the destination subtree) or one created under defaultParentId.
  allowedFolderIds?: Set<string>;
}

export interface ApplyAssignmentsResult {
  appliedCount: number;
  // Rejected in review, outside the selection, or failed to move
  skippedCount: number;
  pathToIdMap: FolderPathMap;
}

export const applyAssignments = async ({
  assignments,
  allowedBookmarkIds,
  pathToIdMap,
  defaultParentId,
  allowedFolderIds,
}: ApplyAssignmentsOptions): Promise<ApplyAssignmentsResult> => {
  const mutablePathToIdMap = { ...pathToIdMap };
  const permittedFolderIds = allowedFolderIds ? new Set(allowedFolderIds) : null;
  let appliedCount = 0;
  let skippedCount = 0;

  for (const assignment of assignments) {
    if (!assignment.isApproved) {
      skippedCount += 1;
      continue;
    }

    if (!allowedBookmarkIds.has(assignment.bookmarkId)) {
      console.error('[ApplyMoves] Ignoring bookmark outside the selection:', assignment.bookmarkId);
      skippedCount += 1;
      continue;
    }

    try {
      let targetFolderId = assignment.suggestedFolderId;

      // A folder outside the destination is never used — re-resolve the path
      // under the destination instead.
      if (targetFolderId && permittedFolderIds && !permittedFolderIds.has(targetFolderId)) {
        targetFolderId = null;
      }

      if (!targetFolderId) {
        targetFolderId = await createFolderPath(
          assignment.suggestedPath,
          mutablePathToIdMap,
          defaultParentId
        );
        permittedFolderIds?.add(targetFolderId);
      }

      if (!targetFolderId) {
        skippedCount += 1;
        continue;
      }

      await moveBookmark(assignment.bookmarkId, targetFolderId);
      appliedCount += 1;
    } catch (error) {
      console.error('Error moving bookmark:', assignment.bookmarkId, error);
      skippedCount += 1;
    }
  }

  return { appliedCount, skippedCount, pathToIdMap: mutablePathToIdMap };
};

export interface LiveDestinationScope {
  pathToIdMap: FolderPathMap;
  defaultParentId: string;
  allowedFolderIds: Set<string>;
}

// Rebuilds the destination scope from the bookmark tree as it is right now, not
// the scan-time snapshot: folders deleted, moved out of the destination, or
// made read-only since the scan are no longer valid targets. Returns null when
// the destination itself is gone or read-only.
export const buildLiveDestinationScope = async (destinationId: string): Promise<LiveDestinationScope | null> => {
  const liveFolders = listDestinationFolders(await getBookmarkTree());
  const scope = scopeFolderDataToDestination(destinationId, liveFolders);
  if (!scope) return null;
  return {
    pathToIdMap: scope.pathToIdMap,
    defaultParentId: scope.defaultParentId,
    allowedFolderIds: getDestinationSubtreeIds(destinationId, liveFolders),
  };
};
