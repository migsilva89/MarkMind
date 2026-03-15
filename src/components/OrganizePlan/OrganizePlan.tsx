import { useMemo } from 'react';
import { type OrganizeSession } from '../../types/organize';
import { groupByRootFolder, getLastSegment, stripRootSegment } from '../../utils/folderDisplay';
import { RefreshIcon, CheckIcon } from '../icons/Icons';
import FolderTreeGroup from '../FolderTreeGroup/FolderTreeGroup';
import Button from '../Button/Button';
import './OrganizePlan.css';

interface OrganizePlanProps {
  session: OrganizeSession;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onToggleFolder: (folderPath: string) => void;
  onToggleGroupFolders: (folderPaths: string[]) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const OrganizePlan = ({
  session,
  onApprovePlan,
  onRejectPlan,
  onToggleFolder,
  onToggleGroupFolders,
  onSelectAll,
  onDeselectAll,
}: OrganizePlanProps) => {
  const folders = useMemo(
    () => session.folderPlan?.folders ?? [],
    [session.folderPlan?.folders]
  );

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

        <div className="organize-plan-bulk-actions">
          <Button onClick={onSelectAll}>Select All</Button>
          <Button onClick={onDeselectAll}>Deselect All</Button>
        </div>

        <div className="organize-plan-folder-list">
          {folderGroups.map(group => {
            const groupPaths = group.items.map(folder => folder.path);
            const includedInGroup = group.items.filter(folder => !folder.isExcluded).length;
            const isFullSelected = includedInGroup === group.items.length;
            const isPartialSelected = includedInGroup > 0 && !isFullSelected;
            const groupNewCount = group.items.filter(folder => folder.isNew && !folder.isExcluded).length;

            const groupCheckbox = (
              <Button
                variant="unstyled"
                className="organize-plan-check-wrap"
                onClick={() => onToggleGroupFolders(groupPaths)}
              >
                <span className={`organize-plan-check ${isFullSelected ? 'full' : isPartialSelected ? 'partial' : ''}`}>
                  {isFullSelected && <CheckIcon width={10} height={10} />}
                  {isPartialSelected && <span className="organize-plan-partial-dash" />}
                </span>
              </Button>
            );

            return (
              <FolderTreeGroup
                key={group.groupName}
                groupName={group.groupName}
                itemCount={includedInGroup}
                badge={groupNewCount > 0 ? `${groupNewCount} new` : undefined}
                headerAction={groupCheckbox}
              >
                {group.items.map(folder => {
                  const displayName = getLastSegment(stripRootSegment(folder.path));

                  return (
                    <Button
                      key={folder.path}
                      variant="unstyled"
                      className={`organize-plan-folder-row ${folder.isExcluded ? 'excluded' : 'included'}`}
                      onClick={() => onToggleFolder(folder.path)}
                    >
                      <span className="organize-plan-check-wrap">
                        <span className={`organize-plan-check ${folder.isExcluded ? '' : 'full'}`}>
                          {!folder.isExcluded && <CheckIcon width={10} height={10} />}
                        </span>
                      </span>
                      <span className="organize-plan-folder-path">{displayName}</span>
                      <span className="organize-plan-folder-description">{folder.description}</span>
                      {folder.isNew && <span className="organize-plan-new-badge">New</span>}
                    </Button>
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
        <Button variant="primary" onClick={onApprovePlan} disabled={includedCount === 0} fullWidth>
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
