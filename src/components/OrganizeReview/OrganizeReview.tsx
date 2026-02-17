import { useMemo } from 'react';
import { type BookmarkAssignment } from '../../types/organize';
import { groupByRootFolder, getLastSegment, stripRootSegment } from '../../utils/folderDisplay';
import { CheckIcon, XIcon } from '../icons/Icons';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import Button from '../Button/Button';
import './OrganizeReview.css';

interface OrganizeReviewProps {
  assignments: BookmarkAssignment[];
  onToggleAssignment: (bookmarkId: string) => void;
  onApplyMoves: () => void;
  onReset: () => void;
}

const OrganizeReview = ({
  assignments,
  onToggleAssignment,
  onApplyMoves,
  onReset,
}: OrganizeReviewProps) => {
  const approvedCount = useMemo(
    () => assignments.filter(assignment => assignment.isApproved).length,
    [assignments]
  );

  const folderGroups = useMemo(
    () => groupByRootFolder(assignments, assignment => assignment.suggestedPath),
    [assignments]
  );

  return (
    <div className="organize-review">
      <p className="organize-review-summary">
        {assignments.length} bookmarks assigned to {folderGroups.length} folder{folderGroups.length !== 1 ? 's' : ''}
      </p>

      <div className="organize-review-list">
        {folderGroups.map(group => (
          <FolderTreeGroup
            key={group.groupName}
            groupName={group.groupName}
            itemCount={group.items.length}
            defaultExpanded
          >
            {group.items.map(assignment => {
              const displayPath = getLastSegment(stripRootSegment(assignment.suggestedPath));

              return (
                <button
                  key={assignment.bookmarkId}
                  className={`organize-review-item ${assignment.isApproved ? 'approved' : 'rejected'}`}
                  onClick={() => onToggleAssignment(assignment.bookmarkId)}
                >
                  <span className="organize-review-item-indicator">
                    {assignment.isApproved
                      ? <CheckIcon width={10} height={10} />
                      : <XIcon width={10} height={10} />
                    }
                  </span>
                  <span className="organize-review-item-title">{assignment.bookmarkTitle}</span>
                  <span className="organize-review-item-folder">{displayPath}</span>
                  {assignment.isNewFolder && (
                    <span className="organize-review-new-badge">New</span>
                  )}
                </button>
              );
            })}
          </FolderTreeGroup>
        ))}
      </div>

      <div className="organize-review-actions">
        <Button
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
