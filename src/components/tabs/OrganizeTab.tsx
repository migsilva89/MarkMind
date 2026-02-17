import { useBulkOrganize } from '../../hooks/useBulkOrganize';
import OrganizeScan from '../OrganizeScan/OrganizeScan';
import OrganizePlan from '../OrganizePlan/OrganizePlan';

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
        />
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
