import { useState, useCallback } from 'react';
import ServiceSelector from '../ServiceSelector/ServiceSelector';
import Button from '../Button/Button';
import { useApiKeyPanel } from '../../hooks/apiKeyPanel';
import {
  StarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  KeyIcon,
  ShieldIcon,
  CheckCircleIcon,
  InfoIcon,
  ExternalLinkIcon,
  SunIcon,
  MoonIcon,
} from '../icons/Icons';
import Footer from '../Footer/Footer';
import './ApiKeyPanel.css';

interface ApiKeyPanelProps {
  isOpen: boolean;
  showWelcomeMessage?: boolean;
  canClose?: boolean;
  onClose?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const ApiKeyPanel = ({
  isOpen,
  showWelcomeMessage = false,
  canClose = true,
  onClose,
  theme,
  onToggleTheme,
}: ApiKeyPanelProps) => {
  const {
    currentService,
    apiKeyInput,
    selectedModel,
    modelsRefreshTrigger,
    hasExistingKey,
    isEditingKey,
    status,
    buttonError,
    handleServiceChange,
    handleModelChange,
    handleApiKeyInputChange,
    handleApiKeySave,
    handleApiKeyInputKeyDown,
    handleApiKeyRemove,
    handleStartEditingKey,
    handleCancelEditing,
    handleOverlayClick,
    handleGoToApp,
    handlePanelClose,
  } = useApiKeyPanel({ isOpen, canClose, onClose });

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleOpenSetupGuide = useCallback((): void => {
    setShowSetupGuide(true);
  }, []);

  const handleCloseSetupGuide = useCallback((): void => {
    setShowSetupGuide(false);
  }, []);

  const handleOpenAIStudio = useCallback((): void => {
    chrome.tabs.create({ url: 'https://aistudio.google.com/apikey' });
  }, []);

  if (!isOpen) return null;

  const hasProviderSelected = currentService.id !== '';
  const hasModelSelected = selectedModel !== '';
  const isApiKeyInteractive = hasProviderSelected || hasExistingKey;
  const showConfiguredState = hasExistingKey && !isEditingKey && hasModelSelected;

  if (showSetupGuide) {
    return (
      <div className="api-key-panel active">
        <div className="api-key-panel-content">
          <header className="api-key-panel-header">
            <div className="header-settings">
              <div className="header-left">
                <Button variant="icon" onClick={handleCloseSetupGuide} title="Back to Settings">
                  <ArrowLeftIcon />
                </Button>
                <h2 className="header-title">Setup Guide</h2>
              </div>
            </div>
          </header>
          <div className="api-key-panel-body">
            <div className="setup-guide-section">
              <h3 className="setup-guide-heading">How does it work?</h3>
              <p className="setup-guide-text">
                MarkMind uses Google's free AI to read your bookmarks and sort them into the right folders.
              </p>
              <p className="setup-guide-text">
                To connect, you need a special password called an API key.
                Think of it like a Wi-Fi password that connects MarkMind to Google's AI.
              </p>
            </div>

            <div className="info-card">
              <div className="info-card-header">
                <div className="info-card-icon-wrap">
                  <CheckCircleIcon width={16} height={16} />
                </div>
                <div className="info-card-titles">
                  <h3 className="info-card-title">Good to know</h3>
                </div>
              </div>
              <div className="setup-guide-reassurances">
                <p className="setup-guide-reassurance-item">100% free. No credit card needed.</p>
                <p className="setup-guide-reassurance-item">Your data never leaves your device.</p>
                <p className="setup-guide-reassurance-item">Takes about 30 seconds to set up.</p>
              </div>
            </div>

            <div className="api-key-card">
              <div className="api-key-card-header">
                <div className="api-key-icon">
                  <KeyIcon />
                </div>
                <div className="api-key-titles">
                  <h3 className="api-key-title">How to get your free key</h3>
                  <p className="api-key-subtitle">Follow these 4 simple steps</p>
                </div>
              </div>

              <div className="step-list">
                <div className="step-list-row">
                  <span className="step-list-number">1</span>
                  <span className="step-list-text">
                    Open Google AI Studio
                    {' '}
                    <Button variant="ghost" compact onClick={handleOpenAIStudio}>
                      <ExternalLinkIcon width={10} height={10} />
                      Open
                    </Button>
                  </span>
                </div>
                <div className="step-list-row">
                  <span className="step-list-number">2</span>
                  <span className="step-list-text">Sign in with your Google account</span>
                </div>
                <div className="step-list-row">
                  <span className="step-list-number">3</span>
                  <span className="step-list-text">Click "Create API Key"</span>
                </div>
                <div className="step-list-row">
                  <span className="step-list-number">4</span>
                  <span className="step-list-text">Copy the key and paste it in Settings</span>
                </div>
              </div>
            </div>

            <Button variant="primary" fullWidth onClick={handleCloseSetupGuide}>
              Got it
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="header-right">
                {onToggleTheme && (
                  <Button
                    variant="icon"
                    onClick={onToggleTheme}
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  </Button>
                )}
                <a
                  href="https://github.com/migsilva89/MarkMind"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header-star-link"
                  aria-label="Star us on GitHub"
                >
                  <StarIcon width={14} height={14} />
                  <span className="header-star-tooltip">Star us on GitHub</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="header-settings">
              <div className="header-left">
                <Button variant="icon" onClick={handlePanelClose} title="Back">
                  <ArrowLeftIcon />
                </Button>
                <h2 className="header-title">Settings</h2>
              </div>
              <div className="header-right">
                <div className="header-guide-link">
                  <Button variant="icon" onClick={handleOpenSetupGuide} title="Setup Guide">
                    <InfoIcon />
                  </Button>
                  <span className="header-guide-tooltip">Setup Guide</span>
                </div>
              </div>
            </div>
          )}
        </header>

        <div className="api-key-panel-body">
          {showWelcomeMessage && (
            <div className="welcome-message">
              <p className="welcome-headline">You mark. We mind.</p>
              <p className="welcome-subtext">Connect your AI to begin.</p>
              <p className="welcome-subtext">
                Your only setup for the magic to happen.
              </p>
            </div>
          )}

          <ServiceSelector
            section="provider"
            onServiceChange={handleServiceChange}
            onModelChange={handleModelChange}
            refreshTrigger={modelsRefreshTrigger}
          />

          <div className="api-key-card">
            {currentService.freeTierNote && (
              <button
                type="button"
                className="api-key-card-info-trigger"
                aria-describedby="free-tier-tooltip"
                onMouseEnter={() => setIsTooltipVisible(true)}
                onMouseLeave={() => setIsTooltipVisible(false)}
                onFocus={() => setIsTooltipVisible(true)}
                onBlur={() => setIsTooltipVisible(false)}
              >
                <InfoIcon width={12} height={12} />
                {isTooltipVisible && (
                  <div
                    id="free-tier-tooltip"
                    role="tooltip"
                    className="api-key-card-info-tooltip"
                  >
                    {currentService.freeTierNote}
                  </div>
                )}
              </button>
            )}
            {showConfiguredState ? (
              <div className="api-key-configured">
                <div className="api-key-configured-badge">
                  <CheckCircleIcon width={20} height={20} />
                  <div className="api-key-configured-info">
                    <h3 className="api-key-configured-title">API Key Configured</h3>
                    <p className="api-key-configured-subtitle">You're all set!</p>
                  </div>
                </div>

                <Button variant="primary" onClick={handleGoToApp} className="btn-go-to-app">
                  Start Organizing Bookmarks
                  <ArrowRightIcon />
                </Button>

                <button
                  className="api-key-change-link"
                  onClick={handleStartEditingKey}
                  type="button"
                >
                  Change API Key
                </button>
              </div>
            ) : hasExistingKey && !isEditingKey ? (
              <div className="api-key-configured">
                <div className="api-key-configured-badge">
                  <CheckCircleIcon width={20} height={20} />
                  <div className="api-key-configured-info">
                    <h3 className="api-key-configured-title">API Key Configured</h3>
                    <p className="api-key-configured-subtitle">Select a model below to continue</p>
                  </div>
                </div>

                <button
                  className="api-key-change-link"
                  onClick={handleStartEditingKey}
                  type="button"
                >
                  Change API Key
                </button>
              </div>
            ) : (
              <>
                <div className="api-key-card-header">
                  <div className="api-key-icon">
                    <KeyIcon />
                  </div>
                  <div className="api-key-titles">
                    <h3 className="api-key-title">{currentService.label || 'API Key'}</h3>
                    <p className="api-key-subtitle">Required for AI features</p>
                  </div>
                </div>

                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={handleApiKeyInputChange}
                  onKeyDown={handleApiKeyInputKeyDown}
                  placeholder={!hasProviderSelected ? 'Select a provider first...' : hasExistingKey ? '••••••••••••••••' : currentService.placeholder}
                  autoComplete="off"
                  disabled={!hasProviderSelected}
                />

                <div className="api-key-actions">
                  <Button
                    variant="primary"
                    onClick={handleApiKeySave}
                    className={`btn-save${buttonError ? ' btn-save-error' : ''}`}
                    disabled={!hasProviderSelected}
                  >
                    {buttonError || (hasExistingKey ? 'Update API Key' : 'Save API Key')}
                  </Button>
                </div>

                {hasExistingKey && isEditingKey && (
                  <button
                    className="api-key-change-link"
                    onClick={handleCancelEditing}
                    type="button"
                  >
                    Cancel
                  </button>
                )}

                {status.type && (
                  <div className="api-key-card-status">
                    <div className={`status ${status.type}`}>{status.message}</div>
                    {status.showGoToApp && (
                      <Button variant="primary" onClick={handleGoToApp} className="btn-go-to-app">
                        Start Organizing Bookmarks
                        <ArrowRightIcon />
                      </Button>
                    )}
                  </div>
                )}

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
              </>
            )}
          </div>

          {hasProviderSelected && (
            <ServiceSelector
              section="model"
              externalServiceId={currentService.id}
              onServiceChange={handleServiceChange}
              onModelChange={handleModelChange}
              refreshTrigger={modelsRefreshTrigger}
            />
          )}

          <div className="info-card">
            <div className="info-card-header">
              <div className="info-card-icon-wrap">
                <ShieldIcon />
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

          {isApiKeyInteractive && hasExistingKey && (
            <div className="danger-zone">
              <h3 className="danger-zone-title">Danger Zone</h3>
              <Button variant="danger" fullWidth onClick={handleApiKeyRemove}>
                Remove API Key
              </Button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default ApiKeyPanel;
