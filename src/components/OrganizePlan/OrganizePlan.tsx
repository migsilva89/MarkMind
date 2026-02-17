import { type StatusType } from '../../types/common';
import { type OrganizeSession } from '../../types/organize';
import { SpinnerIcon, RefreshIcon, CheckIcon } from '../icons/Icons';
import Button from '../Button/Button';
import './OrganizePlan.css';

interface OrganizePlanProps {
  session: OrganizeSession;
  statusMessage: string;
  statusType: StatusType;
  onApprovePlan: () => void;
  onRejectPlan: () => void;
}

const OrganizePlan = ({
  session,
  statusMessage,
  statusType,
  onApprovePlan,
  onRejectPlan,
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

  return (
    <div className="organize-plan">
      <div className="organize-plan-review">
        <p className="organize-plan-summary">{summary}</p>

        <div className="organize-plan-folder-list">
          {folders.map(folder => (
            <div key={folder.path} className="organize-plan-folder-item">
              <span className="organize-plan-folder-path">{folder.path}</span>
              <span className="organize-plan-folder-description">{folder.description}</span>
              {folder.isNew && <span className="organize-plan-new-badge">New</span>}
            </div>
          ))}
        </div>

        <p className="organize-plan-summary">
          {folders.length} folders ({newFolderCount} new)
        </p>
      </div>

      <div className="organize-plan-actions">
        <Button onClick={onApprovePlan} fullWidth>
          <CheckIcon />
          Approve Plan
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
