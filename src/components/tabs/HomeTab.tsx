import { useOrganizeBookmark } from '../../hooks/useOrganizeBookmark';
import CurrentPageCard from '../CurrentPageCard/CurrentPageCard';

const HomeTab = () => {
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
  );
};

export default HomeTab;
