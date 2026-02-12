import { type StatusType } from '../../types/common';
import { type PendingSuggestion } from '../../types/bookmarks';
import { type PageMetadata } from '../../types/pages';
import { GlobeIcon, SpinnerIcon, CheckIcon, XIcon } from '../icons/Icons';
import Button from '../Button/Button';
import './CurrentPageCard.css';

interface CurrentPageCardProps {
  currentPage: PageMetadata | null;
  isLoadingPage: boolean;
  isOrganizing: boolean;
  statusMessage: string;
  statusType: StatusType;
  pendingSuggestion: PendingSuggestion | null;
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
  onOrganize,
  onAccept,
  onDecline,
}: CurrentPageCardProps) => {
  if (isLoadingPage) {
    return (
      <div className="current-page-card">
        <div className="current-page-card-header">
          <div className="current-page-card-icon">
            <GlobeIcon width={14} height={14} />
          </div>
          <span className="current-page-card-label">Current Page</span>
        </div>
        <div className="current-page-card-body">
          <p className="current-page-card-title-placeholder" />
          <p className="current-page-card-url-placeholder" />
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="current-page-card">
        <div className="current-page-card-header">
          <div className="current-page-card-icon">
            <GlobeIcon width={14} height={14} />
          </div>
          <span className="current-page-card-label">Current Page</span>
        </div>
        <div className="current-page-card-body">
          <p className="current-page-card-error">Could not load page information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="current-page-card">
      <div className="current-page-card-header">
        <div className="current-page-card-icon">
          <GlobeIcon width={14} height={14} />
        </div>
        <span className="current-page-card-label">Current Page</span>
      </div>

      <div className="current-page-card-body">
        <p className="current-page-card-title">{currentPage.title}</p>
        <p className="current-page-card-url">{currentPage.url}</p>
      </div>

      {statusMessage && (
        <p className={`current-page-card-status ${statusType}`}>
          {statusMessage}
        </p>
      )}

      <div className="current-page-card-actions">
        {pendingSuggestion ? (
          <div className="current-page-card-suggestion-actions">
            <Button
              onClick={onAccept}
              disabled={isOrganizing}
              fullWidth
            >
              {isOrganizing ? (
                <>
                  <SpinnerIcon />
                  Saving...
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
            ) : (
              'Organize this page'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CurrentPageCard;
