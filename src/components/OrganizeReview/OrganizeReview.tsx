import { useMemo } from 'react';
import { type BookmarkAssignment } from '../../types/organize';
import { getLastSegment } from '../../utils/folderDisplay';
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

      <div className="organize-review-list">
        {folderGroups.map(group => (
          <FolderTreeGroup
            key={group.fullPath}
            groupName={group.displayName}
            itemCount={group.items.length}
          >
            {group.items.map(assignment => (
              <Button
                key={assignment.bookmarkId}
                variant="unstyled"
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
                {assignment.isNewFolder && (
                  <span className="organize-review-new-badge">New</span>
                )}
              </Button>
            ))}
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
