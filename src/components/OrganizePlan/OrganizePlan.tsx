import { useMemo } from 'react';
import { type OrganizeSession } from '../../types/organize';
import { groupByRootFolder, getLastSegment, stripRootSegment } from '../../utils/folderDisplay';
import { RefreshIcon, CheckIcon, XIcon } from '../icons/Icons';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import Button from '../Button/Button';
import './OrganizePlan.css';

interface OrganizePlanProps {
  session: OrganizeSession;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onToggleFolder: (folderPath: string) => void;
}

const OrganizePlan = ({
  session,
  onApprovePlan,
  onRejectPlan,
  onToggleFolder,
}: OrganizePlanProps) => {
  const folders = session.folderPlan?.folders ?? [];

  const folderGroups = useMemo(
    () => groupByRootFolder(folders, folder => folder.path),
    [folders]
  );

  if (!session.folderPlan) return null;

  const { summary } = session.folderPlan;
  const includedCount = folders.filter(folder => !folder.isExcluded).length;
  const newFolderCount = folders.filter(folder => folder.isNew && !folder.isExcluded).length;

  return (
    <div className="organize-plan">
      <div className="organize-plan-review">
        <p className="organize-plan-summary">{summary}</p>

        <div className="organize-plan-folder-list">
          {folderGroups.map(group => {
            const groupNewCount = group.items.filter(folder => folder.isNew && !folder.isExcluded).length;

            return (
              <FolderTreeGroup
                key={group.groupName}
                groupName={group.groupName}
                itemCount={group.items.filter(folder => !folder.isExcluded).length}
                badge={groupNewCount > 0 ? `${groupNewCount} new` : undefined}
              >
                {group.items.map(folder => {
                  const displayName = getLastSegment(stripRootSegment(folder.path));

                  return (
                    <button
                      key={folder.path}
                      className={`organize-plan-folder-row ${folder.isExcluded ? 'excluded' : 'included'}`}
                      onClick={() => onToggleFolder(folder.path)}
                    >
                      <span className="organize-plan-folder-indicator">
                        {folder.isExcluded
                          ? <XIcon width={10} height={10} />
                          : <CheckIcon width={10} height={10} />
                        }
                      </span>
                      <span className="organize-plan-folder-path">{displayName}</span>
                      <span className="organize-plan-folder-description">{folder.description}</span>
                      {folder.isNew && <span className="organize-plan-new-badge">New</span>}
                    </button>
                  );
                })}
              </FolderTreeGroup>
            );
          })}
        </div>

        <p className="organize-plan-summary">
          {includedCount} folder{includedCount !== 1 ? 's' : ''} ({newFolderCount} new)
        </p>
      </div>

      <div className="organize-plan-actions">
        <Button onClick={onApprovePlan} disabled={includedCount === 0} fullWidth>
          <CheckIcon />
          Approve Plan ({includedCount})
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
