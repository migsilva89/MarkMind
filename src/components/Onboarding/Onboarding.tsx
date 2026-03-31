import Button from '../Button/Button';
import {
  SparklesIcon,
  ShieldIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  KeyIcon,
  ExternalLinkIcon,
  SpinnerIcon,
  SunIcon,
  MoonIcon,
} from '../icons/Icons';
import { useOnboarding } from '../../hooks/useOnboarding';
import { type ResolvedTheme } from '../../hooks/useTheme';
import { type OnboardingStep } from '../../types/onboarding';
import { ONBOARDING_STEPS } from '../../config/onboarding';
import './Onboarding.css';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  onEscapeToApiKeyPanel: () => void;
  theme: ResolvedTheme;
  onToggleTheme: () => void;
  startAtStep?: OnboardingStep;
}

const Onboarding = ({
  isOpen,
  onComplete,
  onEscapeToApiKeyPanel,
  theme,
  onToggleTheme,
  startAtStep,
}: OnboardingProps) => {
  const {
    currentStep,
    stepIndex,
    apiKeyInput,
    isValidating,
    errorMessage,
    handleNext,
    handleBack,
    handleApiKeyInputChange,
    handleApiKeyInputKeyDown,
    handleApiKeySubmit,
    handleOpenAIStudio,
    handleEscape,
  } = useOnboarding({ onComplete, onEscapeToApiKeyPanel, startAtStep });

  if (!isOpen) return null;

  const renderProgressDots = () => (
    <div className="onboarding-progress">
      {ONBOARDING_STEPS.map((step, index) => (
        <div
          key={step}
          className={`onboarding-dot${index <= stepIndex ? ' active' : ''}`}
        />
      ))}
    </div>
  );

  const renderBackButton = () => (
    <div className="onboarding-back-row">
      <Button variant="icon" onClick={handleBack} title="Go back">
        <ArrowLeftIcon />
      </Button>
    </div>
  );

  const renderWelcomeStep = () => (
    <div className="onboarding-welcome">
      <img
        src="/assets/icons/icon48.png"
        alt="MarkMind"
        className="onboarding-welcome-logo"
      />
      <h1 className="onboarding-welcome-title">Welcome to MarkMind</h1>
      <p className="onboarding-welcome-subtitle">
        Your bookmarks are about to get organized.
        Automatically. By AI. For free.
      </p>
      <div className="onboarding-features">
        <div className="onboarding-feature-item">
          <SparklesIcon width={16} height={16} />
          <span>Smart folders, zero effort</span>
        </div>
        <div className="onboarding-feature-item">
          <ShieldIcon width={16} height={16} />
          <span>Your data stays on your device</span>
        </div>
        <div className="onboarding-feature-item">
          <CheckCircleIcon width={16} height={16} />
          <span>Completely free, no credit card</span>
        </div>
      </div>
      <div className="onboarding-cta">
        <Button variant="primary" fullWidth onClick={handleNext}>
          Let's get started
        </Button>
      </div>
    </div>
  );

  const renderExplainStep = () => (
    <div className="onboarding-step">
      {renderBackButton()}
      <h2 className="onboarding-explain-title">How does it work?</h2>
      <p className="onboarding-explain-text">
        MarkMind uses AI to read your bookmarks and sort them into the right folders.
        We recommend starting with Google Gemini because it's completely free.
      </p>
      <p className="onboarding-explain-text">
        To connect, you need a special password called an API key.
        Think of it like a Wi-Fi password that lets MarkMind talk to the AI.
      </p>
      <div className="onboarding-reassurances">
        <div className="onboarding-reassurance-item">
          <CheckCircleIcon width={16} height={16} />
          <span>100% free. No credit card needed.</span>
        </div>
        <div className="onboarding-reassurance-item">
          <ShieldIcon width={16} height={16} />
          <span>Your data never leaves your device.</span>
        </div>
        <div className="onboarding-reassurance-item">
          <KeyIcon width={16} height={16} />
          <span>Takes about 30 seconds to set up.</span>
        </div>
      </div>
      <div className="onboarding-cta">
        <Button variant="primary" fullWidth onClick={handleNext}>
          Show me how
        </Button>
      </div>
      <Button
        variant="unstyled"
        className="onboarding-escape-link"
        onClick={handleEscape}
      >
        Already have an API key from another provider?
      </Button>
    </div>
  );

  const renderGuideStep = () => (
    <div className="onboarding-step">
      {renderBackButton()}
      <h2 className="onboarding-guide-title">Let's grab your free key</h2>
      <p className="onboarding-guide-subtitle">Follow these 4 simple steps:</p>
      <div className="step-list">
        <div className="step-list-row">
          <span className="step-list-number">1</span>
          <span className="step-list-text">
            Open Google AI Studio
            <span className="onboarding-step-link">
              {' '}
              <Button variant="ghost" compact onClick={handleOpenAIStudio}>
                <ExternalLinkIcon width={10} height={10} />
                Open
              </Button>
            </span>
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
          <span className="step-list-text">Copy the key and paste it below</span>
        </div>
      </div>
      <div className="onboarding-input-section">
        <input
          type="password"
          placeholder="Paste your key here"
          value={apiKeyInput}
          onChange={handleApiKeyInputChange}
          onKeyDown={handleApiKeyInputKeyDown}
          disabled={isValidating}
        />
        {errorMessage && (
          <p className="onboarding-error-message">{errorMessage}</p>
        )}
        {isValidating && (
          <p className="onboarding-validating-text">
            <SpinnerIcon width={12} height={12} />
            Connecting...
          </p>
        )}
        <Button
          variant="primary"
          fullWidth
          onClick={handleApiKeySubmit}
          disabled={isValidating}
        >
          {isValidating ? 'Connecting...' : 'Connect to Google AI'}
        </Button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="onboarding-success">
      <CheckCircleIcon width={48} height={48} className="onboarding-success-icon" />
      <h2 className="onboarding-success-title">You're all set!</h2>
      <p className="onboarding-success-subtitle">
        MarkMind is connected and ready to organize your bookmarks.
      </p>
      <div className="onboarding-cta">
        <Button variant="primary" fullWidth onClick={handleNext}>
          Start organizing
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'explain':
        return renderExplainStep();
      case 'guide':
        return renderGuideStep();
      case 'success':
        return renderSuccessStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="api-key-panel active">
      <div className="api-key-panel-content">
        <header className="api-key-panel-header">
          <div className="header-welcome">
            <div className="header-left">
              <img
                src="/assets/icons/icon48.png"
                alt="MarkMind"
                className="header-logo"
              />
              <h1 className="header-title">MarkMind</h1>
            </div>
            <div className="header-right">
              <Button
                variant="icon"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </Button>
            </div>
          </div>
        </header>
        <div className="api-key-panel-body">
          {renderProgressDots()}
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
