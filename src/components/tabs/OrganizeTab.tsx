import { useBulkOrganize } from '../../hooks/useBulkOrganize';
import OrganizeScan from '../OrganizeScan/OrganizeScan';
import OrganizePlan from '../OrganizePlan/OrganizePlan';
import { SpinnerIcon } from '../icons/Icons';
import './OrganizeTab.css';

const OrganizeTab = () => {
  const {
    session,
    bookmarkStats,
    statusMessage,
    statusType,
    handleStartScan,
    handleToggleFolder,
    handleSelectAllFolders,
    handleDeselectAllFolders,
    handleStartPlanning,
    handleApprovePlan,
    handleRejectPlan,
    handleTogglePlanFolder,
  } = useBulkOrganize();

  switch (session.status) {
    case 'idle':
    case 'scanning':
    case 'selecting':
      return (
        <OrganizeScan
          session={session}
          bookmarkStats={bookmarkStats}
          onStartScan={handleStartScan}
          onToggleFolder={handleToggleFolder}
          onSelectAll={handleSelectAllFolders}
          onDeselectAll={handleDeselectAllFolders}
          onStartPlanning={handleStartPlanning}
        />
      );

    case 'planning':
    case 'reviewing_plan':
      return (
        <OrganizePlan
          session={session}
          statusMessage={statusMessage}
          statusType={statusType}
          onApprovePlan={handleApprovePlan}
          onRejectPlan={handleRejectPlan}
          onToggleFolder={handleTogglePlanFolder}
        />
      );

    case 'assigning':
      return (
        <div className="organize-assigning">
          <SpinnerIcon width={20} height={20} />
          <p className="organize-assigning-status">
            {statusType === 'loading' && statusMessage
              ? statusMessage
              : 'Assigning bookmarks to folders...'}
          </p>
          {session.batchProgress.totalBatches > 0 && (
            <p className="organize-assigning-progress">
              Batch {session.batchProgress.completedBatches} of {session.batchProgress.totalBatches}
            </p>
          )}
        </div>
      );

    default:
      return (
        <div className="tab-placeholder">
          <p className="tab-placeholder-text">Processing...</p>
        </div>
      );
  }
};

export default OrganizeTab;
