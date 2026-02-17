import { DocumentIcon } from '../icons/Icons';
import { stripRootSegment } from '../../utils/folderDisplay';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
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
  const cleanPath = stripRootSegment(folderPath);
  const displayPath = cleanPath.split('/').join(' / ');

  return (
    <div className="bookmark-tree-path">
      <span className="bookmark-tree-path-label">{label}</span>
      <FolderTreeGroup
        groupName={displayPath}
        itemCount={1}
        badge={isNewFolder ? 'New' : undefined}
        defaultExpanded
      >
        <div className="bookmark-tree-path-item">
          <DocumentIcon width={10} height={10} />
          <span className="bookmark-tree-path-bookmark-title">{bookmarkTitle}</span>
        </div>
      </FolderTreeGroup>
      {isNewFolder && (
        <span className="bookmark-tree-path-new-hint">This folder will be created for you</span>
      )}
    </div>
  );
};

export default BookmarkTreePath;
