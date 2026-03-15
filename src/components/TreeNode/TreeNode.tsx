import { useMemo } from 'react';
import { type FolderTreeNode } from '../../types/organize';
import { getAllBookmarksInNode } from '../../utils/bookmarkScanner';
import { ArrowRightIcon, WarningIcon } from '../icons/Icons';
import OrganizeCheckbox from '../OrganizeCheckbox/OrganizeCheckbox';
import Button from '../Button/Button';
import './TreeNode.css';

interface TreeNodeProps {
  node: FolderTreeNode;
  depth: number;
  selectedSet: Set<string>;
  expandedPaths: Set<string>;
  onToggleBookmarks: (bookmarkIds: string[]) => void;
  onToggleExpand: (nodePath: string) => void;
}

const TreeNode = ({
  node,
  depth,
  selectedSet,
  expandedPaths,
  onToggleBookmarks,
  onToggleExpand,
}: TreeNodeProps) => {
  // node reference is stable between selection changes — only updates after a new scan
  const allBookmarksInNode = useMemo(() => getAllBookmarksInNode(node), [node]);

  const selectedInNode = allBookmarksInNode.filter(bookmark => selectedSet.has(bookmark.id));
  const isFullSelected = allBookmarksInNode.length > 0 && selectedInNode.length === allBookmarksInNode.length;
  const isPartialSelected = selectedInNode.length > 0 && !isFullSelected;
  const isExpanded = expandedPaths.has(node.path);
  const hasChildren = node.children.length > 0 || node.bookmarks.length > 0;
  const isOrphaned = node.name === 'Root';

  return (
    <div className="organize-tree-node">
      <div
        className="organize-tree-folder-row"
        style={{ paddingLeft: `calc(${depth} * var(--spacing-2xl))` }}
      >
        <Button
          variant="unstyled"
          className={`organize-tree-expand-btn ${isExpanded ? 'open' : ''} ${!hasChildren ? 'invisible' : ''}`}
          onClick={() => onToggleExpand(node.path)}
        >
          <ArrowRightIcon width={8} height={8} />
        </Button>

        <Button
          variant="unstyled"
          className="organize-check-wrap"
          onClick={() => onToggleBookmarks(allBookmarksInNode.map(bookmark => bookmark.id))}
        >
          <OrganizeCheckbox state={isFullSelected ? 'full' : isPartialSelected ? 'partial' : 'empty'} />
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
          {node.children.map(childNode => (
            <TreeNode
              key={childNode.path}
              node={childNode}
              depth={depth + 1}
              selectedSet={selectedSet}
              expandedPaths={expandedPaths}
              onToggleBookmarks={onToggleBookmarks}
              onToggleExpand={onToggleExpand}
            />
          ))}

          {node.bookmarks.map(bookmark => {
            const isSelected = selectedSet.has(bookmark.id);
            return (
              <div
                key={bookmark.id}
                className="organize-tree-bookmark-row"
                style={{ paddingLeft: `calc(${depth + 1} * var(--spacing-2xl) + var(--spacing-3xl))` }}
              >
                <Button
                  variant="unstyled"
                  className="organize-check-wrap"
                  onClick={() => onToggleBookmarks([bookmark.id])}
                >
                  <OrganizeCheckbox state={isSelected ? 'full' : 'empty'} />
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

export default TreeNode;
