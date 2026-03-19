import { type StatusType } from '../../types/common';
import { type PendingSuggestion } from '../../types/bookmarks';
import { type PageMetadata } from '../../types/pages';
import { GlobeIcon, CheckCircleIcon, SpinnerIcon, CheckIcon, XIcon } from '../icons/Icons';
import { isHeadingSimilarToTitle } from '../../utils/helpers';
import Button from '../Button/Button';
import BookmarkTreePath from '../BookmarkTreePath/BookmarkTreePath';
import './CurrentPageCard.css';

interface CurrentPageCardProps {
  currentPage: PageMetadata | null;
  isLoadingPage: boolean;
  isOrganizing: boolean;
  statusMessage: string;
  statusType: StatusType;
  pendingSuggestion: PendingSuggestion | null;
  existingBookmarkPath: string | null;
  existingBookmarkId: string | null;
  onOrganize: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const CurrentPageCard = ({
  currentPage,
  isLoadingPage,
  isOrganizing,
  statusMessage,
  statusType,
  pendingSuggestion,
  existingBookmarkPath,
  existingBookmarkId,
  onOrganize,
  onAccept,
  onDecline,
}: CurrentPageCardProps) => {
  const shouldShowH1 = currentPage?.h1
    && !isHeadingSimilarToTitle(currentPage.title, currentPage.h1);
  const isAlreadyBookmarked = !!existingBookmarkPath && !pendingSuggestion;

  return (
  <div className="current-page-card">
    <div className="current-page-card-header">
      <div className="current-page-card-icon">
        {existingBookmarkPath ? (
          <CheckCircleIcon width={14} height={14} />
        ) : (
          <GlobeIcon width={14} height={14} />
        )}
      </div>
      <span className="current-page-card-label">
        {existingBookmarkPath ? 'Already bookmarked' : "You're visiting"}
      </span>
    </div>

    {isLoadingPage ? (
      <div className="current-page-card-body">
        <p className="current-page-card-title-placeholder" />
        <p className="current-page-card-description-placeholder" />
        <p className="current-page-card-url-placeholder" />
      </div>
    ) : !currentPage ? (
      <div className="current-page-card-body">
        <p className="current-page-card-error">Could not load page information</p>
      </div>
    ) : (
      <>
        <div className="current-page-card-body">
          <p className="current-page-card-title">{currentPage.title}</p>
          {currentPage.description && (
            <p className="current-page-card-description">{currentPage.description}</p>
          )}
          {shouldShowH1 && (
            <p className="current-page-card-h1">{currentPage.h1}</p>
          )}
          <p className="current-page-card-url">{currentPage.url}</p>
        </div>

        {pendingSuggestion && (
          <BookmarkTreePath
            folderPath={pendingSuggestion.folderPath}
            bookmarkTitle={pendingSuggestion.pageTitle}
            isNewFolder={pendingSuggestion.isNewFolder}
          />
        )}

        {existingBookmarkPath && !pendingSuggestion && (
          <BookmarkTreePath
            folderPath={existingBookmarkPath}
            bookmarkTitle={currentPage.title}
            isNewFolder={false}
            label="Already saved in"
            defaultExpanded={false}
          />
        )}

        {statusMessage && !pendingSuggestion && !existingBookmarkPath && (
          <p className={`current-page-card-status ${statusType}`}>
            {statusMessage}
          </p>
        )}

        <div className="current-page-card-actions">
          {pendingSuggestion ? (
            <div className="current-page-card-suggestion-actions">
              <Button
                variant="primary"
                onClick={onAccept}
                disabled={isOrganizing}
                fullWidth
              >
                {isOrganizing ? (
                  <>
                    <SpinnerIcon />
                    {existingBookmarkId ? 'Moving...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Accept
                  </>
                )}
              </Button>
              <Button
                variant="danger"
                onClick={onDecline}
                disabled={isOrganizing}
                fullWidth
              >
                <XIcon />
                Decline
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={onOrganize}
              disabled={isOrganizing}
              className={isOrganizing ? 'loading' : ''}
              fullWidth
            >
              {isOrganizing ? (
                <>
                  <SpinnerIcon />
                  {statusMessage || 'Analyzing...'}
                </>
              ) : isAlreadyBookmarked ? (
                'Re-organize'
              ) : (
                'Organize this page'
              )}
            </Button>
          )}
        </div>
      </>
    )}
  </div>
  );
};

export default CurrentPageCard;
