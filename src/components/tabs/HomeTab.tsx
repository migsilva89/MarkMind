import { useOrganizeBookmark } from '../../hooks/useOrganizeBookmark';
import CurrentPageCard from '../CurrentPageCard/CurrentPageCard';
import QuickActions from '../QuickActions/QuickActions';

interface HomeTabProps {
  onTabChange: (tabId: string) => void;
  onOpenSettings: () => void;
}

const HomeTab = ({ onTabChange, onOpenSettings }: HomeTabProps) => {
  const {
    currentPageData,
    isLoadingPage,
    isOrganizing,
    statusMessage,
    statusType,
    pendingSuggestion,
    existingBookmarkPath,
    handleOrganizePage,
    handleAcceptSuggestion,
    handleDeclineSuggestion,
  } = useOrganizeBookmark();

  return (
    <>
      <CurrentPageCard
        currentPage={currentPageData}
        isLoadingPage={isLoadingPage}
        isOrganizing={isOrganizing}
        statusMessage={statusMessage}
        statusType={statusType}
        pendingSuggestion={pendingSuggestion}
        existingBookmarkPath={existingBookmarkPath}
        onOrganize={handleOrganizePage}
        onAccept={handleAcceptSuggestion}
        onDecline={handleDeclineSuggestion}
      />
      <QuickActions onTabChange={onTabChange} onOpenSettings={onOpenSettings} />
    </>
  );
};

export default HomeTab;
