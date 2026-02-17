import { useMemo } from 'react';
import { type OrganizeSession } from '../../types/organize';
import { type BookmarkStats } from '../../utils/bookmarkScanner';
import { groupByRootFolder, getLastSegment, stripRootSegment } from '../../utils/folderDisplay';
import { FolderIcon, SpinnerIcon } from '../icons/Icons';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import Button from '../Button/Button';
import './OrganizeScan.css';

interface OrganizeScanProps {
  session: OrganizeSession;
  bookmarkStats: BookmarkStats | null;
  onStartScan: () => void;
  onToggleFolder: (folderId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartPlanning: () => void;
}

interface FolderListItem {
  folderId: string;
  folderPath: string;
  bookmarkCount: number;
}

const OrganizeScan = ({
  session,
  bookmarkStats,
  onStartScan,
  onToggleFolder,
  onSelectAll,
  onDeselectAll,
  onStartPlanning,
}: OrganizeScanProps) => {
  const folderList = useMemo((): FolderListItem[] => {
    const folderMap = new Map<string, { path: string; count: number }>();

    for (const bookmark of session.allBookmarks) {
      const existing = folderMap.get(bookmark.currentFolderId);
      if (existing) {
        existing.count += 1;
      } else {
        folderMap.set(bookmark.currentFolderId, {
          path: bookmark.currentFolderPath,
          count: 1,
        });
      }
    }

    return [...folderMap.entries()]
      .map(([folderId, data]) => ({
        folderId,
        folderPath: data.path,
        bookmarkCount: data.count,
      }))
      .sort((folderA, folderB) => folderB.bookmarkCount - folderA.bookmarkCount);
  }, [session.allBookmarks]);

  const folderGroups = useMemo(
    () => groupByRootFolder(folderList, folder => folder.folderPath),
    [folderList]
  );

  const selectedCount = useMemo(() => {
    if (!session.selectedFolderIds) return 0;
    const selectedSet = new Set(session.selectedFolderIds);
    return session.allBookmarks.filter(bookmark => selectedSet.has(bookmark.currentFolderId)).length;
  }, [session.allBookmarks, session.selectedFolderIds]);

  if (session.status === 'scanning') {
    return (
      <div className="organize-scan">
        <div className="organize-scan-loading">
          <SpinnerIcon width={20} height={20} />
          Scanning your bookmarks...
        </div>
      </div>
    );
  }

  if (session.status === 'selecting' && bookmarkStats) {
    return (
      <div className="organize-scan">
        <div className="organize-scan-stats">
          <p className="organize-scan-stats-summary">
            Found {bookmarkStats.totalBookmarks} bookmarks in {bookmarkStats.totalFolders} folders
          </p>

          <div className="organize-scan-bulk-actions">
            <Button onClick={onSelectAll}>Select All</Button>
            <Button onClick={onDeselectAll}>Deselect All</Button>
          </div>

          <div className="organize-scan-folder-list">
            {folderGroups.map(group => {
              const groupBookmarkCount = group.items.reduce(
                (total, folder) => total + folder.bookmarkCount, 0
              );

              return (
                <FolderTreeGroup
                  key={group.groupName}
                  groupName={group.groupName}
                  itemCount={groupBookmarkCount}
                  defaultExpanded
                >
                  {group.items.map(folder => {
                    const isSelected = session.selectedFolderIds?.includes(folder.folderId) ?? false;
                    const displayName = getLastSegment(stripRootSegment(folder.folderPath));

                    return (
                      <Button
                        key={folder.folderId}
                        active={isSelected}
                        compact
                        onClick={() => onToggleFolder(folder.folderId)}
                        fullWidth
                      >
                        <span className="organize-scan-folder-item">
                          <span className="organize-scan-folder-path">{displayName}</span>
                          <span className="organize-scan-folder-count">{folder.bookmarkCount}</span>
                        </span>
                      </Button>
                    );
                  })}
                </FolderTreeGroup>
              );
            })}
          </div>
        </div>

        <Button
          onClick={onStartPlanning}
          disabled={selectedCount === 0}
          fullWidth
        >
          Organize Selected ({selectedCount})
        </Button>
      </div>
    );
  }

  return (
    <div className="organize-scan">
      <div className="organize-scan-intro">
        <div className="organize-scan-intro-icon">
          <FolderIcon width={20} height={20} />
        </div>
        <p className="organize-scan-intro-title">Organize All Bookmarks</p>
        <p className="organize-scan-intro-description">
          Let AI analyze your bookmarks and suggest the perfect folder structure
        </p>
        <Button onClick={onStartScan} fullWidth>
          Scan My Bookmarks
        </Button>
      </div>
    </div>
  );
};

export default OrganizeScan;
