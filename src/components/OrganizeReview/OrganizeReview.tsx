import { useMemo } from 'react';
import { type BookmarkAssignment, type FolderPlan } from '../../types/organize';
import { getLastSegment } from '../../utils/folderDisplay';
import { RefreshIcon } from '../icons/Icons';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import OrganizeCheckbox from '../OrganizeCheckbox/OrganizeCheckbox';
import Button from '../Button/Button';
import './OrganizeReview.css';

interface OrganizeReviewProps {
  assignments: BookmarkAssignment[];
  folderPlan: FolderPlan | null;
  onToggleGroupAssignments: (bookmarkIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleAssignment: (bookmarkId: string) => void;
  onApplyMoves: () => void;
  onReOrganize: () => void;
  onReset: () => void;
}

const OrganizeReview = ({
  assignments,
  folderPlan,
  onToggleGroupAssignments,
  onSelectAll,
  onDeselectAll,
  onToggleAssignment,
  onApplyMoves,
  onReOrganize,
  onReset,
}: OrganizeReviewProps) => {
  const approvedCount = useMemo(
    () => assignments.filter(assignment => assignment.isApproved).length,
    [assignments]
  );

  const folderDescriptionMap = useMemo(() => {
    const map = new Map<string, { description: string; isNew: boolean }>();
    if (!folderPlan) return map;
    for (const folder of folderPlan.folders) {
      map.set(folder.path, { description: folder.description, isNew: folder.isNew });
    }
    return map;
  }, [folderPlan]);

  const folderGroups = useMemo(() => {
    const groupMap = new Map<string, BookmarkAssignment[]>();

    for (const assignment of assignments) {
      const path = assignment.suggestedPath;
      if (!groupMap.has(path)) {
        groupMap.set(path, []);
      }
      groupMap.get(path)!.push(assignment);
    }

    return Array.from(groupMap.entries()).map(([fullPath, items]) => ({
      fullPath,
      displayName: getLastSegment(fullPath),
      items,
    }));
  }, [assignments]);

  return (
    <div className="organize-review">
      {folderPlan?.summary && (
        <p className="organize-review-ai-summary">{folderPlan.summary}</p>
      )}

      <p className="organize-review-summary">
        {assignments.length} bookmark{assignments.length !== 1 ? 's' : ''} assigned to {folderGroups.length} folder{folderGroups.length !== 1 ? 's' : ''}
      </p>

      <div className="organize-review-bulk-actions">
        <Button onClick={onSelectAll}>Select All</Button>
        <Button onClick={onDeselectAll}>Deselect All</Button>
      </div>

      <div className="organize-review-list">
        {folderGroups.map(group => {
          const groupIds = group.items.map(item => item.bookmarkId);
          const approvedInGroup = group.items.filter(item => item.isApproved).length;
          const isFullSelected = approvedInGroup === group.items.length;
          const isPartialSelected = approvedInGroup > 0 && !isFullSelected;
          const folderMeta = folderDescriptionMap.get(group.fullPath);

          const groupCheckbox = (
            <Button
              variant="unstyled"
              className="organize-check-wrap"
              onClick={() => onToggleGroupAssignments(groupIds)}
            >
              <OrganizeCheckbox state={isFullSelected ? 'full' : isPartialSelected ? 'partial' : 'empty'} />
            </Button>
          );

          return (
            <FolderTreeGroup
              key={group.fullPath}
              groupName={group.displayName}
              itemCount={approvedInGroup}
              badge={folderMeta?.isNew ? 'New' : undefined}
              headerAction={groupCheckbox}
            >
              {folderMeta?.description && (
                <p className="organize-review-folder-description">{folderMeta.description}</p>
              )}
              {group.items.map(assignment => (
                <Button
                  key={assignment.bookmarkId}
                  variant="unstyled"
                  className={`organize-review-item ${assignment.isApproved ? 'approved' : 'rejected'}`}
                  onClick={() => onToggleAssignment(assignment.bookmarkId)}
                >
                  <span className="organize-check-wrap">
                    <OrganizeCheckbox state={assignment.isApproved ? 'full' : 'empty'} />
                  </span>
                  <span className="organize-review-item-title">{assignment.bookmarkTitle}</span>
                </Button>
              ))}
            </FolderTreeGroup>
          );
        })}
      </div>

      <div className="organize-review-actions">
        <Button
          variant="primary"
          onClick={onApplyMoves}
          disabled={approvedCount === 0}
          fullWidth
        >
          Apply {approvedCount} Move{approvedCount !== 1 ? 's' : ''}
        </Button>
        <Button onClick={onReOrganize} fullWidth>
          <RefreshIcon />
          Re-organize
        </Button>
        <Button onClick={onReset} fullWidth>
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default OrganizeReview;
