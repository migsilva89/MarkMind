import { useState, useCallback } from 'react';
import { type DuplicateGroup } from '../../types/organize';
import { countRemovableDuplicates, getDuplicateIdsToRemove } from '../../utils/duplicates';
import Button from '../Button/Button';
import './OrganizeDuplicates.css';

interface OrganizeDuplicatesProps {
  groups: DuplicateGroup[];
  onRemove: (bookmarkIdsToRemove: string[]) => Promise<void>;
}

const OrganizeDuplicates = ({ groups, onRemove }: OrganizeDuplicatesProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const removableCount = countRemovableDuplicates(groups);

  const handleRemove = useCallback(async (): Promise<void> => {
    setIsRemoving(true);
    try {
      await onRemove(getDuplicateIdsToRemove(groups));
    } finally {
      setIsRemoving(false);
      setIsConfirming(false);
    }
  }, [groups, onRemove]);

  if (groups.length === 0) return null;

  const bookmarkWord = removableCount === 1 ? 'bookmark' : 'bookmarks';

  return (
    <div className="organize-duplicates">
      <p className="organize-duplicates-title">
        {removableCount} duplicate {bookmarkWord} found
      </p>
      <p className="organize-duplicates-subtitle">
        One copy of each is kept; the rest are removed.
      </p>

      <div className="organize-duplicates-list">
        {groups.map(group => (
          <div key={group.url} className="organize-duplicates-group">
            <p className="organize-duplicates-url" title={group.url}>{group.url}</p>
            <ul className="organize-duplicates-copies">
              {group.bookmarks.map((bookmark, index) => (
                <li key={bookmark.id} className="organize-duplicates-copy">
                  <span className={index === 0 ? 'organize-duplicates-tag-keep' : 'organize-duplicates-tag-remove'}>
                    {index === 0 ? 'Keep' : 'Remove'}
                  </span>
                  <span className="organize-duplicates-location">
                    {bookmark.currentFolderPath || 'Root'} — {bookmark.title || 'Untitled'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {isConfirming ? (
        <div className="organize-duplicates-confirm">
          <p className="organize-duplicates-confirm-text">
            Delete {removableCount} {bookmarkWord}? This can't be undone.
          </p>
          <div className="organize-duplicates-confirm-actions">
            <Button onClick={() => setIsConfirming(false)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? 'Removing...' : `Yes, remove ${removableCount}`}
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsConfirming(true)} fullWidth>
          Remove {removableCount} duplicate {bookmarkWord}
        </Button>
      )}
    </div>
  );
};

export default OrganizeDuplicates;
