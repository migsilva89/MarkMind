import { useOrganizeBookmark } from '../../hooks/useOrganizeBookmark';
import WelcomeBanner from '../WelcomeBanner/WelcomeBanner';
import CurrentPageCard from '../CurrentPageCard/CurrentPageCard';
import QuickActions from '../QuickActions/QuickActions';
import OnboardingTooltip from '../OnboardingTooltip/OnboardingTooltip';

interface HomeTabProps {
  onTabChange: (tabId: string) => void;
  onOpenSettings: () => void;
  showCardTooltip?: boolean;
  onDismissCardTooltip?: () => void;
}

const HomeTab = ({
  onTabChange,
  onOpenSettings,
  showCardTooltip = false,
  onDismissCardTooltip,
}: HomeTabProps) => {
  const {
    currentPageData,
    isLoadingPage,
    isOrganizing,
    statusMessage,
    statusType,
    pendingSuggestion,
    existingBookmarkPath,
    existingBookmarkId,
    handleOrganizePage,
    handleAcceptSuggestion,
    handleDeclineSuggestion,
  } = useOrganizeBookmark();

  return (
    <>
      <WelcomeBanner />
      <CurrentPageCard
        currentPage={currentPageData}
        isLoadingPage={isLoadingPage}
        isOrganizing={isOrganizing}
        statusMessage={statusMessage}
        statusType={statusType}
        pendingSuggestion={pendingSuggestion}
        existingBookmarkPath={existingBookmarkPath}
        existingBookmarkId={existingBookmarkId}
        onOrganize={handleOrganizePage}
        onAccept={handleAcceptSuggestion}
        onDecline={handleDeclineSuggestion}
      />
      {showCardTooltip && onDismissCardTooltip && (
        <OnboardingTooltip
          content="This shows the page you're on. Hit Organize to find the perfect folder!"
          onDismiss={onDismissCardTooltip}
        />
      )}
      <QuickActions onTabChange={onTabChange} onOpenSettings={onOpenSettings} />
    </>
  );
};

export default HomeTab;
