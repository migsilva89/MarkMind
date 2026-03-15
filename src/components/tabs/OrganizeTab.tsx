import { useBulkOrganize } from '../../hooks/useBulkOrganize';
import { SpinnerIcon } from '../icons/Icons';
import Button from '../Button/Button';
import OrganizeScan from '../OrganizeScan/OrganizeScan';
import OrganizePlan from '../OrganizePlan/OrganizePlan';
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
    handleToggleBookmarks,
    handleSelectAll,
    handleDeselectAll,
    handleStartOrganizing,
    handleCancelOrganizing,
    handleApprovePlan,
    handleRejectPlan,
    handleTogglePlanFolder,
    handleToggleGroupPlanFolders,
    handleSelectAllPlanFolders,
    handleDeselectAllPlanFolders,
    handleToggleGroupAssignments,
    handleSelectAllAssignments,
    handleDeselectAllAssignments,
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
          onToggleBookmarks={handleToggleBookmarks}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onStartPlanning={handleStartOrganizing}
        />
      );

    case 'organizing':
      return (
        <OrganizeStatusView
          icon={<SpinnerIcon width={24} height={24} />}
          title={statusType === 'loading' && statusMessage
            ? statusMessage
            : 'Analyzing your bookmarks...'}
          description="Feel free to close this popup — MarkMind keeps organizing in the background. Come back anytime to check progress."
        >
          <Button onClick={handleCancelOrganizing} fullWidth>
            Cancel
          </Button>
        </OrganizeStatusView>
      );

    case 'reviewing_plan':
      return (
        <OrganizePlan
          session={session}
          onApprovePlan={handleApprovePlan}
          onRejectPlan={handleRejectPlan}
          onToggleFolder={handleTogglePlanFolder}
          onToggleGroupFolders={handleToggleGroupPlanFolders}
          onSelectAll={handleSelectAllPlanFolders}
          onDeselectAll={handleDeselectAllPlanFolders}
        />
      );

    case 'reviewing_assignments':
      return (
        <OrganizeReview
          assignments={session.assignments}
          onToggleGroupAssignments={handleToggleGroupAssignments}
          onSelectAll={handleSelectAllAssignments}
          onDeselectAll={handleDeselectAllAssignments}
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
