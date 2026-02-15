import { type StatusType } from '../../types/common';
import { type PendingSuggestion } from '../../types/bookmarks';
import { type PageMetadata } from '../../types/pages';

export interface UseOrganizeBookmarkReturn {
  currentPageData: PageMetadata | null;
  isLoadingPage: boolean;
  isOrganizing: boolean;
  statusMessage: string;
  statusType: StatusType;
  pendingSuggestion: PendingSuggestion | null;
  existingBookmarkPath: string | null;
  handleOrganizePage: () => Promise<void>;
  handleAcceptSuggestion: () => Promise<void>;
  handleDeclineSuggestion: () => void;
}
