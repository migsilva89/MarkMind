import { useState, useCallback, useMemo } from 'react';
import { type OrganizeSession, type FolderTreeNode } from '../../types/organize';
import { type BookmarkStats } from '../../types/bookmarks';
import { buildFolderTree, getAllBookmarksInNode } from '../../utils/bookmarkScanner';
import { FolderIcon, SpinnerIcon, CheckIcon, ArrowRightIcon, RefreshIcon, WarningIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
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

  const renderTreeNode = (node: FolderTreeNode, depth: number) => {
    const allBookmarksInNode = getAllBookmarksInNode(node);
    const selectedInNode = allBookmarksInNode.filter(bookmark => selectedSet.has(bookmark.id));
    const isFullSelected = allBookmarksInNode.length > 0 && selectedInNode.length === allBookmarksInNode.length;
    const isPartialSelected = selectedInNode.length > 0 && !isFullSelected;
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children.length > 0 || node.bookmarks.length > 0;

    const isOrphaned = node.name === 'Root';

    return (
      <div key={node.path} className="organize-tree-node">
        <div
          className="organize-tree-folder-row"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <Button
            variant="unstyled"
            className={`organize-tree-expand-btn ${isExpanded ? 'open' : ''} ${!hasChildren ? 'invisible' : ''}`}
            onClick={() => handleToggleExpand(node.path)}
          >
            <ArrowRightIcon width={8} height={8} />
          </Button>

          <Button
            variant="unstyled"
            className="organize-tree-folder-check-wrap"
            onClick={() => onToggleBookmarks(allBookmarksInNode.map(bookmark => bookmark.id))}
          >
            <span className={`organize-tree-check ${isFullSelected ? 'full' : isPartialSelected ? 'partial' : ''}`}>
              {isFullSelected && <CheckIcon width={10} height={10} />}
              {isPartialSelected && <span className="organize-tree-partial-dash" />}
            </span>
          </Button>

          {isOrphaned && (
            <span className="organize-tree-orphaned-icon" title="These bookmarks have no valid parent folder">
              <WarningIcon width={10} height={10} />
            </span>
          )}
          <span className={`organize-tree-folder-name ${isOrphaned ? 'orphaned' : ''}`}>
            {isOrphaned ? 'Orphaned' : node.name}
          </span>
          <span className="organize-tree-folder-count">{allBookmarksInNode.length}</span>
        </div>

        {isExpanded && (
          <div className="organize-tree-children">
            {node.children.map(child => renderTreeNode(child, depth + 1))}

            {node.bookmarks.map(bookmark => {
              const isSelected = selectedSet.has(bookmark.id);
              return (
                <div
                  key={bookmark.id}
                  className="organize-tree-bookmark-row"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
                >
                  <Button
                    variant="unstyled"
                    className="organize-tree-bookmark-check-wrap"
                    onClick={() => onToggleBookmarks([bookmark.id])}
                  >
                    <span className={`organize-tree-check ${isSelected ? 'full' : ''}`}>
                      {isSelected && <CheckIcon width={10} height={10} />}
                    </span>
                  </Button>
                  <span className="organize-tree-bookmark-title" title={bookmark.url}>
                    {bookmark.title}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
            {folderTree.children.map(topLevelNode => renderTreeNode(topLevelNode, 0))}
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
