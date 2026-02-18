import { useBulkOrganize } from '../../hooks/useBulkOrganize';
import { SpinnerIcon } from '../icons/Icons';
import OrganizeScan from '../OrganizeScan/OrganizeScan';
import OrganizePlan from '../OrganizePlan/OrganizePlan';
import OrganizeProgress from '../OrganizeProgress/OrganizeProgress';
import OrganizeReview from '../OrganizeReview/OrganizeReview';
import OrganizeComplete from '../OrganizeComplete/OrganizeComplete';
import OrganizeError from '../OrganizeError/OrganizeError';
import OrganizeStatusView from '../OrganizeStatusView/OrganizeStatusView';

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
    handleCancelPlanning,
    handleApprovePlan,
    handleRejectPlan,
    handleTogglePlanFolder,
    handleToggleAssignment,
    handleApplyMoves,
    handleReset,
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
          onCancelPlanning={handleCancelPlanning}
          onToggleFolder={handleTogglePlanFolder}
        />
      );

    case 'assigning':
      return (
        <OrganizeProgress
          session={session}
          statusMessage={statusMessage}
        />
      );

    case 'reviewing_assignments':
      return (
        <OrganizeReview
          assignments={session.assignments}
          onToggleAssignment={handleToggleAssignment}
          onApplyMoves={handleApplyMoves}
          onReset={handleReset}
        />
      );

    case 'applying':
      return (
        <OrganizeStatusView
          icon={<SpinnerIcon width={20} height={20} />}
          title="Moving bookmarks..."
          description="Please wait while your bookmarks are being reorganized"
        />
      );

    case 'completed':
      return (
        <OrganizeComplete
          session={session}
          onReset={handleReset}
        />
      );

    case 'error':
      return (
        <OrganizeError
          errorMessage={session.errorMessage}
          onReset={handleReset}
        />
      );

    default:
      return null;
  }
};

export default OrganizeTab;
