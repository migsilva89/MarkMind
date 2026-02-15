import { FolderIcon, DocumentIcon, PlusIcon } from '../icons/Icons';
import { getDisplaySegments } from '../../utils/folders';
import './BookmarkTreePath.css';

interface BookmarkTreePathProps {
  folderPath: string;
  bookmarkTitle: string;
  isNewFolder: boolean;
  label?: string;
}

const BookmarkTreePath = ({
  folderPath,
  bookmarkTitle,
  isNewFolder,
  label = 'Suggested location',
}: BookmarkTreePathProps) => {
  const segments = getDisplaySegments(folderPath);
  const lastFolderIndex = segments.length - 1;

  const getTargetRowClass = (index: number): string => {
    if (index !== lastFolderIndex) return '';
    return isNewFolder ? ' bookmark-tree-path-row-new' : ' bookmark-tree-path-row-target';
  };

  return (
    <div className="bookmark-tree-path">
      <span className="bookmark-tree-path-label">{label}</span>
      <div className="bookmark-tree-path-tree">
        {segments.map((segment, index) => {
          const isNewFolderRow = isNewFolder && index === lastFolderIndex;

          return (
            <div
              key={`${segment.name}-${index}`}
              className={`bookmark-tree-path-row${getTargetRowClass(index)}`}
              style={{ paddingLeft: `calc(${segment.depth} * var(--spacing-2xl))` }}
            >
              {segment.isEllipsis ? (
                <span className="bookmark-tree-path-ellipsis">{segment.name}</span>
              ) : (
                <>
                  <FolderIcon width={12} height={12} />
                  <span className="bookmark-tree-path-folder-name">{segment.name}</span>
                  {isNewFolderRow && (
                    <span className="bookmark-tree-path-new-badge">
                      <PlusIcon width={8} height={8} />
                      New
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
        <div
          className="bookmark-tree-path-row bookmark-tree-path-bookmark"
          style={{ paddingLeft: `calc(${(segments[lastFolderIndex]?.depth ?? 0) + 1} * var(--spacing-2xl))` }}
        >
          <DocumentIcon width={12} height={12} />
          <span className="bookmark-tree-path-bookmark-title">{bookmarkTitle}</span>
        </div>
      </div>
      {isNewFolder && (
        <span className="bookmark-tree-path-new-hint">This folder will be created for you</span>
      )}
    </div>
  );
};

export default BookmarkTreePath;
