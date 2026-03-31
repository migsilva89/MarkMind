import Button from '../Button/Button';
import {
  ArrowLeftIcon,
  KeyIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
} from '../icons/Icons';
import './SetupGuide.css';

interface SetupGuideProps {
  onClose: () => void;
  onOpenAIStudio: () => void;
}

const SetupGuide = ({ onClose, onOpenAIStudio }: SetupGuideProps) => (
  <div className="api-key-panel active">
    <div className="api-key-panel-content">
      <header className="api-key-panel-header">
        <div className="header-settings">
          <div className="header-left">
            <Button variant="icon" onClick={onClose} title="Back to Settings">
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
            MarkMind uses AI to read your bookmarks and sort them into the right folders.
            We recommend starting with Google Gemini because it's completely free.
          </p>
          <p className="setup-guide-text">
            To connect, you need a special password called an API key.
            Think of it like a Wi-Fi password that lets MarkMind talk to the AI.
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
                <Button variant="ghost" compact onClick={onOpenAIStudio}>
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

        <Button variant="primary" fullWidth onClick={onClose}>
          Got it
        </Button>
      </div>
    </div>
  </div>
);

export default SetupGuide;
