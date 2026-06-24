import { useState, useCallback } from 'react';
import { type DuplicateGroup } from '../../types/organize';
import OrganizeCheckbox from '../OrganizeCheckbox/OrganizeCheckbox';
import Button from '../Button/Button';
import './OrganizeDuplicates.css';

interface OrganizeDuplicatesProps {
  groups: DuplicateGroup[];
  onRemove: (bookmarkIdsToRemove: string[]) => Promise<void>;
}

const OrganizeDuplicates = ({ groups, onRemove }: OrganizeDuplicatesProps) => {
  // Which copy to keep per group, keyed by URL. Defaults to the first copy;
  // missing keys fall back so re-scans with new groups still work.
  const [keeperByUrl, setKeeperByUrl] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const getKeeperId = (group: DuplicateGroup): string =>
    keeperByUrl[group.url] ?? group.bookmarks[0].id;

  const setKeeperId = (url: string, bookmarkId: string): void => {
    setKeeperByUrl(previous => ({ ...previous, [url]: bookmarkId }));
  };

  // Everything except the chosen keeper in each group.
  const idsToRemove = groups.flatMap(group =>
    group.bookmarks
      .filter(bookmark => bookmark.id !== getKeeperId(group))
      .map(bookmark => bookmark.id)
  );
  const removableCount = idsToRemove.length;

  const handleRemove = useCallback(async (): Promise<void> => {
    setIsRemoving(true);
    try {
      await onRemove(idsToRemove);
    } finally {
      setIsRemoving(false);
      setIsConfirming(false);
    }
  }, [idsToRemove, onRemove]);

  if (groups.length === 0) return null;

  const bookmarkWord = removableCount === 1 ? 'bookmark' : 'bookmarks';

  return (
    <div className="organize-duplicates">
      <p className="organize-duplicates-title">
        {removableCount} duplicate {bookmarkWord} to remove
      </p>
      <p className="organize-duplicates-subtitle">
        Pick the copy to keep in each group — the others are removed.
      </p>

      <div className="organize-duplicates-list">
        {groups.map(group => {
          const keeperId = getKeeperId(group);
          return (
            <div key={group.url} className="organize-duplicates-group">
              <p className="organize-duplicates-url" title={group.url}>{group.url}</p>
              <div className="organize-duplicates-copies">
                {group.bookmarks.map(bookmark => {
                  const isKeeper = bookmark.id === keeperId;
                  return (
                    <Button
                      key={bookmark.id}
                      variant="unstyled"
                      className={`organize-duplicates-copy${isKeeper ? ' is-keeper' : ''}`}
                      onClick={() => setKeeperId(group.url, bookmark.id)}
                      title={isKeeper ? 'Kept' : 'Click to keep this copy'}
                    >
                      <OrganizeCheckbox state={isKeeper ? 'full' : 'empty'} />
                      <span className="organize-duplicates-location">
                        {bookmark.currentFolderPath || 'Root'} — {bookmark.title || 'Untitled'}
                      </span>
                      {isKeeper && <span className="organize-duplicates-keep-tag">keep</span>}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
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
        <Button onClick={() => setIsConfirming(true)} fullWidth disabled={removableCount === 0}>
          Remove {removableCount} duplicate {bookmarkWord}
        </Button>
      )}
    </div>
  );
};

export default OrganizeDuplicates;
