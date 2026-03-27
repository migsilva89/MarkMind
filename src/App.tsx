import { useState, useEffect, useCallback } from 'react';
import ApiKeyPanel from './components/ApiKeyPanel/ApiKeyPanel';
import MainContent from './components/MainContent/MainContent';
import Onboarding from './components/Onboarding/Onboarding';
import { SERVICES } from './config/services';
import { initSelectedState } from './services/selectedState';
import { useTheme } from './hooks/useTheme';
import {
  ONBOARDING_COMPLETE_STORAGE_KEY,
  ONBOARDING_TOOLTIPS_PENDING_KEY,
  ONBOARDING_TOOLTIPS_SEEN_KEY,
} from './config/onboarding';

const App = () => {
  const { theme, toggleTheme } = useTheme();
  const [showApiKeyPanel, setShowApiKeyPanel] = useState(false);
  const [hasAnyApiKey, setHasAnyApiKey] = useState<boolean | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [showOnboardingTooltips, setShowOnboardingTooltips] = useState(false);

  const checkForExistingApiKeys = useCallback(async (): Promise<void> => {
    const storageKeys = Object.values(SERVICES).map(
      (service) => service.storageKey
    );
    const result = await chrome.storage.local.get([
      ...storageKeys,
      ONBOARDING_COMPLETE_STORAGE_KEY,
      ONBOARDING_TOOLTIPS_PENDING_KEY,
      ONBOARDING_TOOLTIPS_SEEN_KEY,
    ]);
    const hasKey = storageKeys.some((key) => !!result[key]);

    setHasAnyApiKey(hasKey);
    setOnboardingComplete(!!result[ONBOARDING_COMPLETE_STORAGE_KEY]);

    if (hasKey) {
      const tooltipsPending = !!result[ONBOARDING_TOOLTIPS_PENDING_KEY];
      const tooltipsSeen = !!result[ONBOARDING_TOOLTIPS_SEEN_KEY];
      setShowOnboardingTooltips(tooltipsPending && !tooltipsSeen);
    }

    if (hasKey) {
      setShowApiKeyPanel(false);
    } else if (result[ONBOARDING_COMPLETE_STORAGE_KEY]) {
      setShowApiKeyPanel(true);
    }

    await initSelectedState();
  }, []);

  useEffect(() => {
    checkForExistingApiKeys();
  }, [checkForExistingApiKeys]);

  const handleApiKeyPanelClose = useCallback((): void => {
    setShowApiKeyPanel(false);
    checkForExistingApiKeys();
  }, [checkForExistingApiKeys]);

  const handleOpenSettings = useCallback((): void => {
    setShowApiKeyPanel(true);
  }, []);

  const handleOnboardingComplete = useCallback((): void => {
    checkForExistingApiKeys();
  }, [checkForExistingApiKeys]);

  const handleEscapeToApiKeyPanel = useCallback((): void => {
    setOnboardingComplete(true);
    setShowApiKeyPanel(true);
  }, []);

  const handleTooltipsDismissed = useCallback(async (): Promise<void> => {
    setShowOnboardingTooltips(false);
    try {
      await chrome.storage.local.set({
        [ONBOARDING_TOOLTIPS_PENDING_KEY]: false,
        [ONBOARDING_TOOLTIPS_SEEN_KEY]: true,
      });
    } catch (error) {
      console.error('Failed to mark tooltips as seen:', error);
    }
  }, []);

  if (hasAnyApiKey === null || onboardingComplete === null) {
    return null;
  }

  const showOnboarding = !hasAnyApiKey && !onboardingComplete;

  return (
    <div className="container">
      {hasAnyApiKey && !showApiKeyPanel && (
        <MainContent
          onOpenSettings={handleOpenSettings}
          theme={theme}
          onToggleTheme={toggleTheme}
          showOnboardingTooltips={showOnboardingTooltips}
          onTooltipsDismissed={handleTooltipsDismissed}
        />
      )}

      {showOnboarding && (
        <Onboarding
          isOpen
          onComplete={handleOnboardingComplete}
          onEscapeToApiKeyPanel={handleEscapeToApiKeyPanel}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {!showOnboarding && (
        <ApiKeyPanel
          isOpen={showApiKeyPanel || !hasAnyApiKey}
          showWelcomeMessage={!hasAnyApiKey}
          canClose={hasAnyApiKey}
          onClose={handleApiKeyPanelClose}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;
