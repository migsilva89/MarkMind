import { useState, useEffect, useCallback, useRef } from 'react';
import ServiceSelector from '../ServiceSelector/ServiceSelector';
import {
  getService,
  DEFAULT_SERVICE_ID,
  type ServiceConfig,
} from '../../config/services';
import { type StatusType, type StatusMessage } from '../../types/common';
import './ApiKeyPanel.css';

interface ApiKeyPanelStatusMessage extends StatusMessage {
  showGoToApp?: boolean;
}

interface ApiKeyPanelProps {
  isOpen: boolean;
  showWelcomeMessage?: boolean;
  canClose?: boolean;
  onClose?: () => void;
}

const ApiKeyPanel = ({
  isOpen,
  showWelcomeMessage = false,
  canClose = true,
  onClose,
}: ApiKeyPanelProps) => {
  const [currentService, setCurrentService] = useState<ServiceConfig>(
    getService(DEFAULT_SERVICE_ID)
  );
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [status, setStatus] = useState<ApiKeyPanelStatusMessage>({ message: '', type: null, showGoToApp: false });
  const [canClosePanel, setCanClosePanel] = useState(canClose);
  const [extensionVersion, setExtensionVersion] = useState('');
  const autoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const manifest = chrome.runtime.getManifest();
    setExtensionVersion(manifest.version);
  }, []);

  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
    };
  }, []);

  const checkExistingApiKey = useCallback(async (service: ServiceConfig): Promise<boolean> => {
    const result = await chrome.storage.local.get([service.storageKey]);
    const keyExists = !!result[service.storageKey];
    setHasExistingKey(keyExists);
    return keyExists;
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkExistingApiKey(currentService);
    }
  }, [isOpen, currentService, checkExistingApiKey]);

  useEffect(() => {
    setCanClosePanel(canClose);
  }, [canClose]);

  const showStatusMessage = useCallback((message: string, type: StatusType): void => {
    setStatus({ message, type, showGoToApp: false });
  }, []);

  const clearStatus = useCallback((): void => {
    setStatus({ message: '', type: null, showGoToApp: false });
  }, []);

  const handlePanelClose = useCallback((): void => {
    if (!canClosePanel) return;
    clearStatus();
    onClose?.();
  }, [canClosePanel, clearStatus, onClose]);

  const handleServiceChange = useCallback((serviceId: string): void => {
    const service = getService(serviceId);
    setCurrentService(service);
    setApiKeyInput('');
    clearStatus();
    checkExistingApiKey(service);
  }, [clearStatus, checkExistingApiKey]);

  const handleApiKeyInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setApiKeyInput(event.target.value);
  }, []);

  const handleApiKeySave = useCallback(async (): Promise<void> => {
    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      showStatusMessage('Please enter an API key', 'error');
      return;
    }

    if (!currentService.validateKey(trimmedKey)) {
      showStatusMessage('Invalid API key format', 'error');
      return;
    }

    showStatusMessage('Saving...', 'loading');

    try {
      await chrome.storage.local.set({ [currentService.storageKey]: trimmedKey });
      showStatusMessage('API key saved successfully', 'success');
      setHasExistingKey(true);
      setApiKeyInput('');

      if (!canClosePanel) {
        setCanClosePanel(true);
        if (autoCloseTimeoutRef.current) {
          clearTimeout(autoCloseTimeoutRef.current);
        }
        autoCloseTimeoutRef.current = setTimeout(() => {
          handlePanelClose();
          autoCloseTimeoutRef.current = null;
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      showStatusMessage('Failed to save API key', 'error');
    }
  }, [apiKeyInput, currentService, canClosePanel, showStatusMessage, handlePanelClose]);

  const handleApiKeyInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      handleApiKeySave();
    }
  }, [handleApiKeySave]);

  const handleApiKeyTest = useCallback(async (): Promise<void> => {
    const { testConfig } = currentService;

    if (!testConfig) {
      showStatusMessage('Test not available for this service', 'error');
      return;
    }

    showStatusMessage('Testing connection...', 'loading');

    try {
      const result = await chrome.storage.local.get([currentService.storageKey]);
      const apiKey = result[currentService.storageKey] as string | undefined;

      if (!apiKey) {
        showStatusMessage('No API key found', 'error');
        return;
      }

      const response = await fetch(testConfig.getEndpoint(apiKey), {
        method: 'POST',
        headers: testConfig.getHeaders(apiKey),
        body: JSON.stringify(testConfig.getBody()),
      });

      if (response.ok) {
        const data = await response.json();
        if (testConfig.validateResponse(data)) {
          setStatus({
            message: 'Connection successful! Your API key is working.',
            type: 'success',
            showGoToApp: true,
          });
        } else {
          showStatusMessage('Unexpected response format', 'error');
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Invalid API key';
        showStatusMessage(`Error: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('API test failed:', error);
      showStatusMessage('Connection failed', 'error');
    }
  }, [currentService, showStatusMessage]);

  const handleApiKeyRemove = useCallback(async (): Promise<void> => {
    const confirmRemoval = window.confirm(
      'Are you sure you want to remove your API key?'
    );

    if (!confirmRemoval) return;

    try {
      await chrome.storage.local.remove([currentService.storageKey]);
      showStatusMessage('API key removed', 'success');
      setHasExistingKey(false);
      setApiKeyInput('');
    } catch (error) {
      console.error('Failed to remove API key:', error);
      showStatusMessage('Failed to remove API key', 'error');
    }
  }, [currentService.storageKey, showStatusMessage]);

  const handleOverlayClick = useCallback((): void => {
    if (canClosePanel) {
      handlePanelClose();
    }
  }, [canClosePanel, handlePanelClose]);

  const handleGoToApp = useCallback((): void => {
    clearStatus();
    onClose?.();
  }, [clearStatus, onClose]);

  if (!isOpen) return null;

  return (
    <div className="api-key-panel active">
      <div className="api-key-panel-overlay" onClick={handleOverlayClick} />
      <div className="api-key-panel-content">
        <header className="api-key-panel-header">
          {showWelcomeMessage ? (
            <div className="header-welcome">
              <div className="header-left">
                <img
                  src="/assets/icons/icon48.png"
                  alt="MarkMind"
                  className="header-logo"
                />
                <h2 className="header-title">MarkMind</h2>
              </div>
              <div className="header-actions">
                <a
                  href="https://github.com/migsilva89/MarkMind"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="github-star-btn"
                >
                  <svg
                    className="github-icon"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <svg
                    className="star-icon"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Star</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="header-settings">
              <div className="header-left">
                <button
                  className="btn-icon"
                  onClick={handlePanelClose}
                  title="Back"
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="header-title">Settings</h2>
              </div>
              <button
                className="btn-icon"
                onClick={handlePanelClose}
                title="Close"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </header>

        <div className="api-key-panel-body">
          {showWelcomeMessage && (
            <div className="welcome-message">
              <p className="welcome-headline">You mark. We mind.</p>
              <p className="welcome-subtext">Connect your AI to begin.</p>
            </div>
          )}

          <ServiceSelector onServiceChange={handleServiceChange} />

          <div className="api-key-card">
            <div className="api-key-card-header">
              <div className="api-key-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <div className="api-key-titles">
                <h3 className="api-key-title">{currentService.label}</h3>
                <p className="api-key-subtitle">Required for AI features</p>
              </div>
            </div>

            <input
              type="password"
              value={apiKeyInput}
              onChange={handleApiKeyInputChange}
              onKeyDown={handleApiKeyInputKeyDown}
              placeholder={hasExistingKey ? '••••••••••••••••' : currentService.placeholder}
              autoComplete="off"
            />

            <div className="api-key-actions">
              <button
                className="btn-ghost btn-primary btn-save"
                onClick={handleApiKeySave}
              >
                {hasExistingKey ? 'Update API Key' : 'Save API Key'}
              </button>
              {hasExistingKey && (
                <button
                  className="btn-ghost"
                  onClick={handleApiKeyTest}
                >
                  Test API
                </button>
              )}
            </div>

            <p className="api-key-help">
              Get your API key at{' '}
              <a
                href={currentService.helpLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {currentService.helpLinkText}
              </a>
            </p>
          </div>

          {status.type && (
            <div className={`status-container ${status.type}`}>
              <div className={`status ${status.type}`}>{status.message}</div>
              {status.showGoToApp && (
                <button
                  className="btn-ghost btn-go-to-app"
                  onClick={handleGoToApp}
                >
                  Start Organizing Bookmarks
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="info-card">
            <div className="info-card-header">
              <div className="info-card-icon-wrap">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="info-card-titles">
                <h3 className="info-card-title">Privacy & Security</h3>
                <p className="info-card-subtitle">Your data stays local</p>
              </div>
            </div>
            <p className="info-card-text">
              Your API key is stored locally in Chrome and never sent to our
              servers. Bookmark data is only processed through your selected AI
              provider.
            </p>
          </div>

          {hasExistingKey && (
            <div className="danger-zone">
              <h3 className="danger-zone-title">Danger Zone</h3>
              <button
                className="btn-ghost btn-danger btn-danger-full"
                onClick={handleApiKeyRemove}
              >
                Remove API Key
              </button>
            </div>
          )}
        </div>

        <footer className="api-key-panel-footer">
          <span className="footer-version">MarkMind v{extensionVersion}</span>
          <a
            href="https://github.com/migsilva89/MarkMind/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-bug-link"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              width="12"
              height="12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Report a Bug
          </a>
        </footer>
      </div>
    </div>
  );
};

export default ApiKeyPanel;
