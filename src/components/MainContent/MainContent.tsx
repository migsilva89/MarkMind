import { useState, useEffect, useCallback, useRef } from 'react';
import { SERVICES, SELECTED_SERVICE_STORAGE_KEY } from '../../config/services';
import { type StatusType } from '../../types/common';
import { type PageMetadata } from '../../types/pages';

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

      const pageData = await getCurrentPageData();

      if (!pageData?.url) {
        showStatus('Could not get current page info', 'error');
        return;
      }

      console.log('Page data collected:', pageData);
      showStatus(`Analyzing: ${pageData.title}`, 'default');

      // TODO: Send pageData to AI for organization suggestion
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
        <button className="btn-icon" onClick={onOpenSettings} title="Settings">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      <main className="main-content">
        <div className="organize-container">
          <p className={`organize-status ${statusType}`}>
            {statusMessage || defaultStatusText}
          </p>
          <button
            className={`btn-ghost ${isLoading ? 'loading' : ''}`}
            onClick={handleAddCurrentPage}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="spinner"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  width="14"
                  height="14"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    strokeWidth="2"
                    strokeDasharray="32"
                    strokeLinecap="round"
                  />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Current Page
              </>
            )}
          </button>
        </div>
      </main>
    </>
  );
};

export default MainContent;
