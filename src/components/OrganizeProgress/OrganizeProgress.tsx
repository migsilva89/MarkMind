import { type OrganizeSession } from '../../types/organize';
import { SpinnerIcon } from '../icons/Icons';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';
import './OrganizeProgress.css';

interface OrganizeProgressProps {
  session: OrganizeSession;
  statusMessage: string;
}

const OrganizeProgress = ({ session, statusMessage }: OrganizeProgressProps) => {
  const { batchProgress } = session;
  const progressPercent = batchProgress.totalBatches > 0
    ? Math.round((batchProgress.completedBatches / batchProgress.totalBatches) * 100)
    : 0;

  return (
    <OrganizeStatusView
      icon={<SpinnerIcon width={24} height={24} />}
      title={statusMessage || 'Assigning bookmarks to folders...'}
    >
      <div className="organize-progress-bar-container">
        <div
          className="organize-progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="organize-progress-percent">{progressPercent}%</p>

      {batchProgress.totalBatches > 0 && (
        <p className="organize-progress-detail">
          Batch {batchProgress.completedBatches} of {batchProgress.totalBatches}
          {' · '}
          {batchProgress.processedBookmarks} of {batchProgress.totalBookmarks} bookmarks
        </p>
      )}

      {batchProgress.failedBatches.length > 0 && (
        <p className="organize-progress-failed">
          {batchProgress.failedBatches.length} batch{batchProgress.failedBatches.length > 1 ? 'es' : ''} failed — will retry
        </p>
      )}
    </OrganizeStatusView>
  );
};

export default OrganizeProgress;
