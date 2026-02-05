import { useState, useEffect, useCallback, useRef } from 'react';
import { SERVICES, SELECTED_SERVICE_STORAGE_KEY } from '../../config/services';
import { type StatusType } from '../../types/common';
import { type PageMetadata } from '../../types/pages';
import { getFolderDataForAI } from '../../utils/folders';
import { organizeBookmark } from '../../services/ai';
import { findBookmarkByUrl, createBookmark, createFolder } from '../../services/bookmarks';
import { CHROME_ROOT_FOLDER_IDS } from '../../types/bookmarks';
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

  const getCurrentPageData = useCallback(async (): Promise<PageMetadata | null> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found');

    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const getMeta = (name: string): string | null => {
            const element = document.querySelector(
              `meta[name="${name}"], meta[property="${name}"]`
            );
            return element?.getAttribute('content') || null;
          };

          const getMainH1 = (): string | null => {
            const mainSelectors = [
              'main h1',
              'article h1',
              '[role="main"] h1',
              '.content h1',
              '.post h1',
              '.entry h1',
            ];

            for (const selector of mainSelectors) {
              const h1 = document.querySelector(selector);
              if (h1?.textContent) {
                return h1.textContent.trim().slice(0, 200);
              }
            }

            const allH1s = document.querySelectorAll('h1');
            for (const h1 of allH1s) {
              const parent = h1.closest('[class*="modal"], [class*="popup"], [class*="dialog"], [role="dialog"]');
              if (!parent && h1.textContent) {
                return h1.textContent.trim().slice(0, 200);
              }
            }

            return null;
          };

          return {
            url: location.href,
            title: document.title,
            favIconUrl:
              document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href || null,
            description: getMeta('description') || getMeta('og:description'),
            keywords: getMeta('keywords'),
            h1: getMainH1(),
          };
        },
      });
      return result as PageMetadata;
    } catch (error) {
      console.error('Failed to execute script on page, using fallback:', error);
      return {
        url: tab.url || '',
        title: tab.title || '',
        favIconUrl: tab.favIconUrl,
      };
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
        showStatus(`Already bookmarked in: ${existingBookmark.parentId}`, 'error');
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
  }, [isLoading, showStatus, getCurrentPageData, selectedServiceId]);

  const handleAcceptSuggestion = useCallback(async (): Promise<void> => {
    if (!pendingSuggestion) return;

    try {
      setIsLoading(true);
      let targetFolderId = pendingSuggestion.folderId;

      if (pendingSuggestion.isNewFolder && !targetFolderId) {
        showStatus(`Creating folder: ${pendingSuggestion.folderPath}`, 'default');
        const newFolder = await createFolder(
          CHROME_ROOT_FOLDER_IDS.BOOKMARKS_BAR,
          pendingSuggestion.folderPath
        );
        targetFolderId = newFolder.id;
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

  const serviceName = selectedServiceId
    ? SERVICES[selectedServiceId]?.name || ''
    : '';

  const defaultStatusText = serviceName
    ? `Connected to ${serviceName}`
    : 'Select an AI provider to get started';

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
          <p className={`organize-status ${statusType}`}>
            {statusMessage || defaultStatusText}
          </p>
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
