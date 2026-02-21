import { useState } from 'react';
import ServiceSelector from '../ServiceSelector/ServiceSelector';
import Button from '../Button/Button';
import { useApiKeyPanel } from '../../hooks/apiKeyPanel';
import {
  GitHubIcon,
  StarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  KeyIcon,
  ShieldIcon,
  CheckCircleIcon,
  InfoIcon,
} from '../icons/Icons';
import Footer from '../Footer/Footer';
import './ApiKeyPanel.css';

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
  const {
    currentService,
    apiKeyInput,
    selectedModel,
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

  if (!isOpen) return null;

  const hasModelSelected = selectedModel !== '';
  const showApiKeyCard = hasModelSelected || hasExistingKey;
  const showConfiguredState = hasExistingKey && !isEditingKey;

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
                  <GitHubIcon />
                  <StarIcon />
                  <span>Star</span>
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

          <ServiceSelector
            onServiceChange={handleServiceChange}
            onModelChange={handleModelChange}
          />

          {showApiKeyCard && (
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

                  <Button onClick={handleGoToApp} className="btn-go-to-app">
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
              ) : (
                <>
                  <div className="api-key-card-header">
                    <div className="api-key-icon">
                      <KeyIcon />
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
                    <Button
                      variant="primary"
                      onClick={handleApiKeySave}
                      className={`btn-save${buttonError ? ' btn-save-error' : ''}`}
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
                        <Button onClick={handleGoToApp} className="btn-go-to-app">
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

          {showApiKeyCard && hasExistingKey && (
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
