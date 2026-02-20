import { useState, useEffect, useCallback } from 'react';
import ApiKeyPanel from './components/ApiKeyPanel/ApiKeyPanel';
import MainContent from './components/MainContent/MainContent';
import { SERVICES } from './config/services';
import { initSelectedState } from './services/selectedState';

const App = () => {
  const [showApiKeyPanel, setShowApiKeyPanel] = useState(false);
  const [hasAnyApiKey, setHasAnyApiKey] = useState<boolean | null>(null);

  const checkForExistingApiKeys = useCallback(async (): Promise<void> => {
    const storageKeys = Object.values(SERVICES).map(
      (service) => service.storageKey
    );
    const result = await chrome.storage.local.get(storageKeys);
    const hasKey = storageKeys.some((key) => !!result[key]);

    setHasAnyApiKey(hasKey);

    if (!hasKey) {
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

  if (hasAnyApiKey === null) {
    return null;
  }

  return (
    <div className="container">
      {hasAnyApiKey && !showApiKeyPanel && (
        <MainContent onOpenSettings={handleOpenSettings} />
      )}

      <ApiKeyPanel
        isOpen={showApiKeyPanel || !hasAnyApiKey}
        showWelcomeMessage={!hasAnyApiKey}
        canClose={hasAnyApiKey}
        onClose={handleApiKeyPanelClose}
      />
    </div>
  );
};

export default App;
