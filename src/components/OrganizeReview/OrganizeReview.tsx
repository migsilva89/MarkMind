import { useMemo } from 'react';
import { type BookmarkAssignment } from '../../types/organize';
import { getLastSegment } from '../../utils/folderDisplay';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import OrganizeCheckbox from '../OrganizeCheckbox/OrganizeCheckbox';
import Button from '../Button/Button';
import './OrganizeReview.css';

interface OrganizeReviewProps {
  assignments: BookmarkAssignment[];
  onToggleGroupAssignments: (bookmarkIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleAssignment: (bookmarkId: string) => void;
  onApplyMoves: () => void;
  onReset: () => void;
}

const OrganizeReview = ({
  assignments,
  onToggleGroupAssignments,
  onSelectAll,
  onDeselectAll,
  onToggleAssignment,
  onApplyMoves,
  onReset,
}: OrganizeReviewProps) => {
  const approvedCount = useMemo(
    () => assignments.filter(assignment => assignment.isApproved).length,
    [assignments]
  );

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
      <p className="organize-review-summary">
        {assignments.length} bookmarks assigned to {folderGroups.length} folder{folderGroups.length !== 1 ? 's' : ''}
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
              headerAction={groupCheckbox}
            >
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
                  {assignment.isNewFolder && (
                    <span className="organize-review-new-badge">New</span>
                  )}
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
        <Button onClick={onReset} fullWidth>
          Start Over
        </Button>
      </div>
    </div>
  );
};

export default OrganizeReview;
