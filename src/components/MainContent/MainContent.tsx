import { useState, useEffect, useCallback, useRef } from 'react';
import { SELECTED_SERVICE_STORAGE_KEY } from '../../config/services';
import { type StatusType } from '../../types/common';
import { type FolderDataForAI } from '../../types/bookmarks';
import { getFolderDataForAI } from '../../utils/folders';
import { organizeBookmark } from '../../services/ai';
import { getCurrentPageData } from '../../services/pageMetadata';
import { getBookmarkById, findBookmarkByUrl, createBookmark, createFolderPath } from '../../services/bookmarks';
import { SettingsIcon, SpinnerIcon, PlusIcon, CheckIcon, XIcon } from '../icons/Icons';
import Button from '../Button/Button';

interface PendingSuggestion {
  pageTitle: string;
  pageUrl: string;
  folderPath: string;
  folderId: string | null;
  isNewFolder: boolean;
}

interface MainContentProps {
  onOpenSettings: () => void;
}

const MainContent = ({ onOpenSettings }: MainContentProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('default');
  const [pendingSuggestion, setPendingSuggestion] = useState<PendingSuggestion | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const folderDataRef = useRef<FolderDataForAI | null>(null);

  useEffect(() => {
    const loadSelectedService = async (): Promise<void> => {
      const result = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY]);
      if (result[SELECTED_SERVICE_STORAGE_KEY]) {
        setSelectedServiceId(result[SELECTED_SERVICE_STORAGE_KEY]);
      }
    };

    loadSelectedService();
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const showStatus = useCallback((message: string, type: StatusType = 'default'): void => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }

    setStatusMessage(message);
    setStatusType(type);

    if (type === 'success' || type === 'error') {
      statusTimeoutRef.current = setTimeout(() => {
        setStatusMessage('');
        setStatusType('default');
        statusTimeoutRef.current = null;
      }, 5000);
    }
  }, []);

  const handleAddCurrentPage = useCallback(async (): Promise<void> => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      showStatus('Getting page information...', 'default');

      const [pageData, folderData] = await Promise.all([
        getCurrentPageData(),
        getFolderDataForAI(),
      ]);

      if (!pageData?.url) {
        showStatus('Could not get current page info', 'error');
        return;
      }

      const existingBookmark = await findBookmarkByUrl(pageData.url);

      if (existingBookmark) {
        const parentFolder = existingBookmark.parentId
          ? await getBookmarkById(existingBookmark.parentId)
          : null;
        const folderName = parentFolder?.title || 'unknown folder';
        showStatus(`Already bookmarked in: ${folderName}`, 'error');
        return;
      }

      let serviceId = selectedServiceId;
      if (!serviceId) {
        const storageResult = await chrome.storage.local.get([SELECTED_SERVICE_STORAGE_KEY]);
        serviceId = storageResult[SELECTED_SERVICE_STORAGE_KEY];
      }

      if (!serviceId) {
        showStatus('Please select an AI provider first', 'error');
        return;
      }

      showStatus(`Asking AI to organize: ${pageData.title}`, 'default');

      folderDataRef.current = folderData;

      const aiResponse = await organizeBookmark(serviceId, {
        title: pageData.title,
        url: pageData.url,
        description: pageData.description || null,
        h1: pageData.h1 || null,
        folderTree: folderData.textTree,
      });

      const folderId = folderData.pathToIdMap[aiResponse.folderPath];

      setPendingSuggestion({
        pageTitle: pageData.title,
        pageUrl: pageData.url,
        folderPath: aiResponse.folderPath,
        folderId: folderId || null,
        isNewFolder: aiResponse.isNewFolder,
      });

      if (folderId) {
        showStatus(`Suggested: ${aiResponse.folderPath}`, 'default');
      } else if (aiResponse.isNewFolder) {
        showStatus(`New folder: ${aiResponse.folderPath}`, 'default');
      } else {
        showStatus(`Folder not found: ${aiResponse.folderPath}`, 'error');
      }
    } catch (error) {
      console.error('Error adding current page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, showStatus, selectedServiceId]);

  const handleAcceptSuggestion = useCallback(async (): Promise<void> => {
    if (!pendingSuggestion || !folderDataRef.current) return;

    try {
      setIsLoading(true);
      let targetFolderId = pendingSuggestion.folderId;

      if (pendingSuggestion.isNewFolder && !targetFolderId) {
        showStatus(`Creating folder: ${pendingSuggestion.folderPath}`, 'default');
        targetFolderId = await createFolderPath(
          pendingSuggestion.folderPath,
          folderDataRef.current.pathToIdMap,
          folderDataRef.current.defaultParentId
        );
      }

      if (!targetFolderId) {
        showStatus('Could not determine target folder', 'error');
        return;
      }

      showStatus('Saving bookmark...', 'default');
      await createBookmark(
        targetFolderId,
        pendingSuggestion.pageTitle,
        pendingSuggestion.pageUrl
      );

      setPendingSuggestion(null);
      showStatus('Bookmark saved!', 'success');
    } catch (error) {
      console.error('Error saving bookmark:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [pendingSuggestion, showStatus]);

  const handleDeclineSuggestion = useCallback((): void => {
    setPendingSuggestion(null);
    showStatus('Suggestion declined', 'default');
  }, [showStatus]);

  return (
    <>
      <header className="main-header">
        <div className="main-header-left">
          <img
            src="/assets/icons/icon48.png"
            alt="MarkMind"
            className="main-header-logo"
          />
          <h1 className="main-header-title">MarkMind</h1>
        </div>
        <Button variant="icon" onClick={onOpenSettings} title="Settings">
          <SettingsIcon />
        </Button>
      </header>

      <main className="main-content">
        <div className="organize-container">
          {statusMessage && (
            <p className={`organize-status ${statusType}`}>
              {statusMessage}
            </p>
          )}
          {pendingSuggestion ? (
            <div className="suggestion-actions">
              <Button
                onClick={handleAcceptSuggestion}
                disabled={isLoading}
              >
                {isLoading ? (
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
                onClick={handleDeclineSuggestion}
                disabled={isLoading}
              >
                <XIcon />
                Decline
              </Button>
            </div>
          ) : (
            <Button
              className={isLoading ? 'loading' : ''}
              onClick={handleAddCurrentPage}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Analyzing...
                </>
              ) : (
                <>
                  <PlusIcon />
                  Add Current Page
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </>
  );
};

export default MainContent;
