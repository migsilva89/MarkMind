import { useState, useEffect, useCallback, useRef } from 'react';
import { SERVICES, SELECTED_SERVICE_STORAGE_KEY } from '../../config/services';
import { type StatusType } from '../../types/common';
import { type PageMetadata } from '../../types/pages';
import { getFolderDataForAI } from '../../utils/folders';
import { SettingsIcon, SpinnerIcon, PlusIcon } from '../icons/Icons';
import Button from '../Button/Button';

interface MainContentProps {
  onOpenSettings: () => void;
}

const MainContent = ({ onOpenSettings }: MainContentProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('default');
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

          return {
            url: location.href,
            title: document.title,
            favIconUrl:
              document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href || null,
            description: getMeta('description') || getMeta('og:description'),
            keywords: getMeta('keywords'),
            h1: document.querySelector('h1')?.textContent?.trim().slice(0, 200) || null,
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

      const [pageData, _folderData] = await Promise.all([
        getCurrentPageData(),
        getFolderDataForAI(),
      ]);

      if (!pageData?.url) {
        showStatus('Could not get current page info', 'error');
        return;
      }

      showStatus(`Analyzing: ${pageData.title}`, 'default');

      // TODO: Send pageData and _folderData to AI for organization suggestion
      showStatus('Page data collected! AI integration coming soon.', 'success');
    } catch (error) {
      console.error('Error adding current page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showStatus(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, showStatus, getCurrentPageData]);

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
        </div>
      </main>
    </>
  );
};

export default MainContent;
