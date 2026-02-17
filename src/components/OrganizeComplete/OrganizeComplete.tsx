import { type OrganizeSession } from '../../types/organize';
import { CheckIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import Button from '../Button/Button';
import './OrganizeComplete.css';

interface OrganizeCompleteProps {
  session: OrganizeSession;
  onReset: () => void;
}

const OrganizeComplete = ({ session, onReset }: OrganizeCompleteProps) => {
  const durationSeconds = session.startedAt && session.completedAt
    ? Math.round((session.completedAt - session.startedAt) / 1000)
    : null;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <OrganizeStatusView
      icon={
        <span className="organize-complete-icon">
          <CheckIcon width={20} height={20} />
        </span>
      }
      title="Organization Complete"
    >
      <div className="organize-complete-stats">
        <div className="organize-complete-stat">
          <span className="organize-complete-stat-value">{session.appliedCount}</span>
          <span className="organize-complete-stat-label">moved</span>
        </div>
        {session.skippedCount > 0 && (
          <div className="organize-complete-stat">
            <span className="organize-complete-stat-value">{session.skippedCount}</span>
            <span className="organize-complete-stat-label">skipped</span>
          </div>
        )}
        {durationSeconds !== null && (
          <div className="organize-complete-stat">
            <span className="organize-complete-stat-value">{formatDuration(durationSeconds)}</span>
            <span className="organize-complete-stat-label">duration</span>
          </div>
        )}
      </div>

      <Button onClick={onReset} fullWidth>
        Done
      </Button>
    </OrganizeStatusView>
  );
};

export default OrganizeComplete;
