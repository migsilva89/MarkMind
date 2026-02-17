import { useMemo } from 'react';
import { type StatusType } from '../../types/common';
import { type OrganizeSession } from '../../types/organize';
import { groupByRootFolder, getLastSegment, stripRootSegment } from '../../utils/folderDisplay';
import { SpinnerIcon, RefreshIcon, CheckIcon, XIcon } from '../icons/Icons';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import Button from '../Button/Button';
import './OrganizePlan.css';

interface OrganizePlanProps {
  session: OrganizeSession;
  statusMessage: string;
  statusType: StatusType;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onToggleFolder: (folderPath: string) => void;
}

const OrganizePlan = ({
  session,
  statusMessage,
  statusType,
  onApprovePlan,
  onRejectPlan,
  onToggleFolder,
}: OrganizePlanProps) => {
  if (session.status === 'planning') {
    return (
      <div className="organize-plan">
        <div className="organize-plan-loading">
          <SpinnerIcon width={20} height={20} />
          {statusType === 'loading' && statusMessage
            ? statusMessage
            : 'Analyzing your bookmarks...'}
        </div>
      </div>
    );
  }

  if (!session.folderPlan) return null;

  const { folders, summary } = session.folderPlan;
  const newFolderCount = folders.filter(folder => folder.isNew).length;

  const folderGroups = useMemo(
    () => groupByRootFolder(folders, folder => folder.path),
    [folders]
  );

  return (
    <div className="organize-plan">
      <div className="organize-plan-review">
        <p className="organize-plan-summary">{summary}</p>

        <div className="organize-plan-folder-list">
          {folderGroups.map(group => {
            const groupNewCount = group.items.filter(folder => folder.isNew).length;

            return (
              <FolderTreeGroup
                key={group.groupName}
                groupName={group.groupName}
                itemCount={group.items.length}
                badge={groupNewCount > 0 ? `${groupNewCount} new` : undefined}
              >
                {group.items.map(folder => {
                  const displayName = getLastSegment(stripRootSegment(folder.path));

                  return (
                    <div key={folder.path} className="organize-plan-folder-item">
                      <span className="organize-plan-folder-path">{displayName}</span>
                      <span className="organize-plan-folder-description">{folder.description}</span>
                      {folder.isNew && <span className="organize-plan-new-badge">New</span>}
                      <button
                        className="organize-plan-remove-btn"
                        onClick={() => onToggleFolder(folder.path)}
                        title="Remove from plan"
                      >
                        <XIcon width={10} height={10} />
                      </button>
                    </div>
                  );
                })}
              </FolderTreeGroup>
            );
          })}
        </div>

        <p className="organize-plan-summary">
          {folders.length} folders ({newFolderCount} new)
        </p>
      </div>

      <div className="organize-plan-actions">
        <Button onClick={onApprovePlan} fullWidth>
          <CheckIcon />
          Approve Plan ({folders.length})
        </Button>
        <Button onClick={onRejectPlan} fullWidth>
          <RefreshIcon />
          Re-plan
        </Button>
      </div>
    </div>
  );
};

export default OrganizePlan;
