import { useState, useCallback, useMemo } from 'react';
import { type OrganizeSession } from '../../types/organize';
import { type BookmarkStats } from '../../types/bookmarks';
import { buildFolderTree } from '../../utils/bookmarkScanner';
import { FolderIcon, SpinnerIcon, RefreshIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import TreeNode from '../TreeNode/TreeNode';
import Button from '../Button/Button';
import './OrganizeScan.css';

interface OrganizeScanProps {
  session: OrganizeSession;
  bookmarkStats: BookmarkStats | null;
  onStartScan: () => void;
  onToggleBookmarks: (bookmarkIds: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onStartPlanning: () => void;
}

const OrganizeScan = ({
  session,
  bookmarkStats,
  onStartScan,
  onToggleBookmarks,
  onSelectAll,
  onDeselectAll,
  onStartPlanning,
}: OrganizeScanProps) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const handleToggleExpand = useCallback((nodePath: string) => {
    setExpandedPaths(previous => {
      const next = new Set(previous);
      if (next.has(nodePath)) {
        next.delete(nodePath);
      } else {
        next.add(nodePath);
      }
      return next;
    });
  }, []);

  const folderTree = useMemo(
    () => buildFolderTree(session.allBookmarks),
    [session.allBookmarks]
  );

  const selectedSet = useMemo(
    () => new Set(session.selectedBookmarkIds ?? []),
    [session.selectedBookmarkIds]
  );

  const selectedCount = selectedSet.size;

  if (session.status === 'scanning') {
    return (
      <div className="organize-scan">
        <OrganizeStatusView
          icon={<SpinnerIcon width={20} height={20} />}
          title="Scanning your bookmarks..."
        />
      </div>
    );
  }

  if (session.status === 'selecting' && bookmarkStats) {
    return (
      <div className="organize-scan">
        <div className="organize-scan-stats">
          <div className="organize-scan-stats-header">
            <p className="organize-scan-stats-summary">
              Found {bookmarkStats.totalBookmarks} bookmarks in {bookmarkStats.totalFolders} folders
            </p>
            <Button
              variant="unstyled"
              className="organize-scan-rescan-btn"
              onClick={onStartScan}
              title="Re-scan to get the latest bookmark data"
            >
              <RefreshIcon width={12} height={12} />
            </Button>
          </div>

          <div className="organize-scan-bulk-actions">
            <Button onClick={onSelectAll}>Select All</Button>
            <Button onClick={onDeselectAll}>Deselect All</Button>
          </div>

          <div className="organize-scan-folder-list">
            {folderTree.children.map(topLevelNode => (
              <TreeNode
                key={topLevelNode.path}
                node={topLevelNode}
                depth={0}
                selectedSet={selectedSet}
                expandedPaths={expandedPaths}
                onToggleBookmarks={onToggleBookmarks}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </div>

        <Button
          variant="primary"
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
        <p className="organize-scan-intro-title">Time to tidy up</p>
        <p className="organize-scan-intro-description">
          We'll analyze your bookmarks and organize them into the perfect folder structure for you.
        </p>
        <Button variant="primary" onClick={onStartScan} fullWidth>
          Scan My Bookmarks
        </Button>
      </div>
    </div>
  );
};

export default OrganizeScan;
