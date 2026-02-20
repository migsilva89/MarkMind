import { useState, useCallback, type ReactNode } from 'react';
import { ArrowRightIcon } from '../icons/Icons';
import Button from '../Button/Button';
import './FolderTreeGroup.css';

interface FolderTreeGroupProps {
  groupName: string;
  itemCount: number;
  badge?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

const FolderTreeGroup = ({
  groupName,
  itemCount,
  badge,
  children,
  defaultExpanded = false,
}: FolderTreeGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(previousExpanded => !previousExpanded);
  }, []);

  return (
    <div className="folder-tree-group">
      <Button
        variant="unstyled"
        className="folder-tree-group-header"
        onClick={handleToggleExpand}
      >
        <span className={`folder-tree-chevron ${isExpanded ? 'expanded' : ''}`}>
          <ArrowRightIcon width={10} height={10} />
        </span>
        <span className="folder-tree-group-name">{groupName}</span>
        {badge && <span className="folder-tree-group-badge">{badge}</span>}
        <span className="folder-tree-group-count">
          {itemCount}
        </span>
      </Button>

      {isExpanded && (
        <div className="folder-tree-group-children">
          {children}
        </div>
      )}
    </div>
  );
};

export default FolderTreeGroup;
